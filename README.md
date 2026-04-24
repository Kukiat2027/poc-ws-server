# poc-ws-server

A minimal, production-shaped **WebSocket server** built on [Bun](https://bun.sh)'s
native `Bun.serve` WebSocket + pub/sub APIs.

Features:

- Native WebSocket upgrade at `ws://<host>:<port>/ws`
- Room-based pub/sub (join / leave / broadcast) via `server.publish`
- JSON wire protocol with a discriminated `type` field
- Per-connection state (client id, joined rooms)
- Ping / pong heartbeat + idle timeout
- `GET /healthz` health endpoint (uptime + room snapshot)
- Built-in test client served at `GET /` — open it in your browser and chat

## Install

```bash
bun install
```

## Run

```bash
# default: PORT=3000 HOST=0.0.0.0
bun run start

# hot-reload during development
bun run dev

# override host/port
PORT=8080 HOST=127.0.0.1 bun run start
```

Then open the test client at `http://localhost:3000/`.

## Wire protocol

Every frame is a JSON object. The client sends one of:

```jsonc
{ "type": "join",    "room": "lobby" }
{ "type": "leave",   "room": "lobby" }
{ "type": "message", "room": "lobby", "data": "hi" }
{ "type": "ping" }
```

The server sends one of:

```jsonc
{ "type": "welcome", "clientId": "…", "serverTime": 0 }
{ "type": "joined",  "room": "lobby", "members": 1 }
{ "type": "left",    "room": "lobby", "members": 0 }
{ "type": "message", "room": "lobby", "from": "…", "data": "hi", "at": 0 }
{ "type": "system",  "room": "lobby", "info": "… joined" }
{ "type": "pong",    "at": 0 }
{ "type": "error",   "code": "BAD_JSON", "message": "…" }
```

Room names must match `^[\w\-:.]{1,64}$`.

## Project layout

```
index.ts           # entry point
src/server.ts      # Bun.serve + WebSocket handlers
src/rooms.ts       # room membership counter
src/protocol.ts    # shared message types + JSON codec
public/index.html  # browser test client
```

## Quick smoke test

```bash
# terminal 1
bun run start

# terminal 2
curl http://localhost:3000/healthz
```

Built with Bun v1.1.29.
