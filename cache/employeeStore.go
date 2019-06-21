package cache

import (
	"sync"

	"github.com/byuoitav/pi-time/structs"
)

var (
	employeeCache      map[string]*structs.Employee
	employeeCacheMutex sync.Mutex
)

func init() {
	employeeCache = make(map[string]*structs.Employee)
}

//AddEmployee adds a blank employee record to the cache
func AddEmployee(byuID string) {
	//put it in the map
	employeeCacheMutex.Lock()
	defer employeeCacheMutex.Unlock()
	employeeCache[byuID] = &structs.Employee{
		ID: byuID,
	}
}

//RemoveEmployeeFromStore removes the employee record from the cache
func RemoveEmployeeFromStore(byuID string) {
	employeeCacheMutex.Lock()
	defer employeeCacheMutex.Unlock()
	delete(employeeCache, byuID)
}

//UpdateEmployeeFromTimesheet updates the employee struct from the server Timesheet struct
func UpdateEmployeeFromTimesheet(byuID string, timesheet structs.Timesheet) {
	employeeCacheMutex.Lock()
	defer employeeCacheMutex.Unlock()
	employeeCache[byuID].ID = byuID
	employeeCache[byuID].Name = timesheet.PersonName
	employeeCache[byuID].TotalTime.PayPeriod = timesheet.PeriodTotal
	employeeCache[byuID].TotalTime.Week = timesheet.WeeklyTotal
	employeeCache[byuID].Message = timesheet.InternationalMessage

	//add the jobs

	//send down websocket
	SendMessageToClient(byuID, "employee", employeeCache[byuID])
}

//GetPunchesForAllJobs will get the list of punches for each job and add them to the cached employee record
func GetPunchesForAllJobs(byuID string) {

}

//GetPossibleWorkOrders will get the list of possible work orders for the employee and add them to the cached employee record
func GetPossibleWorkOrders(byuID string) {

}

//GetWorkOrderEntries will get the list of work order entries for the employee and add them to the cached employee record
func GetWorkOrderEntries(byuID string) {

}

//GetSickVacation will get the sick and vacation entries for the employee and add them to the cached employee record
func GetSickVacation(byuID string) {

}
