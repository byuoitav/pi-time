package main

import (
	"encoding/json"
	"testing"

	"github.com/byuoitav/common/log"
	"github.com/byuoitav/pi-time/cache"
	"github.com/byuoitav/pi-time/helpers"
)

func TestAPI(t *testing.T) {
	byuID := "666567890"

	log.SetLevel("debug")

	//test the cache
	//helpers.DownloadCachedEmployees()

	//get timesheet
	timesheet, _, _ := helpers.GetTimesheet(byuID)
	cache.AddEmployee(byuID)
	cache.UpdateEmployeeFromTimesheet(byuID, timesheet)

	//go get the possible work orders
	//cache.GetPossibleWorkOrders(byuID)

	//get punches for all the jobs
	//cache.GetPunchesForAllJobs(byuID)

	cache.GetWorkOrderEntries(byuID)

	employee := cache.GetEmployeeFromStore(byuID)
	employeeJSON, _ := json.Marshal(employee)

	log.L.Debugf("result: %s", employeeJSON)
}
