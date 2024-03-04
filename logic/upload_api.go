package logic

import (
	"BaiduImageUploadServer/service"
	"BaiduImageUploadServer/utils"
	"bytes"
	"github.com/labstack/echo/v4"
	gonanoid "github.com/matoous/go-nanoid"
	"golang.org/x/image/webp"
	"image/png"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path"

	_ "golang.org/x/image/webp"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
)

func ProcessImageToLocalStorage(saveDir string, file *multipart.FileHeader) (string, error) {
	if err := os.MkdirAll(saveDir, 0755); err != nil {
		return "", err
	}

	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer func(src multipart.File) {
		_ = src.Close()
	}(src)
	imageBytes, err := io.ReadAll(src)
	_, format, err := image.DecodeConfig(bytes.NewReader(imageBytes))
	if err != nil {
		return "", err
	}

	dstFilePath := path.Join(saveDir, gonanoid.MustID(20))
	finalPath := dstFilePath + "." + format

	switch format {
	case "jpeg", "png", "gif":
		dst, err := os.Create(finalPath)
		if err != nil {
			return "", err
		}
		defer func(dst *os.File) {
			_ = dst.Close()
		}(dst)
		if _, err = io.Copy(dst, bytes.NewReader(imageBytes)); err != nil {
			return "", err
		}

	case "webp":
		finalPath = dstFilePath + ".png"
		webpImage, err := webp.Decode(bytes.NewReader(imageBytes))
		if err != nil {
			return "", err
		}
		dst, err := os.Create(finalPath)
		if err != nil {
			return "", err
		}
		defer func(dst *os.File) {
			_ = dst.Close()
		}(dst)
		err = png.Encode(dst, webpImage)
		if err != nil {
			return "", err
		}

	default:
		return "", echo.NewHTTPError(http.StatusBadRequest, "File format not supported, only jpg/png/gif/webp supported")
	}

	return finalPath, nil
}

func BaiduUploadHandler(c echo.Context) error {
	config, ok := c.Get("config").(*utils.Config)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "can not get utils")
	}

	if err := c.Request().ParseMultipartForm(32 << 20); err != nil {
		return err
	}

	// Get the *multipart.Form:
	multipartForm := c.Request().MultipartForm

	// Get all the files from "image" key:
	files := multipartForm.File["image"]
	bdussFields := multipartForm.Value["bduss"]
	if len(bdussFields) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "bduss missing")
	}
	bduss := bdussFields[0]
	if len(bduss) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "bduss empty")
	}
	c.SetCookie(&http.Cookie{
		Name:     "bduss",
		Value:    bduss,
		HttpOnly: true,
	})

	var images []string

	for _, file := range files {
		uploadPath, err := ProcessImageToLocalStorage(config.App.ImageDirectory, file)
		if err != nil {
			return err
		}

		imageFile, err := os.Open(uploadPath)
		if err != nil {
			return err
		}
		defer func(imageFile *os.File) {
			_ = imageFile.Close()
		}(imageFile)
		imageUrl, err := service.UploadToBaidu(bduss, imageFile)
		if err != nil {
			return err
		}
		images = append(images, imageUrl)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"urls": images,
	})
}
