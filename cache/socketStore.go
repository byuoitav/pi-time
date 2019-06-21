package cache

import (
	"fmt"
	"sync"

	"github.com/byuoitav/pi-time/structs"
)

var (
	openConnections     map[string]*Client
	openConnectionMutex sync.Mutex
)

func init() {
	openConnections = make(map[string]*Client)
}

//AddConnection adds the websocket to the store
func AddConnection(byuID string, connectionToAdd *Client) {
	//put it in the map
	openConnectionMutex.Lock()
	defer openConnectionMutex.Unlock()
	openConnections[byuID] = connectionToAdd

	//add a close handler to get rid of it
	connectionToAdd.conn.SetCloseHandler(
		func(code int, text string) error {
			openConnectionMutex.Lock()
			defer openConnectionMutex.Unlock()
			delete(openConnections, byuID)

			//also get rid of the cached employee record
			RemoveEmployeeFromStore(byuID)
			return nil
		})
}

//SendMessageToClient will send a message to the web socket client
func SendMessageToClient(byuID string, messageType string, toSend interface{}) error {
	openConnectionMutex.Lock()
	defer openConnectionMutex.Unlock()

	myConnection, ok := openConnections[byuID]
	if !ok {
		return fmt.Errorf("No websocket found for %v", byuID)
	}

	message := structs.WebSocketMessage{
		Key:   messageType,
		Value: toSend,
	}

	//push it to the channel
	myConnection.send <- message

	return nil

}
