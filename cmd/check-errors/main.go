package main

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/byuoitav/common/db"
	"github.com/byuoitav/common/structs"
	pstructs "github.com/byuoitav/pi-time/structs"
)

func main() {
	devs, err := db.GetDB().GetAllDevices()
	if err != nil {
		log.Fatalf("error: %s", err)
	}

	w := csv.NewWriter(os.Stdout)
	w.Write([]string{"deviceID", "time", "byuID", "error"})

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	wg := sync.WaitGroup{}

	for _, dev := range devs {
		if dev.Type.ID != "TimeClock" {
			continue
		}

		wg.Add(1)

		go func(dev structs.Device) {
			defer wg.Done()

			l := log.New(os.Stderr, dev.ID+" ", log.Flags())

			// get error bucket from this device
			url := fmt.Sprintf("http://%s:8463/buckets/error/punches", dev.Address)
			req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
			if err != nil {
				l.Printf("error building request: %s", err)
				return
			}

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				l.Printf("error doing request: %s", err)
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				l.Printf("bad status code %v", resp.StatusCode)
				return
			}

			punches := struct {
				Punches []struct {
					Key   string `json:"Key"`
					Punch struct {
						Err   string                      `json:"Err"`
						Punch pstructs.ClientPunchRequest `json:"Punch"`
					}
				} `json:"Punches"`
			}{}

			if err := json.NewDecoder(resp.Body).Decode(&punches); err != nil {
				l.Printf("error decoding: %s", err)
				return
			}

			for _, punch := range punches.Punches {
				if time.Since(punch.Punch.Punch.Time) < 24*time.Hour {
					w.Write([]string{
						dev.ID,
						punch.Punch.Punch.Time.Format(time.RFC3339),
						punch.Punch.Punch.BYUID,
						punch.Punch.Err,
					})
				}
			}
		}(dev)
	}

	wg.Wait()
	w.Flush()

	if err := w.Error(); err != nil {
		log.Fatalf("error writing csv: %s", err)
	}
}
