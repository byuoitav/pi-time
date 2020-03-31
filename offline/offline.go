package offline

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/wso2services/wso2requests"
	"github.com/dgraph-io/badger"
)

func resendPunches(){

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

				return bucket.ForEach(func(key, value []byte) error {
					fmt.Printf("trying to post %s\n", key)
					​
					errg.Go(func() error {
						err = helpers.Punch(key, value)
						if err != nil {
							// don't delete it
							return err
						}
​
						// delete it
						return nil
					})
				})
​
				err := errg.Wait()
				if err != nil {
					panic(err)
				}
			})
		}
	}
}
