package utils

// Config struct to match utils.toml file structure
type Config struct {
	App AppConfig `toml:"app"` // has to match with your toml structure.
}

type AppConfig struct {
	ImageDirectory string `toml:"image_dir"` // matches with your key in toml.
}
