# Chicken Soccer Server

Go backend for Chicken Soccer.

## Responsibilities

- Guest registration and token auth
- Player profile and balance
- Chicken collection storage
- Daily per-player shop generation and purchases
- Match creation and opponent generation
- Server-authoritative match simulation over WebSocket

## Run

```bash
go run ./cmd/server
```

Server listens on :8080.

## Test

```bash
go test ./...
```

## Data Storage

Runtime data is stored under:

```text
data/players/{playerId}/
  profile.json
  chickens.jsonl
  feed_inventory.json
  shop/{dateKey}.json
```
