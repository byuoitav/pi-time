package ytime

import (
	"context"
	"time"

	"github.com/byuoitav/pi-time/structs"
)

type Client interface {
	SendPunchRequest(context.Context, string, structs.Punch) (structs.Timesheet, error)
	SendFixPunchRequest(context.Context, string, structs.Punch) ([]structs.TimeClockDay, error)
	SendLunchPunch(context.Context, string, structs.LunchPunch) ([]structs.TimeClockDay, error)
	SendOtherHoursRequest(context.Context, string, structs.ElapsedTimeEntry) (structs.ElapsedTimeSummary, error)
	SendWorkOrderUpsertRequest(context.Context, string, structs.WorkOrderUpsert) (structs.WorkOrderDaySummary, error)
	SendDeletePunchRequest(context.Context, string, structs.DeletePunch) ([]structs.TimeClockDay, error)
	SendDeleteWorkOrderEntryRequest(ctx context.Context, id, jobID, punchDate, sequenceNumber string) (structs.WorkOrderDaySummary, error)
	GetPunchesForJob(ctx context.Context, id string, jobID int) ([]structs.TimeClockDay, error)
	GetWorkOrders(ctx context.Context, operatingUnit string) ([]structs.WorkOrder, error)
	GetWorkOrderEntries(ctx context.Context, id string, jobID int) ([]structs.WorkOrderDaySummary, error)
	GetOtherHoursForDate(ctx context.Context, id string, jobID int, date time.Time) (structs.ElapsedTimeSummary, error)
	GetTimesheet(context.Context, string) (structs.Timesheet, error, bool)
}
