package utils

func FirstOrDefault[T any](values []T, defaultVal T) T {
	if len(values) > 0 {
		return values[0]
	}
	return defaultVal
}
