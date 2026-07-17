# @zeus/operator-ui

UI de operador gamificada (Angular 20 + Three.js) — visor **tier-2** del mesh
zeus. Renderiza el **contrato único** (`state` / `ledger` / intents rol
`operator`) como un **hub de bots** vía `@zeus/operator-bridge`. Convive con
`player-ui` (DJ) y `player-3d-ui`: **varias vistas, un contrato**.

> **Workspace aislado.** No es miembro del workspace npm de zeus (Angular trae su
> propio toolchain). Se instala y compila por su cuenta y se sirve como `dist`.

## Estructura

```
projects/threejs-ui-lib/   → @zeus/threejs-ui-lib (librería publicable, ng-packagr)
projects/dev-app/          → host Angular (@zeus/operator-ui) — ThreeJSLayoutComponent
serve.mjs                  → createOperatorUiServer() + CLI; inyecta window.__ZEUS__
```

## Build & serve

```bash
# desde este paquete
npm install
npm run build:all        # lib (ng-packagr) + dev-app → dist/public
node serve.mjs           # :3020 (OPERATOR_UI_PORT)

# o desde zeus-sdk
npm run build:operator-ui
npm run start:operator-ui
```

## Arquitectura del host

| Pieza | Rol |
|-------|-----|
| `ThreeJSLayoutComponent` | layout modular: header, sidebars, controles, escena |
| `ZeusOperatorBridgeService` | room-client + operator-bridge → `messages$` + intents `operator` |
| `DemoFallbackService` | simulador offline cuando la room no está disponible |
| `@Output() operatorCast` | el layout emite; el host llama `zeusBridge.inspect()` en vivo |

- **Inbound:** `merge(zeusBridge.messages$, demoFallback.messages$)` → `[externalMessages$]`
- **Outbound:** botón → `inspect` (intent rol `operator`)
- **Conexión:** `serve.mjs` inyecta `window.__ZEUS__` (scriptoriumUrl, room, token, game)

### Variables de entorno

| Variable | Default | Rol |
|----------|---------|-----|
| `OPERATOR_UI_PORT` / `ZEUS_PORT_OPERATOR_UI` | `3020` | Puerto HTTP |
| `ZEUS_SCRIPTORIUM_URL` | mesh scriptorium | Runtime (se normaliza a `/runtime`) |
| `ZEUS_ARG_ROOM` | `ARG_DELTA` | Room del juego |
| `ZEUS_GAME` | `delta` | Id de juego en el envelope |
| `ZEUS_SCRIPTORIUM_SECRET` | `dev-secret` | Token de auth |
| `ZEUS_SCRIPTORIUM_USER` | `operator-ui` | actorId outbound |

## Verificación

```bash
npm run verify:operator-ui    # test:operator-bridge + build + e2e:operator-ui
npm run verify:dual-ui        # build + e2e:dual-ui
```
