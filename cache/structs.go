package cache

import "github.com/gorilla/websocket"

// employee is all of the information about an employee for their timeclock session
type employee struct {
	ID        string        `json:"id"`
	Name      string        `json:"name"`
	Jobs      []EmployeeJob `json:"jobs"`
	TotalTime TotalTime     `json:"total-time"`
	Message   string        `json:"international-message"`

	conn *websocket.Conn
	out  chan interface{}
}
