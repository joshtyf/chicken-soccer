dev:
	(cd server && go run ./cmd/server) & (cd web && npm run dev)

server:
	cd server && go run ./cmd/server

web:
	cd web && npm run dev

test-server:
	cd server && go test ./...

build-web:
	cd web && npm run build
