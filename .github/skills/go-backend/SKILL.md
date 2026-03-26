---
name: go-backend
description: 'Project-specific Go backend conventions for the Chicken Soccer game server: WebSocket game engine, REST API, package layout, and testing patterns.'
origin: project
---

# Go Backend — Chicken Soccer Server

Server-authoritative game backend for the Chicken Soccer web game. Handles real-time match
simulation over WebSocket, REST APIs for shop/collection/match-finding, and player persistence.

## When to Activate

- Writing Go server code for this project
- Designing WebSocket message protocols
- Implementing game loop or physics on the server
- Creating REST API endpoints for shop, collection, or matchmaking
- Writing tests for any backend code

## Package Layout

```
server/
  cmd/
    server/
      main.go               — Entry point, wires dependencies, starts HTTP server
  internal/
    api/
      router.go             — HTTP router setup, middleware chain
      handlers_shop.go      — Shop REST handlers
      handlers_collection.go — Collection REST handlers
      handlers_match.go     — Matchmaking REST handlers
      middleware.go         — Auth, CORS, logging, rate-limit
    game/
      loop.go               — Server-authoritative game loop (tick-based)
      state.go              — Match state: ball, chickens, feed, scores, timer
      ball.go               — Ball physics (port from engine/ball.js)
      chicken.go            — Chicken AI + stats (port from engine/chicken.js)
      feed.go               — Feed placement + decay (port from engine/feed.js)
      pitch.go              — Pitch constants + goal detection (port from engine/pitch.js)
      math.go               — Vector math helpers (port from engine/utils.js)
    ws/
      hub.go                — Connection registry, room management
      conn.go               — Single WebSocket connection wrapper
      protocol.go           — Message types, encode/decode
    model/
      chicken.go            — Chicken domain type, stat definitions
      player.go             — Player profile, balance
      shop.go               — Shop listing, daily generation
      feed.go               — Feed type definitions
      gamemode.go           — Game mode definitions
    store/
      sqlite.go             — SQLite persistence layer
      migrations.go         — Schema migrations
      chicken_repo.go       — Chicken CRUD
      player_repo.go        — Player balance operations
      shop_repo.go          — Daily shop state persistence
  go.mod
  go.sum
```

### Package Responsibilities

- **cmd/server**: Only wiring — parse config, build dependencies, call `ListenAndServe`
- **internal/api**: HTTP transport layer — request parsing, response formatting, no business logic
- **internal/game**: Core simulation — pure game logic, no HTTP or WebSocket awareness
- **internal/ws**: WebSocket transport — connection lifecycle, message framing, room routing
- **internal/model**: Domain types — shared structs, enums, constants used across packages
- **internal/store**: Persistence — database operations, migrations, repository interfaces

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
| `state` | Full game state snapshot | Sent every tick (20 Hz) |
| `goal` | `{ "team": string, "scores": {...} }` | Goal scored event |
| `match_start` | `{ "matchup": {...}, "pitch": {...} }` | Match is starting |
| `match_end` | `{ "scores": {...}, "reward": {...} }` | Match finished |
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
    BallRadius  = 3
    BallFriction = 0.98
)

// From chicken.js
const (
    ChickenRadius       = 5
    ChickenBaseSpeed     = 50
    KickRange            = 8
    KickPower            = 2.5
    EatRange             = 5
    AppetiteCooldown     = 2.0
    DistractionWeight    = 0.7
    FeedLifetime         = 4.0
    FeedAttractionRadius = 30
    MaxFeedPerPlayer     = 5
)
```

## REST API Design

### Endpoints

```
POST   /api/auth/guest          — Create guest session
GET    /api/collection          — List player's chickens
GET    /api/shop                — Get today's shop listings
POST   /api/shop/buy-chicken    — Purchase a chicken listing
POST   /api/shop/buy-feed       — Purchase consumable feed
GET    /api/balance             — Get player balance
POST   /api/match/find          — Queue for matchmaking
GET    /ws/match/{matchId}      — WebSocket upgrade for match
```

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

### Request Validation

Validate at the handler boundary. Use typed request structs:

```go
type BuyChickenRequest struct {
    ListingID string `json:"listingId"`
    Name      string `json:"name"`
}

func (h *ShopHandler) BuyChicken(w http.ResponseWriter, r *http.Request) {
    var req BuyChickenRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid request body")
        return
    }

    name := strings.TrimSpace(req.Name)
    if name == "" {
        writeError(w, http.StatusBadRequest, "name is required")
        return
    }

    // ... business logic
}
```

## Concurrency Patterns

### Match Isolation

Each match runs in its own goroutine with its own state. No shared mutable state between matches:

```go
type Match struct {
    mu      sync.Mutex
    state   *GameState
    inputs  chan PlayerInput
    players [2]*PlayerConn
    done    chan struct{}
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
func TestGetShop(t *testing.T) {
    handler := NewShopHandler(mockShopService)
    req := httptest.NewRequest(http.MethodGet, "/api/shop", nil)
    w := httptest.NewRecorder()

    handler.GetShop(w, req)

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
| `mattn/go-sqlite3` | SQLite driver |
| Standard library | Everything else |

Avoid frameworks. Use `http.ServeMux` (Go 1.22+ with method patterns) or a minimal router.

## Frontend Integration

When the Go backend is added:

1. **REST calls**: Replace `localStorage` reads in `src/data/` with `fetch()` calls to REST endpoints
2. **WebSocket**: Replace `useGameLoop` local simulation with WebSocket client that receives state
3. **Canvas rendering**: Keep all rendering client-side — server sends state, client draws it
4. **Hybrid mode**: Support offline/local play as fallback when server is unavailable

### State Shape for WebSocket Broadcast

The server broadcasts a snapshot matching what the client needs to render:

```go
type StateSnapshot struct {
    Ball     BallState     `json:"ball"`
    Chickens []ChickenState `json:"chickens"`
    Feed     []FeedState    `json:"feed"`
    Scores   Scores         `json:"scores"`
    Time     float64        `json:"time"`
    Phase    string         `json:"phase"`
}
```

## Best Practices

- Keep `internal/game/` free of I/O — pure computation only
- Use interfaces for storage so tests can use in-memory implementations
- Validate all client input server-side (feed placement bounds, rate limits)
- Use `context.Context` for cancellation propagation
- Log structured output with `slog` (Go 1.21+)
- Run `go vet`, `staticcheck`, and `go test -race` in CI
- Port physics constants from JS as exact values to ensure parity
