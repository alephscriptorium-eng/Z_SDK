# Engine

Lo genérico y publicable del SDK. Vive en `packages/engine/*`.

| Paquete | Rol |
| ------- | --- |
| [`@zeus/protocol`](/engine/protocol) | Envelope `state\|intent\|track\|ledger`, roles, AsyncAPI |
| [`@zeus/authority-kit`](/engine/authority-kit) | Loop de tick, reducer inyectado, snapshot/ledger |
| [`@zeus/player-mcp-kit`](/engine/player-mcp-kit) | Un MCP por actor + evidencia |
| [`@zeus/playbook-kit`](/engine/playbook-kit) | CASOS, coherencia, acta, runner |
| [`@zeus/view-kit`](/engine/view-kit) | Vistas 3D+HTML browser-safe |
| [`@zeus/http-contract`](/engine/http-contract) | RouteEntry → OpenAPI + proyección MCP |
| [`@zeus/rooms`](/engine/rooms-presets) | Cliente de rooms Socket.IO |
| [`@zeus/presets-sdk`](/engine/rooms-presets) | Catálogo MCP, env/puertos, volúmenes |
| `@zeus/webrtc-signaling` | Señalización WebRTC: rooms + DMs SSB vía pub; ICE desde env |

También: `game-engine`, `ui-kit`, `ui-3d-kit`, `app-shell`, `firehose-core`,
`test-utils`, `room-client-browser`, `feed-kit`, `linea-kit`,
`story-board-schema`, `volumes-ops`.

Fuente viva (lista completa y versiones): `packages/engine/*/package.json`.

El engine habla el protocolo común; los nombres de juego viven en sus
paquetes. Ver [juegos de referencia](/guide/two-games).
