package templates

import (
	"embed"
	"github.com/labstack/echo/v4"
	"html/template"
	"io"
	"io/fs"
)

//go:embed *.html
var templatesFS embed.FS

type TemplateRegistry struct {
	templates *template.Template
}

func (t *TemplateRegistry) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	_ = c
	return t.templates.ExecuteTemplate(w, name, data)
}

func CreateTemplateRenderer() *TemplateRegistry {
	templatesFsInst, _ := fs.Sub(templatesFS, ".")
	parsedTemplates, _ := template.ParseFS(templatesFsInst, "*.html")
	return &TemplateRegistry{
		templates: parsedTemplates,
	}
}

//go:embed assets/*
var AssetsFS embed.FS
