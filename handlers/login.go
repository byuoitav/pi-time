package handlers

import (
	"github.com/byuoitav/pi-time/cache"
	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/ytimeapi"

	"github.com/labstack/echo/v4"
	bolt "go.etcd.io/bbolt"
)

//LogInUser will authenticate a user, upgrade to websocket, and return the timesheet and offline mode to the web socket
func GetLoginUserHandler(db *bolt.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		//upgrade the connection to a websocket
		webSocketClient := cache.ServeWebsocket(c.Response().Writer, c.Request())

		//get the id
		byuID := c.Param("id")
		log.P.Debug("Logging in " + byuID)

		//get the timesheet for this guy
		timesheet, isOffline, err := ytimeapi.GetTimesheet(byuID, db)

		if err != nil {
			//return c.String(http.StatusForbidden, err.Error())
			webSocketClient.CloseWithReason(err.Error())
			return nil
		}

		//store the websocket connection in a map so we can get to it later for that employee id
		cache.AddConnection(byuID, webSocketClient)

		//store the employee in the cache and update it
		cache.AddEmployee(byuID)
		cache.UpdateEmployeeFromTimesheet(byuID, timesheet)

		//now launch some threads to go get all of the other information for the employee
		go cache.GetPossibleWorkOrders(byuID)
		go cache.GetPunchesForAllJobs(byuID)
		go cache.GetWorkOrderEntries(byuID)
		//go cache.GetOtherHours(byuID)

		//if offline, send an offline message down the web socket
		if isOffline {
			_ = cache.SendMessageToClient(byuID, "offline-mode", true)
		} else {
			_ = cache.SendMessageToClient(byuID, "offline-mode", false)
		}

		return nil
	}
}
