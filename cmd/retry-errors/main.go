package main

import (
	"context"
	"encoding/csv"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/byuoitav/common/db"
	"github.com/byuoitav/common/structs"
)

func main() {
	devs, err := db.GetDB().GetAllDevices()
	if err != nil {
		log.Fatalf("error: %s", err)
	}

	w := csv.NewWriter(os.Stdout)
	w.Write([]string{"deviceID", "worked", "error"})

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
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

			url := fmt.Sprintf("http://%s:8463/buckets/error/reset", dev.Address)
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

			if resp.StatusCode == http.StatusOK {
				wMu.Lock()
				defer wMu.Unlock()
				w.Write([]string{
					dev.ID,
					"true",
					"",
				})
				return
			}

			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				wMu.Lock()
				defer wMu.Unlock()
				w.Write([]string{
					dev.ID,
					"false",
					fmt.Sprintf("unable to read body: %s", err),
				})
				return
			}

			wMu.Lock()
			defer wMu.Unlock()
			w.Write([]string{
				dev.ID,
				"false",
				string(body),
			})
		}(dev)
	}

	wg.Wait()

	w.Flush()
	if err := w.Error(); err != nil {
		log.Fatalf("error writing csv: %s", err)
	}
}
