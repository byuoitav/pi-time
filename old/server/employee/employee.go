package employee

import (
	"fmt"
	"sync"

	"github.com/byuoitav/common/nerr"
	"github.com/byuoitav/pi-time/server/base"
	"github.com/byuoitav/pi-time/shared"
)

func GetEmployee(id string) (shared.Employee, *nerr.E) {

	//we want to dispatch to get the punches, timesheet, and employee info in parallel

	wg := sync.WaitGroup
	wg.Add(1)

	respChannel := make(chan base.AsyncWrapper, 1)

	go GetTimesheetAsync(id, wg, respChannel)

	wg.Wait()

	close(respChannel)

	var toReturn shared.Employee

	for i := range respChannel {
		if i.Err != nil {
			return toReturn, i.Err.Addf("Couldn't get employee information")
		}
		toReturn, err := ProcessEmployee(toReturn, i)

	}

}

func ProcessEmployeeWrapper(e shared.Employee, wrapper base.AsyncWrapper) (shared.Employee, *nerr.E) {

	switch wrapper.Type {

	case shared.Timesheet:

		v, ok := wrapper.Val.(WSO2Timesheet)
		if !ok {
			return e, nerr.Create(fmt.Sprintf("Invalid value %v for type Timesheet", wrapper.Val), "invalid-payload")

		}

		e = AddTimesheetInfoToEmployee(e, v)

	case shared.WorkOrder:

	case shared.Punches:

	}

	return e, nil
}
