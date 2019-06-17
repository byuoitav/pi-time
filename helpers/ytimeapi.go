package helpers

import (
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
