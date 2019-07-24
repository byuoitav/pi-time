package structs

import (
	"encoding/json"
	"time"
)

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
	IsPhysicalFacilities  *bool             `json:"is-physical-facilities,omitempty"`
	HasPunchException     *bool             `json:"has-punch-exception,omitempty"`
	HasWorkOrderException *bool             `json:"has-work-order-exception,omitempty"`
	OperatingUnit         string            `json:"operating_unit"`
	TRCs                  []ClientTRC       `json:"trcs"`
	CurrentTRC            ClientTRC         `json:"current-trc"`
	CurrentWorkOrder      ClientWorkOrder   `json:"current-work-order"`
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
	HasPunchException     *bool         `json:"has-punch-exception,omitempty"`
	HasWorkOrderException *bool         `json:"has-work-order-exception,omitempty"`
	Punches               []ClientPunch `json:"punches"`
	PunchedHours          string        `json:"punched-hours"`

	ReportedHours           string                 `json:"reported-hours"`
	PhysicalFacilitiesHours string                 `json:"physical-facilities-hours"`
	WorkOrderEntries        []ClientWorkOrderEntry `json:"work-order-entries"`

	SickHoursYTD     string             `json:"sick-hours-ytd"`
	VacationHoursYTD string             `json:"vacation-hours-ytd"`
	OtherHours       []ClientOtherHours `json:"other-hours"`
}

//ClientPunch is the punch structure sent to the client
type ClientPunch struct {
	ID            int       `json:"id"`
	EmployeeJobID int       `json:"employee-job-id"`
	Time          time.Time `json:"time"`
	PunchType     string    `json:"type"`
	DeletablePair *int      `json:"deletable-pair,omitempty"`
}

//ClientWorkOrderEntry is a work order entry sent to the client
type ClientWorkOrderEntry struct {
	ID                     int             `json:"id"`
	WorkOrder              ClientWorkOrder `json:"work-order"`
	TimeReportingCodeHours string          `json:"time-reporting-code-hours"`
	TRC                    ClientTRC       `json:"trc"`
	Editable               bool            `json:"editable"`
}

//ClientLunchPunchRequest send us for lunch punch
type ClientLunchPunchRequest struct {
	EmployeeJobID     int    `json:"employee-job-id"`
	StartTime         string `json:"start_time"`
	DurationInMinutes int    `json:"duration"`
	PunchDate         string `json:"punch_date"`
}

// DeletePunch .
type DeletePunch struct {
	EmployeeJobID  *int      `json:"employee-record"`
	SequenceNumber *int      `json:"sequence-number"`
	PunchTime      time.Time `json:"punch-time"`
}

//ClientDeleteWorkOrderEntry .
type ClientDeleteWorkOrderEntry struct {
	JobID          int    `json:"employee-job-id"`
	Date           string `json:"date"`
	SequenceNumber int    `json:"sequence-number"`
}

//ClientOtherHours .
type ClientOtherHours struct {
	Editable               bool      `json:"editable"`
	SequenceNumber         int       `json:"sequence-number"`
	TimeReportingCodeHours string    `json:"time-reporting-code-hours"`
	TRC                    ClientTRC `json:"trc"`
}

//ClientOtherHoursRequest is used to post and put the vacation and sick hours
type ClientOtherHoursRequest struct {
	EmployeeJobID          int       `json:"employee-job-id"`
	SequenceNumber         int       `json:"sequence-number"`
	TimeReportingCodeHours string    `json:"time-reporting-code-hours"`
	TRCID                  string    `json:"trc-id"`
	PunchDate              time.Time `json:"punch-date"`
}

//ClientPunchRequest is the punch structure from the client on a punch in or out
type ClientPunchRequest struct {
	BYUID         int       `json:"byu-id"`
	EmployeeJobID int       `json:"employee-job-id"`
	Time          time.Time `json:"time"`
	PunchType     string    `json:"type"`
	WorkOrderID   *string   `json:"work-order-id,omitempty"`
	TRCID         *string   `json:"trc-id,omitempty"`
}

// WorkOrderUpsert .
type WorkOrderUpsert struct {
	EmployeeJobID          *int      `json:"employee_record"`
	SequenceNumber         *int      `json:"sequence_number"`
	TimeReportingCodeHours string    `json:"time_reporting_code_hours"`
	PunchDate              time.Time `json:"punch_date"`
	TRCID                  string    `json:"trc_id"`
	WorkOrderID            *string   `json:"work_order_id"`

	// set on the backend
	TimeCollectionSource string `json:"time_collection_source"`
}

// MarshalJSON .
func (w WorkOrderUpsert) MarshalJSON() ([]byte, error) {
	type Alias WorkOrderUpsert

	return json.Marshal(&struct {
		PunchDate string `json:"punch_date"`
		*Alias
	}{
		PunchDate: w.PunchDate.Format("2006-01-02"),
		Alias:     (*Alias)(&w),
	})
}
