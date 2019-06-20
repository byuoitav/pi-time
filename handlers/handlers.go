package handlers

import (
	"net/http"

	"github.com/byuoitav/common/log"
	commonEvents "github.com/byuoitav/common/v2/events"
	eventsender "github.com/byuoitav/pi-time/events"
	"github.com/labstack/echo"
)

// Punch adds an in or out punch as determined by the body sent
func Punch(context echo.Context) error {
	return nil
}

// LunchPunch adds a lunch punch
func LunchPunch(context echo.Context) error {
	return nil
}

// Sick adds entry to sick time
func Sick(context echo.Context) error {
	return nil
}

// Vacation adds entry to vacation time
func Vacation(context echo.Context) error {
	return nil
}

//WorkOrderEntry handles adding a new WorkOrderEntry (post)
func WorkOrderEntry(context echo.Context) error {
	return nil
}

// DeletePunch deletes an added punch
func DeletePunch(context echo.Context) error {
	return nil
}

//SendEvent passes an event to the messenger
func SendEvent(context echo.Context) error {
	var event commonEvents.Event
	gerr := context.Bind(&event)
	if gerr != nil {
		return context.String(http.StatusBadRequest, gerr.Error())
	}

	eventsender.MyMessenger.SendEvent(event)

	log.L.Debugf("sent event from UI: %+v", event)
	return context.String(http.StatusOK, "success")
}
