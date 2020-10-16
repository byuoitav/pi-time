package main

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io/ioutil"
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
	w.Write([]string{"deviceID", "punchID", "time", "error"})

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	wg := sync.WaitGroup{}
	wMu := sync.Mutex{}

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
				if time.Since(punch.Punch.Punch.Time) > 1*time.Second {
					// delete this punch
					if err := deletePunch(ctx, dev.Address, punch.Key); err != nil {
						wMu.Lock()
						w.Write([]string{
							dev.ID,
							punch.Key,
							punch.Punch.Punch.Time.Format(time.RFC3339),
							err.Error(),
						})
						wMu.Unlock()
					} else {
						wMu.Lock()
						w.Write([]string{
							dev.ID,
							punch.Key,
							punch.Punch.Punch.Time.Format(time.RFC3339),
							"",
						})
						wMu.Unlock()
					}
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

func deletePunch(ctx context.Context, addr, id string) error {
	url := fmt.Sprintf("http://%s:8463/buckets/error/punches/%s", addr, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("unable to build request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("unable to do request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return nil
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("unable to read body: %w", err)
	}

	return fmt.Errorf("%s", body)
}
