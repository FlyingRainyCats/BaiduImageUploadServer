package main

import (
	"BaiduImageUploadServer/logic"
	"BaiduImageUploadServer/templates"
	"BaiduImageUploadServer/utils"
	"fmt"
	"github.com/BurntSushi/toml"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"net/http"
)

func main() {
	e := echo.New()
	e.Renderer = templates.CreateTemplateRenderer()

	config := utils.NewConfig()
	_, err := toml.DecodeFile("config.toml", &config)
	if err != nil {
		fmt.Printf("warn: failed to parse config.toml with error (ignored): %s", err)
	}

	e.StaticFS("/assets", echo.MustSubFS(templates.AssetsFS, "assets"))

	// enable internal logger middleware
	e.Use(middleware.Logger())
	e.Use(middleware.CSRFWithConfig(middleware.CSRFConfig{
		TokenLookup: "header:_csrf,form:_csrf",
		CookiePath:  "/",
	}))
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("config", &config)
			return next(c)
		}
	})

	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			bduss, err := c.Cookie("bduss")
			bdussCookie := ""
			if err == nil {
				bdussCookie = bduss.Value
			}
			c.Set("bduss", bdussCookie)
			return next(c)
		}
	})
	e.GET("/", func(c echo.Context) error {
		bdussCookie := c.Get("bduss").(string)
		csrfToken := c.Get("csrf").(string)

		return c.Render(http.StatusOK, "index.html", map[string]interface{}{
			"BDUSS": bdussCookie,
			"csrf":  csrfToken,
		})
	})
	e.POST("/upload", logic.BaiduUploadHandler)
	e.Logger.Fatal(e.Start(config.App.ListenAddress))
}
