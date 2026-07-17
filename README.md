# ZEUS SDK

**Scriptorium Animus Iocandi** — bundle transmedia de herramientas y recursos para un juego ARG: una **sesión colaborativa** cuyo estado es la única verdad compartida, un **DJ** que pincha materiales y ontología sobre ella, **bots federados** que entran por canales MCP peer-to-peer, y toda UI como una **escena** que consume su slice del snapshot.

![](./SCRIPTORIUM_SKINS.png)

## Qué hay dentro

| Capa | Piezas | Puertos |
|---|---|---|
| **Transporte** | `socket-server` (rooms Socket.IO `/runtime`), `@zeus/rooms`, `@zeus/room-client-browser` | 3017 |
| **Sesión y dominio** | `player-ui` (vista DJ sobre room del juego), `@zeus/arg-domain`, `@zeus/protocol`, `@zeus/authority-kit` | 3013 |
| **Escenas** | `player-3d-ui` (visor de sesión), `3d-monitor` (portal de vistas de room), `operator-ui` (shell Angular tier-2), `editor-ui`, `cache-browser`, `firehose-browser` | 3018 / 3019 / 3020 / 3012 / 3015 / 3016 |
| **3D** | `@zeus/ui-3d-kit` (vanilla ESM, import maps), `@zeus/game-engine` (motor lógico puro) | — |
| **Canales MCP** | rabbit/spider/horse sobre rooms (`@alephscript/mcp-core-sdk`), proyección RouteEntry→MCP en `@zeus/http-contract`, presets curados (`@zeus/presets-sdk`) | — |
| **MCP servers** | solar (demo), lineas (corpus), firehose (disk), console-monitor | 4101–4103 / 4111–4112 / 3008 / 3014 |

## Arranque rápido

```bash
npm install
npm run start:socket-server   # transporte de rooms
npm run start:player               # MASTER de sesión (:3013)
npm run start:player-3d            # visor 3D (:3018)
```

VS Code: **V1 Zeus ▸ start all** levanta la plataforma V1 (`packages/platform`). **Start ▸ all** levanta la malla completa. Documentación (guías, manuales por servicio, contratos OpenAPI/AsyncAPI y registro de decisiones):

```bash
npm run docs:dev                   # portal VitePress en :3230
```

## Verificación

```bash
npm run lint
npm run gates                      # PRACTICAS §5 (puertos, deps, nombres)
npm run e2e:deck:room              # gates del transporte de sesión
npm run verify:dual-ui             # dos UIs, un contrato (G-DUI.*)
```

En GitHub (`alephscriptorium-eng/Z_SDK`), Actions corre `npm ci` + lint + gates
+ matriz de tests de paquetes en cada PR y en pushes a `main` / `wp/*`
(sin publish; release es WP-U53).

## Licencia

[Animus Iocandi AIPLv1](LICENSE.md) — licencia compuesta (GPL-3.0-or-later + capa Animus Iocandi). Declarada como `AIPLv1` en [`package.json`](package.json).
