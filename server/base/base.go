package base

import "github.com/byuoitav/common/nerr"

type AsyncWrapper struct {
	Type string
	Err  *nerr.E
	Val  interface{}
}
