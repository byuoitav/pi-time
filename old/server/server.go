package main

import "github.com/byuoitav/common"

const port = "8101"

func main() {

	router := common.NewRouter()

	router.Get("/:id")

	router.Start(port)
}
