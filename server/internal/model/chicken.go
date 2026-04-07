package model

import (
	"math"
	"math/rand"
	"time"
)

type Chicken struct {
	ID         string             `json:"id"`
	Name       string             `json:"name"`
	Stats      map[string]float64 `json:"stats"`
	Appearance Appearance         `json:"appearance"`
	CreatedAt  string             `json:"createdAt"`
}

type Appearance struct {
	BodyColor string `json:"bodyColor"`
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

var BodyColorPalette = []string{
	"#f0c74a",
	"#f9f5ea",
	"#8e5a3c",
	"#232323",
	"#d17b43",
	"#e6d2ad",
	"#c6b088",
	"#b9653e",
	"#f2dfa4",
}

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

func DefaultAppearance(chickenID string) Appearance {
	if len(BodyColorPalette) == 0 {
		return Appearance{BodyColor: "#f0c74a"}
	}
	idx := int(hashString(chickenID) % uint32(len(BodyColorPalette)))
	return Appearance{BodyColor: BodyColorPalette[idx]}
}

func RandomAppearance(rng *rand.Rand) Appearance {
	if rng == nil {
		rng = rand.New(rand.NewSource(time.Now().UnixNano()))
	}
	if len(BodyColorPalette) == 0 {
		return Appearance{BodyColor: "#f0c74a"}
	}
	return Appearance{BodyColor: BodyColorPalette[rng.Intn(len(BodyColorPalette))]}
}

func GenerateStarterChicken(id string, rng *rand.Rand) Chicken {
	if rng == nil {
		rng = rand.New(rand.NewSource(time.Now().UnixNano()))
	}
	stats := map[string]float64{"speed": float64(rng.Intn(11) + 45)}
	return Chicken{ID: id, Name: randomName(rng), Stats: stats, Appearance: RandomAppearance(rng), CreatedAt: time.Now().UTC().Format(time.RFC3339)}
}

func GenerateRandomOpponent(id string, rng *rand.Rand) Chicken {
	if rng == nil {
		rng = rand.New(rand.NewSource(time.Now().UnixNano()))
	}
	stats := map[string]float64{"speed": float64(rng.Intn(56) + 35)}
	return Chicken{ID: id, Name: randomName(rng), Stats: stats, Appearance: RandomAppearance(rng), CreatedAt: time.Now().UTC().Format(time.RFC3339)}
}

func hashString(s string) uint32 {
	h := uint32(2166136261)
	for i := 0; i < len(s); i++ {
		h ^= uint32(s[i])
		h *= 16777619
	}
	return h
}
