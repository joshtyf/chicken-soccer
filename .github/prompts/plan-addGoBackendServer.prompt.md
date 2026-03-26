# Plan: Add Go Backend Server with WebSocket Game Engine

## TL;DR
Refactor the chicken-soccer monorepo to add a Go backend server that owns match-finding, authoritative game simulation, and reward calculation. The frontend moves to `web/` and becomes a thin WebSocket client that sends player inputs and renders server-streamed game state. Player data (balance, collection, feed inventory) stays in `localStorage`. Shop logic stays fully client-side.

## Decisions
- **Server-authoritative**: Server runs the full game loop (physics, AI, goals); client renders state
- **Monorepo**: `server/` and `web/` side by side
- **Go framework**: Standard library `net/http` (Go 1.22+ `ServeMux` with method patterns) + `gorilla/websocket`
- **Go version**: Minimum Go 1.22
- **Player data**: Stays client-side in `localStorage` (no DB yet). Client sends chicken stats, feed inventory, and game mode to the server at match creation. Server trusts the data
- **Shop**: Stays fully client-side. No shop API. The existing `shopLogic.js` + `useShop.js` remain unchanged
- **Rewards**: Calculated server-side. Server sends reward data in the `match_end` WebSocket message. Client credits the reward to `localStorage` balance
- **Feed inventory**: Client sends available inventory at match creation. Server tracks usage during the match. Server reports feed used in `match_end` message. Client deducts from `localStorage` after match
- **WebSocket disconnect**: Game is cancelled immediately. No reconnection. Client returns to dashboard
- **No countdown**: Match starts immediately after WebSocket connection
- **Always online**: Game requires server connection. No offline/local fallback
- **Tick rate**: Server ticks at 20 Hz (50 ms per tick). Each tick: process inputs → update simulation → broadcast state. Client interpolates between received states for smooth rendering
- **Shared definitions**: `statDefs`, `feedDefs`, `gameModeDefs` exist on both client (JS) and server (Go) — keep in sync manually for now

## Target Folder Structure
```
chicken-soccer/
├── web/                          # Frontend (moved from root)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/           # All existing components
│       ├── data/                 # Unchanged: chickenDB, playerDB, feedInventoryDB, shopLogic, statDefs, feedDefs, gameModeDefs
│       ├── engine/               # Rendering only (draw functions, no physics/AI update)
│       ├── hooks/                # useGameLoop becomes WS render-only, useShop unchanged
│       └── services/             # NEW: wsClient.js, matchApi.js
│
├── server/                       # Go backend
│   ├── go.mod
│   ├── go.sum
│   ├── Makefile
│   ├── cmd/
│   │   └── server/
│   │       └── main.go           # Entry point, HTTP + WS server
│   └── internal/
│       ├── api/                  # HTTP route handlers
│       │   ├── router.go         # Route registration + CORS middleware
│       │   └── match.go          # POST /api/match/create
│       ├── game/                 # Game engine (ported from JS)
│       │   ├── ball.go           # Ball physics
│       │   ├── chicken.go        # Chicken AI + movement
│       │   ├── feed.go           # Feed manager
│       │   ├── pitch.go          # Pitch constants + goal detection
│       │   ├── math.go           # Vector math, collision
│       │   ├── session.go        # Game session lifecycle (creation → playing → gameover → cleanup)
│       │   ├── loop.go           # Fixed-tick game loop (20 Hz)
│       │   └── reward.go         # Match reward calculation
│       ├── match/                # Match finding
│       │   └── matchmaker.go     # Opponent generation + session creation
│       ├── model/                # Shared domain types
│       │   ├── chicken.go        # Chicken struct, stat defs, stat resolution
│       │   ├── feed.go           # Feed types, effects
│       │   └── gamemode.go       # Game mode definitions
│       └── ws/                   # WebSocket layer
│           ├── handler.go        # WS upgrade + connection management
│           └── protocol.go       # Message types (client→server, server→client)
│
├── Makefile                      # Root: `make dev` runs both server and web
├── .github/
│   ├── copilot-instructions.md   # Updated with new architecture
│   └── skills/                   # Already created
│       ├── golang-patterns/
│       ├── golang-testing/
│       ├── go-backend/
│       ├── game-engine/
│       ├── frontend-patterns/
│       └── premium-frontend-ui/
│
├── README.md                     # Updated
└── .gitignore                    # Updated for Go
```

## WebSocket Protocol

### Connection Flow
1. Client selects chickens, game mode on `PreMatchScreen`
2. Client calls `POST /api/match/create` with `{ playerChickens, gameMode, feedInventory }`
3. Server generates opponents, creates session → returns `{ sessionId, opponentChickens }`
4. Client connects `ws://{host}/ws/game/{sessionId}`
5. Server sends `match_start` message, then starts game loop and streams state at 20 Hz
6. On WS disconnect: server cancels game session, client returns to dashboard

### Client → Server Messages
```json
{ "type": "feed_place", "x": 150.5, "y": 90.2, "feedType": "basic" }
{ "type": "feed_select", "feedType": "slowness" }
{ "type": "pause" }
{ "type": "resume" }
```

### Server → Client Messages
```json
{ "type": "match_start", "matchup": {...}, "pitch": {...} }
{ "type": "state", "ball": {...}, "chickens": [...], "feed": [...], "scores": {...}, "time": 45.2, "phase": "playing", "feedInventory": { "slowness": 3 } }
{ "type": "goal", "scorer": "left", "message": "RED SCORES!", "scores": {...} }
{ "type": "match_end", "scores": {...}, "reward": { "didWin": true, "winBonus": 30, "goalBonus": 15, "total": 45 }, "feedUsed": { "slowness": 2 } }
{ "type": "error", "message": "session not found" }
```

### Server-Side Validation
- Feed placement: enforce `MAX_FEED = 5` per player, clamp coordinates to pitch bounds
- Feed type: check player has inventory remaining for limited feed types
- Rate limit: max 1 feed placement per 200 ms to prevent spam

## Steps

### Phase 1: Project Restructure (no dependencies)
1. Move frontend files into `web/` directory: `src/`, `index.html`, `package.json`, `vite.config.js`
2. Update `web/vite.config.js` if needed (add dev server proxy for `/api` and `/ws` to Go server)
3. Update `web/package.json` scripts
4. Verify `cd web && npm install && npm run dev` still works
5. Initialize Go module: `server/go.mod` with `go mod init chicken-soccer/server`
6. Add `gorilla/websocket` dependency
7. Create `server/Makefile` with `run`, `build`, `test` targets
8. Create root `Makefile` with `make dev` target that runs both server and web concurrently
9. Update `.github/copilot-instructions.md` with new monorepo structure and server architecture
10. Update root `README.md`
11. Update root `.gitignore` for Go binaries (`server/bin/`, `*.exe`)

### Phase 2: Go Backend — Domain Models & Entry Point (*depends on Phase 1*)
12. Implement `server/internal/model/chicken.go` — Chicken struct, stat defs (port `statDefs.js`), stat sanitization, `resolveStatsForGame()` (0–100 → 30–80 speed mapping)
13. Implement `server/internal/model/feed.go` — Feed type definitions (port `feedDefs.js`), effects
14. Implement `server/internal/model/gamemode.go` — Game mode definitions (port `gameModeDefs.js`)
15. Implement `server/internal/api/router.go` — HTTP router with CORS middleware (allow `web/` dev server origin)
16. Implement `server/cmd/server/main.go` — server entry point, graceful shutdown
17. **Verification**: `cd server && go build ./...` compiles

### Phase 3: Go Backend — Game Engine (*depends on Phase 2 for model types*)
18. Port `engine/utils.js` → `server/internal/game/math.go` (dist, normalize, angleBetween, lerpAngle, clamp, circleCollision, randomRange)
19. Port `engine/pitch.js` → `server/internal/game/pitch.go` (world constants, pitch bounds, goal areas, goal detection — no draw functions)
20. Port `engine/ball.js` → `server/internal/game/ball.go` (physics: velocity, friction 0.98, wall bounce 0.7 elasticity, kick — no draw functions)
21. Port `engine/chicken.js` → `server/internal/game/chicken.go` (AI states: chase/distracted/celebrate/idle, territory bounds, stat-driven speed, feed consumption with cooldown, kick mechanics, wall avoidance — no draw functions)
22. Port `engine/feed.js` → `server/internal/game/feed.go` (placement with MAX_FEED=5 check, decay at FEED_LIFETIME=4s, attraction radius=30, feed type effects on consumption — no draw functions)
23. Implement `server/internal/game/reward.go` — port `rewardLogic.js` (win bonus 0–50 random, goal bonus 5× goals, total)
24. **Verification**: `cd server && go test ./internal/game/...` — unit tests for ball physics, goal detection, chicken AI tick, reward calculation

### Phase 4: Go Backend — Match Finding & Game Sessions (*depends on Phase 3*)
25. Implement `server/internal/match/matchmaker.go` — opponent generation (port `generateRandomOpponent()`/`generateRandomOpponents()`), match session creation that accepts player chickens + game mode + feed inventory from client
26. Implement `server/internal/game/session.go` — GameSession struct: owns ball, chickens, feedManager, scores, time, phase, player feed inventory. Lifecycle: creation → playing → goal (2s pause) → playing → gameover → cleanup. Session destroyed on WS disconnect
27. Implement `server/internal/game/loop.go` — fixed 20 Hz tick loop: `processInputs()` → `update()` → `broadcast()`. Game duration 90 seconds
28. Implement `server/internal/ws/protocol.go` — JSON message types for client↔server (match_start, state, goal, match_end, error, feed_place, feed_select, pause, resume)
29. Implement `server/internal/ws/handler.go` — WebSocket upgrade handler, session lookup by ID, input dispatch to session, state broadcast, disconnect = cancel game
30. Implement `server/internal/api/match.go` — `POST /api/match/create` accepts `{ playerChickens, gameMode, feedInventory }`, generates opponents, creates session, returns `{ sessionId, opponentChickens }`
31. Wire routes in router: `POST /api/match/create`, `GET /ws/game/{sessionId}`
32. **Verification**: `cd server && go test ./...` — all tests pass. Manual test with wscat: connect, verify state streaming, send feed_place, verify game-over + reward

### Phase 5: Frontend Refactor (*depends on Phase 4; parallel within phase*)
33. Add environment config: `VITE_API_URL` for server base URL (defaults to `http://localhost:8080`)
34. Create `web/src/services/matchApi.js` — `createMatch({ playerChickens, gameMode, feedInventory })` calls `POST /api/match/create`, returns `{ sessionId, opponentChickens }`
35. Create `web/src/services/wsClient.js` — WebSocket wrapper: `connect(sessionId)`, `send(msg)`, `onMessage(callback)`, `close()`. On disconnect: invoke cancel callback
36. Refactor `PreMatchScreen.jsx` — on "Start Match", call `matchApi.createMatch()` instead of `generateRandomOpponents()` locally. Pass server-returned `sessionId` + `opponentChickens` into matchup
37. Refactor `useGameLoop.js` — major rewrite:
    - Remove local physics loop (no Ball, Chicken, FeedManager instantiation)
    - Connect to WebSocket via `wsClient` on mount
    - Receive `state` messages → update render state (ball pos, chicken pos/state, feed, scores, time, phase, feedInventory)
    - Keep canvas rendering: `draw()` functions from `engine/` files still work (they take position data)
    - Send `feed_place` messages on click instead of local feed queue
    - Send `feed_select`, `pause`, `resume` messages
    - Phase/score/time driven by server messages, not local timers
    - On `goal` message: trigger goal overlay from server data
    - On `match_end` message: receive reward from server, call `onMatchEnd` with reward included
    - On WS disconnect: call `onQuit` to return to dashboard
    - Implement client-side interpolation between server state snapshots for smooth rendering
38. Refactor `engine/ball.js` — keep `draw()` method and constructor for render state, remove `update()` physics
39. Refactor `engine/chicken.js` — keep `draw()` method and constructor for render state, remove `update()` AI logic. Accept server-provided state (position, animation state, team, debuffs)
40. Refactor `engine/feed.js` — keep `draw()` method, remove `update()` lifecycle. Accept server-provided feed items
41. Refactor `App.jsx`:
    - Pass `sessionId` through to `GameCanvas` alongside matchup
    - `handleMatchEnd` receives reward from server (no more `calculateMatchReward()` call)
    - Remove `import { calculateMatchReward }` from `rewardLogic`
    - Deduct feed used from `feedInventoryDB` based on `match_end.feedUsed`
    - Credit reward to `playerDB` balance
42. Add `ModeSelectScreen.jsx` to match flow: ensure game mode is passed through to API call
43. **Verification**: `cd web && npm run dev` + `cd server && make run` — play a full match end-to-end

### Phase 6: Cleanup & Documentation (*depends on Phase 5*)
44. Delete `web/src/data/rewardLogic.js` (replaced by server)
45. Remove `generateRandomOpponent()` and `generateRandomOpponents()` from `web/src/data/chickenModel.js` (opponent generation now server-side). Keep `createChicken()`, `normalizeChickenRecord()`, `generateStarterChicken()`, `resolveGameStats()`
46. Update `.github/copilot-instructions.md` architecture section with final structure
47. Update `.github/skills/go-backend/SKILL.md` to align with implemented architecture (remove shop API, store package, SQLite references; add reward, feed inventory tracking)
48. Update root `README.md` with monorepo dev instructions
49. Add `server/README.md` with Go-specific instructions

## Relevant Files

### Frontend files to move
- `src/` → `web/src/`
- `index.html` → `web/index.html`
- `package.json` → `web/package.json`
- `vite.config.js` → `web/vite.config.js`

### Frontend files to create
- `web/src/services/matchApi.js` — HTTP client for match creation
- `web/src/services/wsClient.js` — WebSocket client wrapper

### Frontend files to modify
- `web/src/hooks/useGameLoop.js` — major rewrite: WS render-only client
- `web/src/components/PreMatchScreen.jsx` — use API for opponent generation
- `web/src/components/GameCanvas.jsx` — pass WS session ID
- `web/src/App.jsx` — wire match creation through API, receive server reward
- `web/src/engine/ball.js` — keep `draw()`, remove `update()` physics
- `web/src/engine/chicken.js` — keep `draw()`, remove `update()` AI
- `web/src/engine/feed.js` — keep `draw()`, remove `update()` lifecycle
- `web/src/data/chickenModel.js` — remove `generateRandomOpponent()`, `generateRandomOpponents()`
- `web/vite.config.js` — add dev server proxy for `/api` and `/ws`

### Frontend files to delete
- `web/src/data/rewardLogic.js` — replaced by server-side reward

### Frontend files unchanged
- `web/src/data/chickenDB.js` — stays (localStorage)
- `web/src/data/playerDB.js` — stays (localStorage)
- `web/src/data/feedInventoryDB.js` — stays (localStorage)
- `web/src/data/statDefs.js` — stays (client needs for display)
- `web/src/data/feedDefs.js` — stays (client needs for display)
- `web/src/data/gameModeDefs.js` — stays (client needs for UI)
- `web/src/data/shopLogic.js` — stays (fully client-side)
- `web/src/hooks/useShop.js` — stays (fully client-side)
- `web/src/components/DashboardScreen.jsx` — unchanged
- `web/src/components/StoreScreen.jsx` — unchanged
- `web/src/components/ModeSelectScreen.jsx` — unchanged (passes mode to PreMatch)
- `web/src/components/GameOverScreen.jsx` — unchanged (receives reward from props)
- `web/src/components/GameHUD.jsx` — unchanged
- `web/src/components/GoalOverlay.jsx` — unchanged
- `web/src/components/PauseOverlay.jsx` — unchanged
- `web/src/components/NamingModal.jsx` — unchanged
- `web/src/components/ChickenCard.jsx` — unchanged
- `web/src/components/ChickenList.jsx` — unchanged
- `web/src/components/StoreListingCard.jsx` — unchanged
- `web/src/components/AnimatedTitle.jsx` — unchanged
- `web/src/components/ScreenLayout.jsx` — unchanged
- `web/src/components/UiButton.jsx` — unchanged

### Go files to create (all new)
- `server/cmd/server/main.go`
- `server/internal/model/chicken.go`, `feed.go`, `gamemode.go` — 3 files
- `server/internal/match/matchmaker.go` — 1 file
- `server/internal/game/ball.go`, `chicken.go`, `feed.go`, `pitch.go`, `math.go`, `session.go`, `loop.go`, `reward.go` — 8 files
- `server/internal/ws/handler.go`, `protocol.go` — 2 files
- `server/internal/api/router.go`, `match.go` — 2 files
- `server/go.mod`, `server/Makefile`, root `Makefile`

## Verification Checklist
1. `cd server && go build ./...` — Go compiles
2. `cd server && go test ./...` — all tests pass
3. `cd web && npm run dev` — Vite starts
4. `cd web && npm run build` — production build succeeds
5. Start server + frontend (`make dev`), play a full 1v1 match end-to-end
6. Verify opponent is generated by server on match creation (not local)
7. Verify game state streams via WebSocket (check devtools WS frames)
8. Verify feed placement works via WS (click → server processes → state update with feed items)
9. Verify limited feed (slowness) inventory tracked server-side, counts update in client UI
10. Verify goal detection and score updates come from server
11. Verify game over + reward calculation comes from server `match_end` message
12. Verify reward credited to localStorage balance
13. Verify feed used deducted from localStorage inventory after match
14. Verify WS disconnect cancels the game and returns to dashboard
15. Verify 2v2 mode works (multiple chickens per team sent to server)
16. Verify shop still works fully client-side (no server dependency)

## Further Considerations
1. **Client-side interpolation**: Server sends state at 20 Hz. Client renders at 60fps via `requestAnimationFrame`. Implement linear interpolation between the two most recent server snapshots for smooth chicken/ball movement. This is critical for feel — without it the game will look choppy
2. **Feed inventory trust**: Server currently trusts the client-reported feed inventory at match creation. When player DB moves server-side, the server should own feed inventory too
3. **State snapshot size**: At 20 Hz, each state message includes all chickens, ball, feed items. For 2v2 this is 4 chickens + ball + up to 10 feed items. Monitor payload size; consider delta compression if it becomes an issue
4. **Server-side opponent AI feed placement**: Currently only the human player places feed. If AI opponents should also place feed to distract the player's chickens, this would be a new server-side feature. Not in scope for this migration
5. **Database migration**: When player data moves server-side, add `server/internal/store/` with SQLite persistence. The session architecture already separates concerns cleanly for this
