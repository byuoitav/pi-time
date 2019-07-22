package cache

import (
	"sync"
	"time"

	"github.com/byuoitav/common/log"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/pi-time/ytimeapi"
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
	//wait for 30 seconds and then if the byuid is still closed in the web socket, get rid of it
	time.Sleep(30 * time.Second)

	if !WebSocketExists(byuID) {
		employeeCacheMutex.Lock()
		defer employeeCacheMutex.Unlock()
		delete(employeeCache, byuID)
	}
}

//GetEmployeeFromStore to retrieve the cached employee record
func GetEmployeeFromStore(byuID string) *structs.Employee {
	employeeCacheMutex.Lock()
	defer employeeCacheMutex.Unlock()
	return employeeCache[byuID]
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
func UpdatePossibleWorkOrders(byuID string, jobID int, workOrderArray []structs.WorkOrder) {
	employeeCacheMutex.Lock()
	defer employeeCacheMutex.Unlock()

	employee := employeeCache[byuID]
	for i := range employee.Jobs {
		if employee.Jobs[i].EmployeeJobID == jobID {
			employee.Jobs[i].WorkOrders = []structs.ClientWorkOrder{}

			for _, serverWorkOrder := range workOrderArray {
				var newClientWorkOrder structs.ClientWorkOrder
				newClientWorkOrder.ID = serverWorkOrder.WorkOrderID
				newClientWorkOrder.Name = serverWorkOrder.WorkOrderDescription
				employee.Jobs[i].WorkOrders = append(employee.Jobs[i].WorkOrders, newClientWorkOrder)
			}
		}
		break
	}
	SendMessageToClient(byuID, "employee", employeeCache[byuID])
}

//UpdateOtherHoursForJob updates the other hours for a job
func UpdateOtherHoursForJob(byuID string, jobID int, elapsedTimeSummary structs.ElapsedTimeSummary) {
	employeeCacheMutex.Lock()
	defer employeeCacheMutex.Unlock()

	employee := employeeCache[byuID]
	for i := range employee.Jobs {
		if employee.Jobs[i].EmployeeJobID == jobID {
			//loop through the dates on the and match them up

			for _, elapsedTimeDay := range elapsedTimeSummary.Dates {
				serverDate, err := time.Parse("2006-01-02", elapsedTimeDay.PunchDate)
				if err != nil {
					//freak out
					log.L.Fatalf("WE GOT A WEIRD DATE BACK FROM WSO2 %s %v", elapsedTimeDay.PunchDate, err.Error())
				}
				foundDay := false
				for x := range employee.Jobs[i].Days {

					if employee.Jobs[i].Days[x].Date == serverDate {

						//loop through the ElapstedTimeEntries and translate them to ClientOtherHours
						employee.Jobs[i].Days[x].OtherHours = []structs.ClientOtherHours{}

						for _, elapsedTimeEntry := range elapsedTimeDay.ElapsedTimeEntries {
							var newClientOtherHours structs.ClientOtherHours
							newClientOtherHours.Editable = elapsedTimeEntry.Editable
							newClientOtherHours.SequenceNumber = elapsedTimeEntry.SequenceNumber
							newClientOtherHours.TimeReportingCodeHours = elapsedTimeEntry.TimeReportingCodeHours
							newClientOtherHours.TRC = structs.ClientTRC{
								ID:          elapsedTimeEntry.TRC.TRCID,
								Description: elapsedTimeEntry.TRC.TRCDescription,
							}
							employee.Jobs[i].Days[x].OtherHours = append(employee.Jobs[i].Days[x].OtherHours, newClientOtherHours)
						}

						employee.Jobs[i].Days[x].SickHoursYTD = elapsedTimeSummary.SickLeaveBalanceHours
						employee.Jobs[i].Days[x].VacationHoursYTD = elapsedTimeSummary.VacationLeaveBalanceHours

						foundDay = true

					}
				}
				if !foundDay {
					var newDay structs.ClientDay
					newDay.Date = serverDate
					updateClientDayFromServerOtherHoursDay(&newDay, &elapsedTimeSummary)
					employee.Jobs[i].Days = append(employee.Jobs[i].Days, newDay)
				}
			}
			break
		}
	}

	SendMessageToClient(byuID, "employee", employeeCache[byuID])
}

//UpdateWorkOrderEntriesForJob updates the work order entries for a particular job
func UpdateWorkOrderEntriesForJob(byuID string, jobID int, workOrderDayArray []structs.WorkOrderDaySummary) {
	employeeCacheMutex.Lock()
	defer employeeCacheMutex.Unlock()

	employee := employeeCache[byuID]
	for i := range employee.Jobs {
		if employee.Jobs[i].EmployeeJobID == jobID {
			//now we merge all the days together.....
			for _, serverDay := range workOrderDayArray {
				serverDate, err := time.Parse("2006-01-02", serverDay.Date)
				if err != nil {
					//freak out
					log.L.Fatalf("WE GOT A WEIRD DATE BACK FROM WSO2 %s %v", serverDay.Date, err.Error())
				}

				//find this day in the client array
				foundClientDay := false
				for j := range employee.Jobs[i].Days {
					if employee.Jobs[i].Days[j].Date == serverDate {

						updateClientDayFromServerWorkOrderDay(&employee.Jobs[i].Days[j], &serverDay)
						//go onto the next server day
						foundClientDay = true
						break
					}
				}

				if !foundClientDay {
					//its new - add it
					var newDay structs.ClientDay
					newDay.Date = serverDate
					updateClientDayFromServerWorkOrderDay(&newDay, &serverDay)
					employee.Jobs[i].Days = append(employee.Jobs[i].Days, newDay)
				}
			}

			break
		}
	}

	//send down websocket
	SendMessageToClient(byuID, "employee", employeeCache[byuID])
}

//UpdateEmployeePunchesForJob updates from a []structs.TimeClockDay
func UpdateEmployeePunchesForJob(byuID string, jobID int, dayArray []structs.TimeClockDay) {
	employeeCacheMutex.Lock()
	defer employeeCacheMutex.Unlock()

	employee := employeeCache[byuID]
	for i := range employee.Jobs {
		if employee.Jobs[i].EmployeeJobID == jobID {

			//now we merge all the days together.....
			for _, serverDay := range dayArray {
				serverDate, err := time.Parse("2006-01-02", serverDay.Date)
				if err != nil {
					//freak out
					log.L.Fatalf("WE GOT A WEIRD DATE BACK FROM WSO2 %s %v", serverDay.Date, err.Error())
				}

				//find this day in the client array
				foundClientDay := false
				for j := range employee.Jobs[i].Days {
					if employee.Jobs[i].Days[j].Date == serverDate {

						updateClientDayFromServerTimeClockDay(&employee.Jobs[i].Days[j], &serverDay)
						//go onto the next server day
						foundClientDay = true
						break
					}
				}

				if !foundClientDay {
					//its new - add it
					var newDay structs.ClientDay
					newDay.Date = serverDate
					updateClientDayFromServerTimeClockDay(&newDay, &serverDay)
					employee.Jobs[i].Days = append(employee.Jobs[i].Days, newDay)
				}
			}

			break
		}
	}

	//send down websocket
	SendMessageToClient(byuID, "employee", employeeCache[byuID])
}

func updateClientDayFromServerTimeClockDay(clientDay *structs.ClientDay, serverDay *structs.TimeClockDay) {
	clientDay.HasPunchException = serverDay.HasPunchException
	//clientDay.HasWorkOrderException = serverDay.HasWorkOrderException
	clientDay.PunchedHours = serverDay.PunchedHours

	//replace the punches in this clientDay with the translated punches from the serverDay
	clientDay.Punches = []structs.ClientPunch{}

	for _, serverPunch := range serverDay.Punches {
		var newPunch structs.ClientPunch
		var err error

		if serverPunch.SequenceNumber != nil {
			newPunch.ID = *serverPunch.SequenceNumber
		} else {
			newPunch.ID = 0
		}

		if serverPunch.EmployeeRecord != nil {
			newPunch.EmployeeJobID = *serverPunch.EmployeeRecord
		}

		newPunch.PunchType = serverPunch.PunchType

		if len(serverPunch.PunchTime) > 0 {
			newPunch.Time, err = time.ParseInLocation("2006-01-02 15:04:05", serverDay.Date+" "+serverPunch.PunchTime, time.Local)
			if err != nil {
				log.L.Fatalf("WE GOT A WEIRD DATE BACK FROM WSO2 %s %v", serverDay.Date+" "+serverPunch.PunchTime, err.Error())
			}
		}

		newPunch.DeletablePair = serverPunch.DeletablePair
		clientDay.Punches = append(clientDay.Punches, newPunch)
	}
}

func updateClientDayFromServerWorkOrderDay(clientDay *structs.ClientDay, serverDay *structs.WorkOrderDaySummary) {
	//clientDay.HasPunchException = serverDay.HasPunchException
	clientDay.HasWorkOrderException = serverDay.HasWorkOrderException
	clientDay.PunchHours = serverDay.PunchHours
	clientDay.PhysicalFacilitiesHours = serverDay.PhysicalFacilitiesHours

	//replace the punches in this clientDay with the translated punches from the serverDay
	clientDay.WorkOrderEntries = []structs.ClientWorkOrderEntry{}

	for _, serverWorkOrderEntry := range serverDay.WorkOrderEntries {
		var newWorkOrderEntry structs.ClientWorkOrderEntry

		newWorkOrderEntry.ID = serverWorkOrderEntry.SequenceNumber
		newWorkOrderEntry.WorkOrder = structs.ClientWorkOrder{
			ID:   serverWorkOrderEntry.WorkOrder.WorkOrderID,
			Name: serverWorkOrderEntry.WorkOrder.WorkOrderDescription,
		}
		newWorkOrderEntry.TimeReportingCodeHours = serverWorkOrderEntry.TimeReportingCodeHours
		newWorkOrderEntry.TRC = structs.ClientTRC{
			ID:          serverWorkOrderEntry.TRC.TRCID,
			Description: serverWorkOrderEntry.TRC.TRCDescription,
		}
		newWorkOrderEntry.Editable = serverWorkOrderEntry.Editable

		clientDay.WorkOrderEntries = append(clientDay.WorkOrderEntries, newWorkOrderEntry)
	}
}

func updateClientDayFromServerOtherHoursDay(clientDay *structs.ClientDay, serverDay *structs.ElapsedTimeSummary) {
	clientDay.SickHoursYTD = serverDay.SickLeaveBalanceHours
	clientDay.VacationHoursYTD = serverDay.VacationLeaveBalanceHours

	clientDay.OtherHours = []structs.ClientOtherHours{}

	for _, serverElapsedTimeDay := range serverDay.Dates {
		for _, serverElapsedTimeEntry := range serverElapsedTimeDay.ElapsedTimeEntries {
			var newElapsedTimeEntry structs.ClientOtherHours

			newElapsedTimeEntry.Editable = serverElapsedTimeEntry.Editable
			newElapsedTimeEntry.SequenceNumber = serverElapsedTimeEntry.SequenceNumber
			newElapsedTimeEntry.TRC = structs.ClientTRC{
				ID:          serverElapsedTimeEntry.TRC.TRCID,
				Description: serverElapsedTimeEntry.TRC.TRCDescription,
			}
			newElapsedTimeEntry.TimeReportingCodeHours = serverElapsedTimeEntry.TimeReportingCodeHours

			clientDay.OtherHours = append(clientDay.OtherHours, newElapsedTimeEntry)
		}
	}
}

//GetPunchesForAllJobs will get the list of punches for each job and add them to the cached employee record
func GetPunchesForAllJobs(byuID string) {
	employeeCacheMutex.Lock()
	employee := employeeCache[byuID]
	employeeCacheMutex.Unlock()

	for _, job := range employee.Jobs {
		// call WSO2 for this job and get the punches
		punches := ytimeapi.GetPunchesForJob(byuID, job.EmployeeJobID)

		// now update
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
		if job.IsPhysicalFacilities != nil && *job.IsPhysicalFacilities {
			//call WSO2 to get work orders for job
			workOrders := ytimeapi.GetWorkOrders(job.OperatingUnit)

			//update the work orders
			UpdatePossibleWorkOrders(byuID, job.EmployeeJobID, workOrders)
		}

	}
}

//GetWorkOrderEntries will get the list of work order entries for the employee and add them to the cached employee record
func GetWorkOrderEntries(byuID string) {
	//lock the mutex, get the employee record from the cache (read-only)
	employeeCacheMutex.Lock()
	employee := employeeCache[byuID]
	employeeCacheMutex.Unlock()

	for _, job := range employee.Jobs {
		if job.IsPhysicalFacilities != nil && *job.IsPhysicalFacilities {
			//call WSO2 to get work orders for job
			workOrders := ytimeapi.GetWorkOrderEntries(byuID, job.EmployeeJobID)

			//update the work orders
			UpdateWorkOrderEntriesForJob(byuID, job.EmployeeJobID, workOrders)
		}

	}
}

//GetOtherHours will get the Other Hours entries for the employee and add them to the cached employee record
func GetOtherHours(byuID string) {
	//lock the mutex, get the employee record from the cache
	employeeCacheMutex.Lock()
	employee := employeeCache[byuID]
	employeeCacheMutex.Unlock()

	for _, job := range employee.Jobs {
		if job.JobType == "F" {
			//call WSO2 to get other hours for the job
			otherHours := ytimeapi.GetOtherHours(byuID, job.EmployeeJobID)

			//update the other hours
			UpdateOtherHoursForJob(byuID, job.EmployeeJobID, otherHours)
		}
	}
}
