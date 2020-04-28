package cache

import (
	"fmt"
	"net/http"
	"time"

	"github.com/byuoitav/pi-time/log"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 5 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,

	// allowing all origins!!
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

//ServeWebsocket will create a wrapped websocket connection with a channel to push data to
func ServeWebsocket(w http.ResponseWriter, r *http.Request) *Client {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.P.Error("Error upgrading websocket:", zap.Error(err))
		return nil
	}

	client := &Client{conn: conn, send: make(chan interface{}, 256)}

	go client.read()
	go client.write()

	return client
}

//Client is a wrapper around the websocket connection with a channel to send outbound messages to
type Client struct {
	// the websocket connection
	conn *websocket.Conn

	// buffered channel of outbound messages
	send chan interface{}
}

func (c *Client) read() {
	defer func() {
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))

	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, msg, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway) {
				log.P.Info(fmt.Sprintf("error: %v", err))
			}
			break
		}
		log.P.Info(fmt.Sprintf("Recieved message from socket: %s", msg))
	}
}

func (c *Client) write() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			_ = c.conn.WriteJSON(msg)

		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				return
			}
		}
	}
}

func (c *Client) CloseWithReason(msg string) {
	defer c.conn.Close()

	cmsg := websocket.FormatCloseMessage(4000, msg)

	if len(cmsg) > 125 {
		cmsg = cmsg[:125]
	}

	err := c.conn.WriteMessage(websocket.CloseMessage, cmsg)

	if err != nil {
		log.P.Warn("unable to write close message %v", zap.Error(err))
	}
}
