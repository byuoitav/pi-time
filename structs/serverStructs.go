package structs

//This file is all of the structs that will come back from the WSO2 services

//Timesheet gives all data about the current clock state for an employee and his/her jobs
type Timesheet struct {
	//BYUID is the byu id
	BYUID string `json:"byu_id"`

	//PersonName is the person's name in Last, First format
	PersonName string `json:"person_name"`

	//WeeklyTotal is the total hours worked so far in the week in format h:mm (string)
	WeeklyTotal string `json:"weekly_total"`

	//PeriodTotal is the total hours worked so far in the pay period in format h:mm (string)
	PeriodTotal string `json:"period_total"`

	//Jobs is the array containing current clcok intformation about each job
	Jobs []Job `json:"jobs"`

	//InternationalMessage is used to indicate that a warning should be shown to the user due to hour working limits
	InternationalMessage string `json:"international_message"`
}

//EmployeeCache is the cache list
type EmployeeCache struct {
	Employees []EmployeeRecord `json:"employees"`
}

//EmployeeRecord comes back in the cache list
type EmployeeRecord struct {
	BYUID string `json:"byu_id"`
	NETID string `json:"net_id"`
	Jobs  []Job  `json:"jobs"`
	Name  string `json:"sort_name"`
}

//Job represents the current state of an employee's job
type Job struct {
	JobCodeDesc           string    `json:"job_code_description"`
	PunchType             string    `json:"punch_type"`
	EmployeeRecord        int       `json:"employee_record"`
	WeeklySubtotal        string    `json:"weekly_subtotal"`
	PeriodSubtotal        string    `json:"period_subtotal"`
	PhysicalFacilities    bool      `json:"physical_facilities"`
	OperatingUnit         string    `json:"operating_unit"`
	TRCs                  []TRC     `json:"trcs"`
	CurrentWorkOrder      WorkOrder `json:"current_work_order"`
	CurrentTRC            TRC       `json:"current_trc"`
	FullPartTime          string    `json:"full_part_time"`
	HasPunchException     bool      `json:"has_punch_exception"`
	HasWorkOrderException bool      `json:"has_work_order_exception"`
}

//TRC is a code for the type of hours that an employee can punch in under
type TRC struct {
	TRCID          string `json:"trc_id"`
	TRCDescription string `json:"trc_description"`
}

//WorkOrder is ID and description for a work order
type WorkOrder struct {
	WorkOrderID          string `json:"work_order_id"`
	WorkOrderDescription string `json:"work_order_description"`
}

//TimeClockDay represents a day with activity on the clock
type TimeClockDay struct {
	Date                  string  `json:"date"`
	HasPunchException     bool    `json:"has_punch_exception"`
	HasWorkOrderException bool    `json:"has_work_order_exception"`
	Punches               []Punch `json:"punches"`
	PunchedHours          string  `json:"punched_hours"`
}

//Punch represents a single punch in or out for an employee
type Punch struct {
	PunchType            string `json:"punch_type"`
	PunchTime            string `json:"punch_time"`
	SequenceNumber       int    `json:"sequence_number"`
	DeletablePair        int    `json:"deletable_pair"`
	Latitude             string `json:"latitude"`
	Longitude            string `json:"longitude"`
	LocationDescription  string `json:"location_description"`
	TimeCollectionSource string `json:"time_collection_source"`
	WorkOrderID          string `json:"work_order_id"`
	TRCID                string `json:"trc_id"`
	PunchDate            string `json:"punch_date"`
	EmployeeRecord       int    `json:"employee_record"`
	PunchZone            string `json:"punch_zone"`
}

//LunchPunch is used when posting a lunch punch to the system
type LunchPunch struct {
	StartTime            string `json:"start_time"`
	Duration             string `json:"duration"`
	EmployeeRecord       int    `json:"employee_record"`
	PunchDate            string `json:"punch_date"`
	TimeCollectionSource string `json:"time_collection_source"`
	PunchZone            string `json:"punch_zone"`
	LocationDescription  string `json:"location_description"`
}

//WorkOrderDaySummary is returned when querying a date for work orders logged on that date
type WorkOrderDaySummary struct {
	Date                    string           `json:"punch_date"`
	WorkOrderEntries        []WorkOrderEntry `json:"work_order_entries"`
	PunchHours              string           `json:"punch_hours"`
	PhysicalFacilitiesHours string           `json:"physical_facilities_hours"`
	HasPunchException       bool             `json:"has_punch_exception"`
	HasWorkOrderException   bool             `json:"has_work_order_exception"`
}

//WorkOrderEntry represents a single work order logged for part of a day
type WorkOrderEntry struct {
	WorkOrder              WorkOrder `json:"work_order"`
	TRC                    TRC       `json:"trc"`
	TimeReportingCodeHours string    `json:"time_reporting_code_hours"`
	SequenceNumber         int       `json:"sequence_number"`
	Editable               bool      `json:"editable"`

	//these only used when posting
	EmployeeRecord int `json:"employee_record"`
}

//ElapsedTimeSummary is the parent structure for sick and vacation hours
type ElapsedTimeSummary struct {
	SickLeaveBalanceHours     string           `json:"sick_leave_balance_hours"`
	VacationLeaveBalanceHours string           `json:"vacation_leave_balance_balance"`
	Dates                     []ElapsedTimeDay `json:"elapsed_time_dates"`
}

//ElapsedTimeDay is the parent structure for sick and vacation hours for a day
type ElapsedTimeDay struct {
	PunchDate          string             `json:"punch_date"`
	ElapsedTimeEntries []ElapsedTimeEntry `json:"punches"`
}

//ElapsedTimeEntry is the structure for a single amount of sick or vacation time
type ElapsedTimeEntry struct {
	Editable               bool   `json:"editable"`
	SequenceNumber         int    `json:"sequence_number"`
	TimeReportingCodeHours string `json:"time_reporting_code_hours"`
	TRC                    TRC    `json:"trc"`
}

//DeletePunch .
type DeletePunch struct {
	PunchType      string `json:"punch-type"`
	PunchTime      string `json:"punch-time"`
	SequenceNumber string `json:"sequence-number"`
}
