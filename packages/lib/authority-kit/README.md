# `@zeus/authority-kit`

Autoridad genérica Zeus: loop de tick, aplicación de intents vía reducer
registrado (dominio inyectado), emisión `state` / `ledger` / `track`,
presupuesto de snapshot medible y arranque/parada limpios.

Node-only (depende de `@zeus/rooms`). **No nombra juegos** (D-8): el juego
aporta el dominio y, si hace falta, alias wire.

## Uso

```js
import { startAuthority, PROTOCOL_EVENTS } from '@zeus/authority-kit';
import { EVENTS as GAME_EVENTS } from './my-game-contract.mjs';

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
  tickMs: 100,
  heartbeatMs: 1000,
  domain,
  events: PROTOCOL_EVENTS, // o alias del juego, o dual ['state','arg:state']
  join: { type: 'MyAuthority', features: ['my-game-0.1'] },
  snapshotBudget: true, // avisa si > 32 KiB (G-PROTO.5)
  onShutdown: async () => { /* cerrar feeds, etc. */ }
});
```

La cascada SIGINT del launcher del juego (p. ej. `arg-demos/launch.mjs`) se
hereda: el kit solo escucha `SIGINT`/`SIGTERM` en el proceso de autoridad.

## Peer Card

El kit **no** exige Peer Card en el handshake de room ni en cada intent.
Basta el `role` validado por el dominio (vía `@zeus/protocol` / catálogo).
Helpers `makePeerCard` / `peerCardGrantsRole` quedan listos para mesh/WebRTC.

## Tests

`npm test -w @zeus/authority-kit`
