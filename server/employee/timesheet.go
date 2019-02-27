package employee

import (
	"fmt"

	"github.com/byuoitav/common/nerr"
	"github.com/byuoitav/pi-time/server/base"
	"github.com/byuoitav/pi-time/shared"
	"github.com/byuoitav/wso2services/wso2requests"
)

type WSO2Timesheet struct {
	Jobs          []WSO2Job `json:"jobs"`
	International bool      `json:"international"`
	ByuID         string    `json:"byu_id"`
	PeriodTotal   string    `json:"period_total"`
	WeeklyTotal   string    `json:"weekly_total"`
}

type WSO2Job struct {
	Message            string `json:"message,omitempty"`
	JobCodeDescription string `json:"job_code_description"`
	PhysicalFacilities bool   `json:"physical_facilities"`
	ValidAccount       bool   `json:"valid_account"`
	EmployeeRecord     string `json:"employee_record"`
	ClockIn            bool   `json:"clock_in"`
	WeeklySubtotal     string `json:"weekly_subtotal"`
	OperatingUnit      string `json:"operating_unit"`
	PeriodSubtotal     string `json:"period_subtotal"`
	FullPartTime       string `json:"full_part_time"`
}

func GetTimeSheetForUser(byuid string) (WSO2Timesheet, *nerr.E) {

	var toReturn WSO2Timesheet

	err := wso2requests.MakeWSO2Request("GET", fmt.Sprintf("https://api.byu.edu/domains/erp/hr/timesheet/v1/%v", byuid), nil, &toReturn)
	if err != nil {
		return toReturn, err.Addf("Couldn't get timesheet for user %v", byuid)
	}

	return toReturn, nil
}

func AddTimesheetInfoToEmployee(e shared.Employee, t WSO2Timesheet) shared.Employee {

	e.TotalTime = shared.TotalTime{
		Week:      t.WeeklyTotal,
		PayPeriod: t.PeriodTotal,
	}

	e.ShowWorkOrders = t.PhysicalFacilities

	for _, i := range t.Jobs {
		newJob := shared.Job{
			Name: i.JobCodeDescription,
			TotalTime: shared.TotalTime{
				Week:      i.WeeklySubtotal,
				PayPeriod: i.PeriodSubtotal,
			},
			ClockedIn: i.ClockIn,
			Message:   i.Message,
		}
	}

	return e, nil
}

func GetTimesheetAsync(id string, wg *sync.Waitgroup, returnChannel chan base.AsyncWrapper) *nerr.E {
	e, err := GetTimeSheetForUser(id)
	returnChannel <- base.AsyncWrapper{
		Type:  shared.Timesheet,
		Err:   err,
		Value: e,
	}
	wg.Done()
}
