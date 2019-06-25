package structs

import "time"

//This file is all of the structs that will be sent to the angular client

//WebSocketMessage is a wrapper for whatever we're sending down the websocket
type WebSocketMessage struct {
	Key   string      `json:"key"`
	Value interface{} `json:"value"`
}

//Employee is all of the information about an employee for their timeclock session
type Employee struct {
	ID        string        `json:"id"`
	Name      string        `json:"name"`
	Jobs      []EmployeeJob `json:"jobs"`
	TotalTime TotalTime     `json:"total-time"`
	Message   string        `json:"international-message"`
}

//TotalTime is a struct to hold pay period and total kinds of time
type TotalTime struct {
	Week      string `json:"week"`
	PayPeriod string `json:"pay-period"`
}

//EmployeeJob is a job for an employee - sent to the client
type EmployeeJob struct {
	EmployeeJobID         int               `json:"employee-job-id"`
	Description           string            `json:"description"`
	TimeSubtotals         TotalTime         `json:"time-subtotals"`
	ClockStatus           string            `json:"clock-status"`
	JobType               string            `json:"job-type"`
	IsPhysicalFacilities  bool              `json:"is-physical-facilities"`
	HasPunchException     bool              `json:"has-punch-exception"`
	HasWorkOrderException bool              `json:"has-work-order-exception"`
	OperatingUnit         string            `json:"operating_unit"`
	TRCs                  []ClientTRC       `json:"trcs"`
	CurrentTRC            ClientTRC         `json:"current-trc"`
	WorkOrders            []ClientWorkOrder `json:"work-orders"`
	Days                  []ClientDay       `json:"days"`
}

//ClientTRC is a TRC sent to the client side
type ClientTRC struct {
	ID          string `json:"id"`
	Description string `json:"description"`
}

//ClientWorkOrder is the work order structure sent to the client
type ClientWorkOrder struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

//ClientDay is the day structure sent to the client
type ClientDay struct {
	Date                  time.Time     `json:"date"`
	HasPunchException     bool          `json:"has-punch-exception"`
	HasWorkOrderException bool          `json:"has-work-order-exception"`
	Punches               []ClientPunch `json:"punches"`
	PunchedHours          string        `json:"punched-hours"`

	PunchHours              string                 `json:"punch_hours"`
	PhysicalFacilitiesHours string                 `json:"physical_facilities_hours"`
	WorkOrderEntries        []ClientWorkOrderEntry `json:"work-order-entries"`

	SickHours        string `json:"sick-hours"`
	VacationHours    string `json:"vacation-hours"`
	SickHoursYTD     string `json:"sick-hours-ytd"`
	VacationHoursYTD string `json:"vacation-hours-ytd"`
}

//ClientPunch is the punch structure sent to the client
type ClientPunch struct {
	ID            int       `json:"id"`
	EmployeeJobID int       `json:"employee-job-id"`
	Time          time.Time `json:"time"`
	PunchType     string    `json:"type"`
	DeletablePair int       `json:"deletable-pair"`
}

//ClientWorkOrderEntry is a work order entry sent to the client
type ClientWorkOrderEntry struct {
	ID          string          `json:"id"`
	WorkOrder   ClientWorkOrder `json:"work-order"`
	HoursBilled string          `json:"hours-billed"`
	TRC         ClientTRC       `json:"trc"`
	Editable    bool            `json:"editable"`
}

//ClientLunchPunchRequest send us for lunch punch
type ClientLunchPunchRequest struct {
	EmployeeJobID     int       `json:"employee-job-id"`
	StartTime         time.Time `json:"time"`
	DurationInMinutes int       `json:"duration-in-minutes"`
}

//ClientSickRequest .
type ClientSickRequest struct {
	Editable bool `json:"editable"`
	//SequenceNumber int    `json:"sequence-number"`
	ElapsedHours string `json:"elapsed-hours"`
}

//ClientVacationRequest .
type ClientVacationRequest struct {
	Editable bool `json:"editable"`
	//SequenceNumber int    `json:"sequence-number"`
	ElapsedHours string `json:"elapsed-hours"`
}

//ClientDeletePunch .
type ClientDeletePunch struct {
	PunchType string `json:"punch-type"`
	PunchTime string `json:"punch-time"`
	//SequenceNumber int    `json:"sequence-number"`
}
