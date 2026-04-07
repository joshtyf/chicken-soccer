# Chicken Soccer

Chicken Soccer is a server-authoritative monorepo with:
- a Go backend game server in server
- a React + Vite frontend client in web

The backend owns player state, economy, shop state, and full match simulation. The frontend renders snapshots from the server and sends player input over WebSocket.

## Monorepo Layout

```text
.
├── server/
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── api/
│   │   ├── game/
│   │   ├── match/
│   │   ├── model/
│   │   ├── store/
│   │   └── ws/
│   └── data/
│       └── players/
├── web/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── services/
│       │   ├── auth.js
│       │   ├── api.js
│       │   └── wsClient.js
│       ├── components/
│       ├── hooks/
│       ├── engine/
│       └── data/
├── Makefile
└── .github/
```

## Backend APIs

All endpoints except register require bearer auth.

- POST /api/auth/register
- GET /api/player
- GET /api/collection
- POST /api/collection/init
- GET /api/shop
- POST /api/shop/buy-chicken
- POST /api/shop/buy-feed
- POST /api/match/create
- GET /ws/game/{sessionId}

## WebSocket Messages

Client to server:
- feed_place
- feed_select
- pause
- resume

Server to client:
- match_start
- state
- goal
- match_end
- error

## Development

Run both services:

```bash
make dev
```

Run backend only:

```bash
make server
```

Run frontend only:

```bash
make web
```

Run backend tests:

```bash
cd server && go test ./...
```

Build frontend:

```bash
cd web && npm run build
```

## Notes

- Frontend stores only the guest auth token in localStorage.
- Match simulation, rewards, and feed inventory validation are server-side.
- Player data persists on disk under server/data/players.
- Chicken records now include appearance metadata (currently `appearance.bodyColor`) used by UI cards.
