package helpers

import (
	"encoding/json"
	"os"
	"time"

	"github.com/byuoitav/common/log"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/wso2services/wso2requests"
	"github.com/dgraph-io/badger"
)

func init() {
	dbLoc := os.Getenv("CACHE_DATABASE_LOCATION")
	if len(dbLoc) == 0 {
		log.L.Fatalf("Need CACHE_DATABASE_LOCATION variable")
	}
}

//WatchForCachedEmployees will start a timer and download the cache every 4 hours
func WatchForCachedEmployees(updateNowChan chan struct{}) {
	for {

		DownloadCachedEmployees()

		//wait for 4 hours and then do it again
		select {
		case <-time.After(4 * time.Hour):
			log.L.Infof("4 hour timeout reached")
		case <-updateNowChan:
			log.L.Infof("4 updating now")
		}
	}
}

//DownloadCachedEmployees makes a call to WSO2 to get the employee cache
func DownloadCachedEmployees() error {
	var cacheList structs.EmployeeCache

	//make a WSO2 request to get the cache
	log.L.Debugf("Making call to get employee cache")
	ne := wso2requests.MakeWSO2RequestWithHeaders("GET", "https://psws.byu.edu/PSIGW/BYURESTListeningConnector2/PSFT_HR/clock_employees.v1/", "", &cacheList, map[string]string{"sm_user": "timeclock"})

	if ne != nil {
		log.L.Errorf("Unable to get the cache list: %v", ne)
		return ne
	}

	//open our badger db
	//initialize the badger db
	log.L.Debugf("Initializing Badger DB")
	dbLoc := os.Getenv("CACHE_DATABASE_LOCATION")
	opts := badger.DefaultOptions(dbLoc)

	db, err := badger.Open(opts)
	if err != nil {
		log.L.Fatal(err)
	}

	log.L.Debugf("Adding %v employees to the cache", len(cacheList.Employees))

	//put it into the badger cache
	for _, employee := range cacheList.Employees {
		err := db.Update(func(txn *badger.Txn) error {
			employeeJSON, _ := json.Marshal(employee)

			err := txn.Set([]byte(employee.BYUID), []byte(employeeJSON))
			return err
		})

		if err != nil {
			log.L.Errorf("Unable to get the add to badgerdb: %v", err)
			return err
		}
	}

	db.Close()

	return nil
}

//GetEmployeeFromCache looks up an employee in the cache
func GetEmployeeFromCache(byuID string) (structs.EmployeeRecord, error) {

	dbLoc := os.Getenv("CACHE_DATABASE_LOCATION")
	opts := badger.DefaultOptions(dbLoc)

	db, err := badger.Open(opts)
	if err != nil {
		log.L.Fatal(err)
	}

	defer db.Close()

	var empRecord structs.EmployeeRecord

	err = db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte(byuID))
		if err != nil {
			//not found, return it
			return err
		}

		valCopy, err := item.ValueCopy(nil)
		if err != nil {
			//weirdness
			return err
		}

		//per danny, reuse variable called 'err'
		err = json.Unmarshal(valCopy, &empRecord)
		if err != nil {
			return err
		}

		//no error in db.View
		return nil
	})

	if err != nil {
		//unable to retrieve from cache for whatever reason
		return empRecord, err
	}

	return empRecord, nil
}

func WatchForOfflinePunchesAndSend() {

}

func StartLogChannel() {

}

funct MonitorLogFiles() {
	
}