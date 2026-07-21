# `@zeus/authority-kit`

Autoridad genérica Zeus: loop de tick, aplicación de intents vía reducer
registrado (dominio inyectado), emisión `state` / `ledger` / `track` vía
`makeEnvelope` de `@zeus/protocol` (campo `game` obligatorio), presupuesto de
snapshot medible y arranque/parada limpios.

Node-only (depende de `@zeus/rooms`). **No nombra juegos** (D-8): el caller
pasa `game` y aporta el dominio; el kit solo exige string no vacío.

## Uso

```js
import { startAuthority, PROTOCOL_EVENTS } from '@zeus/authority-kit';

const domain = {
  applyIntent(payload) { /* → { ok, error } */ },
  tick(deltaSec, now) { /* muta estado */ },
  snapshot(reason, { full } = {}) { /* → objeto state */ },
  drainOutbox() { return { ledger: [], tracks: [] }; },
  contentRev() { return this._rev; } // opcional: diffs vs full + heartbeat
};

await startAuthority({
  user: 'my-authority',
  room: 'MY_ROOM',
  game: 'my-game', // obligatorio; lo inyecta el paquete de juego
  tickMs: 100,
  heartbeatMs: 1000,
  domain,
  events: PROTOCOL_EVENTS, // o alias del juego, o dual ['state','arg:state']
  join: { type: 'MyAuthority', features: ['my-game-0.1'] },
  // GAME_STATE_DELTA (v0.2): full boot/heartbeat; parches entre medias
  // stateDelta: true,
  // events: { ...PROTOCOL_EVENTS, DELTA: 'GAME_STATE_DELTA' },
  snapshotBudget: true, // avisa si > 32 KiB (G-PROTO.5)
  onShutdown: async () => { /* cerrar feeds, etc. */ }
});
```

`state` / `track` / `ledger` se publican siempre con envelope
`{ v, game, … }`. No hay publicación de payloads sueltos sin `game`.

La cascada SIGINT del launcher del juego (p. ej. `arg-demos/launch.mjs`) se
hereda: el kit solo escucha `SIGINT`/`SIGTERM` en el proceso de autoridad.

## Peer Card (WP-U93 / D-20)

Al aceptar un intent de join (default: `join`), la autoridad **emite** un
peer-card (`issuePeerCard` → `makePeerCard`) con rol y caducidad. El carril
WebRTC (`@zeus/webrtc-signaling`) **exige** esa card antes de offer/answer/ICE.

```js
await startAuthority({
  // …
  peerCardEndpoint: process.env.ZEUS_SCRIPTORIUM_URL, // o se toma de @zeus/rooms
  onPeerCard: (card, intent) => {
    // entregar card al actor (mesh / cliente WebRTC)
  }
});

// emisión explícita (misma fábrica):
const { issuePeerCard } = await startAuthority({ /* … */ });
const card = issuePeerCard({ role: 'player', sessionId: 'alice' });
```

También: `import { issuePeerCard } from '@zeus/authority-kit'`.

## Tests

`npm test -w @zeus/authority-kit`
