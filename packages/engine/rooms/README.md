# `@zeus/rooms`

Cliente Node de rooms Socket.IO para el transporte de plataforma
(`socket-server` `/runtime`). Une autoridad, MCP players y demos a una room
sin hardcodear URL: resuelve vía `ZEUS_SCRIPTORIUM_URL` / presets-sdk.

```js
import { createClient, connectAndJoin } from '@zeus/rooms';
```

Auth de handshake: `{ token, room, user }` — documentado en el portal
(Guía → Handshake externo).

Tipos: `types/index.d.ts` (incluidos en el tarball).

Browser: `@zeus/room-client-browser`.

## Zonas: ámbito, no filtro (WP-U196)

Una zona **no** es un interés que el receptor descarta: es un **sufijo de
canal**. `sala` + zona `norte` → canal `sala::z:norte`, una sala de socket.io
propia. Dos zonas con el mismo topic son **dos conversaciones**, y quien
reparte es el servidor.

```js
await connectAndJoin(client, user, { room: 'SALA', zones: ['norte'] });
emitRoomEvent(client, 'PLANO_CAMBIA', datos, 'SALA', 'norte'); // entra EN norte
emitRoomEvent(client, 'PLANO_CAMBIA', datos, 'SALA');          // sala desnuda
```

| `zones` | canales | qué significa |
|---|---|---|
| omitido, `null`, `[]`, `''`, `'   '` | `['SALA']` | el ámbito **sin** zona. Nunca «todas» |
| `'norte'` / `['norte']` | `['SALA::z:norte']` | sólo esa zona; no ve la sala desnuda |
| `['norte','norte']` | `['SALA::z:norte']` | una membresía, una entrega |
| `['norte','sur']` | dos canales | dos ámbitos, dos suscripciones |
| `'*'` | — | **lanza**: aquí no hay comodín |

Precio declarado: alcanzar N zonas cuesta **N emisiones** (no hay «a todas»),
y el adaptador guarda **un canal más por zona**. A cambio, las entregas por
emisión bajan de «toda la sala» a «los de la zona». Cifras medidas en
`plan/REPORTES/WP-U196-zonas-ambito-real.md`.

No confundir con `normalizeZoneInterest` / `filterSnapshotByZones` de
`@zeus/game-engine`: aquello es recorte de snapshot en cliente y allí `'*'` y
la ausencia sí significan «todo».

## Tests

`npm test -w @zeus/rooms`
