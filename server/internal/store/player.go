package store

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type playerProfile struct {
	Balance int `json:"balance"`
}

type tokenIndex struct {
	Tokens map[string]string `json:"tokens"`
}

type PlayerStore struct {
	store     *Store
	tokenLock sync.Mutex
}

func NewPlayerStore(s *Store) *PlayerStore {
	return &PlayerStore{store: s}
}

func randID(prefix string) string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return prefix + hex.EncodeToString(b)
}

func (p *PlayerStore) tokenFile() string {
	return filepath.Join(p.store.BaseDir(), "tokens.json")
}

func (p *PlayerStore) loadTokens() (tokenIndex, error) {
	idx := tokenIndex{Tokens: map[string]string{}}
	err := readJSON(p.tokenFile(), &idx)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return idx, nil
		}
		return idx, err
	}
	if idx.Tokens == nil {
		idx.Tokens = map[string]string{}
	}
	return idx, nil
}

func (p *PlayerStore) CreatePlayer() (string, string, error) {
	playerID := randID("p_")
	token := randID("t_")
	dir := p.store.playerDir(playerID)
	if err := p.store.ensureDir(filepath.Join(dir, "shop")); err != nil {
		return "", "", err
	}

	if err := writeJSON(filepath.Join(dir, "profile.json"), playerProfile{Balance: 500}); err != nil {
		return "", "", err
	}
	if err := os.WriteFile(filepath.Join(dir, "chickens.jsonl"), []byte{}, 0o644); err != nil {
		return "", "", err
	}
	if err := writeJSON(filepath.Join(dir, "feed_inventory.json"), map[string]int{"slowness": 0}); err != nil {
		return "", "", err
	}
	_ = os.WriteFile(filepath.Join(dir, "created_at.txt"), []byte(time.Now().UTC().Format(time.RFC3339)), 0o644)

	p.tokenLock.Lock()
	defer p.tokenLock.Unlock()
	idx, err := p.loadTokens()
	if err != nil {
		return "", "", err
	}
	idx.Tokens[token] = playerID
	if err := writeJSON(p.tokenFile(), idx); err != nil {
		return "", "", err
	}
	return playerID, token, nil
}

func (p *PlayerStore) GetPlayerByToken(token string) (string, error) {
	p.tokenLock.Lock()
	defer p.tokenLock.Unlock()
	idx, err := p.loadTokens()
	if err != nil {
		return "", err
	}
	playerID, ok := idx.Tokens[token]
	if !ok {
		return "", errors.New("token not found")
	}
	return playerID, nil
}

func (p *PlayerStore) profilePath(playerID string) string {
	return filepath.Join(p.store.playerDir(playerID), "profile.json")
}

func (p *PlayerStore) GetBalance(playerID string) (int, error) {
	m := p.store.lockForPlayer(playerID)
	m.Lock()
	defer m.Unlock()
	var prof playerProfile
	if err := readJSON(p.profilePath(playerID), &prof); err != nil {
		return 0, err
	}
	if prof.Balance < 0 {
		prof.Balance = 0
	}
	return prof.Balance, nil
}

func (p *PlayerStore) AddBalance(playerID string, amount int) (int, error) {
	if amount < 0 {
		amount = 0
	}
	m := p.store.lockForPlayer(playerID)
	m.Lock()
	defer m.Unlock()
	var prof playerProfile
	if err := readJSON(p.profilePath(playerID), &prof); err != nil {
		return 0, err
	}
	prof.Balance += amount
	if err := writeJSON(p.profilePath(playerID), prof); err != nil {
		return 0, err
	}
	return prof.Balance, nil
}

func (p *PlayerStore) DeductBalance(playerID string, amount int) (int, bool, error) {
	if amount < 0 {
		amount = 0
	}
	m := p.store.lockForPlayer(playerID)
	m.Lock()
	defer m.Unlock()
	var prof playerProfile
	if err := readJSON(p.profilePath(playerID), &prof); err != nil {
		return 0, false, err
	}
	if prof.Balance < amount {
		return prof.Balance, false, nil
	}
	prof.Balance -= amount
	if err := writeJSON(p.profilePath(playerID), prof); err != nil {
		return 0, false, err
	}
	return prof.Balance, true, nil
}
