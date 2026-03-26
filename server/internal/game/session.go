package game

import (
	"encoding/json"
	"errors"
	"math/rand"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"chicken-soccer/server/internal/model"
	"chicken-soccer/server/internal/store"
)

type ClientInput struct {
	Type     string  `json:"type"`
	X        float64 `json:"x,omitempty"`
	Y        float64 `json:"y,omitempty"`
	FeedType string  `json:"feedType,omitempty"`
}

type Matchup struct {
	PlayerChickens   []model.Chicken `json:"playerChickens"`
	OpponentChickens []model.Chicken `json:"opponentChickens"`
	GameMode         model.GameMode  `json:"gameMode"`
}

type Session struct {
	mu          sync.Mutex
	ID          string
	PlayerID    string
	Matchup     Matchup
	Ball        BallState
	BallTouched bool
	Chickens    []ChickenState
	Feed        []FeedItem
	FeedInv     map[string]int
	FeedUsed    map[string]int
	SelectedFeed string
	LeftScore   int
	RightScore  int
	TimeLeft    float64
	Phase       string
	GoalTimer   float64
	conn        *websocket.Conn
	closed      bool
	quit        chan struct{}
	inputQueue  chan ClientInput
	lastFeedAt  time.Time
	playerStore *store.PlayerStore
	feedStore   *store.FeedStore
	rng         *rand.Rand
}

type Registry struct {
	mu       sync.Mutex
	sessions map[string]*Session
}

func NewRegistry() *Registry { return &Registry{sessions: map[string]*Session{}} }

func (r *Registry) Add(s *Session) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.sessions[s.ID] = s
}

func (r *Registry) Get(id string) (*Session, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.sessions[id]
	return s, ok
}

func (r *Registry) Remove(id string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.sessions, id)
}

func NewSession(id, playerID string, matchup Matchup, feedInv map[string]int, ps *store.PlayerStore, fs *store.FeedStore) *Session {
	left := BuildTeam("left", matchup.PlayerChickens)
	right := BuildTeam("right", matchup.OpponentChickens)
	all := append(left, right...)
	return &Session{
		ID:           id,
		PlayerID:     playerID,
		Matchup:      matchup,
		Ball:         NewBall(),
		BallTouched:  false,
		Chickens:     all,
		Feed:         []FeedItem{},
		FeedInv:      map[string]int{"slowness": feedInv["slowness"]},
		FeedUsed:     map[string]int{"slowness": 0},
		SelectedFeed: "basic",
		TimeLeft:     90,
		Phase:        "playing",
		quit:         make(chan struct{}),
		inputQueue:   make(chan ClientInput, 128),
		playerStore:  ps,
		feedStore:    fs,
		rng:          rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

func (s *Session) AttachConn(conn *websocket.Conn) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.closed {
		return errors.New("session closed")
	}
	s.conn = conn
	return nil
}

func (s *Session) Start(onDone func()) {
	go func() {
		defer onDone()
		ticker := time.NewTicker(TickInterval)
		defer ticker.Stop()
		s.send(map[string]any{"type": "match_start", "matchup": s.Matchup, "pitch": map[string]any{"worldW": WorldW, "worldH": WorldH}, "feedInventory": s.FeedInv, "ballTouched": s.BallTouched})
		for {
			select {
			case <-s.quit:
				return
			case <-ticker.C:
				s.processInputs()
				s.update(1.0 / TickRate)
				s.broadcastState()
				if s.Phase == "gameover" {
					s.finish()
					return
				}
			}
		}
	}()
}

func (s *Session) Close() {
	s.mu.Lock()
	if s.closed {
		s.mu.Unlock()
		return
	}
	s.closed = true
	if s.conn != nil {
		_ = s.conn.Close()
	}
	close(s.quit)
	s.mu.Unlock()
}

func (s *Session) PushInput(in ClientInput) {
	select {
	case s.inputQueue <- in:
	default:
	}
}

func (s *Session) processInputs() {
	for {
		select {
		case in := <-s.inputQueue:
			s.applyInput(in)
		default:
			return
		}
	}
}

func (s *Session) applyInput(in ClientInput) {
	switch in.Type {
	case "feed_select":
		if in.FeedType == "basic" || in.FeedType == "slowness" {
			s.SelectedFeed = in.FeedType
		}
	case "pause":
		if s.Phase == "playing" {
			s.Phase = "paused"
		}
	case "resume":
		if s.Phase == "paused" {
			s.Phase = "playing"
		}
	case "feed_place":
		if s.Phase != "playing" {
			return
		}
		if !s.BallTouched {
			return
		}
		count := 0
		for _, f := range s.Feed {
			if f.Player == "player" {
				count++
			}
		}
		if count >= MaxFeedPerPlayer {
			return
		}
		if time.Since(s.lastFeedAt) < FeedPlaceCooldown {
			return
		}
		s.lastFeedAt = time.Now()
		feedType := in.FeedType
		if feedType == "" {
			feedType = s.SelectedFeed
		}
		if feedType == "" {
			feedType = "basic"
		}
		if feedType == "slowness" {
			if s.FeedInv["slowness"] <= 0 {
				feedType = "basic"
			} else {
				if s.feedStore == nil {
					s.FeedInv["slowness"]--
					s.FeedUsed["slowness"]++
				} else {
					remaining, ok, err := s.feedStore.DeductCount(s.PlayerID, "slowness", 1)
					if err != nil || !ok {
						feedType = "basic"
					} else {
						s.FeedInv["slowness"] = remaining
						s.FeedUsed["slowness"]++
					}
				}
			}
		}
		s.Feed = append(s.Feed, FeedItem{X: Clamp(in.X, PitchX+2, PitchX+PitchW-2), Y: Clamp(in.Y, PitchY+2, PitchY+PitchH-2), Player: "player", Type: feedType, Timer: FeedLifetime, Radius: FeedAttractRadius})
	}
}

func (s *Session) nearestFeed(c ChickenState) *FeedItem {
	if c.Appetite > 0 {
		return nil
	}
	var chosen *FeedItem
	best := 1e9
	for i := range s.Feed {
		f := &s.Feed[i]
		d := Dist(c.X, c.Y, f.X, f.Y)
		if d < f.Radius && d < best {
			best = d
			chosen = f
		}
	}
	return chosen
}

func (s *Session) consumeFeed(target *FeedItem, chicken *ChickenState) {
	for i := range s.Feed {
		if &s.Feed[i] == target {
			if target.Type == "slowness" {
				chicken.SlowTimer = 3
				chicken.SlowMultiplier = 0.3
			}
			chicken.Appetite = 2
			s.Feed = append(s.Feed[:i], s.Feed[i+1:]...)
			return
		}
	}
}

func (s *Session) update(dt float64) {
	if s.Phase == "paused" {
		return
	}
	if s.Phase == "goal" {
		s.GoalTimer -= dt
		if s.GoalTimer <= 0 {
			s.Ball.Reset()
			s.BallTouched = false
			for i := range s.Chickens {
				s.Chickens[i].X = s.Chickens[i].HomeX
				s.Chickens[i].Y = s.Chickens[i].HomeY
				s.Chickens[i].VX = 0
				s.Chickens[i].VY = 0
				s.Chickens[i].SlowTimer = 0
				s.Chickens[i].SlowMultiplier = 1
				s.Chickens[i].Appetite = 0
			}
			s.Feed = nil
			s.Phase = "playing"
		}
		return
	}
	if s.Phase != "playing" {
		return
	}

	s.TimeLeft -= dt
	if s.TimeLeft <= 0 {
		s.TimeLeft = 0
		s.Phase = "gameover"
		return
	}

	s.Ball.Update(dt)
	for i := range s.Feed {
		s.Feed[i].Timer -= dt
	}
	nextFeed := s.Feed[:0]
	for _, f := range s.Feed {
		if f.Timer > 0 {
			nextFeed = append(nextFeed, f)
		}
	}
	s.Feed = nextFeed

	for i := range s.Chickens {
		nf := s.nearestFeed(s.Chickens[i])
		UpdateChicken(&s.Chickens[i], dt, &s.Ball, nf, s.rng)
		if nf != nil && Dist(s.Chickens[i].X, s.Chickens[i].Y, nf.X, nf.Y) < 5 {
			s.consumeFeed(nf, &s.Chickens[i])
		}
	}

	if !s.BallTouched {
		moving := (s.Ball.VX*s.Ball.VX + s.Ball.VY*s.Ball.VY) > 0.0025
		if moving {
			s.BallTouched = true
		}
	}

	if InLeftGoal(s.Ball) {
		s.RightScore++
		s.Phase = "goal"
		s.GoalTimer = 2
		s.send(map[string]any{"type": "goal", "scorer": "right", "message": "BLUE SCORES!", "scores": map[string]int{"left": s.LeftScore, "right": s.RightScore}})
	} else if InRightGoal(s.Ball) {
		s.LeftScore++
		s.Phase = "goal"
		s.GoalTimer = 2
		s.send(map[string]any{"type": "goal", "scorer": "left", "message": "RED SCORES!", "scores": map[string]int{"left": s.LeftScore, "right": s.RightScore}})
	}
}

func (s *Session) broadcastState() {
	s.send(map[string]any{
		"type":          "state",
		"ball":          s.Ball,
		"ballTouched":   s.BallTouched,
		"chickens":      s.Chickens,
		"feed":          s.Feed,
		"scores":        map[string]int{"left": s.LeftScore, "right": s.RightScore},
		"time":          s.TimeLeft,
		"phase":         s.Phase,
		"feedInventory": s.FeedInv,
	})
}

func (s *Session) finish() {
	r := CalculateReward(s.LeftScore, s.RightScore, s.rng)
	balance, _ := s.playerStore.AddBalance(s.PlayerID, r.Total)
	r.NewBalance = balance
	s.send(map[string]any{"type": "match_end", "scores": map[string]int{"left": s.LeftScore, "right": s.RightScore}, "reward": r})
	s.Close()
}

func (s *Session) send(payload map[string]any) {
	s.mu.Lock()
	conn := s.conn
	closed := s.closed
	s.mu.Unlock()
	if conn == nil || closed {
		return
	}
	_ = conn.SetWriteDeadline(time.Now().Add(2 * time.Second))
	_ = conn.WriteJSON(payload)
}

func (s *Session) ReadLoop() {
	for {
		s.mu.Lock()
		conn := s.conn
		closed := s.closed
		s.mu.Unlock()
		if conn == nil || closed {
			return
		}
		var in ClientInput
		if err := conn.ReadJSON(&in); err != nil {
			s.Close()
			return
		}
		in.Type = normalizeType(in.Type)
		if in.Type == "" {
			continue
		}
		s.PushInput(in)
	}
}

func normalizeType(t string) string {
	switch t {
	case "feed_place", "feed_select", "pause", "resume":
		return t
	default:
		return ""
	}
}

func (s *Session) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{"id": s.ID})
}
