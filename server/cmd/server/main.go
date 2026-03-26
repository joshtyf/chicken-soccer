package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"chicken-soccer/server/internal/api"
	"chicken-soccer/server/internal/game"
	"chicken-soccer/server/internal/match"
	"chicken-soccer/server/internal/store"
)

func main() {
	wd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}
	baseDir := filepath.Join(wd, "data")
	s := store.New(baseDir)
	if err := os.MkdirAll(filepath.Join(baseDir, "players"), 0o755); err != nil {
		log.Fatal(err)
	}

	playerStore := store.NewPlayerStore(s)
	chickenStore := store.NewChickenStore(s)
	feedStore := store.NewFeedStore(s)
	shopStore := store.NewShopStore(s)
	registry := game.NewRegistry()
	matchmaker := match.NewMatchmaker(registry, playerStore, feedStore)

	server := api.New(api.Config{
		PlayerStore:  playerStore,
		ChickenStore: chickenStore,
		FeedStore:    feedStore,
		ShopStore:    shopStore,
		Registry:     registry,
		Matchmaker:   matchmaker,
	})

	log.Println("server listening on :8080")
	if err := http.ListenAndServe(":8080", server.Routes()); err != nil {
		log.Fatal(err)
	}
}
