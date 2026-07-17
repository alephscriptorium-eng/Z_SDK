# Integración gamify-ui ↔ contrato único (puente de protocolo)

> Contrato ejecutable: el mapeo vive en `src/index.mjs` y sus tests son la spec.
> Sustituye el puente sesión (`session:state` / `selection:cast`) demolido en WP-U32.

## El problema

Dos contratos que no se hablan:

- **Contrato único** (fuente): `state` / `ledger` / `intent` en la room del juego
  (canónico + dual `arg:*` mientras las vistas migran).
- **gamify-ui** (destino): el framework Angular anima un **hub de bots** a partir
  de `AlephMessage` (`COMPATIBLE_MESSAGES`): `{id, fromBot, toBot, channel, content,
  timestamp, type}`.

`@zeus/operator-bridge` es el traductor **inbound** (state/ledger → UI), puro y
testeable sin Angular. La proyección de slice (`projectOperatorSlice`) alimenta
el HUD del operador. Outbound (controles → intents con rol `operator`) vive en
el host (`ZeusOperatorBridgeService` en `@zeus/operator-ui`).

## Mapeo (contrato)

| Evento/estado | AlephMessage | Notas |
|---|---|---|
| `state.actors` (por actor nuevo) | `channel=sys`, `bot-to-center`, `fromBot=actorId` | idempotente en reconexión |
| `ledger` kind conocido | `channel=game`, content según tabla `LEDGER_CONTENT` | inspect/label/cache/… |
| `ledger` kind desconocido | `channel=game`, content=`kind …` | no silencia hechos nuevos |

- **`CentralHub`** = centro del hub visual (no es master de sesión).
- **timestamp** viene de `state.ts` / `entry.ts`; ids estables por orden de stream.

## Uso

```js
import {
  createOperatorBridge,
  projectOperatorSlice,
  makeOperatorIntent,
  WIRE,
} from '@zeus/operator-bridge';

const bridge = createOperatorBridge();

for (const ev of WIRE.STATE) {
  roomClient.on(ev, (state) => {
    for (const msg of bridge.onState(state)) sink.push(msg);
    hud = projectOperatorSlice(state);
  });
}
for (const ev of WIRE.LEDGER) {
  roomClient.on(ev, (entry) => {
    for (const msg of bridge.onLedger(entry)) sink.push(msg);
  });
}

// outbound (host):
roomClient.emit('intent', makeOperatorIntent('op', 'inspect', { targetId: 'nodo-a' }, { game: 'delta' }));
```

En `@zeus/operator-ui` este `sink` sustituye al `demo-message-simulator` del
framework; el simulador queda como fallback offline.

## Fuera de alcance

El puente no conoce nombres de juego (PRACTICAS §1.11): el caller inyecta `game`
en `makeOperatorIntent`. Pozo no consume operator-ui hoy.
