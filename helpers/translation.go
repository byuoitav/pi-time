package helpers

import (
	"fmt"
	"os"

	"github.com/byuoitav/pi-time/structs"
)

func translateToPunch(start structs.ClientPunchRequest) map[string]structs.Punch {

	var req structs.Punch
	req.PunchType = start.PunchType
	fmt.Printf("\ntime: %v\n\n", start.Time.Local())
	req.PunchTime = start.Time.Local().Format("15:04:01")
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
