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

La forma wire de cada kind vive en **una sola tabla** `EVENT_META`
(`src/event-meta.mjs`): AsyncAPI y el validador runtime `isShaped(kind, data)`
se derivan de ella. No hay un segundo esquema paralelo.

### Inbound: `intent`

```js
{ v:1, game, from, ts, actorId, intent, role?: 'player'|'dj'|'operator', ...args }
```

Cada juego declara un **catálogo** `intent → { roles }`. Un intent cuyo `role`
(default `player`) no está autorizado se rechaza con `rol_no_autorizado`.

`isShaped('intent', data)` exige los campos required de `EVENT_META` (incl.
`game`). `isIntentShaped` / `validateIntent` siguen siendo el chequeo mínimo
de transporte (`actorId` + `intent` + catálogo opcional) que usan los dominios
antes del envelope completo en wire.

### Outbound: `state` | `track` | `ledger`

- `state` — snapshot compacto @Hz + heartbeat; opcionalmente `mode: 'delta'`
  (cuerpo `GAME_STATE_DELTA`, ver §6)
- `track` — pista de navegación (no muta dominio)
- `ledger` — hechos append-only

`isShaped(kind, data)` rechaza payloads que incumplan `required` / tipos de
`EVENT_META` para ese kind.

## 3. API

- `makeEnvelope({ game, kind, from?, ts?, ... })` — `game` (string no vacío)
  obligatorio
- `makeIntent(actorId, intent, args?, fromOrOpts?)` — el 4º arg es `from`
  (string) u options `{ from?, game, role?, ts?, v? }`. **`game` es
  obligatorio** (mismo criterio que `makeEnvelope`); sin él lanza
  `TypeError`. Los wrappers de juego (`delta` / `pozo`) inyectan su
  `GAME_ID` cuando el caller pasa solo `from` string.
- `isShaped(kind, data)` — forma wire desde `EVENT_META`
- `isIntentShaped(payload, catalog?)` / `validateIntent(payload, catalog)`
- `createIntentCatalog(defs)` / `assertIntentRole(payload, catalog)`
- `makePeerCard({ roomId, endpoint, token, scopes, expiresAt, ... })`
- `checkSnapshotBudget(snapshot)`
- `diffGameState` / `applyGameStateDelta` / `isGameStateDeltaShaped` (§6)

## 4. Peer Card (credencial de rol)

Token revocable `{ roomId, endpoint, token, scopes, expiresAt }`. Los scopes
`role:player|dj|operator` acreditan el rol del actor. Misma pieza prevista
para WebRTC (ola 10) e identidad SSB (horizonte). No es identidad fuerte:
es ticket de room + rol + caducidad.

## 5. AsyncAPI

Generado desde `EVENT_META` (misma fuente que `isShaped`):

```bash
npm run spec:generate -w @zeus/protocol
npm run spec:asyncapi:html   # → docs/public/api/protocol/
```

Los juegos (p. ej. delta en `@zeus/arg-domain`) re-exportan/consumen este
paquete y aportan catálogo de intents + alias de wire si los necesitan.

## 6. GAME_STATE_DELTA (gamechannel v0.2)

Entre heartbeats full, la autoridad puede publicar **parches** en lugar del
snapshot completo (dolor: N actores ⇒ snapshots que no escalan).

| Campo | Full (`mode: 'full'` o legado) | Delta (`mode: 'delta'`) |
| ----- | ------------------------------ | ----------------------- |
| `tick` | tick actual | tick actual |
| `baseTick` | — | tick del estado base sobre el que aplica |
| `actors` / `anchors` | mapas completos | solo ids cambiados; `null` = borrado |
| wire Rooms | `state` / `GAME_STATE` | mismo kind `state` **o** alias `GAME_STATE_DELTA` |

API pura (2º cliente = cualquier viewer que aplique sin mutar dominio):

```js
import {
  diffGameState,
  applyGameStateDelta,
  isGameStateDeltaShaped,
  GAME_STATE_DELTA
} from '@zeus/protocol';

const delta = diffGameState(prev, next, { reason: 'change' });
const applied = applyGameStateDelta(prev, delta);
// applied.ok ? applied.state : resync full (p. ej. base_tick_mismatch)
```

`@zeus/authority-kit` con `stateDelta: true` calcula el diff y publica full
en boot/heartbeat y delta en cambios intermedios (ver README del kit).
