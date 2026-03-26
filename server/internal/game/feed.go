package game

import "time"

type FeedItem struct {
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Player string  `json:"player"`
	Type   string  `json:"type"`
	Timer  float64 `json:"timer"`
	Radius float64 `json:"radius"`
}

const (
	FeedLifetime       = 4.0
	FeedAttractRadius  = 30.0
	MaxFeedPerPlayer   = 5
	FeedPlaceCooldown  = 200 * time.Millisecond
)
