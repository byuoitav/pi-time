package offline

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/byuoitav/pi-time/employee"
	"github.com/byuoitav/pi-time/helpers"
	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/structs"
	"github.com/labstack/echo/v4"
	bolt "go.etcd.io/bbolt"
	"go.uber.org/zap"
	errgroup "golang.org/x/sync/errgroup"
)

const (
	PENDING_BUCKET = "PENDING"
	ERROR_BUCKET   = "ERROR"
)

type bucketStats struct {
	PendingBucket  int
	ErrorBucket    int
	EmployeeBucket int
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

	//TODO add a sleep for 30 seconds and then remove the ticker stuff
	for {
		select {
		case <-ticker.C:
			var canDelete []string
			err := db.View(func(tx *bolt.Tx) error {
				bucket := tx.Bucket([]byte(PENDING_BUCKET))
				if bucket == nil {
					return fmt.Errorf("unable to access bucket")
				}

				errg, _ := errgroup.WithContext(context.Background())

				err := bucket.ForEach(func(key, value []byte) error {

					errg.Go(func() error {
						//TODO: print err and return nil
						log.P.Info(fmt.Sprintf("trying to post %s\n", key))
						var punch structs.ClientPunchRequest
						err := json.Unmarshal(value, &punch)
						if err != nil {
							return fmt.Errorf("error occured in unmarshalling punchrequest from db: %s", err)
						}

						err = helpers.Punch(punch.BYUID, punch)
						if err != nil {
							// don't delete it if its a timeout
							if strings.Contains(err.Error(), "request timed out") || strings.Contains(err.Error(), "network is unreachable") {
								return err
							}

							// add it to the error bucket if it is something other than a time out
							gerr := addPunchToErrorBucket(string(key), punch, db)
							if gerr != nil {
								return fmt.Errorf("an error occured adding the failed punch to the error bucket: %s", gerr)
							}

							// Add it to the can delete because its being added to a different bucket
							canDelete = append(canDelete, string(key))
							return err
						}

						// delete it (add key to canDelete array)
						canDelete = append(canDelete, fmt.Sprintf("%s", key))
						return nil
					})
					return nil
				})

				err = errg.Wait()
				if err != nil {
					log.P.Warn("error: ", zap.Error(err))
				}

				return nil
			})
			if err != nil {
				log.P.Warn("error:", zap.Error(err))
			}

			err = db.Update(func(tx *bolt.Tx) error {
				bucket := tx.Bucket([]byte(PENDING_BUCKET))
				if bucket == nil {
					return fmt.Errorf("unable to access bucket")
				}
				//delete all of the requests that went through
				if len(canDelete) != 0 {
					for _, deleteKey := range canDelete {
						gerr := bucket.Delete([]byte(deleteKey))
						if gerr != nil {
							return fmt.Errorf("unable to delete punch with id: %s\n error: %s", deleteKey, gerr)
						}

					}
				}
				return nil
			})

			if err != nil {
				log.P.Warn("unable to access database", zap.Error(err))
			}
		}
	}
}

func AddPunchToBucket(byuId string, request structs.ClientPunchRequest, db *bolt.DB) error {

	err := db.Update(func(tx *bolt.Tx) error {
		//create punch bucket if it does not exist
		log.P.Debug("Checking if pending Bucket Exists")
		_, err := tx.CreateBucketIfNotExists([]byte(PENDING_BUCKET))
		if err != nil {
			return fmt.Errorf("error creating the pending bucket: %s", err)
		}

		return nil
	})
	if err != nil {
		log.P.Warn("error:", zap.Error(err))
		return err
	}

	key := []byte(fmt.Sprintf("%s%s", byuId, time.Now().Format(time.RFC3339)))

	// create a punch
	log.P.Debug("adding punch to bucket")
	err = db.Batch(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(PENDING_BUCKET))
		if bucket == nil {
			return fmt.Errorf("unable to access bucket")
		}

		requestJSON, _ := json.Marshal(request)

		return bucket.Put(key, requestJSON)
	})
	log.P.Debug("Successfully added punch to the bucket")

	if err != nil {
		log.P.Warn("an error occured while adding the punch to the bucket:", zap.Error(err))
		return err
	}

	return nil
}

func addPunchToErrorBucket(byuId string, request structs.ClientPunchRequest, db *bolt.DB) error {

	err := db.Update(func(tx *bolt.Tx) error {
		//create punch bucket if it does not exist
		log.P.Debug("Checking if Error Bucket Exists")
		_, err := tx.CreateBucketIfNotExists([]byte(ERROR_BUCKET))
		if err != nil {
			return fmt.Errorf("error creating the error bucket: %s", err)
		}

		return nil
	})
	if err != nil {
		log.P.Warn("error:", zap.Error(err))
		return err
	}

	key := []byte(fmt.Sprintf("%s%s", byuId, time.Now()))

	// create a punch
	log.P.Debug("adding punch to bucket")
	err = db.Batch(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(ERROR_BUCKET))

		if bucket == nil {
			return fmt.Errorf("unable to access bucket")
		}

		requestJSON, _ := json.Marshal(request)

		return bucket.Put(key, requestJSON)
	})
	log.P.Debug("Successfully added punch to the bucket")

	if err != nil {
		log.P.Warn("an error occured while adding the error to the bucket: ", zap.Error(err))
		return err
	}

	return nil
}

func GetBucketStatsHandler(db *bolt.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var pendingBucket bolt.BucketStats
		var errorBucket bolt.BucketStats
		var employeeBucket bolt.BucketStats
		err := db.View(func(tx *bolt.Tx) error {
			bucket := tx.Bucket([]byte(PENDING_BUCKET))
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

		err = db.View(func(tx *bolt.Tx) error {
			bucket := tx.Bucket([]byte(employee.EMPLOYEE_BUCKET))
			if bucket == nil {
				return fmt.Errorf("unable to access bucket")
			}

			employeeBucket = bucket.Stats()
			return nil
		})
		if err != nil {
			return c.String(http.StatusInternalServerError, fmt.Sprintf("error: %s", err))
		}

		var stats bucketStats
		stats.ErrorBucket = errorBucket.KeyN
		stats.PendingBucket = pendingBucket.KeyN
		stats.EmployeeBucket = employeeBucket.KeyN

		return c.JSON(http.StatusOK, stats)
	}
}

func GetEmployeeFromBucket(db *bolt.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		byuID := c.Param("id")
		var empRecord structs.EmployeeRecord

		err := db.View(func(tx *bolt.Tx) error {
			b := tx.Bucket([]byte(employee.EMPLOYEE_BUCKET))
			if b == nil {
				log.P.Warn("cannot open employee bucket")
				return fmt.Errorf("cannot open employee bucket")
			}

			item := b.Get([]byte(byuID))
			if item == nil {
				//not found, return it
				return c.String(http.StatusInternalServerError, fmt.Sprintf("item not found"))
			}

			err := json.Unmarshal(item, &empRecord)
			if err != nil {
				return c.String(http.StatusInternalServerError, fmt.Sprintf("%s", err))
			}

			//no error in db.View
			return nil
		})

		if err != nil {
			//unable to retrieve from cache for whatever reason
			log.P.Warn("unable to retrieve from cache for reason: %s", zap.Error(err))
			return c.String(http.StatusInternalServerError, fmt.Sprintf("%s", err))
		}

		return c.JSON(http.StatusOK, empRecord)
	}
}

func GetErrorBucketPunchesHandler(db *bolt.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var bucketPunches errorPunches
		bucketPunches.BucketName = "error"
		err := db.View(func(tx *bolt.Tx) error {
			bucket := tx.Bucket([]byte(ERROR_BUCKET))
			if bucket == nil {
				return fmt.Errorf("unable to access bucket")
			}

			var err error

			bucket.ForEach(func(key, value []byte) error {
				var request structs.ClientPunchRequest
				if err = json.Unmarshal(value, &request); err != nil {
					return fmt.Errorf("unable to unmarshal punch out of db: %s", err)
				}

				p := punch{
					Key:   string(key),
					Punch: request,
				}

				bucketPunches.Punches = append(bucketPunches.Punches, p)
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

		sort.Slice(bucketPunches.Punches, func(i, j int) bool {
			return bucketPunches.Punches[i].Key < bucketPunches.Punches[j].Key
		})

		return c.JSON(http.StatusOK, bucketPunches)
	}
}

func GetDeletePunchFromErrorBucketHandler(db *bolt.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		punchId := c.Param("punchId")

		err := db.Update(func(tx *bolt.Tx) error {
			bucket := tx.Bucket([]byte(ERROR_BUCKET))
			if bucket == nil {
				return fmt.Errorf("unable to access bucket")
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
}
