package helpers

import (
	"os"

	"github.com/byuoitav/pi-time/cache"
	"github.com/byuoitav/pi-time/structs"
)

func translateToPunch(start structs.ClientPunchRequest) structs.Punch {
	var req structs.Punch
	req.PunchType = start.PunchType
	req.PunchTime = start.Time.Local().Format("15:04:05")
	req.Latitude = structs.String(cache.LATITUDE)
	req.Longitude = structs.String(cache.LONGITUDE)
	req.LocationDescription = structs.String(os.Getenv("SYSTEM_ID"))
	req.TimeCollectionSource = structs.String("CPI")
	req.PunchDate = structs.String(start.Time.Local().Format("2006-01-02"))
	req.EmployeeRecord = start.EmployeeJobID
	req.PunchZone = structs.String(start.Time.Local().Format("-07:00"))
	req.InternetAddress = structs.String("")
	req.SequenceNumber = start.SequenceNumber
	req.WorkOrderID = start.WorkOrderID
	req.TRCID = start.TRCID

	return req
}

func translateToElapsedTimeEntry(start structs.ClientOtherHoursRequest) structs.ElapsedTimeEntry {
	var toReturn structs.ElapsedTimeEntry

	toReturn.SequenceNumber = start.SequenceNumber
	toReturn.TRCID = start.TRCID
	toReturn.EmployeeRecord = start.EmployeeJobID
	toReturn.TimeReportingCodeHours = start.TimeReportingCodeHours
	toReturn.PunchDate = start.PunchDate.Format("2006-01-02")
	toReturn.TimeCollectionSource = os.Getenv("SYSTEM_ID")

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
