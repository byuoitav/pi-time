package eventsender

import (
	"os"

	"github.com/byuoitav/central-event-system/hub/base"
	"github.com/byuoitav/central-event-system/messenger"
	"github.com/byuoitav/common/log"
	commonEvents "github.com/byuoitav/common/v2/events"
)

var MyMessenger *messenger.Messenger

func init() {
	//start messenger
	deviceInfo := commonEvents.GenerateBasicDeviceInfo(os.Getenv("SYSTEM_ID"))
	messenger, err := messenger.BuildMessenger(os.Getenv("HUB_ADDRESS"), base.Messenger, 1000)
	if err != nil {
		log.L.Errorf("unable to build the messenger: %s", err.Error())
	}

	messenger.SubscribeToRooms(deviceInfo.RoomID)
}
