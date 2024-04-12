package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	gonanoid "github.com/matoous/go-nanoid/v2"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"strings"
)

const BaiduImageUploadEndpointUrl = "https://sp0.baidu.com/6_R1fD_bAAd3otqbppnN2DJv/Pic/upload?pid=super&app=skin&l&logid=3915152959"
const BaiduImageURLFormat = "https://imgsrc.baidu.com/forum/pic/item/%s.png"
const DefaultUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.2365.66'"

type BaiduUploadRespData struct {
	CurTime       interface{} `json:"cur_time"`
	PicID         string      `json:"pic_id"`
	FullpicWidth  int         `json:"fullpic_width"`
	FullpicHeight int         `json:"fullpic_height"`
	PicType       int         `json:"pic_type"`
	FullDatalen   int         `json:"full_datalen"`
	FullSign0     interface{} `json:"full_sign0"`
	FullSign1     interface{} `json:"full_sign1"`
	PicIDEncode   string      `json:"pic_id_encode"`
	PicDesc       string      `json:"pic_desc"`
	PicWater      string      `json:"pic_water"`
}

type BaiduUploadResp struct {
	ErrNo  int                  `json:"err_no"`
	ErrMsg string               `json:"err_msg"`
	Data   *BaiduUploadRespData `json:"data"`
}

func UploadToBaidu(image io.Reader, bduss string, headers map[string]string) (string, error) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	defer func(writer *multipart.Writer) {
		_ = writer.Close()
	}(writer)

	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition",
		fmt.Sprintf(`form-data; name="%s"; filename="%s"`,
			"file", fmt.Sprintf("image-%s.png", gonanoid.Must(20))))
	h.Set("Content-Type", "image/png")
	w, err := writer.CreatePart(h)
	if err != nil {
		return "", err
	}
	_, err = io.Copy(w, image)
	if err != nil {
		return "", err
	}

	// Close the multipart writer
	if err := writer.Close(); err != nil {
		return "", err
	}
	req, err := http.NewRequest("POST", BaiduImageUploadEndpointUrl, &buf)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", DefaultUserAgent)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Cookie", fmt.Sprintf("BDUSS=%s", bduss))
	for key, value := range headers {
		headerName := strings.ToLower(key)
		if headerName == "cookie" {
			req.Header.Add(key, value)
		} else {
			req.Header.Set(key, value)
		}
	}

	client := &http.Client{
		// Don't follow redirect - is usually a rejected request, no need to follow :/
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", nil
	}
	defer func(Body io.ReadCloser) {
		_ = Body.Close()
	}(resp.Body)

	// Check HTTP response status.
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("received non-200 response: %d", resp.StatusCode)
	}

	var uploadResp BaiduUploadResp
	if err := json.NewDecoder(resp.Body).Decode(&uploadResp); err != nil {
		return "", err
	}

	if uploadResp.ErrNo != 0 {
		return "", fmt.Errorf("baidu upload failed: %s", uploadResp.ErrMsg)
	}

	imageId := uploadResp.Data.PicIDEncode
	imageUrl := fmt.Sprintf(BaiduImageURLFormat, imageId)

	return imageUrl, nil
}
