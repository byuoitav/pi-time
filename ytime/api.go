package ytime

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/byuoitav/auth/wso2"
	"github.com/byuoitav/pi-time/offline"

	"github.com/byuoitav/pi-time/structs"
)

type client struct {
	host     string
	endpoint string

	client *wso2.Client
}

const (
	_defaultHost     = "api.byu.edu:443"
	_defaultEndpoint = "/domains/erp/hr"
)

func NewClient(id, secret string) Client {
	return &client{
		host:     _defaultHost,
		endpoint: _defaultEndpoint,
		client: &wso2.Client{
			GatewayURL:   "https://api.byu.edu/",
			ClientID:     id,
			ClientSecret: secret,
		},
	}
}

func (c *client) sendRequest(ctx context.Context, method string, endpoint string, reqBody interface{}, structToFill interface{}) error {
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
func (c *client) SendPunchRequest(ctx context.Context, id string, punch structs.Punch) (structs.Timesheet, error) {
	var ret structs.Timesheet

	body := make(map[string]structs.Punch)
	body["punch"] = punch

	if err := c.sendRequest(ctx, http.MethodPost, "/punches/v1/"+id, body, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// SendFixPunchRequest sends a punch request to the YTime API and returns the response.
func (c *client) SendFixPunchRequest(ctx context.Context, id string, punch structs.Punch) ([]structs.TimeClockDay, error) {
	var ret []structs.TimeClockDay

	body := make(map[string]structs.Punch)
	body["punch"] = punch

	if err := c.sendRequest(ctx, http.MethodPut, "/punches/v1/"+id, body, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// SendLunchPunch sends a lunch punch request to the YTime API and returns the response.
func (c *client) SendLunchPunch(ctx context.Context, id string, punch structs.LunchPunch) ([]structs.TimeClockDay, error) {
	var ret []structs.TimeClockDay

	body := make(map[string]structs.LunchPunch)
	body["lunch_punch"] = punch

	if err := c.sendRequest(ctx, http.MethodPost, "/ytime_lunch_punch/v1/"+id, body, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// SendOtherHoursRequest sends a sick/vacation request to the YTime API and returns the response (if no problem), and error, as well as the http response and body
func (c *client) SendOtherHoursRequest(ctx context.Context, id string, entry structs.ElapsedTimeEntry) (structs.ElapsedTimeSummary, error) {
	var ret structs.ElapsedTimeSummary

	wrapper := structs.ElapsedTimeEntryWrapper{
		ElapsedTimeEntry: entry,
	}

	if err := c.sendRequest(ctx, http.MethodPost, "/elapsed_time_punch/v1/"+id, wrapper, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// SendWorkOrderUpsertRequest .
func (c *client) SendWorkOrderUpsertRequest(ctx context.Context, id string, upsert structs.WorkOrderUpsert) (structs.WorkOrderDaySummary, error) {
	var ret structs.WorkOrderDaySummary

	if err := c.sendRequest(ctx, http.MethodPost, "/work_order_entry/v1/"+id, upsert, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// SendDeletePunchRequest sends a delete punch request to the YTime API and returns the response.
func (c *client) SendDeletePunchRequest(ctx context.Context, id string, punch structs.DeletePunch) ([]structs.TimeClockDay, error) {
	var ret []structs.TimeClockDay

	endpoint := fmt.Sprintf("/punches/v1/%s,%d,%s,%d", id, *punch.EmployeeJobID, punch.PunchTime.Local().Format("2006-01-02"), *punch.SequenceNumber)

	if err := c.sendRequest(ctx, http.MethodDelete, endpoint, nil, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// SendDeleteWorkOrderEntryRequest sends a delete work order entry request to the YTime API and returns the response
func (c *client) SendDeleteWorkOrderEntryRequest(ctx context.Context, id, jobID, punchDate, sequenceNumber string) (structs.WorkOrderDaySummary, error) {
	var ret structs.WorkOrderDaySummary

	endpoint := fmt.Sprintf("/work_order_entry/v1/%s,%s,%s,%s", id, jobID, punchDate, sequenceNumber)

	if err := c.sendRequest(ctx, http.MethodDelete, endpoint, nil, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// GetTimesheet returns a timesheet, a bool if the timesheet was returned in offlie mode (from cache), and possible error
func (c *client) GetTimesheet(ctx context.Context, id string) (timesheet structs.Timesheet, cached bool, err error) {
	// if there is an error, try to return the cached version
	defer func() {
		if err == nil {
			return
		}

		// don't overwrite the return value err
		emp, err2 := offline.GetEmployeeFromCache(id)
		if err2 != nil {
			return
		}

		// overwrite return values
		cached = true
		timesheet = structs.Timesheet{
			PersonName:           emp.Name,
			WeeklyTotal:          "--:--",
			PeriodTotal:          "--:--",
			InternationalMessage: "",
			Jobs:                 emp.Jobs,
		}
	}()

	url := fmt.Sprintf("https://%s%s%s%s", c.host, c.endpoint, "/timesheet/v1/", id)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		err = fmt.Errorf("unable to build request: %w", err)
		return
	}

	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Accept", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		err = fmt.Errorf("unable to make request: %w", err)
		return
	}
	defer resp.Body.Close()

	respBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		err = fmt.Errorf("unable to read response: %w", err)
		return
	}

	// TODO different status codes - unmarshal into structs.ServerLoginErrorMessage?
	if resp.StatusCode/100 == 5 {
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
func (c *client) GetPunchesForJob(ctx context.Context, id string, jobID int) ([]structs.TimeClockDay, error) {
	var ret []structs.TimeClockDay

	endpoint := fmt.Sprintf("/punches/v1/%s,%d", id, jobID)

	if err := c.sendRequest(ctx, http.MethodGet, endpoint, nil, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// GetWorkOrders gets all the possilbe work orders for the day from WSO2
func (c *client) GetWorkOrders(ctx context.Context, operatingUnit string) ([]structs.WorkOrder, error) {
	var ret []structs.WorkOrder

	if err := c.sendRequest(ctx, http.MethodGet, "/work_orders_by_operating_unit/v1"+operatingUnit, nil, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// GetWorkOrderEntries gets all the work order entries for a particular job from WSO2
func (c *client) GetWorkOrderEntries(ctx context.Context, id string, jobID int) ([]structs.WorkOrderDaySummary, error) {
	var ret []structs.WorkOrderDaySummary

	endpoint := fmt.Sprintf("/work_order_entry/v1/%s,%d", id, jobID)

	if err := c.sendRequest(ctx, http.MethodGet, endpoint, nil, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}

// GetOtherHoursForDate gets the other hours for a job for a specitic date from WSO2
func (c *client) GetOtherHoursForDate(ctx context.Context, id string, jobID int, date time.Time) (structs.ElapsedTimeSummary, error) {
	var ret structs.ElapsedTimeSummary

	// TODO should the date format have .Local()?
	endpoint := fmt.Sprintf("/elapsed_time_punch/v1/%s,%d,%s", id, jobID, date.Format("2006-01-02"))

	if err := c.sendRequest(ctx, http.MethodGet, endpoint, nil, &ret); err != nil {
		return ret, err
	}

	return ret, nil
}
