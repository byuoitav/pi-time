package helpers

import (
	"fmt"
	"os"
	"strconv"

	"github.com/byuoitav/common/log"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/wso2services/wso2requests"
)

//GetTimesheet returns a timesheet, a bool if the timesheet was returned in offline mode (from cache), and possible error
func GetTimesheet(byuid string) (structs.Timesheet, bool, error) {

	var timesheet structs.Timesheet

	err :=
		wso2requests.MakeWSO2Request("GET", "https://api.byu.edu:443/domains/erp/hr/timesheet/v1/"+byuid, "", &timesheet)

	if err != nil {
		log.L.Debugf("Error when making WSO2 request to get timesheet %v", err)

		//look in the cache
		employeeRecord, innerErr := GetEmployeeFromCache(byuid)
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

//LunchPunch will do the lunch punch
func LunchPunch(byuID string, request structs.ClientLunchPunchRequest) error {
	//translate our body to theirs
	var WSO2Request structs.LunchPunch
	WSO2Request.EmployeeRecord = request.EmployeeJobID
	WSO2Request.StartTime = request.StartTime.Format("15:04")
	WSO2Request.PunchDate = request.StartTime.Format("2006-01-02")
	WSO2Request.Duration = string(request.DurationInMinutes)
	WSO2Request.TimeCollectionSource = "CPI"
	WSO2Request.PunchZone = "XXX"
	WSO2Request.LocationDescription = os.Getenv("SYSTEM_ID")

	var punchResponse structs.Punch

	err :=
		wso2requests.MakeWSO2Request("POST", "https://api.byu.edu:443/domains/erp/hr/ytime_lunch_punch/v1/"+byuID, WSO2Request, &punchResponse)

	if err != nil {
		log.L.Errorf("Error when making lunch punch %s", err.Error())
		return err
	}

	//add the response punch to the employee record

	//send the employee record down the websocket

	//return success
	return nil

}

//Punch will do an in or out punch
func Punch(byuID string, request structs.ClientPunchRequest) error {
	//translate our body to theirs
	var req structs.Punch
	req.PunchType = request.PunchType
	fmt.Printf("\ntime: %v\n\n", request.Time.Local())
	req.PunchTime = request.Time.Local().Format("15:04:01")
	req.Latitude = structs.String("40.25258")
	req.Longitude = structs.String("-111.657658")
	req.LocationDescription = structs.String(os.Getenv("SYSTEM_ID"))
	req.TimeCollectionSource = structs.String("CPI")
	req.WorkOrderID = request.WorkOrderID
	req.TRCID = request.TRCID
	req.PunchDate = structs.String(request.Time.Local().Format("2006-01-02"))
	req.EmployeeRecord = structs.Int(request.EmployeeJobID)
	req.PunchZone = structs.String(request.Time.Local().Format("-07:00"))

	wrapper := make(map[string]structs.Punch)
	wrapper["punch"] = req

	var punchResponse structs.Timesheet

	err := wso2requests.MakeWSO2Request("POST", "https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID, wrapper, &punchResponse)
	if err != nil {
		log.L.Errorf("Error when making punch %s", err.Error())
	}

	//add response to employee record

	//send back down websocket

	//if successful
	return nil
}

// //WorkOrderEntry will do the work order entry
// func WorkOrderEntry(byuID string, request structs.ClientWorkOrderEntry) error {
// 	var WSO2Request structs.WorkOrderEntry
// 	WSO2Request.WorkOrder = request.WorkOrder
// 	WSO2Request.TRC = request.TRC
// 	WSO2Request.HoursWorked = request.HoursBilled
// 	WSO2Request.SequenceNumber = request.SequenceNumber
// 	WSO2Request.Editable = request.Editable

// 	var punchResponse structs.WorkOrderDaySummary

// 	err := wso2requests.MakeWSO2Request("POST", "https://api.byu.edu:443/domains/erp/hr/work_order_entry/v1/"+byuID, WSO2Request, &punchResponse)

// 	if err != nil {
// 		log.L.Errorf("Error when adding work order entry %s", err.Error())
// 	}

// 	//if successful
// 	return nil
// }

// //Sick .
// func Sick(byuID string, request structs.ClientSickRequest) {
// 	var WSO2Request structs.ElapsedTimeEntry
// 	WSO2Request.Editable = request.Editable
// 	WSO2Request.SequenceNumber = request.SequenceNumber
// 	WSO2Request.ElapsedHours = request.ElapsedHours
// 	// WSO2Request.TRC = ???
// 	// WSO2Request.TRCID = ???
// 	WSO2Request.PunchDate = request.punchDate

// 	var punchResponse structs.ElapsedTimeSummary

// 	err := wso2requests.MakeWSO2Request("POST", "https://api.byu.edu:443/domains/erp/hr/elapsed_time_punch/v1/"+byuID, WSO2Request, &punchResponse)

// 	if err != nil {
// 		log.L.Errorf("Error when adding sick entry %s", err.Error())
// 	}

// 	//if successful
// 	return nil
// }

// //Vacation .
// func Vacation(byuID string, request structs.ClientVacationRequest) {
// 	var WSO2Request structs.ElapsedTimeEntry
// 	WSO2Request.Editable = request.Editable
// 	WSO2Request.SequenceNumber = request.SequenceNumber
// 	WSO2Request.ElapsedHours = request.ElapsedHours
// 	// WSO2Request.TRC = ???
// 	// WSO2Request.TRCID = ???
// 	WSO2Request.PunchDate = request.punchDate

// 	var punchResponse structs.ElapsedTimeSummary

// 	err := wso2requests.MakeWSO2Request("POST", "https://api.byu.edu:443/domains/erp/hr/elapsed_time_punch/v1/"+byuID, WSO2Request, &punchResponse)

// 	if err != nil {
// 		log.L.Errorf("Error when adding vacation entry %s", err.Error())
// 	}

// 	//if successful
// 	return nil
// }

//GetPunchesForJob gets a list of serverside TimeClockDay structures from WSO2
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

//GetWorkOrders gets all the possilbe work orders for the day from WSO2
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

//GetWorkOrderEntries gets all the work order entries for a particular job from WSO2
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

//GetOtherHours gets the other hours for a job from WSO2
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
