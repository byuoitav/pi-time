package ytime

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"time"

	"github.com/byuoitav/auth/wso2"
	"github.com/byuoitav/common/log"
	"github.com/byuoitav/common/nerr"
	"github.com/byuoitav/pi-time/offline"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/wso2services/wso2requests"
)

type Client interface {
	SendPunchRequest(context.Context, string, structs.Punch) (structs.Timesheet, error)
}

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
func SendFixPunchRequest(byuID string, req structs.Punch) ([]structs.TimeClockDay, *nerr.E) {
	var resp []structs.TimeClockDay

	body := make(map[string]structs.Punch)
	body["punch"] = req

	method := "PUT"
	err := wso2requests.MakeWSO2RequestWithHeaders(method, "https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID, body, &resp, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return resp, nerr.Translate(err).Addf("failed to make a punch for %s: %s", byuID, err.Error())
	}

	return resp, nil
}

// SendLunchPunch sends a lunch punch request to the YTime API and returns the response.
func SendLunchPunch(byuID string, req structs.LunchPunch) ([]structs.TimeClockDay, *nerr.E) {
	var resp []structs.TimeClockDay

	body := make(map[string]structs.LunchPunch)
	body["lunch_punch"] = req

	err := wso2requests.MakeWSO2RequestWithHeaders("POST", "https://api.byu.edu:443/domains/erp/hr/ytime_lunch_punch/v1/"+byuID, body, &resp, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return resp, nerr.Translate(err).Addf("failed to make a lunch punch for %s: %s", byuID, err.Error())
	}

	return resp, nil
}

// SendOtherHoursRequest sends a sick/vacation request to the YTime API and returns the response (if no problem), and error, as well as the http response and body
func SendOtherHoursRequest(byuID string, body structs.ElapsedTimeEntry) (structs.ElapsedTimeSummary, *nerr.E, *http.Response, string) {
	var otherResponse structs.ElapsedTimeSummary

	var wrapper structs.ElapsedTimeEntryWrapper

	wrapper.ElapsedTimeEntry = body

	test, _ := json.Marshal(body)

	log.L.Debugf("Body to send to other hours WSO2: %s", test)

	err, response, responseBody := wso2requests.MakeWSO2RequestWithHeadersReturnResponse("POST", "https://api.byu.edu:443/domains/erp/hr/elapsed_time_punch/v1/"+byuID, wrapper, &otherResponse, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})

	if err != nil {
		return otherResponse, nerr.Translate(err).Addf("failed to record sick hours for %s", byuID), response, responseBody
	}

	return otherResponse, nil, response, responseBody
}

// SendWorkOrderUpsertRequest .
func SendWorkOrderUpsertRequest(byuID string, req structs.WorkOrderUpsert) (structs.WorkOrderDaySummary, *nerr.E) {
	var resp structs.WorkOrderDaySummary

	url := fmt.Sprintf("https://api.byu.edu:443/domains/erp/hr/work_order_entry/v1/%s", byuID)

	err := wso2requests.MakeWSO2RequestWithHeaders("POST", url, req, &resp, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return resp, nerr.Translate(err).Addf("failed to send a work order entry for %s", byuID)
	}

	return resp, nil
}

// SendDeletePunchRequest sends a delete punch request to the YTime API and returns the response.
func SendDeletePunchRequest(byuID string, req structs.DeletePunch) ([]structs.TimeClockDay, *nerr.E) {
	var resp []structs.TimeClockDay

	url := fmt.Sprintf("https://api.byu.edu:443/domains/erp/hr/punches/v1/%s,%d,%s,%d", byuID, *req.EmployeeJobID, req.PunchTime.Local().Format("2006-01-02"), *req.SequenceNumber)

	err := wso2requests.MakeWSO2RequestWithHeaders("DELETE", url, nil, &resp, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return resp, nerr.Translate(err).Addf("failed to delete punch")
	}

	return resp, nil
}

// SendDeleteWorkOrderEntryRequest sends a delete work order entry request to the YTime API and returns the response
func SendDeleteWorkOrderEntryRequest(byuID string, jobID string, punchDate string, sequenceNumber string) (structs.WorkOrderDaySummary, *nerr.E) {
	var response structs.WorkOrderDaySummary

	err := wso2requests.MakeWSO2RequestWithHeaders("DELETE", "https://api.byu.edu:443/domains/erp/hr/work_order_entry/v1/"+byuID+","+jobID+","+punchDate+","+sequenceNumber, "", &response, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})
	if err != nil {
		return response, nerr.Translate(err).Addf("failed to delete work order entry for %s", byuID)
	}

	return response, nil
}

// GetTimesheet returns a timesheet, a bool if the timesheet was returned in offline mode (from cache), and possible error
func GetTimesheet(byuid string) (structs.Timesheet, bool, error) {

	var timesheet structs.Timesheet

	err, httpResponse, responseBody := wso2requests.MakeWSO2RequestWithHeadersReturnResponse("GET", "https://api.byu.edu:443/domains/erp/hr/timesheet/v1/"+byuid, "", &timesheet, map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
	})

	if err != nil {
		log.L.Debugf("Error when making WSO2 request to get timesheet %v", err)

		if httpResponse.StatusCode/100 == 5 {
			//500 code, then we look in cache
			//look in the cache
			employeeRecord, innerErr := offline.GetEmployeeFromCache(byuid)

			if innerErr != nil {
				//not found
				log.L.Debugf("No cached timesheet found")
				return timesheet, false, errors.New("System offline - employee not found")
			}

			log.L.Debugf("Cached timesheet found")

			timesheet := structs.Timesheet{
				PersonName:           employeeRecord.Name,
				WeeklyTotal:          "--:--",
				PeriodTotal:          "--:--",
				InternationalMessage: "",
				Jobs:                 employeeRecord.Jobs,
			}

			return timesheet, true, nil
		}

		var messageStruct structs.ServerLoginErrorMessage

		testForMessageErr := json.Unmarshal([]byte(responseBody), &messageStruct)
		if testForMessageErr != nil {
			return timesheet, false, errors.New("Employee not found")
		}

		errMessage := messageStruct.Status.Message

		return timesheet, false, errors.New(errMessage)
	}

	return timesheet, false, nil
}

// GetPunchesForJob gets a list of serverside TimeClockDay structures from WSO2
func GetPunchesForJob(byuID string, jobID int) []structs.TimeClockDay {
	var WSO2Response []structs.TimeClockDay

	log.L.Debugf("Sending WSO2 GET request to %v", "https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID+","+strconv.Itoa(jobID))

	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
		"https://api.byu.edu:443/domains/erp/hr/punches/v1/"+byuID+","+strconv.Itoa(jobID), "", &WSO2Response, map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		})

	if err != nil {
		log.L.Errorf("Error when retrieving punches for employee and job %s %v %s", byuID, jobID, err.Error())
	}

	return WSO2Response
}

// GetWorkOrders gets all the possilbe work orders for the day from WSO2
func GetWorkOrders(operatingUnit string) []structs.WorkOrder {
	var WSO2Response []structs.WorkOrder

	log.L.Debugf("Getting work orders for operating unit %v", operatingUnit)

	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
		"https://api.byu.edu:443/domains/erp/hr/work_orders_by_operating_unit/v1/"+operatingUnit, "", &WSO2Response, map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		})

	if err != nil {
		log.L.Errorf("Error when retrieving possible work orders for operating unit %v", err.Error())
	}

	return WSO2Response
}

// GetWorkOrderEntries gets all the work order entries for a particular job from WSO2
func GetWorkOrderEntries(byuID string, employeeJobID int) []structs.WorkOrderDaySummary {
	var WSO2Response []structs.WorkOrderDaySummary

	log.L.Debugf("Getting work orders for employee and job %v %v", byuID, employeeJobID)

	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
		"https://api.byu.edu:443/domains/erp/hr/work_order_entry/v1/"+byuID+","+strconv.Itoa(employeeJobID), "", &WSO2Response, map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		})

	if err != nil {
		log.L.Errorf("Error when retrieving possible work orders for operating unit %v", err.Error())
	}

	return WSO2Response
}

// GetOtherHoursForDate gets the other hours for a job for a specitic date from WSO2
func GetOtherHoursForDate(byuID string, employeeJobID int, date time.Time) structs.ElapsedTimeSummary {
	var WSO2Response structs.ElapsedTimeSummary

	log.L.Debugf("Getting other hours for employee and and date job %v %v", byuID, employeeJobID, date)

	err := wso2requests.MakeWSO2RequestWithHeaders("GET",
		"https://api.byu.edu:443/domains/erp/hr/elapsed_time_punch/v1/"+byuID+","+strconv.Itoa(employeeJobID)+","+date.Format("2006-01-02"), "", &WSO2Response, map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		})

	if err != nil {
		log.L.Errorf("Error when retrieving other hours for date %v %v", date, err.Error())
	}

	return WSO2Response
}
