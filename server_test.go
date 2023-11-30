package main

import (
	"fmt"
	"testing"

	"github.com/byuoitav/common/log"
	"github.com/byuoitav/pi-time/employee"
	"github.com/byuoitav/pi-time/offline"
	bolt "go.etcd.io/bbolt"
)

func TestAPI(t *testing.T) {
	byuID := "779147452"

	log.SetLevel("debug")

	fmt.Println("Building databases")
	//TODO Smitty - open db and pass it in to the functions
	dbLoc := "_testing/testDB.db"
	db, err := bolt.Open(dbLoc, 0666, nil)
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

	fmt.Println("START: get workers from Workday and test that byuid can be found")

	err = employee.DownloadCachedEmployees(db)
	if err != nil {
		fmt.Printf("error downloading cached employees: %s\n", err)
	}
	fmt.Println(employee.GetEmployeeFromCache(byuID, db))
	fmt.Println("END: get workers from Workday and test that byuid can be found")
}
