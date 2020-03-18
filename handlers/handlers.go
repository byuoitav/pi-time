package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/byuoitav/common/log"
	"github.com/byuoitav/pi-time/cache"
	"github.com/byuoitav/pi-time/helpers"
	"github.com/byuoitav/pi-time/structs"
	"github.com/labstack/echo/v4"
)

type YTime struct {
	ClientKey    string
	ClientSecret string
}

// Punch adds an in or out punch as determined by the body sent
func (y *YTime) Punch(context echo.Context) error {
	byuID := context.Param("id")

	var incomingRequest structs.ClientPunchRequest
	err := context.Bind(&incomingRequest)
	if err != nil {
		return context.String(http.StatusBadRequest, err.Error())
	}

	//call the helper
	err = helpers.Punch(byuID, incomingRequest)
	if err != nil {
		return context.String(http.StatusInternalServerError, err.Error())
	}

	return context.String(http.StatusOK, "ok")
}

// FixPunch adds an in or out punch as determined by the body sent
func (y *YTime) FixPunch(context echo.Context) error {
	byuID := context.Param("id")

	num, err := strconv.Atoi(context.Param("seq"))
	if err != nil {
		return context.String(http.StatusBadRequest, fmt.Sprintf("unable to parse sequence number: %s", err))
	}

	var incomingRequest structs.ClientPunchRequest
	err = context.Bind(&incomingRequest)
	if err != nil {
		return context.String(http.StatusBadRequest, err.Error())
	}

	incomingRequest.SequenceNumber = structs.Int(num)

	//call the helper
	err = helpers.FixPunch(byuID, incomingRequest)
	if err != nil {
		return context.String(http.StatusInternalServerError, err.Error())
	}

	return context.String(http.StatusOK, "ok")
}

// LunchPunch adds a lunch punch
func (y *YTime) LunchPunch(context echo.Context) error {
	//byu id passed in the url
	byuID := context.Param("id")

	var req structs.LunchPunch
	err := context.Bind(&req)
	if err != nil {
		return context.String(http.StatusBadRequest, err.Error())
	}

	//call the helper
	err = helpers.LunchPunch(byuID, req)
	if err != nil {
		return context.String(http.StatusInternalServerError, err.Error())
	}

	return context.String(http.StatusOK, "ok")
}

// OtherHours adds entry to sick time
func (y *YTime) OtherHours(context echo.Context) error {
	//BYU ID, EmployeeJobID, Punch Date are all passed in the url
	byuID := context.Param("id")

	var incomingRequest structs.ClientOtherHoursRequest
	err := context.Bind(&incomingRequest)
	if err != nil {
		log.L.Debugf("Bad incoming request for other hours %v", err.Error())
		return context.String(http.StatusBadRequest, err.Error())
	}

	log.L.Debugf("Processing other hours request: %+v", incomingRequest)

	errMessage, err := helpers.OtherHours(byuID, incomingRequest)
	if err != nil {
		log.L.Debugf("Error processing other hours %v, %v", errMessage, err.Error())
		return context.String(http.StatusInternalServerError, errMessage)
	}

	return context.String(http.StatusOK, "ok")
}

// UpsertWorkOrderEntry .
func (y *YTime) UpsertWorkOrderEntry(ectx echo.Context) error {
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
func (y *YTime) DeletePunch(ectx echo.Context) error {
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
func (y *YTime) DeleteWorkOrderEntry(context echo.Context) error {
	//BYU ID is passed in the url
	byuID := context.Param("id")

	var incomingRequest structs.ClientDeleteWorkOrderEntry
	err := context.Bind(&incomingRequest)
	if err != nil {
		return context.String(http.StatusBadRequest, err.Error())
	}
	date, err := time.ParseInLocation("2006-1-2", incomingRequest.Date, time.Local)
	if err != nil {
		log.L.Debugf("Invalid date sent %v", incomingRequest.Date)
		return context.String(http.StatusInternalServerError, "invalid date")
	}

	incomingRequest.Date = date.Format("2006-01-02")

	ne := helpers.DeleteWorkOrderEntry(byuID, incomingRequest)
	if ne != nil {
		log.L.Error(ne)
		return context.String(http.StatusInternalServerError, ne.Error())
	}

	return context.String(http.StatusOK, "ok")
}

//GetSickAndVacationForJobAndDate handles ensuring that we have the sick and vacation for a day
func (y *YTime) GetSickAndVacationForJobAndDate(context echo.Context) error {
	//BYU ID, EmployeeJobID, Punch Date, and Sequence Number are all passed in the url
	byuID := context.Param("id")
	jobIDString := context.Param("jobid")
	dateString := context.Param("date")

	jobID, _ := strconv.Atoi(jobIDString)
	date, err := time.ParseInLocation("2006-1-2", dateString, time.Local)

	if err != nil {
		log.L.Debugf("Invalid date sent %v", dateString)
		return context.String(http.StatusInternalServerError, "invalid date")
	}

	cache.GetOtherHoursForJobAndDate(byuID, jobID, date)

	return context.String(http.StatusOK, "ok")
}
