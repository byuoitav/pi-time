package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/byuoitav/common/v2/events"
	"github.com/byuoitav/pi-time/cache"
	"github.com/byuoitav/pi-time/event"
	"github.com/byuoitav/pi-time/helpers"
	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/offline"
	"github.com/byuoitav/pi-time/structs"
	"github.com/labstack/echo/v4"

	bolt "go.etcd.io/bbolt"
)

// Punch adds an in or out punch as determined by the body sent
func GetPunchHandler(db *bolt.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		byuID := c.Param("id")

		var incomingRequest structs.ClientPunchRequest
		err := c.Bind(&incomingRequest)
		if err != nil {
			return c.String(http.StatusBadRequest, err.Error())
		}

		//call the helper
		err = helpers.Punch(byuID, incomingRequest)
		if err != nil {
			//Add the punch to the bucket if it failed for any reason
			key := []byte(fmt.Sprintf("%s%s", byuID, time.Now().Format(time.RFC3339)))
			gerr := offline.AddPunchToBucket(key, incomingRequest, db)
			if gerr != nil {
				return fmt.Errorf("two errors occured:%s and %s", err, gerr)
			}

			return nil
		}

		return c.String(http.StatusOK, "ok")
	}
}

// FixPunch adds an in or out punch as determined by the body sent
func FixPunch(c echo.Context) error {
	byuID := c.Param("id")

	num, err := strconv.Atoi(c.Param("seq"))
	if err != nil {
		return c.String(http.StatusBadRequest, fmt.Sprintf("unable to parse sequence number: %s", err))
	}

	var incomingRequest structs.ClientPunchRequest
	err = c.Bind(&incomingRequest)
	if err != nil {
		return c.String(http.StatusBadRequest, err.Error())
	}

	incomingRequest.SequenceNumber = structs.Int(num)

	//call the helper
	err = helpers.FixPunch(byuID, incomingRequest)
	if err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}

	return c.String(http.StatusOK, "ok")
}

// LunchPunch adds a lunch punch
func LunchPunch(c echo.Context) error {
	//byu id passed in the url
	byuID := c.Param("id")

	var req structs.LunchPunch
	err := c.Bind(&req)
	if err != nil {
		return c.String(http.StatusBadRequest, err.Error())
	}

	//call the helper
	err = helpers.LunchPunch(byuID, req)
	if err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}

	return c.String(http.StatusOK, "ok")
}

// OtherHours adds entry to sick time
func OtherHours(c echo.Context) error {
	//BYU ID, EmployeeJobID, Punch Date are all passed in the url
	byuID := c.Param("id")

	var incomingRequest structs.ClientOtherHoursRequest
	err := c.Bind(&incomingRequest)
	if err != nil {
		log.P.Debug(fmt.Sprintf("Bad incoming request for other hours %v", err.Error()))
		return c.String(http.StatusBadRequest, err.Error())
	}

	log.P.Debug(fmt.Sprintf("Processing other hours request: %+v", incomingRequest))

	errMessage, err := helpers.OtherHours(byuID, incomingRequest)
	if err != nil {
		log.P.Debug(fmt.Sprintf("Error processing other hours %v, %v", errMessage, err.Error()))
		return c.String(http.StatusInternalServerError, errMessage)
	}

	return c.String(http.StatusOK, "ok")
}

// UpsertWorkOrderEntry .
func UpsertWorkOrderEntry(ectx echo.Context) error {
	byuID := ectx.Param("id")

	var req structs.WorkOrderUpsert
	err := ectx.Bind(&req)
	if err != nil {
		return ectx.String(http.StatusBadRequest, err.Error())
	}

	err = helpers.UpsertWorkOrderEntry(byuID, req)
	if err != nil {
		return ectx.String(http.StatusInternalServerError, err.Error())
	}

	return ectx.String(http.StatusOK, "ok")
}

// DeletePunch deletes an added punch
func DeletePunch(ectx echo.Context) error {
	byuID := ectx.Param("id")

	var req structs.DeletePunch
	err := ectx.Bind(&req)
	if err != nil {
		return ectx.String(http.StatusBadRequest, err.Error())
	}

	err = helpers.DeletePunch(byuID, req)
	if err != nil {
		return ectx.String(http.StatusInternalServerError, err.Error())
	}

	return ectx.String(http.StatusOK, "ok")
}

// DeleteWorkOrderEntry deletes a work order entry
func DeleteWorkOrderEntry(c echo.Context) error {
	//BYU ID is passed in the url
	byuID := c.Param("id")

	var incomingRequest structs.ClientDeleteWorkOrderEntry
	err := c.Bind(&incomingRequest)
	if err != nil {
		return c.String(http.StatusBadRequest, err.Error())
	}
	date, err := time.ParseInLocation("2006-1-2", incomingRequest.Date, time.Local)
	if err != nil {
		log.P.Debug(fmt.Sprintf("Invalid date sent %v", incomingRequest.Date))
		return c.String(http.StatusInternalServerError, "invalid date")
	}

	incomingRequest.Date = date.Format("2006-01-02")

	ne := helpers.DeleteWorkOrderEntry(byuID, incomingRequest)
	if ne != nil {
		log.P.Error(fmt.Sprintf("%s", ne))
		return c.String(http.StatusInternalServerError, ne.Error())
	}

	return c.String(http.StatusOK, "ok")
}

//SendEventHandler passes an event to the messenger
func SendEventHandler(c echo.Context) error {
	var e events.Event
	if err := c.Bind(&e); err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}

	if err := event.SendEvent(e); err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusOK)
}

//GetSickAndVacationForJobAndDate handles ensuring that we have the sick and vacation for a day
func GetSickAndVacationForJobAndDate(c echo.Context) error {
	//BYU ID, EmployeeJobID, Punch Date, and Sequence Number are all passed in the url
	byuID := c.Param("id")
	jobIDString := c.Param("jobid")
	dateString := c.Param("date")

	jobID, _ := strconv.Atoi(jobIDString)
	date, err := time.ParseInLocation("2006-1-2", dateString, time.Local)

	if err != nil {
		log.P.Debug(fmt.Sprintf("Invalid date sent %v", dateString))
		return c.String(http.StatusInternalServerError, "invalid date")
	}

	cache.GetOtherHoursForJobAndDate(byuID, jobID, date)

	return c.String(http.StatusOK, "ok")
}
