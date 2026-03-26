package model

import (
	"math"
	"math/rand"
	"time"
)

type Chicken struct {
	ID        string             `json:"id"`
	Name      string             `json:"name"`
	Stats     map[string]float64 `json:"stats"`
	CreatedAt string             `json:"createdAt"`
}

type RuntimeStats struct {
	Speed float64 `json:"speed"`
}

var firstNames = []string{"Clucky", "Pecky", "Nugget", "Flap", "Sunny", "Rusty", "Poppy", "Comet"}
var lastNames = []string{"Rocket", "Dancer", "Feather", "Boots", "Spark", "Pepper", "Wing", "Blaze"}

const (
	SpeedMinGameValue = 30.0
	SpeedMaxGameValue = 80.0
)

func DefaultStats() map[string]float64 {
	return map[string]float64{"speed": 50}
}

func clamp(v, minV, maxV float64) float64 {
	return math.Max(minV, math.Min(maxV, v))
}

func SanitizeStats(input map[string]float64) map[string]float64 {
	out := DefaultStats()
	if input == nil {
		return out
	}
	if v, ok := input["speed"]; ok {
		out["speed"] = clamp(v, 0, 100)
	}
	return out
}

func ResolveStatsForGame(stats map[string]float64) RuntimeStats {
	safe := SanitizeStats(stats)
	n := safe["speed"] / 100.0
	return RuntimeStats{Speed: SpeedMinGameValue + (SpeedMaxGameValue-SpeedMinGameValue)*n}
}

func randomName(rng *rand.Rand) string {
	return firstNames[rng.Intn(len(firstNames))] + " " + lastNames[rng.Intn(len(lastNames))]
}

func GenerateStarterChicken(id string, rng *rand.Rand) Chicken {
	if rng == nil {
		rng = rand.New(rand.NewSource(time.Now().UnixNano()))
	}
	stats := map[string]float64{"speed": float64(rng.Intn(11) + 45)}
	return Chicken{ID: id, Name: randomName(rng), Stats: stats, CreatedAt: time.Now().UTC().Format(time.RFC3339)}
}

func GenerateRandomOpponent(id string, rng *rand.Rand) Chicken {
	if rng == nil {
		rng = rand.New(rand.NewSource(time.Now().UnixNano()))
	}
	stats := map[string]float64{"speed": float64(rng.Intn(56) + 35)}
	return Chicken{ID: id, Name: randomName(rng), Stats: stats, CreatedAt: time.Now().UTC().Format(time.RFC3339)}
}
