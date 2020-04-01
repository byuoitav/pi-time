package offline

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"

	"github.com/byuoitav/pi-time/helpers"
	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/structs"
	"github.com/labstack/echo/v4"
	bolt "go.etcd.io/bbolt"
	errgroup "golang.org/x/sync/errgroup"
)

const (
	PENDING_BUCKET = "PENDING"
	ERROR_BUCKET   = "ERROR"
)

type bucketStats struct {
	PendingBucket int
	ErrorBucket   int
}

type errorPunches struct {
	BucketName string
	Punches    []punch
}

type punch struct {
	Key   string
	Punch structs.ClientPunchRequest
}

func ResendPunches(db *bolt.DB) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			err := db.View(func(tx *bolt.Tx) error {
				bucket := tx.Bucket([]byte([]byte(PENDING_BUCKET)))
				if bucket != nil {
				}

				errg, err := errgroup.WithContext(context.Background())
				var canDelete []string
				return bucket.ForEach(func(key, value []byte) error {
					fmt.Printf("trying to post %s\n", key)
					var err error
					errg.Go(func() error {
						var punch structs.ClientPunchRequest
						err := json.Unmarshal(value, &punch)
						if err != nil {
							return fmt.Errorf("error occured in unmarshalling punchrequest from db: %s", err)
						}

						err = helpers.Punch(fmt.Sprintf("%s", key), punch)
						if err != nil {
							// don't delete it if its not a timeout
							// add it to the error bucket if it is something other than a time out
							gerr := addPunchToErrorBucket(fmt.Sprintf("%s", key), punch, db)
							if gerr != nil {
								return fmt.Errorf("an error occured adding the failed punch to the error bucket: %s", gerr)
							}

							return err
						}

						// delete it (add key to canDelete array)
						canDelete = append(canDelete, fmt.Sprintf("%s", key))
						return nil
					})
					return err
				})

				//delete all of the requests that went through
				if len(canDelete) != 0 {
					for _, deleteKey := range canDelete {
						gerr := bucket.Delete([]byte(deleteKey))
						if gerr != nil {
							return fmt.Errorf("unable to delete punch with id: %s\n error: %s", deleteKey, gerr)
						}

					}
				}

				err = errg.Wait()
				if err != nil {
					panic(err)
				}

				return nil
			})
		}
	}
}

func AddPunchToBucket(byuId string, request structs.ClientPunchRequest, db *bolt.DB) error {
	
	err := db.Update(func(tx *bolt.Tx) error {
		//create punch bucket if it does not exist
		log.P.Debug("Checking if Punch Bucket Exists")
		_, err := tx.CreateBucketIfNotExists([]byte(PENDING_BUCKET))
		if err != nil {
			return fmt.Errorf("error creating the punch bucket: %s", err)
		}

		key := []byte(fmt.Sprintf("%s%s", byuId, time.Now()))

		// create a punch
		log.P.Debug("adding punch to bucket")
		return db.Batch(func(tx *bolt.Tx) error {
			bucket := tx.Bucket([]byte(PENDING_BUCKET))
			if bucket == nil {
				//TODO error out
			}

			return bucket.Put(key, []byte(fmt.Sprintf("%v", request)))
		})
		log.P.Debug("Successfully added punch to the bucket")

		return nil
	})
	if err != nil {
		log.P.Warn(fmt.Sprintf("an error occured while adding the punch to the bucket: %s", err))
	}

	return nil
}

func addPunchToErrorBucket(byuId string, request structs.ClientPunchRequest, db *bolt.DB) error {

	err := db.Update(func(tx *bolt.Tx) error {
		//create punch bucket if it does not exist
		log.P.Debug("Checking if Punch Bucket Exists")
		_, err := tx.CreateBucketIfNotExists([]byte(ERROR_BUCKET))
		if err != nil {
			log.P.Warn("failed to create errorBucket")
			return fmt.Errorf("error creating the error bucket: %s", err)
		}

		key := []byte(fmt.Sprintf("%s%s", byuId, time.Now()))

		// create a punch
		log.P.Debug("adding punch to bucket")
		return db.Batch(func(tx *bolt.Tx) error {
			bucket := tx.Bucket([]byte(ERROR_BUCKET))
			if bucket == nil {
				return fmt.Errorf("unable to access bucket")
			}

			return bucket.Put(key, []byte(fmt.Sprintf("%v", request)))
		})
		log.P.Debug("Successfully added failed punch to the error bucket")

		return nil
	})
	if err != nil {
		log.P.Warn(fmt.Sprintf("an error occured while adding the failed punch to the error bucket: %s", err))
	}

	return nil
}

func GetBucketStats(c echo.Context, db *bolt.DB) error {
	var pendingBucket bolt.BucketStats
	var errorBucket bolt.BucketStats
	err := db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte([]byte(PENDING_BUCKET)))
		if bucket == nil {
			return fmt.Errorf("unable to access bucket")
		}

		pendingBucket = bucket.Stats()
		return nil
	})
	if err != nil {
		return c.String(http.StatusInternalServerError, fmt.Sprintf("error: %s", err))
	}

	err = db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(ERROR_BUCKET))
		if bucket == nil {
			return fmt.Errorf("unable to access bucket")
		}

		errorBucket = bucket.Stats()
		return nil
	})
	if err != nil {
		return c.String(http.StatusInternalServerError, fmt.Sprintf("error: %s", err))
	}

	var stats bucketStats
	stats.ErrorBucket = errorBucket.KeyN
	stats.PendingBucket = pendingBucket.KeyN

	return c.JSON(http.StatusOK, stats)
}

func ErrorBucketPunches(c echo.Context, db *bolt.DB) error {

	var bucketPunches errorPunches
	bucketPunches.BucketName = "error"
	var m map[string][]byte
	err := db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte([]byte(ERROR_BUCKET)))
		if bucket != nil {
		}
		var err error

		bucket.ForEach(func(key, value []byte) error {
			m[fmt.Sprintf("%s", key)] = value
			return nil
		})
		if err != nil {
			return fmt.Errorf("an error occured while retrieving punches from the db", err)
		}

		return nil
	})
	if err != nil {
		return c.String(http.StatusInternalServerError, fmt.Sprintf("error: %s", err))
	}

	for key, value := range m {
		var request structs.ClientPunchRequest
		if err = json.Unmarshal(value, &request); err != nil {
			return fmt.Errorf("unable to unmarshal punch out of db: %s", err)
		}

		p := punch{
			Key:   key,
			Punch: request,
		}

		bucketPunches.Punches = append(bucketPunches.Punches, p)
	}

	sort.Slice(bucketPunches.Punches, func(i, j int) bool {
		return bucketPunches.Punches[i].Key < bucketPunches.Punches[j].Key
	})

	return c.JSON(http.StatusOK, bucketPunches)
}

func DeletePunchFromErrorBucket(c echo.Context, db *bolt.DB) error {
	punchId := c.Param("punchId")

	err := db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte([]byte(ERROR_BUCKET)))
		if bucket != nil {
		}

		gerr := bucket.Delete([]byte(punchId))
		if gerr != nil {
			return fmt.Errorf("unable to delete punch with id: %s\n error: %s", punchId, gerr)
		}

		return nil
	})
	if err != nil {
		return c.String(http.StatusInternalServerError, fmt.Sprintf("error: %s", err))
	}

	return c.String(http.StatusOK, "ok")
}
