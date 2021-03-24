package cache

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/byuoitav/pi-time/log"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/wso2services/wso2requests"
	"go.uber.org/zap"
)

var (
	Latitude  = ""
	Longitude = ""
)

//GetYtimeLocation will get the latitude and longitude for the pi based on the building
func GetYTimeLocation() error {
	systemID := os.Getenv("SYSTEM_ID")
	split := strings.Split(systemID, "-")
	if len(split) == 0 {
		return fmt.Errorf("invalid system id %q", systemID)
	}

	building := split[0]
	log.P.Debug(fmt.Sprintf("Sending WSO2 GET request to %v", "https://api.byu.edu:443/domains/erp/hr/locations/v1/"+building))

	var loc structs.YTimeLocation
	err := wso2requests.MakeWSO2Request("GET", "https://api.byu.edu:443/domains/erp/hr/locations/v1/"+building, "", &loc)
	if err != nil {
		return fmt.Errorf("unable to get building information for %q: %w", building, err)
	}

	Latitude = strconv.FormatFloat(loc.Latitude, 'f', -1, 64)
	Longitude = strconv.FormatFloat(loc.Longitude, 'f', -1, 64)
	log.P.Info("Successfully got location", zap.String("latitude", Latitude), zap.String("Longitude", Longitude))
	return nil
}
