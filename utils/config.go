package utils

import "github.com/mcuadros/go-defaults"

// Config struct to match utils.toml file structure
type Config struct {
	App AppConfig `toml:"app"` // has to match with your toml structure.
}

type AppConfig struct {
	DefaultBduss  string `toml:"default_bduss"`
	ListenAddress string `toml:"listen_address" default:":1323"`
}

func NewConfig() *Config {
	config := new(Config)
	defaults.SetDefaults(config)
	return config
}
