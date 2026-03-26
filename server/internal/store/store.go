package store

import (
	"bufio"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
)

type Store struct {
	baseDir string
	mu      sync.Mutex
	locks   map[string]*sync.Mutex
}

func New(baseDir string) *Store {
	return &Store{baseDir: baseDir, locks: map[string]*sync.Mutex{}}
}

func (s *Store) BaseDir() string { return s.baseDir }

func (s *Store) ensureDir(path string) error {
	return os.MkdirAll(path, 0o755)
}

func (s *Store) playerDir(playerID string) string {
	return filepath.Join(s.baseDir, "players", playerID)
}

func (s *Store) lockForPlayer(playerID string) *sync.Mutex {
	s.mu.Lock()
	defer s.mu.Unlock()
	if m, ok := s.locks[playerID]; ok {
		return m
	}
	m := &sync.Mutex{}
	s.locks[playerID] = m
	return m
}

func readJSON(path string, out any) error {
	b, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	if len(b) == 0 {
		return errors.New("empty json file")
	}
	return json.Unmarshal(b, out)
}

func writeJSON(path string, in any) error {
	b, err := json.MarshalIndent(in, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, b, 0o644)
}

func readJSONL[T any](path string) ([]T, error) {
	f, err := os.Open(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return []T{}, nil
		}
		return nil, err
	}
	defer f.Close()

	items := []T{}
	s := bufio.NewScanner(f)
	for s.Scan() {
		line := s.Bytes()
		if len(line) == 0 {
			continue
		}
		var item T
		if err := json.Unmarshal(line, &item); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, s.Err()
}

func writeJSONL[T any](path string, items []T) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	w := bufio.NewWriter(f)
	for _, item := range items {
		b, err := json.Marshal(item)
		if err != nil {
			return err
		}
		if _, err := w.Write(append(b, '\n')); err != nil {
			return err
		}
	}
	return w.Flush()
}
