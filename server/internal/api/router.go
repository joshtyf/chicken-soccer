package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"chicken-soccer/server/internal/game"
	"chicken-soccer/server/internal/match"
	"chicken-soccer/server/internal/store"
	"chicken-soccer/server/internal/ws"
)

type Config struct {
	PlayerStore  *store.PlayerStore
	ChickenStore *store.ChickenStore
	FeedStore    *store.FeedStore
	ShopStore    *store.ShopStore
	Registry     *game.Registry
	Matchmaker   *match.Matchmaker
}

type API struct {
	playerStore  *store.PlayerStore
	chickenStore *store.ChickenStore
	feedStore    *store.FeedStore
	shopStore    *store.ShopStore
	registry     *game.Registry
	matchmaker   *match.Matchmaker
}

func New(cfg Config) *API {
	return &API{
		playerStore:  cfg.PlayerStore,
		chickenStore: cfg.ChickenStore,
		feedStore:    cfg.FeedStore,
		shopStore:    cfg.ShopStore,
		registry:     cfg.Registry,
		matchmaker:   cfg.Matchmaker,
	}
}

func (a *API) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/auth/register", a.Register)
	mux.Handle("GET /api/player", a.auth(a.GetPlayer))
	mux.Handle("GET /api/collection", a.auth(a.GetCollection))
	mux.Handle("POST /api/collection/init", a.auth(a.InitCollection))
	mux.Handle("GET /api/shop", a.auth(a.GetShop))
	mux.Handle("POST /api/shop/buy-chicken", a.auth(a.BuyChicken))
	mux.Handle("POST /api/shop/buy-feed", a.auth(a.BuyFeed))
	mux.Handle("POST /api/match/create", a.auth(a.CreateMatch))
	mux.Handle("/ws/game/", ws.NewHandler(a.registry, a.playerStore))
	return cors(mux)
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

type ctxKey string

const playerIDKey ctxKey = "playerID"

func (a *API) auth(next http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tok := bearerToken(r.Header.Get("Authorization"))
		if tok == "" {
			writeError(w, http.StatusUnauthorized, "missing bearer token")
			return
		}
		pid, err := a.playerStore.GetPlayerByToken(tok)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}
		r.Header.Set("X-Player-ID", pid)
		next(w, r)
	})
}

func bearerToken(v string) string {
	const p = "Bearer "
	if len(v) <= len(p) || !strings.HasPrefix(v, p) {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(v, p))
}

func playerIDFromReq(r *http.Request) string {
	return r.Header.Get("X-Player-ID")
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]any{"error": msg})
}
