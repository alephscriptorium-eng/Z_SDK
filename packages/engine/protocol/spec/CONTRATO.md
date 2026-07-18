# @zeus/protocol — Contrato único (v1)

Contrato entre la **autoridad** (único proceso que muta el dominio de un
juego), las **vistas** (proyectan snapshots), los **actores** (emiten intents
con rol) y los **navegadores** (consumen track).

Transporte: room Socket.IO (`@zeus/rooms` / `ZEUS_SCRIPTORIUM_URL`). Los
eventos viajan como `ROOM_MESSAGE` `{ event, room, data }` donde `event` es
uno de `state|intent|track|ledger` y `data` lleva el envelope con campo
**`game`** (id aportado por el paquete de juego, nunca hardcodeado aquí).

## 1. Principios (gates)

| id | regla |
| -- | ----- |
| G-PROTO.1 | Una autoridad por room |
| G-PROTO.2 | Vistas proyectan y emiten intents; no corren engine |
| G-PROTO.3 | Dominio puro (browser-safe, sin red/fs) |
| G-PROTO.4 | Reducers en tabla; inválido = no-op explicable |
| G-PROTO.5 | Snapshot con presupuesto (default ≤ 32 KiB) |

## 2. Envelope

```js
{ v: 1, game: '<game-id>', from?, ts, ... }
```

### Inbound: `intent`

```js
{ v:1, game, from, ts, actorId, intent, role?: 'player'|'dj'|'operator', ...args }
```

Cada juego declara un **catálogo** `intent → { roles }`. Un intent cuyo `role`
(default `player`) no está autorizado se rechaza con `rol_no_autorizado`.

### Outbound: `state` | `track` | `ledger`

- `state` — snapshot compacto @Hz + heartbeat
- `track` — pista de navegación (no muta dominio)
- `ledger` — hechos append-only

## 3. API

- `makeEnvelope({ game, kind, from?, ts?, ... })` — `game` (string no vacío)
  obligatorio
- `makeIntent(actorId, intent, args?, fromOrOpts?)` — el 4º arg es `from`
  (string) u options `{ from?, game, role?, ts?, v? }`. **`game` es
  obligatorio** (mismo criterio que `makeEnvelope`); sin él lanza
  `TypeError`. Los wrappers de juego (`delta` / `pozo`) inyectan su
  `GAME_ID` cuando el caller pasa solo `from` string.
- `isIntentShaped(payload, catalog?)` / `validateIntent(payload, catalog)`
- `createIntentCatalog(defs)` / `assertIntentRole(payload, catalog)`
- `makePeerCard({ roomId, endpoint, token, scopes, expiresAt, ... })`
- `checkSnapshotBudget(snapshot)`

## 4. Peer Card (credencial de rol)

Token revocable `{ roomId, endpoint, token, scopes, expiresAt }`. Los scopes
`role:player|dj|operator` acreditan el rol del actor. Misma pieza prevista
para WebRTC (ola 10) e identidad SSB (horizonte). No es identidad fuerte:
es ticket de room + rol + caducidad.

## 5. AsyncAPI

Generado desde este contrato:

```bash
npm run spec:generate -w @zeus/protocol
npm run spec:asyncapi:html   # → docs/public/api/protocol/
```

Los juegos (p. ej. delta en `@zeus/arg-domain`) re-exportan/consumen este
paquete y aportan catálogo de intents + alias de wire si los necesitan.
