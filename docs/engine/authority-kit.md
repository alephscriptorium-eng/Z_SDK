# Authority kit — `@zeus/authority-kit`

Autoridad genérica: loop de tick, aplicación de intents vía reducer
registrado (dominio inyectado), emisión `state` / `ledger` / `track` con
envelope de `@zeus/protocol` (`game` obligatorio), presupuesto de snapshot y
apagado limpio.

Node-only (usa `@zeus/rooms`). El caller pasa `game` y el dominio; el kit
habla el protocolo común.

```js
import { startAuthority, PROTOCOL_EVENTS } from '@zeus/authority-kit';

await startAuthority({
  user: 'my-authority',
  room: 'MY_ROOM',
  game: 'my-game',
  tickMs: 100,
  domain: { applyIntent, tick, snapshot, drainOutbox },
  events: PROTOCOL_EVENTS
});
```

Consumidores de referencia: autoridad de delta (`arg-demos`) y de pozo.
README: `packages/engine/authority-kit/README.md`.
