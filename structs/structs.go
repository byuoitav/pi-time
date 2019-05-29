package structs

import "time"

// in general, durations are represented as int's where it is a number in minutes

// Employee .
type Employee struct {
	// ID is the employees BYU ID number
	ID string `json:"id"`

	// Name is the employees full name
	Name string `json:"name"`

	// Jobs is the list of jobs they have
	Jobs []Job `json:"jobs"`

	// TotalTime is the sum of time that this employee has worked across all jobs
	TotalTime TotalTime `json:"total-time"`
}

// Job .
type Job struct {
	// Name is the name of the job
	Name string `json:"name"`

	// TotalTime is the total time worked for this job
	TotalTime TotalTime `json:"total-time"`

	// ClockedIn is whether or not they are clock in for this job.
	ClockedIn bool `json:"clocked-in"`

	// PayTypes represents each of the pay types availble for this job (ie, on call, premium pay, normal, etc)
	PayTypes []string `json:"pay-types"`

	CurrentWorkOrder    WorkOrder   `json:"current-work-order"`
	AvailableWorkOrders []WorkOrder `json:"available-work-orders"`

	Days []Day `json:"days"`
}

// Day .
type Day struct {
	Date time.Time `json:"date"`

	HasTimesheetExceptions bool    `json:"has-time-sheet-exceptions"`
	PunchedHours           int     `json:"punched-hours"`
	OtherHours             int     `json:"other-hours"`
	Punches                []Punch `json:"punches"`

	HasWorkOrderExceptions bool               `json:"has-work-order-exceptions"`
	WorkOrderBillings      []WorkOrderBilling `json:"work-order-billings"`
}

// WorkOrderBilling .
type WorkOrderBilling struct {
	WorkOrder  WorkOrder `json:"work-order"`
	BilledTime int       `json:"billed-time"`
}

// Punch .
type Punch struct {
	Time          time.Time `json:"in-time"`
	Type          string    `json:"type"`
	ExceptionType string    `json:"exception-type"`
}

// WorkOrder .
type WorkOrder struct {
	// ID is the work order id (ie, PS-1234-5)
	ID string `json:"id"`

	// Name is the name/description of this job (ie, Stadium Clean Up)
	Name string `json:"name"`
}

// TotalTime .
type TotalTime struct {
	// Week is The total time clocked in for this week
	Week int `json:"week"`

	// PayPeriod is the total time clocked in for this pay period
	PayPeriod int `json:"pay-period"`
}
