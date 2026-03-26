package ws

import (
	"net/http"
	"strings"

	"github.com/gorilla/websocket"

	"chicken-soccer/server/internal/game"
	"chicken-soccer/server/internal/store"
)

type Handler struct {
	Registry    *game.Registry
	PlayerStore *store.PlayerStore
	Upgrader    websocket.Upgrader
}

func NewHandler(reg *game.Registry, ps *store.PlayerStore) *Handler {
	return &Handler{
		Registry:    reg,
		PlayerStore: ps,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
	}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	token := bearerToken(r.Header.Get("Authorization"))
	if token == "" {
		token = strings.TrimSpace(r.URL.Query().Get("token"))
	}
	if token == "" {
		http.Error(w, "missing token", http.StatusUnauthorized)
		return
	}
	playerID, err := h.PlayerStore.GetPlayerByToken(token)
	if err != nil {
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}
	sessionID := strings.TrimPrefix(r.URL.Path, "/ws/game/")
	s, ok := h.Registry.Get(sessionID)
	if !ok || s.PlayerID != playerID {
		http.Error(w, "session not found", http.StatusNotFound)
		return
	}
	conn, err := h.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	if err := s.AttachConn(conn); err != nil {
		_ = conn.Close()
		return
	}
	s.ReadLoop()
}

func bearerToken(v string) string {
	const p = "Bearer "
	if len(v) <= len(p) || !strings.HasPrefix(v, p) {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(v, p))
}
