package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/byuoitav/common/v2/events"
	"github.com/byuoitav/pi-time/employee"
	"github.com/byuoitav/pi-time/event"
	"github.com/byuoitav/pi-time/helpers"
	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/offline"
	"github.com/byuoitav/pi-time/structs"
	"github.com/labstack/echo/v4"

	bolt "go.etcd.io/bbolt"
)

// Punch adds an in or out punch as determined by the body sent
func PostPunch(db *bolt.DB) echo.HandlerFunc {
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

// SendEventHandler passes an event to the messenger
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

// returns a dump of the cache for testing
func CacheDump(db *bolt.DB) echo.HandlerFunc {
	return echo.HandlerFunc(func(c echo.Context) error {
		cache, err := employee.GetCache(db)
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}

		log.P.Info("Returning cache dump", "numEmployees", len(cache.Employees))

		return c.JSON(http.StatusOK, cache)
	})
}
