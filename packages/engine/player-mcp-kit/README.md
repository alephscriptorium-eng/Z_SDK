# `@zeus/player-mcp-kit`

Patrón **un MCP por actor** con semántica verificable:

1. Emitir intent → esperar evidencia en `state` / `ledger`
2. Dry-run de rechazos silenciosos (ventana noop + `explain`)
3. Resources estándar: `<game>://player/state`, `<game>://scene`, `<game>://casos`
4. Health: `connected` + `lastStateTs`

Sin nombres de juego concretos (D-8). El juego inyecta wire events,
`makeIntent`, puerto (vía `presets-sdk/env`) y lectores de resources.

## Uso

```js
import {
  createPlayerRoomBridge,
  createPlayerMcpServer,
  confirmIntent,
  buildStandardPlayerResources
} from '@zeus/player-mcp-kit';
import { listCasoIds } from '@zeus/playbook-kit';
import { EVENTS, makeIntent } from '@zeus/protocol'; // o wire/alias del juego

const bridge = createPlayerRoomBridge({
  actor: 'uno',
  room: process.env.ZEUS_MY_ROOM, // vía env del juego, no hardcode
  events: EVENTS, // o alias wire del juego
  makeIntent: (actorId, intent, args, from) =>
    makeIntent(actorId, intent, args, { from, game: 'my-game' }),
  peer: { type: 'MyPlayerMcp', features: ['intent', 'mcp-wrapper'] },
  // Peercard firmada (peer-card-seat) — mismo carril que la puerta:
  // peerCard, requirePeerCard: true, assertPeerCard: verifyTravelingPeerCard
});

const registry = buildStandardPlayerResources({
  game: 'my-game',
  bridge,
  readPlayerState: () => ({ actor: bridge.myActor() }),
  readScene: () => ({ /* escena del juego */ }),
  readCasos: () => {
    const markdown = /* leer CASOS.md del juego */;
    return { casos: listCasoIds(markdown), markdown };
  }
});

const server = createPlayerMcpServer({
  name: 'my-player-mcp-uno',
  version: '0.1.0',
  port, // resolveZeusMcpPorts()…
  bridge,
  registry,
  buildMcp(mcp) {
    // tools del juego; usan confirmIntent(bridge, cfg, { intent, done, explain })
  }
});
```

## API

| export | rol |
| ------ | --- |
| `createPlayerRoomBridge` | cliente room; colas ledger/track; `emitIntent` |
| `confirmIntent` | intent → evidencia / dry-run |
| `createPlayerMcpServer` | `createStandardMcpServer` + health estándar |
| `buildStandardPlayerResources` / `standardPlayerResourceUris` | URIs estándar |
| `fail` / `sleep` | helpers de tools |

Parseo de playbook (`listCasoIds` / `extractCaso`) y coherencia/acta/runner:
`@zeus/playbook-kit`.

## Tests

`npm test -w @zeus/player-mcp-kit`
