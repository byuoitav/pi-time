package ytimeapi

import (
	"strconv"

	"github.com/byuoitav/common/log"
	"github.com/byuoitav/common/nerr"
	"github.com/byuoitav/pi-time/offline"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/wso2services/wso2requests"
)

// SendPunchRequest sends a punch request to the YTime API and returns the response.
func SendPunchRequest(byuID string, body structs.Punch) (structs.Timesheet, *nerr.E) {
	var punchResponse structs.Timesheet

	err := wso2requests.MakeWSO2Request("POST", "https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID, body, &punchResponse)
	if err != nil {
		return punchResponse, nerr.Translate(err).Addf("failed to make a punch for %s: %s", byuID, err.Error())
	}

	return punchResponse, nil
}

// SendLunchPunchRequest sends a lunch punch request to the YTime API and returns the response.
func SendLunchPunchRequest(byuID string, body structs.LunchPunch) (structs.Timesheet, *nerr.E) {
	var punchResponse structs.Timesheet

	err := wso2requests.MakeWSO2Request("POST", "https://api.byu.edu:443/domains/erp/hr/ytime_lunch_punch/v1/"+byuID, body, &punchResponse)
	if err != nil {
		return punchResponse, nerr.Translate(err).Addf("failed to make a lunch punch for %s", byuID)
	}

	return punchResponse, nil
}

// SendOtherHoursRequest sends a sick/vacation request to the YTime API and returns the response.
func SendOtherHoursRequest(byuID string, body structs.ElapsedTimeEntry) (structs.ElapsedTimeSummary, *nerr.E) {
	var otherResponse structs.ElapsedTimeSummary

	err := wso2requests.MakeWSO2Request("POST", "https://api.byu.edu:443/domains/erp/hr/elapsed_time_punch/v1/"+byuID, body, &otherResponse)
	if err != nil {
		return otherResponse, nerr.Translate(err).Addf("failed to record sick hours for %s", byuID)
	}

	return otherResponse, nil
}

// SendWorkOrderEntryRequest sends a work order entry request to the YTime API and returns the response.
func SendWorkOrderEntryRequest(byuID string, body structs.WorkOrderEntry) (structs.WorkOrderDaySummary, *nerr.E) {
	var workOrderResponse structs.WorkOrderDaySummary

	err := wso2requests.MakeWSO2Request("POST", "https://api.byu.edu:443/domains/erp/hr/work_order_entry/v1/"+byuID, body, &workOrderResponse)
	if err != nil {
		return workOrderResponse, nerr.Translate(err).Addf("failed to send a work order entry for %s", byuID)
	}

	return workOrderResponse, nil
}

// SendDeletePunchRequest sends a delete punch request to the YTime API and returns the response.
func SendDeletePunchRequest(byuID string, body structs.DeletePunch) ([]structs.Punch, *nerr.E) {
	var response []structs.Punch

	err := wso2requests.MakeWSO2Request("DELETE", "https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID, body, &response)
	if err != nil {
		return response, nerr.Translate(err).Addf("failed to delete punch for %s", byuID)
	}

	return response, nil
}

// GetTimesheet returns a timesheet, a bool if the timesheet was returned in offline mode (from cache), and possible error
func GetTimesheet(byuid string) (structs.Timesheet, bool, error) {

	var timesheet structs.Timesheet

	err := wso2requests.MakeWSO2Request("GET", "https://api.byu.edu:443/domains/erp/hr/timesheet/v1/"+byuid, "", &timesheet)

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

	err := wso2requests.MakeWSO2Request("GET",
		"https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID+","+strconv.Itoa(jobID), "", &WSO2Response)

	if err != nil {
		log.L.Errorf("Error when retrieving punches for employee and job %s %v %s", byuID, jobID, err.Error())
	}

	return WSO2Response
}

// GetWorkOrders gets all the possilbe work orders for the day from WSO2
func GetWorkOrders(operatingUnit string) []structs.WorkOrder {
	var WSO2Response []structs.WorkOrder

	log.L.Debugf("Getting work orders for operating unit %v", operatingUnit)

	err := wso2requests.MakeWSO2Request("GET",
		"https://api.byu.edu:443/domains/erp/hr/work_orders_by_operating_unit/v1/"+operatingUnit, "", &WSO2Response)

	if err != nil {
		log.L.Errorf("Error when retrieving possible work orders for operating unit %v", err.Error())
	}

	return WSO2Response
}

// GetWorkOrderEntries gets all the work order entries for a particular job from WSO2
func GetWorkOrderEntries(byuID string, employeeJobID int) []structs.WorkOrderDaySummary {
	var WSO2Response []structs.WorkOrderDaySummary

	log.L.Debugf("Getting work orders for employee and job %v %v", byuID, employeeJobID)

	err := wso2requests.MakeWSO2Request("GET",
		"https://api.byu.edu:443/domains/erp/hr/work_order_entry/v1/"+byuID+","+strconv.Itoa(employeeJobID), "", &WSO2Response)

	if err != nil {
		log.L.Errorf("Error when retrieving possible work orders for operating unit %v", err.Error())
	}

	return WSO2Response
}

// GetOtherHours gets the other hours for a job from WSO2
func GetOtherHours(byuID string, employeeJobID int) structs.ElapsedTimeSummary {
	var WSO2Response structs.ElapsedTimeSummary

	log.L.Debugf("Getting other hours for employee and job %v %v", byuID, employeeJobID)

	err := wso2requests.MakeWSO2Request("GET",
		"https://api.byu.edu:443/domains/erp/hr/elapsed_time_punch/v1/"+byuID+","+strconv.Itoa(employeeJobID), "", &WSO2Response)

	if err != nil {
		log.L.Errorf("Error when retrieving other hours %v", err.Error())
	}

	return WSO2Response
}
