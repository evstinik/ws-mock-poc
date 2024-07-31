# Testing WebSocket in Cypress

Repo contains a micro app that connects to WebSocket server and when user clicks on the button sends `{"action":"ping"}` message over websocket.

Use this app to prototype mocking Websocket channel in Cypress.

## Quickstart

1. Install dependencies

```
pnpm install
```

2. Start websocket server (ws://localhost:3007)

```
cd server
pnpm install
pnpm start
```

3. Start frontend (http://localhost:5173)

```
pnpm dev
```
