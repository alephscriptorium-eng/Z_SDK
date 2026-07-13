# @zeus/operator-ui

UI de operador gamificada (Angular 20 + Three.js) — visor **tier-2** del universo
zeus. Absorbida desde `gea-sdk/threejs-gamify-ui` (block-13); renderiza la sesión
zeus como un **hub de bots** vía `@zeus/operator-bridge`. Convive con
`player-3d-ui` (la escena canónica vanilla): **dos UIs, un contrato de sesión**.

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

El `dev-app` es el shell de operador de producción:

| Pieza | Rol |
|-------|-----|
| `ThreeJSLayoutComponent` | layout modular: header, sidebars (bot-list, message-panel), controles, escena |
| `ZeusSessionBridgeService` | `@zeus/room-client-browser` + `@zeus/operator-bridge` → `messages$` |
| `DemoFallbackService` | simulador offline cuando la sesión no está disponible |
| `@Output() operatorCast` | el layout emite; el host llama `zeusBridge.cast()` en vivo |

- **Inbound:** `merge(zeusBridge.messages$, demoFallback.messages$)` → `[externalMessages$]`
- **Outbound:** botón "single message" → `operatorCast` → `selection:cast` (actorId=`operator-ui`)
- **Conexión:** connect/disconnect reales vía bridge (no simulación); `serve.mjs` inyecta `window.__ZEUS__`

## El puente de sesión (block-13 L-serve)

- **Lib**: `ThreeJSScenePureComponent` acepta `@Input() externalMessages$` — stream
  canónico de mensajes bot-hub (`HubMessage`). Sin red ni sesión dentro de la escena.
- **Host** (`ZeusSessionBridgeService` + `DemoFallbackService`): conecta a scriptorium
  con `@zeus/room-client-browser`, mapea eventos con `@zeus/operator-bridge`, y hace
  `merge(zeusMessages$, demoMessages$)` cuando la sesión no está disponible.
- **Three.js**: facades Angular (`KitSceneFacade`, `KitTrajectoryFacade`,
  `KitAnimationFacade`) sobre `@zeus/ui-3d-kit` — sin coreografía de juego
  (eso sigue en `player-3d-ui`).
- **serve.mjs** exporta `createOperatorUiServer({ port, host, zeus })` e inyecta
  `window.__ZEUS__` (`scriptoriumUrl`, `room`, `token`, …) desde el entorno
  `ZEUS_SCRIPTORIUM_*`.

### Variables de entorno

| Variable | Default | Rol |
|----------|---------|-----|
| `OPERATOR_UI_PORT` / `ZEUS_PORT_OPERATOR_UI` | `3020` | Puerto HTTP |
| `ZEUS_SCRIPTORIUM_URL` | `http://localhost:3017` | Runtime scriptorium (se normaliza a `/runtime`) |
| `ZEUS_SCRIPTORIUM_ROOM` | `scriptorium.<sessionId>` | Room explícita (opcional) |
| `ZEUS_SESSION_ID` | `default` | Id de sesión |
| `ZEUS_SCRIPTORIUM_SECRET` | `dev-secret` | Token de auth |
| `ZEUS_SCRIPTORIUM_USER` | `operator-ui` | actorId outbound |

## Verificación

```bash
# gate reproducible (desde zeus-sdk raíz)
npm run verify:operator-ui    # test:operator-bridge + build:operator-ui + e2e:operator-ui

# por pasos
npm run test:operator-bridge
npm run build:operator-ui
npm run e2e:operator-ui       # G-OUI.0–4
```

VS Code: **Test ✓ e2e operator-ui**.

### Smoke manual

Con `socket-server` (:3017) y algún bot emitiendo (`@zeus/ping-pong-bots` en
`PING_SESSION_MODE=1`) arriba:

```bash
npm run start:operator-ui          # abre :3020
```

Cada `selection:cast`/`PING`/`PONG` en la room aparece como mensaje animado en el
hub. Sin sesión viva, cae a modo demo (simulador) sin romper.

## Docs de la lib

- `projects/threejs-ui-lib/COMPATIBLE_MESSAGES.md` — formato de mensajes (bot-hub)
- `projects/threejs-ui-lib/MODULAR-LAYOUT-GUIDE.md` — layout modular

## Dependencias @zeus

- `@zeus/threejs-ui-lib` — la librería (interna, `dist/`).
- `@zeus/operator-bridge` — mapeo puro sesión→AlephMessage.
- `@zeus/room-client-browser` — cliente socket.io del runtime.
- `@zeus/ui-3d-kit` — SceneManager / TrajectoryManager / AnimationController (ESM).

Licencia AIPLv1.
