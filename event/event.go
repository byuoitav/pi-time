package event

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/byuoitav/common/v2/events"
	"github.com/byuoitav/pi-time/log"
)

var (
	eventProcessorHost = os.Getenv("EVENT_PROCESSOR_HOST")
)

func SendEvent(e events.Event) error {
	if len(eventProcessorHost) == 0 {
		return errors.New("no event hosts")
	}

	// add generating system
	e.GeneratingSystem = os.Getenv("SYSTEM_ID")

	reqBody, err := json.Marshal(e)
	if err != nil {
		return fmt.Errorf("unable to marshal event: %w", err)
	}

	eventProcessorHostList := strings.Split(eventProcessorHost, ",")
	for _, hostName := range eventProcessorHostList {
		// create the request
		log.P.Debug(fmt.Sprintf("Sending event to address %s", hostName))

		req, err := http.NewRequest("POST", hostName, bytes.NewReader(reqBody))
		if err != nil {
			return fmt.Errorf("unable to build request: %w", err)
		}

		// add headers
		req.Header.Add("content-type", "application/json")

		client := http.Client{
			Timeout: 5 * time.Second,
		}

		resp, err := client.Do(req)
		if err != nil {
			return fmt.Errorf("unable to do request: %w", err)
		}
		defer resp.Body.Close()

		// read the resp
		if resp.StatusCode/100 != 2 {
			return fmt.Errorf("bad statusCode %v", resp.StatusCode)
		}
	}

	return nil
}
