# Engine

Lo genérico y publicable del SDK. Hoy vive en `packages/engine/*`; el layout
objetivo lo agrupa bajo `engine/` (WP-U51 no mueve carpetas aún).

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

También: `game-engine`, `ui-kit`, `ui-3d-kit`, `app-shell`, `firehose-core`,
`test-utils`, `room-client-browser`.

**Regla D-8:** el engine no nombra `delta` ni `pozo`. Ver [dos juegos](/guide/two-games).
