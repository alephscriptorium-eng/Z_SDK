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

> **Alcance del aislamiento: un solo servidor.** Está medido contando entregas
> dentro de un `SocketServer`. **No sobrevive al relay**: con
> `ZEUS_SCRIPTORIUM_BRIDGE=remote`, `emitDownstream` reparte a **todo el
> namespace** ignorando el canal, así que todo evento de bajada alcanza a
> todos los sockets, zona o no. Esto es herencia (las salas ya se perdían
> ahí), no algo que introduzca el ámbito de zona — pero no lo tapa.
>
> **Ámbito ≠ permiso.** El nombre de canal es determinista y adivinable a
> propósito: cualquiera que sepa el nombre de una zona puede suscribirse. El
> permiso vive en el carril peercard/torno, no aquí.

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
| `'a::z:b'` | — | **lanza**: el separador está prohibido en la zona… |
| `room: 'SALA::z:norte'` | — | **…y también en la sala**: si no, se cae en el canal de una zona sin declararla |

Dos asimetrías deliberadas, para que no sorprendan:

- **`zone: ''` al emitir LANZA**, mientras que `zones: ''` al suscribir cae a
  la sala desnuda. Al suscribir, el blanco da el ámbito *más pequeño* (no
  recibes de más); al emitir, tratarlo como ausencia publicaría en un destino
  que nadie pidió y que ningún suscriptor de zona oye. Un
  `const z = cfg.zona ?? ''` se suscribe bien y **revienta al emitir** — a
  propósito, en vez de publicar en el sitio equivocado en silencio.
- **El id de zona es sensible a mayúsculas.** `'Norte'` y `'norte'` son **dos
  zonas**, igual que son dos salas para socket.io. Plegarlas uniría dos
  ámbitos declarados separados, y unir ámbitos es ensanchar. Sólo se recorta
  el blanco de los bordes (`' norte '` → `'norte'`).

Precio declarado: alcanzar N zonas cuesta **N emisiones** (no hay «a todas»),
y el adaptador guarda **un canal más por zona**. A cambio, las entregas por
emisión bajan de «toda la sala» a «los de la zona». Cifras medidas en
`plan/REPORTES/WP-U196-zonas-ambito-real.md`.

Aviso de crecimiento: `adapter.rooms` sí se vacía al desconectar, pero el
libro propio del servidor (`SocketServer.roomsSockets`) **retiene la clave y
los sids muertos** — medido: 1 cliente en 5 zonas deja 5 entradas residuales.
Es herencia de `@zeus/socket-core`, pero con zonas la ley de crecimiento pasa
de «nº de salas» (vocabulario corto y fijo) a «nº de nombres de zona jamás
usados» (cadenas libres). Elige ids de zona de un vocabulario acotado.

No confundir con `normalizeZoneInterest` / `filterSnapshotByZones` de
`@zeus/game-engine`: aquello es recorte de snapshot en cliente y allí `'*'` y
la ausencia sí significan «todo».

## Tests

`npm test -w @zeus/rooms`
