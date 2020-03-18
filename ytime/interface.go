package ytime

import (
	"context"

	"github.com/byuoitav/pi-time/structs"
)

type Client interface {
	SendPunchRequest(context.Context, string, structs.Punch) (structs.Timesheet, error)
}
