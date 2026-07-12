# @zeus/player-debug-3d-ui

Visor **debug 3D** (:3019) — misma armazón que
[`@zeus/player-3d-ui`](../player-3d-ui) (Express, server-rendered, sin bundler,
kit + three vendorizados por import map) pero con una **escena distinta**:
visualización **radial del tráfico de la room**.

## Qué rinde

- Cada cliente conocido de la room se sienta en un **círculo** alrededor del origen.
- Cada evento observado en la room lanza una **partícula** desde el marcador del emisor
  hacia el centro, reutilizando el `TrajectoryManager` del kit.
- Demuestra que el kit sirve también una escena **no-map** (sin map-engine).

El entry del navegador es `assets/js/viewer-main.mjs`; el cliente room está en
`assets/js/room-client.browser.mjs`.

## Cómo arrancar

```bash
npm run start:debug-3d             # desde zeus-sdk/  → http://localhost:3019
# o:
npm start -w @zeus/player-debug-3d-ui
```

Para ver tráfico necesita scriptorium-server (:3017 `/runtime`) y una sesión activa
(player-ui en modo room como MASTER). Ver el README de `player-3d-ui` para el arranque
completo.

## Entorno

| Variable | Default | Uso |
|----------|---------|-----|
| `ZEUS_PORT_DEBUG_3D` | `3019` | puerto del visor |
| `ZEUS_HOST` | `localhost` | host de bind |
| `ZEUS_PORT_SCRIPTORIUM` | `3017` | puerto de scriptorium (inyectado en `#viewer-config`) |
| `ZEUS_SCRIPTORIUM_SESSION` | `default` | sessionId; `?session=` lo sobreescribe |
| `ZEUS_SCRIPTORIUM_ROOM` | `scriptorium.<sessionId>` | room observada |
| `ZEUS_SCRIPTORIUM_SECRET` | `dev-secret` | token de auth del socket |

## Rutas

`/` shell · `/health` json ok · `/kit` · `/models` · `/vendor/three` ·
`/vendor/socket.io` · `/assets`.

## Test

```bash
npm test   # 5/5 — health + shell + rutas vendorizadas
```
