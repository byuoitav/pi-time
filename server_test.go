package main

import (
	"testing"

	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/cache"
)

func TestAPI(t *testing.T) {
	//gobyuID := "666567890"

	log.SetLevel("debug")

	//test the cache
	//helpers.DownloadCachedEmployees()

	cache.GetYtimeLocation()

	//get timesheet
	//timesheet, _, _ := helpers.GetTimesheet(byuID)
	//cache.AddEmployee(byuID)
	//cache.UpdateEmployeeFromTimesheet(byuID, timesheet)

	//go get the possible work orders
	//cache.GetPossibleWorkOrders(byuID)

	//get punches for all the jobs
	//cache.GetPunchesForAllJobs(byuID)

	//cache.GetWorkOrderEntries(byuID)
	//cache.GetOtherHours(byuID)

	//employee := cache.GetEmployeeFromStore(byuID)
	//employeeJSON, _ := json.Marshal(employee)

	//log.P.Debug("result: %s", employeeJSON)
}
