package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/structs"
	"github.com/labstack/echo/v4"

	bolt "go.etcd.io/bbolt"
)

type bucketStats struct {
	pendingBucket int
	errorBucket   int
}

type errorPunches struct {
	bucketName string
	punches    []structs.ClientPunchRequest
}

func GetBucketStats(context echo.Context) error {
	dbLoc := os.Getenv("CACHE_DATABASE_LOCATION")
	db, err := bolt.Open(dbLoc, 0600, nil)
	if err != nil {
		log.P.Panic(fmt.Sprintf("error opening the db: %s", err))
		return context.String(http.StatusInternalServerError, fmt.Sprintf("error: %s", err))

	}

	var pendingBucket int
	var errorBucket int
	err = db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte([]byte("punches")))
		if bucket != nil {
		}

		bucket.ForEach(func(key, value []byte) error {
			pendingBucket = pendingBucket + 1
			return nil
		})
		return nil
	})
	if err != nil {
		return context.String(http.StatusInternalServerError, fmt.Sprintf("error: %s", err))
	}

	err = db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte([]byte("error")))
		if bucket != nil {
		}

		bucket.ForEach(func(key, value []byte) error {
			errorBucket = errorBucket + 1
			return nil
		})
		return nil
	})
	if err != nil {
		return context.String(http.StatusInternalServerError, fmt.Sprintf("error: %s", err))
	}

	var stats bucketStats
	stats.errorBucket = errorBucket
	stats.pendingBucket = pendingBucket

	return context.JSON(http.StatusOK, stats)
}

func ErrorBucketPunches(context echo.Context) error {
	dbLoc := os.Getenv("CACHE_DATABASE_LOCATION")
	db, err := bolt.Open(dbLoc, 0600, nil)
	if err != nil {
		return context.String(http.StatusInternalServerError, fmt.Sprintf("error opening db: %s", err))
	}

	var bucketPunches errorPunches
	bucketPunches.bucketName = "error"
	err = db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte([]byte("error")))
		if bucket != nil {
		}
		var err error
		bucket.ForEach(func(key, value []byte) error {
			var punch structs.ClientPunchRequest
			if err = json.Unmarshal(value, &punch); err != nil {
				return fmt.Errorf("unable to unmarshal punch out of db: %s", err)
			}

			bucketPunches.punches = append(bucketPunches.punches, punch)
			return nil
		})
		if err != nil {
			return fmt.Errorf("an error occured while retrieving punches from the db", err)
		}

		return nil
	})
	if err != nil {
		return context.String(http.StatusInternalServerError, fmt.Sprintf("error: %s", err))
	}

	return context.JSON(http.StatusOK, bucketPunches)
}

func DeletePunchFromErrorBucket(context echo.Context) error {
	punchId := context.Param("punchId")
	dbLoc := os.Getenv("CACHE_DATABASE_LOCATION")
	db, err := bolt.Open(dbLoc, 0600, nil)
	if err != nil {
		return context.String(http.StatusInternalServerError, fmt.Sprintf("error opening db: %s", err))
	}

	err = db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte([]byte("error")))
		if bucket != nil {
		}

		gerr := bucket.Delete([]byte(punchId))
		if gerr != nil {
			return fmt.Errorf("unable to delete punch with id: %s\n error: %s", punchId, gerr)
		}

		return nil
	})
	if err != nil {
		return context.String(http.StatusInternalServerError, fmt.Sprintf("error: %s", err))
	}

	return context.String(http.StatusOK, "ok")
}
