# Integración gamify-ui ↔ sesión zeus (puente de protocolo)

> Reconstrucción del `INTEGRATION-GAMIFY-UI.md` perdido en la absorción de gea-sdk
> ([GA-D], [AV-B]), ahora como **contrato ejecutable**: el mapeo vive en
> `src/index.mjs` y sus tests son la spec.

## El problema

Dos contratos que no se hablan:

- **Sesión zeus** (fuente, única verdad): eventos en la room `/runtime`
  (`presence`, `PING`, `PONG`, `selection:cast`) + snapshots `session:state`.
- **gamify-ui** (destino): el framework Angular anima un **hub de bots** a partir
  de `AlephMessage` (`COMPATIBLE_MESSAGES`): `{id, fromBot, toBot, channel, content,
  timestamp, type}`.

`@zeus/operator-bridge` es el traductor **inbound** (sesión → UI), puro y testeable
sin Angular. No es un visor: es la capa que hace de la sesión zeus una **escena que
consume su slice** (contrato de sesión, [D0]/[D1]) renderizada por el shell de operador.

## Mapeo (contrato)

| Evento/estado zeus | AlephMessage | Notas |
|---|---|---|
| `presence {actorId}` | `channel=sys`, `type=bot-to-center`, `fromBot=actorId`, `toBot=CentralHub` | el actor aparece en el círculo |
| `PING {from,n,expr}` | `channel=game`, `bot-to-center`, `content="PING #n · expr"` | |
| `PONG {from,answer,error?}` | `channel=game`, `bot-to-center`, `content="PONG = answer"` | error se refleja en content |
| `selection:cast {actorId,targetId,label,deckId}` | `channel=game`, `bot-to-center`, `content="escogió targetId (label)"` | **selección atribuida** (ver [session-events]) |
| `session:state {actors, selections.last}` | `sys` por cada actor nuevo (idempotente) + `game` de la última selección | reconciliación en reconexión |

- **`CentralHub`** = el master de sesión (centro del hub). Los actores/bots
  (ping/pong/rabbit/spider/horse y participantes) se posicionan en círculo.
- **Canales** → colores del framework: `sys` rojo, `game` púrpura, etc.
- **timestamp** viene de `payload.ts` real; ids estables por orden de stream.

## Uso

```js
import { createOperatorBridge } from '@zeus/operator-bridge';
const bridge = createOperatorBridge();               // { onSessionEvent, onSnapshot, reset }

roomClient.on('selection:cast', (p) => {
  for (const msg of bridge.onSessionEvent('selection:cast', p)) sink.push(msg); // → message-panel/bot-list
});
roomClient.on('session:state', ({ snapshot }) => {
  for (const msg of bridge.onSnapshot(snapshot)) sink.push(msg);
});
```

En `@zeus/operator-ui` (L-serve) este `sink` sustituye al `demo-message-simulator`
del framework; el simulador queda como fallback offline.

## Fuera de alcance (fase 2, L-outbound)

Outbound (controles del shell → `ROOM_MESSAGE`/intents de vuelta a la sesión) no
está aquí: el puente es inbound puro. El outbound vive en el host
(`ZeusSessionBridgeService.cast()/setPlayhead()/deckLoad()` en `@zeus/operator-ui`).

[D0]: ../../../docs/reference/decisions.md
[D1]: ../../../docs/reference/decisions.md
[GA-D]: ../../../docs/reference/decisions.md
[AV-B]: ../../../docs/reference/decisions.md
[session-events]: ../../../docs/reference/session-events.md
