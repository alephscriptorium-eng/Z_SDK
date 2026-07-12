# @zeus/player-3d-ui

Visor de **sesión 3D** (:3018) — cliente room del runtime scriptorium. Express,
server-rendered, sin bundler: sirve la shell + los assets crudos de
[`@zeus/ui-3d-kit`](../../lib/ui-3d-kit) y three.js vendorizado, y el navegador
resuelve todo por import map.

## Qué rinde

- **Escena `vaivén-dos-nodos`** del kit (dos nodos + corredor de enlace + anclas).
- **Marionetas reactivas** que aparecen *on demand* según la presencia detectada en
  los eventos de room y coreografían el tráfico de la sesión:

  | Evento de room | Acción (walk-driver / adapter) | Animación |
  |----------------|--------------------------------|-----------|
  | presencia (from/actorId nuevo) | spawn + registro en ancla libre | idle (sit) |
  | `PING {from}` | walk home→far | walk → idle al llegar |
  | `PONG {from}` | walk far→home | walk + emote (wave) |
  | `selection:cast {actorId, targetId, label, deckId}` | settle en el ancla del nodo del deck | sit + emote (thumbsUp), etiqueta = `label ?? targetId`, HUD |
  | `session:state` (snapshot) | sin intents; reconcilia etiquetas (idempotente, para viewers que entran tarde) | etiqueta desde `selections.byActor` |

- **HUD DOM** con el estado de la sesión (deck, playhead, selecciones).

La coreografía vive en `assets/js/event-choreographer.mjs` (browser ESM, sin three:
solo dirige engine/adapter/puppets, así es unit-testable con stubs). El cliente room
del navegador está en `assets/js/room-client.browser.mjs`.

## Cómo arrancar

```bash
npm run start:player-3d            # desde zeus-sdk/  → http://localhost:3018
# o directamente:
npm start -w @zeus/player-3d-ui
```

Necesita, para tener sesión viva:

1. **scriptorium-server** (`npm run start:scriptorium-server`, :3017 `/runtime`).
2. **player-ui en modo room** (`ZEUS_SESSION_TRANSPORT=room npm run start:player`),
   que es el MASTER de `scriptorium.<sessionId>` y emite los `SET_STATE`.

Sin ellos la shell rinde igual (health + escena vacía), pero no hay tráfico que
coreografiar.

## Entorno

| Variable | Default | Uso |
|----------|---------|-----|
| `ZEUS_PORT_PLAYER_3D` | `3018` | puerto del visor |
| `ZEUS_HOST` | `localhost` | host de bind |
| `ZEUS_PORT_SCRIPTORIUM` | `3017` | puerto de scriptorium (inyectado en `#viewer-config`) |
| `ZEUS_SCRIPTORIUM_SESSION` | `default` | sessionId; `?session=` en la URL lo sobreescribe |
| `ZEUS_SCRIPTORIUM_ROOM` | `scriptorium.<sessionId>` | room a la que se une el viewer |
| `ZEUS_SCRIPTORIUM_SECRET` | `dev-secret` | token de auth del socket |

## Rutas

`/` shell (import map + canvas + `#viewer-config`) · `/health` json ok ·
`/kit` fuentes crudas del kit · `/models` GLB placeholder · `/vendor/three` ·
`/vendor/socket.io` · `/assets` shell ui-kit.

## Test

```bash
npm test   # 15/15 — health, shell, rutas vendorizadas + coreografía con stubs
```

Cobertura e2e: `npm run e2e:player-3d` (desde zeus-sdk/) levanta scriptorium +
player-ui room + este visor + el debug, valida la shell y un `selection:cast`
extremo a extremo.
