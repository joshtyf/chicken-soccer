# Chicken Soccer — Project Guidelines

## Overview
Chicken Soccer is now a server-authoritative monorepo with a Go backend and React frontend. The backend owns player identity, balance, chicken collection, feed inventory, daily shop state, and real-time match simulation over WebSocket.

## Tech Stack
- Frontend: React 19 + Vite 8 in web
- Backend: Go 1.22+ in server (net/http + gorilla/websocket)
- Rendering: Canvas 2D pixel-art presentation
- Storage: JSON and JSONL files under server/data

## Monorepo Structure
```
web/
  src/
    App.jsx
    services/
      auth.js
      api.js
      wsClient.js
    components/
    hooks/
    engine/
    data/

server/
  cmd/server/main.go
  internal/
    api/
    game/
    match/
    model/
    store/
    ws/
  data/
    players/
```

## Architecture Rules
- Server-authoritative gameplay: all physics, AI, goals, and rewards are computed on the backend.
- Client is a thin API/WebSocket consumer that renders snapshots and sends player input.
- No frontend localStorage game databases for balance, collection, feed inventory, shop listings, or rewards.
- Frontend keeps only the guest auth token in localStorage.
- WebSocket disconnect cancels the match and returns to dashboard behavior on the client.

## Frontend Conventions
- Keep shared display constants in web/src/data (statDefs, feedDefs, gameModeDefs).
- Put API and auth logic in web/src/services.
- Keep screen components focused on rendering; async data and side effects belong in hooks/services.
- Canvas hook reads server snapshots and interpolates render positions.

## Backend Conventions
- internal/api: parse/validate requests and shape responses.
- internal/store: all JSON/JSONL persistence and per-player concurrency locking.
- internal/game: pure simulation/session lifecycle and reward computation.
- internal/ws: connection handling and protocol transport.

## Development
```bash
make dev       # run backend + frontend
make server    # run Go backend
make web       # run Vite frontend

cd server && go test ./...
cd web && npm run build
```

## Skills
- See .github/skills/go-backend for backend package conventions.
- See .github/skills/golang-patterns for idiomatic Go guidance.
- See .github/skills/frontend-patterns for React and hook composition patterns.
