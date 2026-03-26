package store

import (
	"path/filepath"

	"chicken-soccer/server/internal/model"
)

type ShopState struct {
	DateKey  string        `json:"dateKey"`
	Listings []ShopListing `json:"listings"`
}

type ShopListing struct {
	ID            string             `json:"id"`
	GeneratedName string             `json:"generatedName"`
	Stats         map[string]float64 `json:"stats"`
	Price         int                `json:"price"`
}

type ShopStore struct {
	store *Store
}

func NewShopStore(s *Store) *ShopStore { return &ShopStore{store: s} }

func (s *ShopStore) file(playerID, dateKey string) string {
	return filepath.Join(s.store.playerDir(playerID), "shop", dateKey+".json")
}

func (s *ShopStore) GetDailyShop(playerID, dateKey string) (*ShopState, error) {
	m := s.store.lockForPlayer(playerID)
	m.Lock()
	defer m.Unlock()
	state := ShopState{}
	if err := readJSON(s.file(playerID, dateKey), &state); err != nil {
		return nil, err
	}
	return &state, nil
}

func (s *ShopStore) SaveDailyShop(playerID, dateKey string, state ShopState) error {
	m := s.store.lockForPlayer(playerID)
	m.Lock()
	defer m.Unlock()
	return writeJSON(s.file(playerID, dateKey), state)
}

func GenerateDailyShop(dateKey string, seed uint32) ShopState {
	rng := newMulberry32(seed)
	count := randomInt(rng, 3, 10)
	raw := make([]ShopListing, 0, count)
	for i := 0; i < count; i++ {
		stats := map[string]float64{
			"speed": float64(randomInt(rng, 0, 100)),
		}
		raw = append(raw, ShopListing{
			ID:            dateKey + "-" + itoa(i) + "-" + itoa(randomInt(rng, 0, 999999)),
			GeneratedName: randomShopName(rng),
			Stats:         stats,
		})
	}
	return ShopState{DateKey: dateKey, Listings: priceByStrength(raw)}
}

func ShopSeedFromDateAndPlayer(dateKey, playerID string) uint32 {
	return hashString("shop:" + dateKey + ":" + playerID)
}

func randomShopName(rng func() float64) string {
	first := []string{"Clucky", "Pecky", "Nugget", "Flap", "Sunny", "Rusty", "Poppy", "Comet"}
	last := []string{"Rocket", "Dancer", "Feather", "Boots", "Spark", "Pepper", "Wing", "Blaze"}
	return first[randomInt(rng, 0, len(first)-1)] + " " + last[randomInt(rng, 0, len(last)-1)]
}

func strength(s ShopListing) float64 {
	return s.Stats["speed"] / 100.0
}

func priceByStrength(items []ShopListing) []ShopListing {
	type pair struct {
		idx int
		v   float64
	}
	arr := make([]pair, 0, len(items))
	for i, it := range items {
		arr = append(arr, pair{idx: i, v: strength(it)})
	}
	for i := range arr {
		for j := i + 1; j < len(arr); j++ {
			if arr[j].v < arr[i].v {
				arr[i], arr[j] = arr[j], arr[i]
			}
		}
	}
	maxIdx := len(arr) - 1
	if maxIdx < 1 {
		maxIdx = 1
	}
	for rank, p := range arr {
		ratio := float64(rank) / float64(maxIdx)
		items[p.idx].Price = int(100 + (500-100)*ratio + 0.5)
	}
	return items
}

func hashString(s string) uint32 {
	h := uint32(2166136261)
	for i := 0; i < len(s); i++ {
		h ^= uint32(s[i])
		h *= 16777619
	}
	return h
}

func newMulberry32(seed uint32) func() float64 {
	a := seed
	return func() float64 {
		a += 0x6d2b79f5
		t := a
		t = uint32(int32(t^(t>>15)) * int32(t|1))
		t ^= t + uint32(int32(t^(t>>7))*int32(t|61))
		return float64((t^(t>>14))&0xffffffff) / 4294967296.0
	}
}

func randomInt(rng func() float64, minV, maxV int) int {
	if maxV <= minV {
		return minV
	}
	return int(rng()*float64(maxV-minV+1)) + minV
}

func itoa(v int) string {
	if v == 0 {
		return "0"
	}
	neg := v < 0
	if neg {
		v = -v
	}
	buf := [20]byte{}
	i := len(buf)
	for v > 0 {
		i--
		buf[i] = byte('0' + (v % 10))
		v /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}

func ToChicken(id, name string, listing ShopListing) model.Chicken {
	return model.Chicken{ID: id, Name: name, Stats: model.SanitizeStats(listing.Stats)}
}
