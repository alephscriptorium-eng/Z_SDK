# ZEUS SDK

**Scriptorium Animus Iocandi** — monorepo para **crear juegos**: contrato único
(`state` / `intent` / `track` / `ledger`), autoridad por room, UIs como vistas
que emiten intents, bots MCP por actor, y validación con playbook CASOS.

Dos juegos de referencia (**delta** y **pozo**) demuestran que el engine sirve
a ambos (D-8). Layout: **engine · editor · mesh · games · examples**.

![](./SCRIPTORIUM_SKINS.png)

## Mapa

| Capa | Ruta | Piezas |
| ---- | ---- | ------ |
| **Engine** | `packages/engine/*` | `protocol`, `authority-kit`, `player-mcp-kit`, `playbook-kit`, `view-kit`, `http-contract`, `rooms`, `presets-sdk`, `game-engine`, `ui-*-kit`… |
| **Editor** | `packages/editor/editor-ui` | crear presets / camino a gamemap |
| **Mesh** | `packages/mesh/*` | socket-server, player-ui (DJ), operator-ui, browsers, monitores 3D, MCPs |
| **Games** | `packages/games/delta/*`, `packages/games/pozo` | delta · pozo (hasta WP-U61; destino: [`Z_SDK-games-library`](https://github.com/alephscriptorium-eng/Z_SDK-games-library)) |
| **Examples** | `examples/*` | game-demos, ping-pong-bots |

## Arranque rápido

```bash
npm install
npm run start:socket-server   # transporte de rooms
npm run demo:arg              # delta — autoridad + 3 visores
npm run demo:pozo             # pozo — autoridad + vista + MCP
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
npm run test:arg              # familia delta
npm test -w @zeus/pozo        # segundo juego
npm run docs:build
```

En GitHub (`alephscriptorium-eng/Z_SDK`), Actions corre `npm ci` + lint + gates
+ matriz de tests en cada PR y pushes a `main` / `wp/*`. En `main`, el
workflow **Release** (changesets) solo publica tras quality+test verdes y si
existe el secret `NPM_TOKEN` (registry `@zeus`). Local, sin publish:

```bash
npx changeset                 # obligatorio si tocas engine publicable
npm run release:changeset-dry # bump + changelog + pack, luego restaura
npm run release:dry           # solo npm pack + verify tarballs
```

## Licencia

[Animus Iocandi AIPLv1](LICENSE.md) — licencia compuesta (GPL-3.0-or-later + capa Animus Iocandi). Declarada como `AIPLv1` en [`package.json`](package.json).
