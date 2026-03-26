---
name: go-backend
description: 'Project-specific Go backend conventions for the Chicken Soccer game server: WebSocket game engine, REST API, package layout, and testing patterns.'
origin: project
---

# Go Backend — Chicken Soccer Server

Server-authoritative game backend for the Chicken Soccer web game. Handles real-time match
simulation over WebSocket, opponent generation, and reward calculation. Player data (balance,
collection, feed inventory) stays in the frontend `localStorage` — the server receives this
data from the client at match creation and trusts it. Shop logic is fully client-side.

## When to Activate

- Writing Go server code for this project
- Designing WebSocket message protocols
- Implementing game loop or physics on the server
- Creating the match creation REST endpoint
- Writing tests for any backend code

## Package Layout

```
server/
  cmd/
    server/
      main.go               — Entry point, wires dependencies, starts HTTP server
  internal/
    api/
      router.go             — HTTP router setup, CORS middleware
      match.go              — POST /api/match/create handler
    game/
      loop.go               — Server-authoritative game loop (20 Hz tick)
      session.go            — Game session lifecycle (creation → playing → gameover → cleanup)
      ball.go               — Ball physics (port from engine/ball.js)
      chicken.go            — Chicken AI + stats (port from engine/chicken.js)
      feed.go               — Feed placement + decay (port from engine/feed.js)
      pitch.go              — Pitch constants + goal detection (port from engine/pitch.js)
      math.go               — Vector math helpers (port from engine/utils.js)
      reward.go             — Match reward calculation (port from data/rewardLogic.js)
    match/
      matchmaker.go         — Opponent generation + session creation
    ws/
      handler.go            — WS upgrade, session lookup, disconnect = cancel game
      protocol.go           — Message types, encode/decode
    model/
      chicken.go            — Chicken domain type, stat definitions, stat resolution
      feed.go               — Feed type definitions, effects
      gamemode.go           — Game mode definitions
  go.mod
  go.sum
```

### Package Responsibilities

- **cmd/server**: Only wiring — parse config, build dependencies, call `ListenAndServe`
- **internal/api**: HTTP transport layer — request parsing, response formatting, CORS, no business logic
- **internal/game**: Core simulation — pure game logic, no HTTP or WebSocket awareness. Session owns full lifecycle
- **internal/match**: Opponent generation and session creation
- **internal/ws**: WebSocket transport — connection lifecycle, message framing. Disconnect cancels game
- **internal/model**: Domain types — shared structs, enums, constants used across packages

## WebSocket Protocol

### Message Format

Use JSON with a `type` field for routing:

```go
type Message struct {
    Type    string          `json:"type"`
    Payload json.RawMessage `json:"payload,omitempty"`
}
```

### Client → Server Messages

| Type | Payload | Description |
|------|---------|-------------|
| `place_feed` | `{ "x": float, "y": float, "feedType": string }` | Player places feed on pitch |
| `select_feed` | `{ "feedType": string }` | Player switches active feed type |
| `pause` | — | Player requests pause |
| `resume` | — | Player requests resume |

### Server → Client Messages

| Type | Payload | Description |
|------|---------|-------------|
| `match_start` | `{ "matchup": {...}, "pitch": {...} }` | Match is starting |
| `state` | Full game state snapshot + feedInventory | Sent every tick (20 Hz) |
| `goal` | `{ "team": string, "scores": {...}, "message": string }` | Goal scored event |
| `match_end` | `{ "scores": {...}, "reward": {...}, "feedUsed": {...} }` | Match finished, reward calculated server-side |
| `error` | `{ "message": string }` | Server-side error |

### Tick Rate

- Server ticks at **20 Hz** (50 ms per tick)
- Each tick: process input queue → update simulation → broadcast state
- Client interpolates between received states for smooth rendering

```go
const TickRate = 20
const TickInterval = time.Second / TickRate

func (m *Match) Run(ctx context.Context) {
    ticker := time.NewTicker(TickInterval)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            m.processInputs()
            m.update(TickInterval)
            m.broadcast()
        }
    }
}
```

## Game Loop Port Strategy

The JS engine in `src/engine/` maps to Go server code:

| JS Source | Go Target | Notes |
|-----------|-----------|-------|
| `engine/pitch.js` | `internal/game/pitch.go` | Constants only, direct port |
| `engine/utils.js` | `internal/game/math.go` | Pure math, direct port |
| `engine/ball.js` | `internal/game/ball.go` | Physics runs server-side |
| `engine/chicken.js` | `internal/game/chicken.go` | AI + stats, server-authoritative |
| `engine/feed.js` | `internal/game/feed.go` | Placement/decay server-side, input from client |
| `data/statDefs.js` | `internal/model/chicken.go` | Stat conversion logic |
| `data/chickenModel.js` | `internal/model/chicken.go` | Chicken creation, stat resolution |
| `data/feedDefs.js` | `internal/model/feed.go` | Feed type definitions |
| `data/gameModeDefs.js` | `internal/model/gamemode.go` | Game mode constants |

### Physics Constants

Port these values directly from the JS engine:

```go
// From pitch.js
const (
    WorldW  = 320
    WorldH  = 180
    PitchX  = 20
    PitchY  = 20
    PitchW  = 280
    PitchH  = 140
    GoalW   = 6
    GoalH   = 40
)

// From ball.js
const (
    BallRadius       = 3
    BallFriction     = 0.98
    BallBounceElast  = 0.7
)

// From chicken.js
const (
    ChickenRadius       = 5
    KickRange            = 8
    KickPower            = 2.5
    EatRange             = 5
    AppetiteCooldown     = 2.0
    DistractionWeight    = 0.7
    WallMargin           = 20
    WallOffset           = 12
)

// From feed.js
const (
    FeedLifetime         = 4.0
    FeedAttractionRadius = 30
    MaxFeedPerPlayer     = 5
)
```

### Stat Resolution

Chicken speed is stored as a UI value (0–100) and converted to a game value (30–80).
Port this from `statDefs.js`:

```go
const (
    SpeedMinGameValue = 30.0
    SpeedMaxGameValue = 80.0
)

func ResolveGameSpeed(uiValue float64) float64 {
    clamped := clamp(uiValue, 0, 100)
    normalized := clamped / 100.0
    return SpeedMinGameValue + (SpeedMaxGameValue-SpeedMinGameValue)*normalized
}
```

The `ChickenBaseSpeed = 50` constant in the JS source is a default — actual speed comes from
`resolveStatsForGame()` applied to each chicken's stats. Always use `ResolveGameSpeed()` on
the chicken's stat value, never hardcode 50.

## REST API Design

### Endpoints

Only one REST endpoint for now. All other interactions happen via WebSocket:

```
POST   /api/match/create       — Create match session, returns opponents + session ID
GET    /ws/game/{sessionId}    — WebSocket upgrade for match
```

### Match Creation

```go
type CreateMatchRequest struct {
    PlayerChickens []ChickenData     `json:"playerChickens"`
    GameMode       GameModeData      `json:"gameMode"`
    FeedInventory  map[string]int    `json:"feedInventory"`
}

type CreateMatchResponse struct {
    SessionID        string        `json:"sessionId"`
    OpponentChickens []ChickenData `json:"opponentChickens"`
}
```

The server:
1. Validates the request (team size matches game mode, stats are in range)
2. Generates random opponents with `generateRandomOpponents()`
3. Creates a game session holding player chickens, opponents, and feed inventory
4. Returns session ID + opponent data for client display

### Response Format

```go
type APIResponse struct {
    Data  interface{} `json:"data,omitempty"`
    Error string      `json:"error,omitempty"`
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(APIResponse{Data: data})
}

func writeError(w http.ResponseWriter, status int, msg string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(APIResponse{Error: msg})
}
```

### Feed Inventory Tracking

The client sends its feed inventory at match creation. The server:
1. Stores it in the game session
2. Validates feed placements against remaining inventory
3. Decrements inventory on successful placement
4. Reports total feed used in `match_end` message

```go
type FeedInventory map[string]int

func (inv FeedInventory) CanUse(feedType string) bool {
    // "basic" feed is unlimited
    if feedType == "basic" {
        return true
    }
    return inv[feedType] > 0
}

func (inv FeedInventory) Use(feedType string) bool {
    if feedType == "basic" {
        return true
    }
    if inv[feedType] <= 0 {
        return false
    }
    inv[feedType]--
    return true
}
```

### WebSocket Disconnect Handling

When a WebSocket connection drops:
1. The game session is cancelled immediately
2. The session goroutine exits via context cancellation
3. No reconnection is supported — the client returns to the dashboard

## Concurrency Patterns

### Match Isolation

Each match runs in its own goroutine with its own state. No shared mutable state between matches:

```go
type Session struct {
    mu             sync.Mutex
    id             string
    ball           *Ball
    chickens       []*Chicken
    feedManager    *FeedManager
    scores         Scores
    gameTime       float64
    phase          string          // "playing" | "goal" | "gameover"
    goalTimer      float64
    feedInventory  FeedInventory
    inputs         chan PlayerInput
    conn           *websocket.Conn
    cancel         context.CancelFunc
}
```

### Input Queue

Buffer player inputs and process them once per tick:

```go
func (m *Match) processInputs() {
    for {
        select {
        case input := <-m.inputs:
            m.applyInput(input)
        default:
            return
        }
    }
}
```

### Graceful Shutdown

Use context cancellation to stop matches and close connections:

```go
func (s *Server) Shutdown(ctx context.Context) error {
    s.hub.CloseAll()
    return s.httpServer.Shutdown(ctx)
}
```

## Testing Strategy

### Game Logic Tests

Test the pure simulation in `internal/game/` independently from transport:

```go
func TestBallBouncesOffWall(t *testing.T) {
    ball := NewBall()
    ball.VX = -5.0
    ball.Y = PitchY + PitchH/2 // Not in goal opening

    ball.Update(1.0 / 20) // One tick

    if ball.VX <= 0 {
        t.Error("ball should bounce off left wall")
    }
}
```

### WebSocket Integration Tests

Use `httptest` + `gorilla/websocket` dialer:

```go
func TestMatchWebSocket(t *testing.T) {
    srv := httptest.NewServer(setupRouter())
    defer srv.Close()

    wsURL := "ws" + strings.TrimPrefix(srv.URL, "http") + "/ws/match/test-id"
    conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
    if err != nil {
        t.Fatalf("dial failed: %v", err)
    }
    defer conn.Close()

    // Read initial match_start message
    var msg Message
    err = conn.ReadJSON(&msg)
    if err != nil {
        t.Fatalf("read failed: %v", err)
    }
    if msg.Type != "match_start" {
        t.Errorf("got type %q; want match_start", msg.Type)
    }
}
```

### Handler Tests

Use `httptest.NewRequest` + `httptest.NewRecorder`:

```go
func TestCreateMatch(t *testing.T) {
    handler := NewMatchHandler(matchmaker)
    body := `{"playerChickens":[{"stats":{"speed":50}}],"gameMode":{"id":"solo","chickensPerTeam":1},"feedInventory":{"slowness":3}}`
    req := httptest.NewRequest(http.MethodPost, "/api/match/create", strings.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()

    handler.CreateMatch(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("got status %d; want 200", w.Code)
    }
}
```

## Dependencies

Minimal dependency footprint:

| Package | Purpose |
|---------|---------|
| `net/http` | HTTP server (stdlib) |
| `gorilla/websocket` | WebSocket connections |
| Standard library | Everything else |

Avoid frameworks. Use `http.ServeMux` (Go 1.22+ with method patterns).

## Frontend Integration

The Go backend handles match simulation only. Player data stays client-side:

1. **Match creation**: Client calls `POST /api/match/create` with player chickens, game mode, and feed inventory
2. **WebSocket**: `useGameLoop` connects to `ws://host/ws/game/{sessionId}`, receives state, renders via canvas
3. **Canvas rendering**: All rendering stays client-side — server sends state snapshots, client draws
4. **Feed placement**: Client sends `feed_place` messages; server validates and processes
5. **Rewards**: Server calculates and sends in `match_end` message; client credits to localStorage
6. **Feed inventory**: Server tracks usage during match, reports in `match_end`; client deducts from localStorage after
7. **Shop**: Fully client-side, no server involvement
8. **No offline mode**: Game requires server connection. WS disconnect cancels the match

### State Shape for WebSocket Broadcast

The server broadcasts a snapshot matching what the client needs to render:

```go
type StateSnapshot struct {
    Ball          BallState      `json:"ball"`
    Chickens      []ChickenState `json:"chickens"`
    Feed          []FeedState    `json:"feed"`
    Scores        Scores         `json:"scores"`
    Time          float64        `json:"time"`
    Phase         string         `json:"phase"`
    FeedInventory map[string]int `json:"feedInventory"`
}
```

## Best Practices

- Keep `internal/game/` free of I/O — pure computation only
- Validate all client input server-side (feed placement bounds, inventory checks, rate limits)
- Use `context.Context` for cancellation propagation (WS disconnect → cancel session)
- Log structured output with `slog` (Go 1.21+)
- Session owns full lifecycle: creation → playing → goal pause → gameover → cleanup
- No database for now — all player data from client. Architecture supports future DB migration
- Run `go vet`, `staticcheck`, and `go test -race` in CI
- Port physics constants from JS as exact values to ensure parity
