package main

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/byuoitav/common/log"
	"github.com/byuoitav/common/v2/events"
	"github.com/byuoitav/pi-time/cache"
	"github.com/byuoitav/pi-time/event"
	"github.com/labstack/echo/v4"

	"github.com/byuoitav/pi-time/employee"
	"github.com/byuoitav/pi-time/handlers"
	"github.com/byuoitav/pi-time/offline"
	"github.com/labstack/echo/v4/middleware"
	bolt "go.etcd.io/bbolt"
)

var updateCacheNowChannel = make(chan struct{})

func main() {
	//start a go routine to go and get the latitude and longitude from the building struct
	go cache.GetYtimeLocation()

	//start a go routine that will monitor the persistent cache for punches that didn't get posted and post them once the clock comes online

	//start up a server to serve the angular site and set up the handlers for the UI to use
	port := ":8463"

	router := echo.New()

	// health endpoint
	router.GET("/healthz", func(c echo.Context) error {
		return c.String(http.StatusOK, "healthy")
	})

	//TODO Smitty - open db and pass it in to the functions
	dbLoc := os.Getenv("CACHE_DATABASE_LOCATION")
	db, err := bolt.Open(dbLoc, 0600, nil)
	if err != nil {
		panic(fmt.Sprintf("could not open db: %s", err))
	}

	//create buckets if they do not exist
	err = db.Update(func(tx *bolt.Tx) error {
		//create punch bucket if it does not exist
		log.L.Debug("Checking if Pending Bucket Exists")
		_, err := tx.CreateBucketIfNotExists([]byte(offline.PENDING_BUCKET))
		if err != nil {
			return fmt.Errorf("error creating the pending bucket: %s", err)
		}

		log.L.Debug("Checking if Error Bucket Exists")
		_, err = tx.CreateBucketIfNotExists([]byte(offline.ERROR_BUCKET))
		if err != nil {
			return fmt.Errorf("error creating the error bucket: %s", err)
		}

		log.L.Debug("Checking if Employee Bucket Exists")
		_, err = tx.CreateBucketIfNotExists([]byte(employee.EMPLOYEE_BUCKET))
		if err != nil {
			return fmt.Errorf("error creating the employee bucket: %s", err)
		}

		return nil
	})
	if err != nil {
		panic(fmt.Sprintf("could not create db buckets: %s", err))
	}

	//start a go routine that will pull the cache information for offline mode
	go employee.WatchForCachedEmployees(updateCacheNowChannel, db)

	go offline.ResendPunches(db)

	//Get all the bucket stats (pending, error, employee)
	router.GET("/statz", offline.GetBucketStatsHandler(db))

	// push up bucket stats every 5 minutes
	go sendBucketStats(db)

	//Search for employee in the employee cache
	router.GET("/employeeBucket/:id", offline.GetEmployeeFromBucket(db))

	//returns all the punches in the error bucket
	router.GET("/buckets/error/punches", offline.GetErrorBucketPunchesHandler(db))

	//deletes a specific punch in the error bucket
	router.DELETE("/buckets/error/punches/:punchId", offline.GetDeletePunchFromErrorBucketHandler(db))

	//deletes all the punches in the error bucket
	router.DELETE("/buckets/error/punches/all", offline.DeleteAllFromPunchBucket(db))

	//moves all requests in the error bucket to the pending bucket and clears the error bucket
	router.GET("/buckets/error/reset", offline.TransferPunchesHandler(db))

	//login and upgrade to websocket
	router.GET("/id/:id", handlers.GetLoginUserHandler(db))

	//all of the functions to call to add / update / delete / do things on the UI

	//clock in
	//clock out
	//transfer
	//add missing punch
	router.POST("/punch/:id", handlers.GetPunchHandler(db))

	//will send in a ClientPunchRequest in the body
	router.PUT("/punch/:id/:seq", handlers.FixPunch) //will send in a ClientPunchRequest in the body

	//lunchpunch
	router.POST("/lunchpunch/:id", handlers.LunchPunch)

	//get sick and vacation
	router.GET("/otherhours/:id/:jobid/:date", handlers.GetSickAndVacationForJobAndDate)

	//add sick or vacation
	router.PUT("/otherhours/:id", handlers.OtherHours)

	// add/edit work order entry
	router.POST("/workorderentry/:id", handlers.UpsertWorkOrderEntry)

	//delete work order entry
	router.DELETE("/workorderentry/:id", handlers.DeleteWorkOrderEntry)

	//delete duplicate punch
	router.DELETE("/punch/:id", handlers.DeletePunch)

	//endpoint for UI events
	router.POST("/event", handlers.SendEventHandler)

	//force an update of the employee cache
	router.PUT("/updateCache", updateCacheNow)
	router.GET("/cache", handlers.CacheDump(db))

	router.GET("/", func(c echo.Context) error {
		return c.Redirect(http.StatusTemporaryRedirect, "/analog")
	})

	//serve the angular web page
	router.Group("/analog", middleware.StaticWithConfig(middleware.StaticConfig{
		Root:   "analog",
		Index:  "index.html",
		HTML5:  true,
		Browse: true,
	}))

	server := http.Server{
		Addr:           port,
		MaxHeaderBytes: 1024 * 10,
	}

	err = router.StartServer(&server)
	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.L.Fatalf("failed to start server: %s", err)
	}
}

func updateCacheNow(ectx echo.Context) error {
	updateCacheNowChannel <- struct{}{}

	return ectx.String(http.StatusOK, "cache update initiated")
}

func sendBucketStats(db *bolt.DB) {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		stats, err := offline.GetBucketStats(db)
		if err != nil {
			log.L.Warnf("unable to get bucket stats: %s", err)
			continue
		}

		deviceInfo := events.GenerateBasicDeviceInfo(os.Getenv("SYSTEM_ID"))
		e := events.Event{
			Timestamp:    time.Now(),
			EventTags:    []string{"pi-time"},
			AffectedRoom: deviceInfo.BasicRoomInfo,
			TargetDevice: deviceInfo,
			Key:          "pi-time-pending-bucket-size",
			Value:        strconv.Itoa(stats.PendingBucket),
		}

		if err := event.SendEvent(e); err != nil {
			log.L.Infof("unable to send pending bucket event: %w")
		}

		e.Key = "pi-time-error-bucket-size"
		e.Value = strconv.Itoa(stats.ErrorBucket)

		if err := event.SendEvent(e); err != nil {
			log.L.Infof("unable to send error bucket event: %w")
		}

		e.Key = "pi-time-employee-bucket-size"
		e.Value = strconv.Itoa(stats.EmployeeBucket)

		if err := event.SendEvent(e); err != nil {
			log.L.Infof("unable to send employee bucket event: %w")
		}
	}
}
