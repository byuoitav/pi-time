package handlers

import (
	"net/http"

	"github.com/byuoitav/pi-time/helpers"
	"github.com/byuoitav/pi-time/socket"
	"github.com/labstack/echo"
)

//LogInUser will authenticate a user, upgrade to websocket, and return the timesheet and offline mode to the web socket
func LogInUser(context echo.Context) error {
	//do something to authenticate the user, then upgrade to a websocket

	//get the id
	byuID := context.Param("id")

	//get the timesheet for this guy
	timesheet, isOffline, err := helpers.GetTimesheet(byuID)

	if err != nil {
		return context.String(http.StatusForbidden, "invalid BYU ID")
	}

	//upgrade the connection to a websocket
	webSocketClient := socket.ServeWebsocket(context.Response().Writer, context.Request())

	//store the websocket connection in a map so we can get to it later for that employee id
	socket.AddConnection(byuID, webSocketClient)


	
	
	//send the timesheet down the web socket
	socket.SendMessageToClient(byuID, "timesheet", timesheet)

	//if offline, send an offline message down the web socket
	if isOffline {
		socket.SendMessageToClient(byuID, "offline-mode", true)
	} else {
		socket.SendMessageToClient(byuID, "offline-mode", false)
	}

	return nil
}
