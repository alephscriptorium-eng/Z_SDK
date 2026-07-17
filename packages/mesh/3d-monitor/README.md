# @zeus/3d-monitor

**Portal de vistas 3D** (:3019) sobre el runtime del scriptorium — misma armazón
que [`@zeus/player-3d-ui`](../../app/player-3d-ui) (Express, server-rendered,
sin bundler, kit + three vendorizados por import map), pero ya **no es una
vista**: es un **portal de vistas** construido sobre un **view kit** reutilizable.

> Antes se llamaba `@zeus/player-debug-3d-ui` y vivía en `packages/app/`;
> ahora vive en `packages/platform/3d-monitor`.

## Vistas

| Vista | Ruta | Qué rinde |
|-------|------|-----------|
| 🌀 Portal | `/` | galería de vistas registradas (una card por vista) |
| 🛰️ **Default** | `/views/default` | la vista radial original: clientes de la room en círculo, eventos como partículas al hub |
| 🕸️ **Ecosystem** | `/views/ecosystem` | rabbits/spiders/horses con marker por rol, **canales federados** (RNFP de spider) como arcos con pulsos, y un **agujero negro** que traga el tráfico sin clasificar y a los pares silenciosos |
| 🌌 **Flux** | `/views/flux` | estación orbital: cada cliente es un **nodo etiquetado** (sprite con nombre) ubicado deterministamente por su identidad y rol; el tráfico corre por **tuberías** con pulsos (ping↔pong, malla de descubrimiento rabbit, canales federados spider, JSON-RPC horse); el **agujero negro se forma del buffer de announces** (colapsa al superar el umbral y se evapora al drenarse); los horses despliegan su **forja** con un satélite por tool ofrecida |
| 🗺️ **Gamemap** | `/views/gamemap` | el tablero real de `npm run demo:game`: escena **vaivén-dos-nodos** (plataformas, corredor, anclas con ocupación) construida con las piezas de `ui-3d-kit`, el robot como **puppet GLB** dirigido por los `GAME_STATE` de la autoridad (con dead reckoning entre snapshots), y cada `GAME_INTENT` corriendo como fantasma por el corredor; observa `PUBLIC_ROOM` por defecto (`defaultRoom` del descriptor) |
| 🏓 **Bots Log** | `/views/bots-log` | log visual de `npm run demo:bots`: una columna 3D por rol que crece con su actividad + panel DOM con el detalle coloreado de cada evento |

## View kit (crear una vista nueva)

Una vista es un **layout** que combina elementos reutilizables con su propia
lógica de negocio:

- **Servidor** (`src/view-kit/`): `defineView({...})` normaliza el descriptor
  (id, title, entry, campos de HUD, log panel…), `createViewRegistry` lo indexa
  y `renderViewLayout` rinde el layout compartido (stage + HUD + import map +
  `#viewer-config` + entry del navegador).
- **Navegador genérico** (`@zeus/view-kit`, montado en `/view-kit`):
  `createViewerScene`, `setText`/`createCounters`, `connectRoom`/
  `readViewerConfig`, `createLogPanel`, `createLabelSprite`/`createGlowSprite`,
  `onChannelEvent` (suscripción resiliente dual-wire con dedupe).
- **Helpers del monitor** (`assets/js/monitor/`): `classifyRole`/`channelFor`
  (cast demo:bots), `createRingLayout`, `createMarker`/`createHub`/
  `createBlackHole`, `createPipeNetwork` — específicos del tráfico de room
  que este portal visualiza.

La room de cada vista se resuelve `?room=` → `ZEUS_SCRIPTORIUM_ROOM` →
`defaultRoom` del descriptor → `scriptorium.<sessionId>` — el mismo orden con
el que los demos resuelven la suya, así una vista que sigue a un demo aterriza
donde el demo juega.

Para añadir una vista:

1. `defineView({ id, title, entry: '/assets/js/views/mi-vista.mjs', hud: {...} })`
   en `src/views/registry.mjs`.
2. Escribir la lógica en `assets/js/views/mi-vista.mjs` importando de
   `@zeus/view-kit` y, si hace falta, de `../monitor/index.mjs`.
3. (Opcional) añadirla al `localNav` de `src/config.json`.

El portal, el routing (`/views/:id`) y `/health.views` la recogen del registry.

## Cómo arrancar

```bash
npm run start:3d-monitor           # desde zeus-sdk/  → http://localhost:3019
# o:
npm start -w @zeus/3d-monitor
```

Para ver tráfico necesita socket-server (:3017 `/runtime`) y una sesión activa
(player-ui en modo room como MASTER). Las vistas Ecosystem y Bots Log lucen con
`npm run demo:bots` corriendo. Ver el README de `player-3d-ui` para el arranque
completo.

## Entorno

| Variable | Default | Uso |
|----------|---------|-----|
| `ZEUS_PORT_DEBUG_3D` | `3019` | puerto del monitor |
| `ZEUS_HOST` | `localhost` | host de bind |
| `ZEUS_PORT_SCRIPTORIUM` | `3017` | puerto de scriptorium (inyectado en `#viewer-config`) |
| `ZEUS_SCRIPTORIUM_SESSION` | `default` | sessionId; `?session=` lo sobreescribe |
| `ZEUS_SCRIPTORIUM_ROOM` | `scriptorium.<sessionId>` | room observada |
| `ZEUS_SCRIPTORIUM_SECRET` | `dev-secret` | token de auth del socket |

## Rutas

`/` portal · `/views/:id` vista · `/health` json ok (incluye `views`) · `/kit`
(ui-3d-kit) · `/view-kit` · `/models` · `/vendor/three` · `/vendor/socket.io` ·
`/assets`.

## Test

```bash
npm test   # health + portal + vistas + rutas vendorizadas
```
