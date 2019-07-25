package helpers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strconv"
	"time"

	"github.com/byuoitav/common/log"
	"github.com/byuoitav/pi-time/cache"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/pi-time/ytimeapi"
)

// Punch will record a regular punch on the employee record and report up the websocket.
func Punch(byuID string, request structs.ClientPunchRequest) error {
	// build WSO2 request
	log.L.Debugf("translating punch request")
	punchRequest := translateToPunch(request)

	// send WSO2 request to the YTime API
	log.L.Debugf("sending punch request %v", punchRequest)
	timesheet, err, httpResponse := ytimeapi.SendPunchRequest(byuID, punchRequest)
	if err != nil {
		responseBody, bodyErr := ioutil.ReadAll(httpResponse.Body)
		if bodyErr != nil {
			log.L.Errorf("Error with punch %v, unable to ready body", err.Error())
		}

		log.L.Errorf("Error with punch %v, body %s", err.Error(), responseBody)
		// TODO put it into the db to be posted later
	}

	// update the employee timesheet, which also sends it up the websocket
	log.L.Debugf("updating employee timesheet")
	cache.UpdateEmployeeFromTimesheet(byuID, timesheet)

	//update the punches and work order entries
	log.L.Debugf("updating employee punches and work orders because a new punch happened")
	go cache.GetPossibleWorkOrders(byuID)
	go cache.GetPunchesForAllJobs(byuID)
	go cache.GetWorkOrderEntries(byuID)

	// if successful, return nil
	return nil
}

// LunchPunch will record a lunch punch on the employee record and report up the websocket.
func LunchPunch(byuID string, req structs.LunchPunch) error {
	if req.EmployeeJobID == nil {
		return fmt.Errorf("employee_record must be set")
	}

	if req.Duration == nil {
		return fmt.Errorf("duration must be set")
	}

	req.TimeCollectionSource = "CPI"
	req.LocationDescription = os.Getenv("SYSTEM_ID")
	req.PunchZone = structs.String(req.StartTime.Local().Format("-07:00"))

	days, err := ytimeapi.SendLunchPunch(byuID, req)
	if err != nil {
		log.L.Warnf("Error with lunch punch: %s", err.Error())
		return err
	}

	if len(days) == 0 || len(days) > 1 {
		return fmt.Errorf("unexpected response from API - expected 1 day, got %v days", len(days))
	}

	cache.UpdateTimeClockDay(byuID, *req.EmployeeJobID, days[0])

	//update the punches and work order entries
	log.L.Debug("updating employee punches and work orders because a new lunch punch happened")
	go cache.GetPossibleWorkOrders(byuID)
	go cache.GetPunchesForAllJobs(byuID)
	go cache.GetWorkOrderEntries(byuID)

	// if successful, return nil
	return nil
}

// OtherHours will record sick/vacation hours for the employee and report up the websocket.
func OtherHours(byuID string, request structs.ClientOtherHoursRequest) (string, error) {
	// build WSO2 request
	elapsed := translateToElapsedTimeEntry(request)

	// send WSO2 request to the YTime API
	summary, err, response, responseBody := ytimeapi.SendOtherHoursRequest(byuID, elapsed)
	if err != nil {
		errMessage := err.Error()
		if response.StatusCode == 400 {
			var messageStruct structs.ServerErrorMessage

			testForMessageErr := json.Unmarshal([]byte(responseBody), &messageStruct)
			if testForMessageErr != nil {
				return errMessage, err
			}

			errMessage = messageStruct.Message
		}
		return errMessage, err
	}

	//parse the date
	date, _ := time.ParseInLocation("2006-01-02", summary.Dates[0].PunchDate, time.Local)

	// update the employee record, which also sends it up the websocket
	cache.UpdateOtherHoursForJobAndDate(byuID, request.EmployeeJobID, date, summary)

	// if successful, return nil
	return "", nil
}

// UpsertWorkOrderEntry .
func UpsertWorkOrderEntry(byuID string, req structs.WorkOrderUpsert) error {
	if req.EmployeeJobID == nil {
		return fmt.Errorf("employee_record must be set to add/edit a work order entry")
	}

	req.TimeCollectionSource = "CPI"

	summary, err := ytimeapi.SendWorkOrderUpsertRequest(byuID, req)
	if err != nil {
		return err
	}

	// update the employee record, which also sends it up the websocket
	cache.UpdateWorkOrderEntriesForJob(byuID, *req.EmployeeJobID, []structs.WorkOrderDaySummary{summary})
	return nil
}

// DeletePunch will delete a punch from the employee record and report up the websocket.
func DeletePunch(byuID string, req structs.DeletePunch) error {
	if req.EmployeeJobID == nil {
		return fmt.Errorf("employee-record must be set to delete a punch")
	}

	if req.SequenceNumber == nil {
		return fmt.Errorf("sequence-number must be set to delete a punch")
	}

	resp, err := ytimeapi.SendDeletePunchRequest(byuID, req)
	if err != nil {
		return fmt.Errorf("unable to send punch request: %s", err.Error())
	}

	if len(resp) == 0 || len(resp) > 1 {
		return fmt.Errorf("unexpected response from API - expected 1 day, got %v days", len(resp))
	}

	cache.UpdateTimeClockDay(byuID, *req.EmployeeJobID, resp[0])
	return nil
}

// DeleteWorkOrderEntry deletes a work order entry and reports to the websocket
func DeleteWorkOrderEntry(byuID string, request structs.ClientDeleteWorkOrderEntry) error {
	//send WSO2 request
	id := strconv.Itoa(request.JobID)
	seqNum := strconv.Itoa(request.SequenceNumber)

	response, err := ytimeapi.SendDeleteWorkOrderEntryRequest(byuID, id, request.Date, seqNum)
	if err != nil {
		log.L.Error(err)
		return fmt.Errorf(err.Error())
	}
	var array []structs.WorkOrderDaySummary
	array = append(array, response)
	//update the employee timesheet, which also sends it up the websocket
	cache.UpdateWorkOrderEntriesForJob(byuID, request.JobID, array)

	//if successful return nil
	return nil
}
