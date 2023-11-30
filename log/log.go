package log

import (
	"log/slog"
	"os"
	"runtime"
)

var P *slog.Logger

func init() {
	var logLevel = new(slog.LevelVar)
	P = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: logLevel}))
	slog.SetDefault(P)

	logLevel.Set(slog.LevelInfo)

	//set log level to debug if running on Windows
	if runtime.GOOS == "windows" {
		logLevel.Set(slog.LevelDebug)
		P.Info("running from Windows, logging set to debug")
	}

	P.Info("Zap logger started")

}
