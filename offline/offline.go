package offline

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/byuoitav/pi-time/helpers"
	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/structs"
	bolt "go.etcd.io/bbolt"
	errgroup "golang.org/x/sync/errgroup"
)

func resendPunches() {

	dbLoc := os.Getenv("CACHE_DATABASE_LOCATION")
	db, err := bolt.Open(dbLoc, 0600, nil)
	if err != nil {
		log.P.Panic(fmt.Sprintf("error opening the db: %s", err))
	}

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			err := db.View(func(tx *bolt.Tx) error {
				bucket := tx.Bucket([]byte([]byte("punches")))
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
							gerr := addPunchToErrorBucket(fmt.Sprintf("%s", key), punch)
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

func addPunchToErrorBucket(byuId string, request structs.ClientPunchRequest) error {
	db, err := bolt.Open("./cache.db", 0600, nil)
	if err != nil {
		log.P.Panic(fmt.Sprintf("error opening the db: %s", err))
		return fmt.Errorf("error opening the db: %s", err)
	}

	err = db.Update(func(tx *bolt.Tx) error {
		//create punch bucket if it does not exist
		log.P.Debug("Checking if Punch Bucket Exists")
		_, err := tx.CreateBucketIfNotExists([]byte("error"))
		if err != nil {
			log.P.Panic("failed to create errorBucket")
			return fmt.Errorf("error creating the error bucket: %s", err)
		}

		key := []byte(fmt.Sprintf("%s%s", byuId, time.Now()))

		// create a punch
		log.P.Debug("adding punch to bucket")
		return db.Batch(func(tx *bolt.Tx) error {
			bucket := tx.Bucket([]byte("error"))
			if bucket != nil {
			}

			return bucket.Put(key, []byte(fmt.Sprintf("%v", request)))
		})
		log.P.Debug("Successfully added failed punch to the error bucket")

		return nil
	})
	if err != nil {
		log.P.Panic(fmt.Sprintf("an error occured while adding the failed punch to the error bucket: %s", err))
	}

	return nil
}
