package match

import (
	"math/rand"
	"time"

	"chicken-soccer/server/internal/game"
	"chicken-soccer/server/internal/model"
	"chicken-soccer/server/internal/store"
)

type Matchmaker struct {
	Registry    *game.Registry
	PlayerStore *store.PlayerStore
	FeedStore   *store.FeedStore
}

func NewMatchmaker(reg *game.Registry, ps *store.PlayerStore, fs *store.FeedStore) *Matchmaker {
	return &Matchmaker{Registry: reg, PlayerStore: ps, FeedStore: fs}
}

func randID() string {
	return "s_" + time.Now().UTC().Format("20060102150405") + "_" + itoa(rand.Intn(1000000))
}

func (m *Matchmaker) Create(playerID string, selected []model.Chicken, mode model.GameMode, feedInv map[string]int) (string, []model.Chicken) {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	opponents := make([]model.Chicken, 0, mode.ChickensPerTeam)
	for i := 0; i < mode.ChickensPerTeam; i++ {
		opponents = append(opponents, model.GenerateRandomOpponent("cpu_"+itoa(i)+"_"+itoa(rng.Intn(999999)), rng))
	}
	sessionID := randID()
	s := game.NewSession(sessionID, playerID, game.Matchup{PlayerChickens: selected, OpponentChickens: opponents, GameMode: mode}, feedInv, m.PlayerStore, m.FeedStore)
	m.Registry.Add(s)
	s.Start(func() { m.Registry.Remove(sessionID) })
	return sessionID, opponents
}

func itoa(v int) string {
	if v == 0 {
		return "0"
	}
	buf := [20]byte{}
	i := len(buf)
	for v > 0 {
		i--
		buf[i] = byte('0' + v%10)
		v /= 10
	}
	return string(buf[i:])
}
