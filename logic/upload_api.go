package logic

import (
	"BaiduImageUploadServer/service"
	"bytes"
	"github.com/labstack/echo/v4"
	"golang.org/x/image/webp"
	_ "golang.org/x/image/webp"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	"image/png"
	_ "image/png"
	"io"
	"mime/multipart"
	"net/http"
)

func PreProcessImage(file *multipart.FileHeader) ([]byte, error) {
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer func(src multipart.File) {
		_ = src.Close()
	}(src)
	imageBytes, err := io.ReadAll(src)
	_, format, err := image.DecodeConfig(bytes.NewReader(imageBytes))
	if err != nil {
		return nil, err
	}

	switch format {
	case "jpeg", "png", "gif":
		break

	case "webp":
		webpImage, err := webp.Decode(bytes.NewReader(imageBytes))
		if err != nil {
			return nil, err
		}
		var pngBuffer bytes.Buffer
		err = png.Encode(&pngBuffer, webpImage)
		imageBytes = pngBuffer.Bytes()

	default:
		return nil, echo.NewHTTPError(http.StatusBadRequest, "File format not supported, only jpg/png/gif/webp supported")
	}

	return imageBytes, nil
}

func BaiduUploadHandler(c echo.Context) error {
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
		imageBytes, err := PreProcessImage(file)
		if err != nil {
			return err
		}

		imageUrl, err := service.UploadToBaidu(bduss, bytes.NewReader(imageBytes))
		if err != nil {
			return err
		}
		images = append(images, imageUrl)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"urls": images,
	})
}
