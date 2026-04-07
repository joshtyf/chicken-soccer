package store

import (
	"errors"
	"math/rand"
	"path/filepath"
	"time"

	"chicken-soccer/server/internal/model"
)

type ChickenStore struct {
	store *Store
}

func NewChickenStore(s *Store) *ChickenStore { return &ChickenStore{store: s} }

func (c *ChickenStore) file(playerID string) string {
	return filepath.Join(c.store.playerDir(playerID), "chickens.jsonl")
}

func (c *ChickenStore) GetAll(playerID string) ([]model.Chicken, error) {
	m := c.store.lockForPlayer(playerID)
	m.Lock()
	defer m.Unlock()
	items, err := readJSONL[model.Chicken](c.file(playerID))
	if err != nil {
		return nil, err
	}

	changed := false
	for i := range items {
		if items[i].Appearance.BodyColor == "" {
			items[i].Appearance = model.DefaultAppearance(items[i].ID)
			changed = true
		}
	}

	if changed {
		if err := writeJSONL(c.file(playerID), items); err != nil {
			return nil, err
		}
	}

	return items, nil
}

func (c *ChickenStore) GetByID(playerID, chickenID string) (*model.Chicken, error) {
	items, err := c.GetAll(playerID)
	if err != nil {
		return nil, err
	}
	for _, item := range items {
		if item.ID == chickenID {
			cp := item
			return &cp, nil
		}
	}
	return nil, errors.New("chicken not found")
}

func (c *ChickenStore) Add(playerID string, chicken model.Chicken) error {
	m := c.store.lockForPlayer(playerID)
	m.Lock()
	defer m.Unlock()
	items, err := readJSONL[model.Chicken](c.file(playerID))
	if err != nil {
		return err
	}
	items = append(items, chicken)
	return writeJSONL(c.file(playerID), items)
}

func (c *ChickenStore) Remove(playerID, chickenID string) (bool, error) {
	m := c.store.lockForPlayer(playerID)
	m.Lock()
	defer m.Unlock()
	items, err := readJSONL[model.Chicken](c.file(playerID))
	if err != nil {
		return false, err
	}
	next := make([]model.Chicken, 0, len(items))
	removed := false
	for _, item := range items {
		if item.ID == chickenID {
			removed = true
			continue
		}
		next = append(next, item)
	}
	if !removed {
		return false, nil
	}
	return true, writeJSONL(c.file(playerID), next)
}

func (c *ChickenStore) Init(playerID string) ([]model.Chicken, error) {
	m := c.store.lockForPlayer(playerID)
	m.Lock()
	defer m.Unlock()
	items, err := readJSONL[model.Chicken](c.file(playerID))
	if err != nil {
		return nil, err
	}
	if len(items) > 0 {
		changed := false
		for i := range items {
			if items[i].Appearance.BodyColor == "" {
				items[i].Appearance = model.DefaultAppearance(items[i].ID)
				changed = true
			}
		}
		if changed {
			if err := writeJSONL(c.file(playerID), items); err != nil {
				return nil, err
			}
		}
		return items, nil
	}
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	starter := model.GenerateStarterChicken("c_"+randID(""), rng)
	items = []model.Chicken{starter}
	if err := writeJSONL(c.file(playerID), items); err != nil {
		return nil, err
	}
	return items, nil
}
