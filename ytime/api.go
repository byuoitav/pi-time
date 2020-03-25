package ytime

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/byuoitav/auth/wso2"
	"github.com/byuoitav/pi-time/offline"
)

type Client struct {
	host     string
	endpoint string

	client *wso2.Client
}

const (
	_defaultHost     = "api.byu.edu:443"
	_defaultEndpoint = "/domains/erp/hr"
)

func New(id, secret string) *Client {
	return &Client{
		host:     _defaultHost,
		endpoint: _defaultEndpoint,
		client: &wso2.Client{
			GatewayURL:   "https://api.byu.edu/",
			ClientID:     id,
			ClientSecret: secret,
		},
	}
}

func (c *Client) sendRequest(ctx context.Context, method string, endpoint string, reqBody interface{}, structToFill interface{}) error {
	var reqBytes []byte

	if reqBody != nil {
		var err error
		if reqBytes, err = json.Marshal(reqBody); err != nil {
			return fmt.Errorf("unable to marshal body: %w", err)
		}
	}

	url := fmt.Sprintf("https://%s%s%s", c.host, c.endpoint, endpoint)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(reqBytes))
	if err != nil {
		return fmt.Errorf("unable to build request: %w", err)
	}

	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Accept", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("unable to make request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("unable to read response: %w", err)
	}

	if err := json.Unmarshal(respBody, &structToFill); err != nil {
		return fmt.Errorf("unable to parse response: %w", err)
	}

	return nil
}

// SendPunchRequest sends a punch request to the YTime API and returns the response.
func (c *Client) SendPunchRequest(ctx context.Context, id string, punch Punch) (Timesheet, error) {
	var ret Timesheet

	body := make(map[string]Punch)
	body["punch"] = punch

	if err := c.sendRequest(ctx, http.MethodPost, "/punches/v1/"+id, body, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// SendFixPunchRequest sends a punch request to the YTime API and returns the response.
func (c *Client) SendFixPunchRequest(ctx context.Context, id string, punch Punch) ([]TimeClockDay, error) {
	var ret []TimeClockDay

	body := make(map[string]Punch)
	body["punch"] = punch

	if err := c.sendRequest(ctx, http.MethodPut, "/punches/v1/"+id, body, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// SendLunchPunch sends a lunch punch request to the YTime API and returns the response.
func (c *Client) SendLunchPunch(ctx context.Context, id string, punch LunchPunch) ([]TimeClockDay, error) {
	var ret []TimeClockDay

	body := make(map[string]LunchPunch)
	body["lunch_punch"] = punch

	if err := c.sendRequest(ctx, http.MethodPost, "/ytime_lunch_punch/v1/"+id, body, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// SendOtherHoursRequest sends a sick/vacation request to the YTime API and returns the response (if no problem), and error, as well as the http response and body
func (c *Client) SendOtherHoursRequest(ctx context.Context, id string, entry ElapsedTimeEntry) (ElapsedTimeSummary, error) {
	var ret ElapsedTimeSummary

	wrapper := ElapsedTimeEntryWrapper{
		ElapsedTimeEntry: entry,
	}

	if err := c.sendRequest(ctx, http.MethodPost, "/elapsed_time_punch/v1/"+id, wrapper, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// SendWorkOrderUpsertRequest .
func (c *Client) SendWorkOrderUpsertRequest(ctx context.Context, id string, upsert WorkOrderUpsert) (WorkOrderDaySummary, error) {
	var ret WorkOrderDaySummary

	if err := c.sendRequest(ctx, http.MethodPost, "/work_order_entry/v1/"+id, upsert, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// SendDeletePunchRequest sends a delete punch request to the YTime API and returns the response.
func (c *Client) SendDeletePunchRequest(ctx context.Context, id string, jobID int, date time.Time, seqNumber int) ([]TimeClockDay, error) {
	var ret []TimeClockDay

	endpoint := fmt.Sprintf("/punches/v1/%s,%d,%s,%d", id, jobID, date.Local().Format("2006-01-02"), seqNumber)

	if err := c.sendRequest(ctx, http.MethodDelete, endpoint, nil, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// SendDeleteWorkOrderEntryRequest sends a delete work order entry request to the YTime API and returns the response
func (c *Client) SendDeleteWorkOrderEntryRequest(ctx context.Context, id, jobID, punchDate, sequenceNumber string) (WorkOrderDaySummary, error) {
	var ret WorkOrderDaySummary

	endpoint := fmt.Sprintf("/work_order_entry/v1/%s,%s,%s,%s", id, jobID, punchDate, sequenceNumber)

	if err := c.sendRequest(ctx, http.MethodDelete, endpoint, nil, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// GetTimesheet returns a timesheet, a bool if the timesheet was returned in offlie mode (from cache), and possible error
func (c *Client) GetTimesheet(ctx context.Context, id string) (timesheet Timesheet, cached bool, err error) {
	url := fmt.Sprintf("https://%s%s%s%s", c.host, c.endpoint, "/timesheet/v1/", id)

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		err = fmt.Errorf("unable to build request: %w", err)
		return
	}

	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Accept", "application/json")

	resp, err := c.client.Do(req)
	switch {
	case errors.Is(err, context.DeadlineExceeded):
		// return cached version
		emp, err2 := offline.GetEmployeeFromCache(id)
		if err2 != nil {
			return
		}

		// overwrite return values
		cached = true
		timesheet = Timesheet{
			PersonName:           emp.Name,
			WeeklyTotal:          "--:--",
			PeriodTotal:          "--:--",
			InternationalMessage: "",
			Jobs:                 emp.Jobs,
		}
		return
	case err != nil:
		err = fmt.Errorf("unable to make request: %w", err)
		return
	}
	defer resp.Body.Close()

	respBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		err = fmt.Errorf("unable to read response: %w", err)
		return
	}

	switch resp.StatusCode / 100 {
	case 5:
		// TODO unmarshal into ServerLoginErrorMessage?
		err = fmt.Errorf("%v response received from API", resp.StatusCode)
		return
	}

	if err = json.Unmarshal(respBody, &timesheet); err != nil {
		err = fmt.Errorf("unable to unmarshal response: %w", err)
		return
	}

	return
}

// GetPunchesForJob gets a list of serverside TimeClockDay structures from WSO2
func (c *Client) GetPunchesForJob(ctx context.Context, id string, jobID int) ([]TimeClockDay, error) {
	var ret []TimeClockDay

	endpoint := fmt.Sprintf("/punches/v1/%s,%d", id, jobID)

	if err := c.sendRequest(ctx, http.MethodGet, endpoint, nil, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// GetWorkOrders gets all the possilbe work orders for the day from WSO2
func (c *Client) GetWorkOrders(ctx context.Context, operatingUnit string) ([]WorkOrder, error) {
	var ret []WorkOrder

	if err := c.sendRequest(ctx, http.MethodGet, "/work_orders_by_operating_unit/v1"+operatingUnit, nil, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// GetWorkOrderEntries gets all the work order entries for a particular job from WSO2
func (c *Client) GetWorkOrderEntries(ctx context.Context, id string, jobID int) ([]WorkOrderDaySummary, error) {
	var ret []WorkOrderDaySummary

	endpoint := fmt.Sprintf("/work_order_entry/v1/%s,%d", id, jobID)

	if err := c.sendRequest(ctx, http.MethodGet, endpoint, nil, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// GetOtherHoursForDate gets the other hours for a job for a specitic date from WSO2
func (c *Client) GetOtherHoursForDate(ctx context.Context, id string, jobID int, date time.Time) (ElapsedTimeSummary, error) {
	var ret ElapsedTimeSummary

	// TODO should the date format have .Local()?
	endpoint := fmt.Sprintf("/elapsed_time_punch/v1/%s,%d,%s", id, jobID, date.Format("2006-01-02"))

	if err := c.sendRequest(ctx, http.MethodGet, endpoint, nil, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

func (c *Client) GetLocation(ctx context.Context, building string) (Location, error) {
	var ret Location

	if err := c.sendRequest(ctx, http.MethodGet, "/locations/v1/"+building, nil, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}
