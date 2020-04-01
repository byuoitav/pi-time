package cache

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/wso2services/wso2requests"
)

//LAT and LONG
var (
	LATITUDE  = "40.25258"
	LONGITUDE = "-111.657658"
)

func init() {
	if len(os.Getenv("SYSTEM_ID")) == 0 {
		log.P.Warn("Must have SYSTEM_ID set")
	}

}

//GetYtimeLocation will get the latitude and longitude for the pi based on the building
func GetYtimeLocation() {
	//retry again and again until it works
	for {
		var ytimeLocation structs.YTimeLocation

		systemID := os.Getenv("SYSTEM_ID")
		systemParts := strings.Split(systemID, "-")
		building := systemParts[0]

		log.P.Debug(fmt.Sprintf("Sending WSO2 GET request to %v", "https://api.byu.edu:443/domains/erp/hr/locations/v1/"+building))

		err := wso2requests.MakeWSO2Request("GET",
			"https://api.byu.edu:443/domains/erp/hr/locations/v1/"+building, "", &ytimeLocation)

		if err != nil {
			log.P.Error(fmt.Sprintf("Error when retrieving building information for %v: %v", building, err))
			time.Sleep(1000)
		} else {
			LATITUDE = fmt.Sprintf("%v", ytimeLocation.Latitude)
			LONGITUDE = fmt.Sprintf("%v", ytimeLocation.Longitude)
			log.P.Debug(fmt.Sprintf("Lat and Long retrieved %v, %v", LATITUDE, LONGITUDE))
			break
		}
	}
}
