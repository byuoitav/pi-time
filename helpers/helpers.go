package helpers

import (
	"fmt"
	"io"

	"github.com/byuoitav/pi-time/cache"
	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/pi-time/ytimeapi"
)

// Punch will record a regular punch on the employee record and report up the websocket.
func Punch(byuID string, request structs.ClientPunchRequest) error {
	// build WSO2 request
	log.P.Debug("translating punch request")
	punchRequest := translateToPunch(request)
	// send WSO2 request to the YTime API
	log.P.Debug(fmt.Sprintf("sending punch request %v", punchRequest))
	timesheet, err, httpResponse := ytimeapi.SendPunchRequest(byuID, punchRequest)
	if err != nil {
		var responseBody []byte
		var bodyErr error
		if httpResponse != nil {
			responseBody, bodyErr = io.ReadAll(httpResponse.Body)
			if bodyErr != nil {
				return fmt.Errorf("unable to submit punch: %v. unable to read body", err.Error())
			}
		}

		return fmt.Errorf("unable to submit punch: %v. response body: %s", err.Error(), responseBody)
	}

	// update the employee timesheet, which also sends it up the websocket
	log.P.Debug("updating employee timesheet")
	cache.UpdateEmployeeFromTimesheet(byuID, timesheet)

	//update the punches and work order entries
	log.P.Debug("updating employee punches and work orders because a new punch happened")
	go cache.GetPossibleWorkOrders(byuID)
	go cache.GetPunchesForAllJobs(byuID)
	go cache.GetWorkOrderEntries(byuID)

	// if successful, return nil
	return nil
}
