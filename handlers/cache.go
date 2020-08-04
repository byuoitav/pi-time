package handlers

import (
	"net/http"

	"github.com/byuoitav/pi-time/employee"
	"github.com/byuoitav/pi-time/log"
	"github.com/labstack/echo/v4"
	bolt "go.etcd.io/bbolt"
	"go.uber.org/zap"
)

func CacheDump(db *bolt.DB) echo.HandlerFunc {
	return echo.HandlerFunc(func(c echo.Context) error {
		cache, err := employee.GetCache(db)
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}

		log.P.Info("Returning cache dump", zap.Int("numEmployees", len(cache.Employees)))

		return c.JSON(http.StatusOK, cache)
	})
}
