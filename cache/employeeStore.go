package cache

import (
	"sync"
	"time"

	"github.com/byuoitav/common/log"
	"github.com/byuoitav/pi-time/helpers"
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

	employee := employeeCache[byuID]
	employee.ID = byuID
	employee.Name = timesheet.PersonName
	employee.TotalTime.PayPeriod = timesheet.PeriodTotal
	employee.TotalTime.Week = timesheet.WeeklyTotal
	employee.Message = timesheet.InternationalMessage

	//add the jobs
	employee.Jobs = []structs.EmployeeJob{}
	for _, job := range timesheet.Jobs {
		var translatedJob structs.EmployeeJob
		translatedJob.EmployeeJobID = job.EmployeeRecord
		translatedJob.Description = job.JobCodeDesc
		translatedJob.TimeSubtotals.PayPeriod = job.PeriodSubtotal
		translatedJob.TimeSubtotals.Week = job.WeeklySubtotal
		translatedJob.ClockStatus = job.PunchType
		translatedJob.JobType = job.FullPartTime
		translatedJob.IsPhysicalFacilities = job.PhysicalFacilities
		translatedJob.HasPunchException = job.HasPunchException
		translatedJob.HasWorkOrderException = job.HasWorkOrderException
		translatedJob.OperatingUnit = job.OperatingUnit

		translatedJob.TRCs = []structs.ClientTRC{}
		for _, trc := range job.TRCs {
			translatedJob.TRCs = append(translatedJob.TRCs, structs.ClientTRC{
				ID:          trc.TRCID,
				Description: trc.TRCDescription,
			})
		}

		translatedJob.CurrentTRC = structs.ClientTRC{
			ID:          job.CurrentTRC.TRCID,
			Description: job.CurrentTRC.TRCDescription,
		}

		//append to array
		employee.Jobs = append(employee.Jobs, translatedJob)
	}

	//send down websocket
	SendMessageToClient(byuID, "employee", employeeCache[byuID])
}

//UpdatePossibleWorkOrders .
func UpdatePossibleWorkOrders(byuID string, jobID string, workOrderArray []structs.WorkOrder) {
	employeeCacheMutex.Lock()
	defer employeeCacheMutex.Unlock()

	employee := employeeCache[byuID]
	for _, job := range employee.Jobs {
		if job.EmployeeJobID == jobID {

			//find the job
			job.WorkOrders = []structs.ClientWorkOrder{}

			for serverWorkOrder := range workOrderArray {
				var newClientWorkOrder structs.ClientWorkOrder
				newClientWorkOrder.ID = serverWorkOrder.ID
				newClientWorkOrder.Name = serverWorkOrder.Description
				job.WorkOrders = append(job.WorkOrders, newClientWorkOrder)
			}
		}
	}
}

//UpdateEmployeePunchesForJob updates from a []structs.TimeClockDay
func UpdateEmployeePunchesForJob(byuID string, jobID int, dayArray []structs.TimeClockDay) {
	employeeCacheMutex.Lock()
	defer employeeCacheMutex.Unlock()

	employee := employeeCache[byuID]
	for _, job := range employee.Jobs {
		if job.EmployeeJobID == jobID {

			//now we merge all the days together.....
			for _, serverDay := range dayArray {
				serverDate, err := time.Parse("2006-01-02", serverDay.Date)
				if err != nil {
					//freak out
					log.L.Fatalf("WE GOT A WEIRD DATE BACK FROM WSO2 %s %v", serverDay.Date, err.Error())
				}

				//find this day in the client array
				foundClientDay := false
				for _, clientDay := range job.Days {
					if clientDay.Date == serverDate {

						updateClientDayFromServerDay(&clientDay, &serverDay)
						//go onto the next server day
						foundClientDay = true
						break
					}
				}

				if !foundClientDay {
					//its new - add it
					var newDay structs.ClientDay
					newDay.Date = serverDate
					updateClientDayFromServerDay(&newDay, &serverDay)
					job.Days = append(job.Days, newDay)
				}
			}

			break
		}
	}

	//send down websocket
	SendMessageToClient(byuID, "employee", employeeCache[byuID])
}

func updateClientDayFromServerDay(clientDay *structs.ClientDay, serverDay *structs.TimeClockDay) {
	clientDay.HasPunchException = serverDay.HasPunchException
	clientDay.HasWorkOrderException = serverDay.HasWorkOrderException
	clientDay.PunchedHours = serverDay.PunchedHours

	//replace the punches in this clientDay with the translated punches from the serverDay
	clientDay.Punches = []structs.ClientPunch{}

	for _, serverPunch := range serverDay.Punches {
		var newPunch structs.ClientPunch
		var err error
		newPunch.ID = serverPunch.SequenceNumber
		newPunch.EmployeeJobID = serverPunch.EmployeeRecord
		newPunch.PunchType = serverPunch.PunchType
		newPunch.Time, err = time.ParseInLocation("2006-01-02 15:04:05", serverDay.Date+" "+serverPunch.PunchTime, time.Local)

		if err != nil {
			//freak out
			log.L.Fatalf("WE GOT A WEIRD DATE BACK FROM WSO2 %s", serverDay.Date+" "+serverPunch.PunchTime)
		}
		newPunch.DeletablePair = serverPunch.DeletablePair

		clientDay.Punches = append(clientDay.Punches, newPunch)
	}
}

//GetPunchesForAllJobs will get the list of punches for each job and add them to the cached employee record
func GetPunchesForAllJobs(byuID string) {
	employeeCacheMutex.Lock()
	employee := employeeCache[byuID]
	employeeCacheMutex.Unlock()

	for _, job := range employee.Jobs {
		//call WSO2 for this job and get the punches
		punches := helpers.GetPunchesForJob(byuID, job.EmployeeJobID)

		//now update
		UpdateEmployeePunchesForJob(byuID, job.EmployeeJobID, punches)
	}
}

//GetPossibleWorkOrders will get the list of possible work orders for the employee and add them to the cached employee record
func GetPossibleWorkOrders(byuID string) {
	//lock the mutex, get the employee record from the cache (read-only)

	employeeCacheMutex.Lock()
	employee := employeeCache[byuID]
	employeeCacheMutex.Unlock()

	for _, job := range employee.Jobs {
		//call WSO2 to get work orders for job
		workOrders := helpers.GetWorkOrders(job.OperatingUnit)

		//update the work orders
		UpdatePossibleWorkOrders(byuID, job.EmployeeJobID, workOrders)

	}
}

//GetWorkOrderEntries will get the list of work order entries for the employee and add them to the cached employee record
func GetWorkOrderEntries(byuID string) {

}

//GetSickVacation will get the sick and vacation entries for the employee and add them to the cached employee record
func GetSickVacation(byuID string) {

}
