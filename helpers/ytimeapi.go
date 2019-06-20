package helpers

import (
	"os"

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
		} else {
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
	}

	return timesheet, false, nil
}

//LunchPunch will do the lunch punch
func LunchPunch(byuID string, request structs.ClientLunchPunchRequest) error {
	//tranlsate our body to theirs
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
		wso2requests.MakeWSO2Request("GET", "https://api.byu.edu:443/domains/erp/hr/ytime_lunch_punch/v1/"+byuID, WSO2Request, &punchResponse)

	if err != nil {
		log.L.Errorf("Error when making lunch punch %s", err.Error())
		return err
	}

	//add the response punch to the employee record

	//send the employee record down the websocket

	//return success
	return nil

}
