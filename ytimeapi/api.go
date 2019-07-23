package ytimeapi

import (
	"encoding/json"
	"strconv"
	"time"

	"github.com/byuoitav/common/log"
	"github.com/byuoitav/common/nerr"
	"github.com/byuoitav/pi-time/offline"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/wso2services/wso2requests"
)

// SendPunchRequest sends a punch request to the YTime API and returns the response.
func SendPunchRequest(byuID string, body map[string]structs.Punch) (structs.Timesheet, *nerr.E) {
	var punchResponse structs.Timesheet

	err := wso2requests.MakeWSO2RequestWithHeaders("POST", "https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID, body, &punchResponse, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return punchResponse, nerr.Translate(err).Addf("failed to make a punch for %s: %s", byuID, err.Error())
	}

	return punchResponse, nil
}

// SendLunchPunchRequest sends a lunch punch request to the YTime API and returns the response.
func SendLunchPunchRequest(byuID string, body structs.LunchPunch) (structs.Timesheet, *nerr.E) {
	var punchResponse structs.Timesheet

	err := wso2requests.MakeWSO2RequestWithHeaders("POST", "https://api.byu.edu:443/domains/erp/hr/ytime_lunch_punch/v1/"+byuID, body, &punchResponse, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return punchResponse, nerr.Translate(err).Addf("failed to make a lunch punch for %s: %s", byuID, err.Error())
	}

	return punchResponse, nil
}

// SendOtherHoursRequest sends a sick/vacation request to the YTime API and returns the response.
func SendOtherHoursRequest(byuID string, body structs.ElapsedTimeEntry) (structs.ElapsedTimeSummary, *nerr.E) {
	var otherResponse structs.ElapsedTimeSummary

	var wrapper structs.ElapsedTimeEntryWrapper

	wrapper.ElapsedTimeEntry = body

	test, _ := json.Marshal(body)

	log.L.Debugf("Body to send to other hours WSO2: %s", test)

	err := wso2requests.MakeWSO2RequestWithHeaders("POST", "https://api.byu.edu:443/domains/erp/hr/elapsed_time_punch/v1/"+byuID, wrapper, &otherResponse, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return otherResponse, nerr.Translate(err).Addf("failed to record sick hours for %s", byuID)
	}

	return otherResponse, nil
}

// SendNewWorkOrderEntryRequest sends a work order entry request to the YTime API and returns the response.
func SendNewWorkOrderEntryRequest(byuID string, body structs.WorkOrderEntry) (structs.WorkOrderDaySummary, *nerr.E) {
	var workOrderResponse structs.WorkOrderDaySummary

	err := wso2requests.MakeWSO2RequestWithHeaders("POST", "https://api.byu.edu:443/domains/erp/hr/work_order_entry/v1/"+byuID, body, &workOrderResponse, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return workOrderResponse, nerr.Translate(err).Addf("failed to send a work order entry for %s", byuID)
	}

	return workOrderResponse, nil
}

// SendEditWorkOrderEntryRequest sends a work order entry request to the YTime API and returns the response.
func SendEditWorkOrderEntryRequest(byuID string, body structs.WorkOrderEntry) (structs.WorkOrderDaySummary, *nerr.E) {
	var workOrderResponse structs.WorkOrderDaySummary

	err := wso2requests.MakeWSO2RequestWithHeaders("POST", "https://api.byu.edu:443/domains/erp/hr/work_order_entry/v1/"+byuID, body, &workOrderResponse, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return workOrderResponse, nerr.Translate(err).Addf("failed to send a work order entry for %s", byuID)
	}

	return workOrderResponse, nil
}

// SendDeletePunchRequest sends a delete punch request to the YTime API and returns the response.
func SendDeletePunchRequest(byuID string, jobID string, punchDate string, sequenceNumber string) ([]structs.Punch, *nerr.E) {
	var response []structs.Punch
	log.L.Info(punchDate)

	err := wso2requests.MakeWSO2RequestWithHeaders("DELETE", "https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID+","+jobID+","+punchDate+","+sequenceNumber, "", &response, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return response, nerr.Translate(err).Addf("failed to delete punch for %s", byuID)
	}

	return response, nil
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

	err := wso2requests.MakeWSO2RequestWithHeaders("GET", "https://api.byu.edu:443/domains/erp/hr/timesheet/v1/"+byuid, "", &timesheet, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		log.L.Debugf("Error when making WSO2 request to get timesheet %v", err)

		//look in the cache
		employeeRecord, innerErr := offline.GetEmployeeFromCache(byuid)
		if innerErr != nil {
			//not found
			log.L.Debugf("No cached timesheet found")
			return timesheet, false, err
		}

		log.L.Debugf("Cached timesheet found")
		timesheet := structs.Timesheet{
			PersonName:           employeeRecord.Name,
			WeeklyTotal:          "--:--",
			PeriodTotal:          "--:--",
			InternationalMessage: "",
			Jobs:                 employeeRecord.Jobs,
		}

		return timesheet, true, nil
	}

	return timesheet, false, nil
}

// GetPunchesForJob gets a list of serverside TimeClockDay structures from WSO2
func GetPunchesForJob(byuID string, jobID int) []structs.TimeClockDay {
	var WSO2Response []structs.TimeClockDay

	log.L.Debugf("Sending WSO2 GET request to %v", "https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID+","+strconv.Itoa(jobID))

	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
		"https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID+","+strconv.Itoa(jobID), "", &WSO2Response, map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		})

	if err != nil {
		log.L.Errorf("Error when retrieving punches for employee and job %s %v %s", byuID, jobID, err.Error())
	}

	return WSO2Response
}

// GetWorkOrders gets all the possilbe work orders for the day from WSO2
func GetWorkOrders(operatingUnit string) []structs.WorkOrder {
	var WSO2Response []structs.WorkOrder

	log.L.Debugf("Getting work orders for operating unit %v", operatingUnit)

	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
		"https://api.byu.edu:443/domains/erp/hr/work_orders_by_operating_unit/v1/"+operatingUnit, "", &WSO2Response, map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		})

	if err != nil {
		log.L.Errorf("Error when retrieving possible work orders for operating unit %v", err.Error())
	}

	return WSO2Response
}

// GetWorkOrderEntries gets all the work order entries for a particular job from WSO2
func GetWorkOrderEntries(byuID string, employeeJobID int) []structs.WorkOrderDaySummary {
	var WSO2Response []structs.WorkOrderDaySummary

	log.L.Debugf("Getting work orders for employee and job %v %v", byuID, employeeJobID)

	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
		"https://api.byu.edu:443/domains/erp/hr/work_order_entry/v1/"+byuID+","+strconv.Itoa(employeeJobID), "", &WSO2Response, map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		})

	if err != nil {
		log.L.Errorf("Error when retrieving possible work orders for operating unit %v", err.Error())
	}

	return WSO2Response
}

// // GetOtherHours gets the other hours for a job from WSO2
// func GetOtherHours(byuID string, employeeJobID int) structs.ElapsedTimeSummary {
// 	var WSO2Response structs.ElapsedTimeSummary

// 	log.L.Debugf("Getting other hours for employee and job %v %v", byuID, employeeJobID)

// 	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
// 		"https://api.byu.edu:443/domains/erp/hr/elapsed_time_punch/v1/"+byuID+","+strconv.Itoa(employeeJobID), "", &WSO2Response, map[string]string{
// 			"Content-Type": "application/json",
// 			"Accept":       "application/json",
// 		})

// 	if err != nil {
// 		log.L.Errorf("Error when retrieving other hours %v", err.Error())
// 	}

// 	return WSO2Response
// }

// GetOtherHoursForDate gets the other hours for a job for a specitic date from WSO2
func GetOtherHoursForDate(byuID string, employeeJobID int, date time.Time) structs.ElapsedTimeSummary {
	var WSO2Response structs.ElapsedTimeSummary

	log.L.Debugf("Getting other hours for employee and and date job %v %v", byuID, employeeJobID, date)

	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
		"https://api.byu.edu:443/domains/erp/hr/elapsed_time_punch/v1/"+byuID+","+strconv.Itoa(employeeJobID)+","+date.Format("2006-01-02"), "", &WSO2Response, map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		})

	if err != nil {
		log.L.Errorf("Error when retrieving other hours for date %v %v", date, err.Error())
	}

	return WSO2Response
}
