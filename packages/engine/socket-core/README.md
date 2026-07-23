# `@zeus/socket-core`

Superficie Socket.IO propia de Zeus: `SocketClient` y `SocketServer`.
Sustituye el uso de `@alephscript/mcp-core-sdk` `/client` y `/server` en
consumidores Zeus (migración de imports = WP-U160).

## Ubicación

`packages/engine/socket-core` — lib de engine (mismo territorio que
`@zeus/rooms`); el mesh (`@zeus/socket-server`) la consumirá vía workspace.

## Superficie

### `@zeus/socket-core/client` — `SocketClient`

| API | Uso |
| --- | --- |
| `new SocketClient(user, url, namespace, options?)` | ctor |
| `.io` | socket.io-client (`connect`, `emit`, `on`, `id`, …) |
| `.room(event, data?, room?)` | emite `ROOM_MESSAGE` `{ event, room, data }` |

`options` relevantes: `autoConnect`, `auth`, `reconnection`, `timeout`.

### `@zeus/socket-core/server` — `SocketServer`

| API | Uso |
| --- | --- |
| `new SocketServer(name, httpServer, activateInstruments?, autoBroadcast?)` | ctor (también acepta objeto de opciones) |
| `.createNamespace(namespace)` | crea `/namespace` + handlers de room protocol |
| `.io` | instancia `socket.io` Server |

Room protocol (cuando `autoBroadcast`): `CLIENT_REGISTER`,
`CLIENT_SUSCRIBE`, `ROOM_MESSAGE` (incl. `MAKE_MASTER` / `SET_*` / `GET_*`).

## Imports

```js
import { SocketClient } from '@zeus/socket-core/client';
import { SocketServer } from '@zeus/socket-core/server';
```

Tipos: `types/client.d.ts`, `types/server.d.ts`.

## Tests

```bash
npm test -w @zeus/socket-core
```
