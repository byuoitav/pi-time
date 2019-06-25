package main

import (
	"net/http"

	"github.com/labstack/echo"

	"github.com/byuoitav/common"
	"github.com/byuoitav/common/log"
	"github.com/byuoitav/pi-time/handlers"
	"github.com/byuoitav/pi-time/helpers"
	"github.com/labstack/echo/middleware"
)

var updateCacheNowChannel = make(chan struct{})

func main() {

	log.SetLevel("debug")

	//start a go routine that will pull the cache information for offline mode
	go helpers.WatchForCachedEmployees(updateCacheNowChannel)

	//start up a server to serve the angular site and set up the handlers for the UI to use
	port := ":8463"

	router := common.NewRouter()

	//login and upgrade to websocket
	router.GET("/id/:id", handlers.LogInUser)

	//all of the functions to call to add / update / delete / do things on the UI
	router.POST("/punch/:id", handlers.Punch)
	router.POST("/lunchpunch/:id", handlers.LunchPunch)
	router.PUT("/sick/:id", handlers.Sick)
	router.PUT("/vacation/:id", handlers.Vacation)
	router.POST("/workorderentry/id", handlers.WorkOrderEntry)
	router.DELETE("/punch/:jobid/:date/:seqnum", handlers.DeletePunch)

	//endpoint for UI events
	router.POST("/event", handlers.SendEvent)

	//force an update of the employee cache
	router.PUT("/updateCache", updateCacheNow)

	//serve the angular web page
	router.Group("/", middleware.StaticWithConfig(middleware.StaticConfig{
		Root:   "analog-dist",
		Index:  "index.html",
		HTML5:  true,
		Browse: true,
	}))

	server := http.Server{
		Addr:           port,
		MaxHeaderBytes: 1024 * 10,
	}

	router.StartServer(&server)
}

func updateCacheNow(ectx echo.Context) error {
	updateCacheNowChannel <- struct{}{}

	return ectx.String(http.StatusOK, "cache update initiated")
}
