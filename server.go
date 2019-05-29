package main

import (
	"net/http"

	"github.com/byuoitav/common"
	"github.com/byuoitav/pi-time/handlers"
	"github.com/labstack/echo/middleware"
)

func main() {
	port := ":8463"

	router := common.NewRouter()

	router.GET("/:id", handlers.LogInUser)

	router.Group("/", middleware.StaticWithConfig(middleware.StaticConfig{
		Root:   "analog-dist",
		Index:  "index.html",
		HTML5:  true,
		Browse: true,
	}))

	server := http.Server{
		Addr:           port,
		MaxHeaderBytes: 1024 * 10,
	}

	router.StartServer(&server)
}
