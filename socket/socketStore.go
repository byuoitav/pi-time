package socket

import (
	"fmt"
	"sync"

	"github.com/byuoitav/pi-time/structs"
)

var (
	openConnections map[string]*Client
	mutex           sync.Mutex
)

func init() {
	openConnections = make(map[string]*Client)
}

//AddConnection adds the websocket to the store
func AddConnection(byuID string, connectionToAdd *Client) {
	//put it in the map
	mutex.Lock()
	defer mutex.Unlock()
	openConnections[byuID] = connectionToAdd

	//add a close handler to get rid of it
	connectionToAdd.conn.SetCloseHandler(
		func(code int, text string) error {
			mutex.Lock()
			defer mutex.Unlock()
			delete(openConnections, byuID)
			return nil
		})
}

//SendMessageToClient will send a message to the web socket client
func SendMessageToClient(byuID string, messageType string, toSend interface{}) error {
	mutex.Lock()
	defer mutex.Unlock()

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
