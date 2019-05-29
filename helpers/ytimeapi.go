package helpers

func GetTimesheet(byuid string) error {
	err :=
		wso2services.MakeWSO2Request("GET", "https://api.byu.edu:443/domains/erp/hr/timesheet/v1/"+byuid, "", timesheet)

	if err != nil {
		if httpResponse.StatusCode/100 == 4 {
			//this means they don't have jobs to punch in
		}
	}

}
