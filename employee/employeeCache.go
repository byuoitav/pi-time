package employee

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"os"
	"time"

	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/wso2services/wso2requests"
	bolt "go.etcd.io/bbolt"
	"go.uber.org/zap"
)

const (
	EMPLOYEE_BUCKET = "EMPLOYEE"
)

func init() {
	dbLoc := os.Getenv("CACHE_DATABASE_LOCATION")

	if len(dbLoc) == 0 {
		log.P.Warn("Need CACHE_DATABASE_LOCATION variable")
	}
}

//WatchForCachedEmployees will start a timer and download the cache every 4 hours
func WatchForCachedEmployees(updateNowChan chan struct{}, db *bolt.DB) {
	for {
		start := time.Now()
		log.P.Info("Updating employee cache")
		var wait time.Duration

		if err := DownloadCachedEmployees(db); err != nil {
			wait = 30 * time.Minute
			log.P.Error("unable to download employee cache", zap.Error(err), zap.Time("next", time.Now().Add(wait)))
		} else {
			// generate a random time between 01:00 and 04:00 (in the local timezone) tomorrow
			one := time.Now().AddDate(0, 0, 1)
			_, offset := one.Zone()
			one = one.Truncate(24 * time.Hour)
			one = one.Add(1 * time.Hour)
			one = one.Add(time.Duration(-offset) * time.Second)
			min := one.Unix()
			max := one.Add(3 * time.Hour).Unix()
			delta := max - min
			sec := rand.Int63n(delta) + min
			update := time.Unix(sec, 0)
			wait = time.Until(update)

			log.P.Info("Finished updating employee cache", zap.Duration("took", time.Since(start)), zap.Time("next", time.Now().Add(wait)))
		}

		select {
		case <-time.After(wait):
		case <-updateNowChan:
		}
	}
}

//DownloadCachedEmployees makes a call to WSO2 to get the employee cache
func DownloadCachedEmployees(db *bolt.DB) error {
	log.P.Info("Downloading employees")

	var cache structs.EmployeeCache
	ne := wso2requests.MakeWSO2RequestWithHeaders("GET", "https://api.byu.edu:443/domains/erp/hr/clock_employees/v1/", "", &cache, map[string]string{"sm_user": "timeclock"})
	if ne != nil {
		return ne
	}

	log.P.Info("Finished downloading employees. Now adding to local cache", zap.Int("numEmployees", len(cache.Employees)))

	err := db.Update(func(tx *bolt.Tx) error {
		// delete the existing employee bucket
		_ = tx.DeleteBucket([]byte(EMPLOYEE_BUCKET))

		// recreate the bucket
		b, err := tx.CreateBucketIfNotExists([]byte(EMPLOYEE_BUCKET))
		if err != nil {
			return fmt.Errorf("error creating the employee bucket: %s", err)
		}

		// add the employees to the bucket
		for _, emp := range cache.Employees {
			bytes, err := json.Marshal(emp)
			if err != nil {
				log.P.Warn("unable to marshal employee", zap.String("id", emp.BYUID), zap.Error(err))
				continue
			}

			if err := b.Put([]byte(emp.BYUID), bytes); err != nil {
				log.P.Warn("unable to cache employee", zap.String("id", emp.BYUID), zap.Error(err))
				continue
			}
		}

		return nil
	})
	if err != nil {
		return err
	}

	return nil
}

func GetCache(db *bolt.DB) (structs.EmployeeCache, error) {
	var cache structs.EmployeeCache

	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(EMPLOYEE_BUCKET))
		if b == nil {
			return fmt.Errorf("employee bucket doest not exist")
		}

		err := b.ForEach(func(k, v []byte) error {
			var emp structs.EmployeeRecord
			if err := json.Unmarshal(v, &emp); err != nil {
				return fmt.Errorf("unable to unmarshal employee %q: %w", string(k), err)
			}

			cache.Employees = append(cache.Employees, emp)
			return nil
		})
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return cache, err
	}

	return cache, nil
}

//GetEmployeeFromCache looks up an employee in the cache
func GetEmployeeFromCache(byuID string, db *bolt.DB) (structs.EmployeeRecord, error) {
	var emp structs.EmployeeRecord

	err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(EMPLOYEE_BUCKET))
		if b == nil {
			return fmt.Errorf("employee bucket doest not exist")
		}

		bytes := b.Get([]byte(byuID))
		if bytes == nil {
			return fmt.Errorf("employee not in cache")
		}

		if err := json.Unmarshal(bytes, &emp); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		log.P.Warn("unable to get employee from cache", zap.String("id", byuID), zap.Error(err))
		return emp, err
	}

	return emp, nil
}
