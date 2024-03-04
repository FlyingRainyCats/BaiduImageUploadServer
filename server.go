package main

import (
	"BaiduImageUploadServer/logic"
	"BaiduImageUploadServer/templates"
	"BaiduImageUploadServer/utils"
	"github.com/BurntSushi/toml"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"net/http"
)

func main() {
	e := echo.New()
	e.Renderer = templates.CreateTemplateRenderer()

	var config utils.Config
	_, err := toml.DecodeFile("config.toml", &config)
	if err != nil {
		panic(err)
	}

	// enable internal logger middleware
	e.Use(middleware.Logger())

	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("config", &config)
			return next(c)
		}
	})

	e.StaticFS("/assets", echo.MustSubFS(templates.AssetsFS, "assets"))
	e.GET("/", func(c echo.Context) error {
		bduss, err := c.Cookie("bduss")
		bdussCookie := ""
		if err == nil {
			bdussCookie = bduss.Value
		}
		return c.Render(http.StatusOK, "index.html", map[string]interface{}{
			"BDUSS": bdussCookie,
		})
	})
	e.POST("/upload", logic.BaiduUploadHandler)
	e.Logger.Fatal(e.Start(":1323"))
}
