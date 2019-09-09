package handler

import (
	"io"
	"net/http"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	id, ok := r.URL.Query()["id"]

	if !ok {
		return
	}

	read, write := io.Pipe()

	// writing without a reader will deadlock so write in a goroutine
	go func() {
		defer write.Close()
		resp, err := http.Get("https://tienda.mercadona.es/api/v1_1/products/" + id[0] + "/?lang=es&wh=vlc1")
		if err != nil {
			return
		}
		defer resp.Body.Close()
		io.Copy(write, resp.Body)

	}()

	io.Copy(w, read)
}
