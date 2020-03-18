package log

import (
	"errors"
	"fmt"
	"log"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// P is a plain zap logger
var P *zap.Logger

// Config is the logger config used for P
var Config zap.Config

func init() {
	var err error
	Config = zap.Config{
		Level:       zap.NewAtomicLevelAt(zap.InfoLevel),
		Development: false,
		Sampling: &zap.SamplingConfig{
			Initial:    100,
			Thereafter: 100,
		},
		Encoding: "json",
		EncoderConfig: zapcore.EncoderConfig{
			TimeKey:        "@",
			LevelKey:       "level",
			NameKey:        "logger",
			CallerKey:      "caller",
			MessageKey:     "msg",
			StacktraceKey:  "stacktrace",
			LineEnding:     zapcore.DefaultLineEnding,
			EncodeLevel:    zapcore.LowercaseLevelEncoder,
			EncodeTime:     zapcore.ISO8601TimeEncoder,
			EncodeDuration: zapcore.StringDurationEncoder,
			EncodeCaller:   zapcore.ShortCallerEncoder,
		},
		OutputPaths:      []string{"stderr"},
		ErrorOutputPaths: []string{"stderr"},
	}

	P, err = Config.Build()
	if err != nil {
		log.Fatalf("failed to initialize zap logger: %v", err)
	}

	P.Info("Zap logger started")

	_ = P.Sync()
}

func SetLevel(level int) error {
	switch level {
	case 1:
		fmt.Printf("\nSetting log level to *debug*\n\n")
		Config.Level.SetLevel(zap.DebugLevel)
	case 2:
		fmt.Printf("\nSetting log level to *info*\n\n")
		Config.Level.SetLevel(zap.InfoLevel)
	case 3:
		fmt.Printf("\nSetting log level to *warn*\n\n")
		Config.Level.SetLevel(zap.WarnLevel)
	case 4:
		fmt.Printf("\nSetting log level to *error*\n\n")
		Config.Level.SetLevel(zap.ErrorLevel)
	case 5:
		fmt.Printf("\nSetting log level to *panic*\n\n")
		Config.Level.SetLevel(zap.PanicLevel)
	default:
		return errors.New("invalid log level: must be [1-4]")
	}

	return nil
}
