package handlers

import (
	"github.com/byuoitav/pi-time/socket"
	"github.com/labstack/echo"
)

func LogInUser(context echo.Context) error {

	//do something to authenticate the user, then upgrade to a websocket

	socket.ServeWebsocket(context.Response().Writer, context.Request())
	//return context.JSON(http.StatusOK, "")
	return nil
}
