# ZEUS SDK

**Scriptorium Animus Iocandi** — monorepo para **crear juegos**: contrato único
(`state` / `intent` / `track` / `ledger`), autoridad por room, UIs como vistas
que emiten intents, bots MCP por actor, y validación con playbook CASOS.

Dos juegos de referencia (**delta** y **pozo**) demuestran que el engine sirve
a ambos (D-8). Layout: **engine · editor · mesh · examples**. Los juegos viven
en [`Z_SDK-games-library`](https://github.com/alephscriptorium-eng/Z_SDK-games-library)
(WP-U61).

![](./SCRIPTORIUM_SKINS.png)

## Mapa

| Capa | Ruta | Piezas |
| ---- | ---- | ------ |
| **Engine** | `packages/engine/*` | `protocol`, `authority-kit`, `player-mcp-kit`, `playbook-kit`, `view-kit`, `http-contract`, `rooms`, `presets-sdk`, `game-engine`, `ui-*-kit`… |
| **Editor** | `packages/editor/editor-ui` | crear presets / camino a gamemap |
| **Mesh** | `packages/mesh/*` | socket-server, player-ui (DJ), operator-ui, browsers, monitores 3D, MCPs |
| **Games** | [`Z_SDK-games-library`](https://github.com/alephscriptorium-eng/Z_SDK-games-library) | delta · pozo |
| **Examples** | `examples/*` | game-demos, ping-pong-bots |

## Arranque rápido

```bash
npm install
npm run start:socket-server   # transporte de rooms (mesh)
```

Demos de juego (desde el clone hermano `Z_SDK-games-library`):

```bash
cd ../Z_SDK-games-library
npm install                   # file: temporal → este monorepo (.deps/zeus-sdk)
npm run demo:arg              # delta contra mesh de Z_SDK
npm run demo:pozo
```

Documentación (guías, contratos OpenAPI/AsyncAPI, resources MCP, playbook):

```bash
npm run docs:dev              # VitePress (puerto vía presets-sdk/env, default :3230)
npm run docs:build            # specs + Redoc + AsyncAPI HTML + sitio estático
```

`ZEUS_OPEN_BROWSER=1` es opt-in; por defecto no abre navegador.

## Verificación

```bash
npm run lint
npm run gates                 # PRACTICAS §5 (puertos, deps, nombres)
npm run docs:build
```

Juegos (library):

```bash
cd ../Z_SDK-games-library && npm test && npm run e2e:arg && npm run e2e:pozo-mcp
```

En GitHub (`alephscriptorium-eng/Z_SDK`), Actions corre `npm ci` + lint + gates
+ matriz de tests de workspaces engine/mesh/editor/examples.
