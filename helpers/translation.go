package helpers

import (
	"os"

	"github.com/byuoitav/pi-time/structs"
)

func translateToPunch(start structs.ClientPunchRequest) structs.Punch {
	var toReturn structs.Punch

	toReturn.PunchType = start.PunchType
	toReturn.PunchTime = start.Time.Format("15:04")
	toReturn.Latitude = "40.25258"
	toReturn.Longitude = "-111.657658"
	toReturn.LocationDescription = os.Getenv("SYSTEM_ID")
	toReturn.TimeCollectionSource = "CPI"
	toReturn.WorkOrderID = start.WorkOrderID
	toReturn.TRCID = start.TRCID
	toReturn.PunchDate = start.Time.Format("2006-01-02")
	toReturn.EmployeeRecord = start.EmployeeJobID
	toReturn.PunchZone = ""

	return toReturn
}

func translateToLunchPunch(start structs.ClientLunchPunchRequest) structs.LunchPunch {
	var toReturn structs.LunchPunch

	toReturn.EmployeeRecord = start.EmployeeJobID
	toReturn.StartTime = start.StartTime.Format("15:04")
	toReturn.PunchDate = start.StartTime.Format("2006-01-02")
	toReturn.Duration = string(start.DurationInMinutes)
	toReturn.TimeCollectionSource = "CPI"
	toReturn.PunchZone = "XXX"
	toReturn.LocationDescription = os.Getenv("SYSTEM_ID")

	return toReturn
}

func translateToElapsedTimeEntry(start structs.ClientOtherHours) structs.ElapsedTimeEntry {
	var toReturn structs.ElapsedTimeEntry

	toReturn.Editable = start.Editable
	toReturn.SequenceNumber = start.SequenceNumber
	toReturn.TRC = structs.TRC{
		TRCID:          start.TRC.ID,
		TRCDescription: start.TRC.Description,
	}
	toReturn.TimeReportingCodeHours = start.TimeReportingCodeHours

	return toReturn
}

func translateToWorkOrderEntry(start structs.ClientWorkOrderEntry) structs.WorkOrderEntry {
	var toReturn structs.WorkOrderEntry

	toReturn.WorkOrder = structs.WorkOrder{
		WorkOrderID:          start.WorkOrder.ID,
		WorkOrderDescription: start.WorkOrder.Name,
	}
	toReturn.TRC = structs.TRC{
		TRCID:          start.TRC.ID,
		TRCDescription: start.TRC.Description,
	}
	toReturn.TimeReportingCodeHours = start.TimeReportingCodeHours
	toReturn.Editable = start.Editable

	return toReturn
}

func translateToDeletePunch(start structs.ClientDeletePunch, sequenceNumber string) structs.DeletePunch {
	var toReturn structs.DeletePunch

	toReturn.PunchTime = start.PunchTime
	toReturn.PunchType = start.PunchType
	toReturn.SequenceNumber = sequenceNumber

	return toReturn
}
