package main

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/byuoitav/pi-time/cache"
	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/ytime"
	figure "github.com/common-nighthawk/go-figure"
	"github.com/labstack/echo/v4"
	"github.com/spf13/pflag"
	"go.uber.org/zap"

	"github.com/byuoitav/pi-time/handlers"
	"github.com/byuoitav/pi-time/helpers"
	"github.com/labstack/echo/v4/middleware"
)

var updateCacheNowChannel = make(chan struct{})

func main() {
	figure.NewFigure("PI-TIME", "ntgreek", true).Print()
	fmt.Print("\n\n")

	var (
		port     int
		logLevel int

		clientID      string
		clientSecret  string
		cacheLocation string
	)

	pflag.IntVarP(&port, "port", "P", 8080, "port to run the server on")
	pflag.IntVarP(&logLevel, "log-level", "L", 2, "level of logging wanted. 1=DEBUG, 2=INFO, 3=WARN, 4=ERROR, 5=PANIC")
	pflag.StringVarP(&clientID, "id", "i", "", "client id for ytime api")
	pflag.StringVarP(&clientSecret, "secret", "s", "", "client secret for ytime api")
	pflag.StringVarP(&cacheLocation, "cache", "c", "./cache/", "path location to where to cache data")
	pflag.Parse()

	if err := log.SetLevel(logLevel); err != nil {
		log.P.Fatal("unable to set log level", zap.Error(err), zap.Int("got", logLevel))
	}

	// check key/secret
	if len(clientID) == 0 || len(clientSecret) == 0 {
		log.P.Fatalf("client id (--id) and secret (--secret) must be set")
	}

	e := echo.New()

	yth := handlers.YTime{
		Client: ytime.New(clientID, clientSecret),
	}

	//start a go routine to go and get the latitude and longitude from the building struct
	go cache.GetYtimeLocation()

	//start a go routine that will pull the cache information for offline mode
	go helpers.WatchForCachedEmployees(updateCacheNowChannel)

	// TODO start a go routine that will monitor the persistent cache for punches that didn't get posted and post them once the clock comes online

	// health endpoint
	e.GET("/healthz", func(c echo.Context) error {
		return c.String(http.StatusOK, "healthy")
	})

	//login and upgrade to websocket
	e.GET("/id/:id", yth.LogInUser)

	// clock in/out/transfer
	e.POST("/punch/:id", yth.Punch)

	// fix a punch
	e.PUT("/punch/:id/:seq", yth.FixPunch)

	// lunchpunch
	e.POST("/lunchpunch/:id", yth.LunchPunch)

	// get sick and vacation
	e.GET("/otherhours/:id/:jobid/:date", yth.GetSickAndVacationForJobAndDate)

	// add sick or vacation
	e.PUT("/otherhours/:id", yth.OtherHours)

	// add/edit work order entry
	e.POST("/workorderentry/:id", yth.UpsertWorkOrderEntry)

	// delete work order entry
	e.DELETE("/workorderentry/:id", yth.DeleteWorkOrderEntry)

	// delete duplicate punch
	e.DELETE("/punch/:id", yth.DeletePunch)

	// TODO endpoint for UI events
	// e.POST("/event", handlers.SendEvent)

	// force an update of the employee cache
	e.PUT("/updateCache", updateCacheNow)

	// serve the angular web page
	e.Group("/", middleware.StaticWithConfig(middleware.StaticConfig{
		Root:   "analog",
		Index:  "index.html",
		HTML5:  true,
		Browse: true,
	}))

	addr := fmt.Sprintf(":%d", port)
	log.P.Info("Starting server", zap.String("addr", addr))

	err := e.Start(addr)
	if err != nil && errors.Is(err, http.ErrServerClosed) {
		log.P.Fatal("failed to start server", zap.Error(err))
	}
}

func updateCacheNow(c echo.Context) error {
	updateCacheNowChannel <- struct{}{}

	return c.String(http.StatusOK, "cache update initiated")
}
