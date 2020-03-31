package ytimeapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/byuoitav/common/nerr"
	"github.com/byuoitav/pi-time/helpers"
	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/wso2services/wso2requests"
)

// SendPunchRequest sends a punch request to the YTime API and returns the response.
func SendPunchRequest(byuID string, req structs.Punch) (structs.Timesheet, *nerr.E, *http.Response) {
	var punchResponse structs.Timesheet

	body := make(map[string]structs.Punch)
	body["punch"] = req

	method := "POST"
	err, response, _ := wso2requests.MakeWSO2RequestWithHeadersReturnResponse(method, "https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID, body, &punchResponse, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return punchResponse, nerr.Translate(err).Addf("failed to make a punch for %s: %s", byuID, err.Error()), response
	}

	return punchResponse, nil, response
}

// SendFixPunchRequest sends a punch request to the YTime API and returns the response.
func SendFixPunchRequest(byuID string, req structs.Punch) ([]structs.TimeClockDay, *nerr.E) {
	var resp []structs.TimeClockDay

	body := make(map[string]structs.Punch)
	body["punch"] = req

	method := "PUT"
	err := wso2requests.MakeWSO2RequestWithHeaders(method, "https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID, body, &resp, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return resp, nerr.Translate(err).Addf("failed to make a punch for %s: %s", byuID, err.Error())
	}

	return resp, nil
}

// SendLunchPunch sends a lunch punch request to the YTime API and returns the response.
func SendLunchPunch(byuID string, req structs.LunchPunch) ([]structs.TimeClockDay, *nerr.E) {
	var resp []structs.TimeClockDay

	body := make(map[string]structs.LunchPunch)
	body["lunch_punch"] = req

	err := wso2requests.MakeWSO2RequestWithHeaders("POST", "https://api.byu.edu:443/domains/erp/hr/ytime_lunch_punch/v1/"+byuID, body, &resp, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return resp, nerr.Translate(err).Addf("failed to make a lunch punch for %s: %s", byuID, err.Error())
	}

	return resp, nil
}

// SendOtherHoursRequest sends a sick/vacation request to the YTime API and returns the response (if no problem), and error, as well as the http response and body
func SendOtherHoursRequest(byuID string, body structs.ElapsedTimeEntry) (structs.ElapsedTimeSummary, *nerr.E, *http.Response, string) {
	var otherResponse structs.ElapsedTimeSummary

	var wrapper structs.ElapsedTimeEntryWrapper

	wrapper.ElapsedTimeEntry = body

	test, _ := json.Marshal(body)

	log.P.Debug(fmt.Sprintf("Body to send to other hours WSO2: %s", test))

	err, response, responseBody := wso2requests.MakeWSO2RequestWithHeadersReturnResponse("POST", "https://api.byu.edu:443/domains/erp/hr/elapsed_time_punch/v1/"+byuID, wrapper, &otherResponse, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})

	if err != nil {
		return otherResponse, nerr.Translate(err).Addf("failed to record sick hours for %s", byuID), response, responseBody
	}

	return otherResponse, nil, response, responseBody
}

// SendWorkOrderUpsertRequest .
func SendWorkOrderUpsertRequest(byuID string, req structs.WorkOrderUpsert) (structs.WorkOrderDaySummary, *nerr.E) {
	var resp structs.WorkOrderDaySummary

	url := fmt.Sprintf("https://api.byu.edu:443/domains/erp/hr/work_order_entry/v1/%s", byuID)

	err := wso2requests.MakeWSO2RequestWithHeaders("POST", url, req, &resp, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return resp, nerr.Translate(err).Addf("failed to send a work order entry for %s", byuID)
	}

	return resp, nil
}

// SendDeletePunchRequest sends a delete punch request to the YTime API and returns the response.
func SendDeletePunchRequest(byuID string, req structs.DeletePunch) ([]structs.TimeClockDay, *nerr.E) {
	var resp []structs.TimeClockDay

	url := fmt.Sprintf("https://api.byu.edu:443/domains/erp/hr/punches/v1/%s,%d,%s,%d", byuID, *req.EmployeeJobID, req.PunchTime.Local().Format("2006-01-02"), *req.SequenceNumber)

	err := wso2requests.MakeWSO2RequestWithHeaders("DELETE", url, nil, &resp, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return resp, nerr.Translate(err).Addf("failed to delete punch")
	}

	return resp, nil
}

// SendDeleteWorkOrderEntryRequest sends a delete work order entry request to the YTime API and returns the response
func SendDeleteWorkOrderEntryRequest(byuID string, jobID string, punchDate string, sequenceNumber string) (structs.WorkOrderDaySummary, *nerr.E) {
	var response structs.WorkOrderDaySummary

	err := wso2requests.MakeWSO2RequestWithHeaders("DELETE", "https://api.byu.edu:443/domains/erp/hr/work_order_entry/v1/"+byuID+","+jobID+","+punchDate+","+sequenceNumber, "", &response, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return response, nerr.Translate(err).Addf("failed to delete work order entry for %s", byuID)
	}

	return response, nil
}

// GetTimesheet returns a timesheet, a bool if the timesheet was returned in offline mode (from cache), and possible error
func GetTimesheet(byuid string) (structs.Timesheet, bool, error) {

	var timesheet structs.Timesheet

	err, httpResponse, responseBody := wso2requests.MakeWSO2RequestWithHeadersReturnResponse("GET", "https://api.byu.edu:443/domains/erp/hr/timesheet/v1/"+byuid, "", &timesheet, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})

	if err != nil {
		log.P.Debug(fmt.Sprintf("Error when making WSO2 request to get timesheet %v", err))

		if httpResponse.StatusCode/100 == 5 {
			//500 code, then we look in cache
			//look in the cache
			employeeRecord, innerErr := helpers.GetEmployeeFromCache(byuid)

			if innerErr != nil {
				//not found
				log.P.Debug("No cached timesheet found")
				return timesheet, false, errors.New("System offline - employee not found")
			}

			log.P.Debug("Cached timesheet found")

			timesheet := structs.Timesheet{
				PersonName:           employeeRecord.Name,
				WeeklyTotal:          "--:--",
				PeriodTotal:          "--:--",
				InternationalMessage: "",
				Jobs:                 employeeRecord.Jobs,
			}

			return timesheet, true, nil
		}

		var messageStruct structs.ServerLoginErrorMessage

		testForMessageErr := json.Unmarshal([]byte(responseBody), &messageStruct)
		if testForMessageErr != nil {
			return timesheet, false, errors.New("Employee not found")
		}

		errMessage := messageStruct.Status.Message

		return timesheet, false, errors.New(errMessage)
	}

	return timesheet, false, nil
}

// GetPunchesForJob gets a list of serverside TimeClockDay structures from WSO2
func GetPunchesForJob(byuID string, jobID int) []structs.TimeClockDay {
	var WSO2Response []structs.TimeClockDay

	log.P.Debug(fmt.Sprintf("Sending WSO2 GET request to %v", "https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID+","+strconv.Itoa(jobID)))

	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
		"https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID+","+strconv.Itoa(jobID), "", &WSO2Response, map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		})

	if err != nil {
		log.P.Error(fmt.Sprintf("Error when retrieving punches for employee and job %s %v %s", byuID, jobID, err.Error()))
	}

	return WSO2Response
}

// GetWorkOrders gets all the possilbe work orders for the day from WSO2
func GetWorkOrders(operatingUnit string) []structs.WorkOrder {
	var WSO2Response []structs.WorkOrder

	log.P.Debug(fmt.Sprintf("Getting work orders for operating unit %v", operatingUnit))

	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
		"https://api.byu.edu:443/domains/erp/hr/work_orders_by_operating_unit/v1/"+operatingUnit, "", &WSO2Response, map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		})

	if err != nil {
		log.P.Error(fmt.Sprintf("Error when retrieving possible work orders for operating unit %v", err.Error()))
	}

	return WSO2Response
}

// GetWorkOrderEntries gets all the work order entries for a particular job from WSO2
func GetWorkOrderEntries(byuID string, employeeJobID int) []structs.WorkOrderDaySummary {
	var WSO2Response []structs.WorkOrderDaySummary

	log.P.Debug(fmt.Sprintf("Getting work orders for employee and job %v %v", byuID, employeeJobID))

	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
		"https://api.byu.edu:443/domains/erp/hr/work_order_entry/v1/"+byuID+","+strconv.Itoa(employeeJobID), "", &WSO2Response, map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		})

	if err != nil {
		log.P.Error(fmt.Sprintf("Error when retrieving possible work orders for operating unit %v", err.Error()))
	}

	return WSO2Response
}

// // GetOtherHours gets the other hours for a job from WSO2
// func GetOtherHours(byuID string, employeeJobID int) structs.ElapsedTimeSummary {
// 	var WSO2Response structs.ElapsedTimeSummary

// 	log.P.Debug("Getting other hours for employee and job %v %v", byuID, employeeJobID)

// 	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
// 		"https://api.byu.edu:443/domains/erp/hr/elapsed_time_punch/v1/"+byuID+","+strconv.Itoa(employeeJobID), "", &WSO2Response, map[string]string{
// 			"Content-Type": "application/json",
// 			"Accept":       "application/json",
// 		})

// 	if err != nil {
// 		log.P.Error("Error when retrieving other hours %v", err.Error())
// 	}

// 	return WSO2Response
// }

// GetOtherHoursForDate gets the other hours for a job for a specitic date from WSO2
func GetOtherHoursForDate(byuID string, employeeJobID int, date time.Time) structs.ElapsedTimeSummary {
	var WSO2Response structs.ElapsedTimeSummary

	log.P.Debug(fmt.Sprintf("Getting other hours for employee and and date job %v %v", fmt.Sprintf("%v %v", byuID, employeeJobID), date))

	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
		"https://api.byu.edu:443/domains/erp/hr/elapsed_time_punch/v1/"+byuID+","+strconv.Itoa(employeeJobID)+","+date.Format("2006-01-02"), "", &WSO2Response, map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		})

	if err != nil {
		log.P.Error(fmt.Sprintf("Error when retrieving other hours for date %v %v", date, err.Error()))
	}

	return WSO2Response
}
