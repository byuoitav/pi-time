package helpers

import (
	"os"

	"github.com/byuoitav/pi-time/structs"
)

func translateToPunch(start structs.ClientPunchRequest) map[string]structs.Punch {

	var req structs.Punch
	req.PunchType = start.PunchType
	req.PunchTime = start.Time.Local().Format("15:04:05")
	req.Latitude = structs.String("40.25258")
	req.Longitude = structs.String("-111.657658")
	req.LocationDescription = structs.String(os.Getenv("SYSTEM_ID"))
	req.TimeCollectionSource = structs.String("CPI")
	req.WorkOrderID = start.WorkOrderID
	req.TRCID = start.TRCID
	req.PunchDate = structs.String(start.Time.Local().Format("2006-01-02"))
	req.EmployeeRecord = structs.Int(start.EmployeeJobID)
	req.PunchZone = structs.String(start.Time.Local().Format("-07:00"))
	req.InternetAddress = structs.String("")

	wrapper := make(map[string]structs.Punch)
	wrapper["punch"] = req

	return wrapper
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
