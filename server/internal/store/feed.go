package store

import "path/filepath"

type FeedStore struct {
	store *Store
}

func NewFeedStore(s *Store) *FeedStore { return &FeedStore{store: s} }

func (f *FeedStore) file(playerID string) string {
	return filepath.Join(f.store.playerDir(playerID), "feed_inventory.json")
}

func (f *FeedStore) GetInventory(playerID string) (map[string]int, error) {
	m := f.store.lockForPlayer(playerID)
	m.Lock()
	defer m.Unlock()
	inv := map[string]int{"slowness": 0}
	if err := readJSON(f.file(playerID), &inv); err != nil {
		return nil, err
	}
	if inv["slowness"] < 0 {
		inv["slowness"] = 0
	}
	return inv, nil
}

func (f *FeedStore) AddCount(playerID, feedKey string, amount int) (int, error) {
	if amount < 0 {
		amount = 0
	}
	m := f.store.lockForPlayer(playerID)
	m.Lock()
	defer m.Unlock()
	inv := map[string]int{"slowness": 0}
	if err := readJSON(f.file(playerID), &inv); err != nil {
		return 0, err
	}
	inv[feedKey] += amount
	if err := writeJSON(f.file(playerID), inv); err != nil {
		return 0, err
	}
	return inv[feedKey], nil
}

func (f *FeedStore) DeductCount(playerID, feedKey string, amount int) (int, bool, error) {
	if amount < 0 {
		amount = 0
	}
	m := f.store.lockForPlayer(playerID)
	m.Lock()
	defer m.Unlock()
	inv := map[string]int{"slowness": 0}
	if err := readJSON(f.file(playerID), &inv); err != nil {
		return 0, false, err
	}
	if inv[feedKey] < amount {
		return inv[feedKey], false, nil
	}
	inv[feedKey] -= amount
	if err := writeJSON(f.file(playerID), inv); err != nil {
		return 0, false, err
	}
	return inv[feedKey], true, nil
}
