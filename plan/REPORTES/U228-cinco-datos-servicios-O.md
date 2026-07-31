# U228 — Cinco datos por servicio para O (compose/nodo)

**WP-U228** (P0 · ola 2 · `plan/BACKLOG.md:307`) · deriva de **U179 ✅**
(`plan/MATRIZ-RUNTIME-51.md`) — este documento **apunta** a la matriz, no la
duplica: proyecta sus 8 columnas a los 5 datos que O necesita para escribir
compose **con un patrón, no 17 casos**. El consumidor es el mundo O; aquí se
**describe** el runtime de Z — cómo O lo componga es obra de O.

**Convenciones de cita** (todas resolubles por grep):

- `M:<n>` = `plan/MATRIZ-RUNTIME-51.md` línea n (la fila de la pieza, con su
  evidencia completa de 8 columnas).
- `env:<n>` = `packages/engine/presets-sdk/src/env/index.mjs` línea n — misma
  convención que la matriz (M:33-35).
- `raíz:<n>` = `package.json` de la raíz del repo, línea n.
- Resto: `ruta:línea` relativa a la raíz del repo.

---

## 1 · Denominador: qué es un SERVICIO (19 de 51)

De las **51 piezas** de la matriz (M:17), es *servicio* la que se **arranca
como proceso** con comando real **y** escucha puerto o es proceso servidor.
Aplicando ese filtro a las columnas `comando` + `puerto` de la matriz:

- **19 piezas-servicio** → **22 procesos-puerto** (dos piezas arrancan varios
  servers en un proceso: linea-system ×2, solar-system ×3 — ver §2.1-V3).
- **8 piezas arrancables que NO son servicio** (comando real, pero ni puerto
  ni proceso servidor) — quedan fuera del compose como *services* aunque O
  pueda usarlas como jobs:
  - `@zeus/feed-kit` — job de sync, no escucha (M:64; comando raíz:44).
  - `@zeus/linea-kit` — CLI por bin, sin start (M:69).
  - `@zeus/playbook-kit` — CLI cliente, no escucha (M:71).
  - `@zeus/volumes-ops` — servidor REST **embebible**, sin start propio;
    puerto del llamador, default 0 efímero (M:84).
  - `@zeus/blob-sync-harness` — spike de validación, sin listen (M:98).
  - `@zeus/blobstore-client` — fixture con `listen(0)` efímero, puerto fuera
    del env (M:99).
  - `@zeus/game-demos` y `@zeus/ping-pong-bots` — procesos **cliente** de
    sesión, sin puerto (M:123-124). Si O los quiere como contenedor, el
    patrón §2 aplica con la fila `puerto` vacía.
- **24 libs que no se arrancan** (columna comando = «no se arranca (lib)» en
  su fila M): acta-kit, app-shell, authority-kit, embajador-kit,
  firehose-core, game-engine, http-contract, lifecycle-kit, parte-kit,
  player-mcp-kit, presets-sdk, protocol, reparto-kit, room-client-browser,
  rooms, socket-core, story-board-schema, test-utils, ui-3d-kit, ui-kit,
  view-kit, webrtc-signaling (M:60-85), operator-bridge (M:110),
  threejs-ui-lib (M:130). **Las libs quedan fuera** del denominador.

Cuadre: 19 + 8 + 24 = 51 ✓.

Dato de contexto: hoy **no existe arranque orquestado** en el repo — los
scripts `start:v1-zeus` y `start:all` son *echo* de instrucciones para
terminales paralelos (raíz:33-34). El compose de O ocupa un hueco real.

---

## 2 · EL PATRÓN — plantilla única de servicio

Todo servicio del §3 es **una instancia de parámetros** de esta plantilla
(las excepciones, contadas y declaradas en §2.1):

```text
servicio <alias>:
  comando : npm run start:<alias>          # raíz:<L> ≡ `npm run start -w <@zeus/pkg>`
  puerto  : <default> (env:<L-default>)    # cómo cambia: override <ZEUS_MCP_*|ZEUS_PORT_*> (env:<L-override>)
  disco   : <lee|escribe VOLUMES/DISK_*  ·  dataDir  ·  assets locales  ·  ninguno>
  deps    : <@zeus/* runtime del package.json de la pieza>
  peercard: <emite | porta | verifica | no>
```

- **comando** — forma única: alias `start:*` en el `package.json` raíz que
  delega en `npm run start -w <@zeus/pkg>` (raíz:16-31 y raíz:121-122). Una
  sola excepción de forma (D2, §2.1).
- **puerto** — default y override salen de la **fuente única de puertos**
  (`presets-sdk` env: defaults MCP env:36-48 y UI env:70-90; overrides
  `ZEUS_MCP_*` env:51-67 y `ZEUS_PORT_*` env:93-107 — convención M:33-35).
  Una sola excepción estructural (E1, §2.1) y tres variantes de nombre (V1).
- **disco** — proyección de la columna `disco` de la matriz: qué rutas
  `VOLUMES/DISK_*`, dataDir o assets toca el proceso, o «ninguno».
- **deps** — columna `deps @zeus (runtime)` de la matriz (los `@zeus/*` de
  `dependencies`; workspace = contexto de build, no imagen por paquete).
- **peercard** — columna `peercard` de la matriz, reducida al verbo:
  emite / porta / verifica / no.

### 2.1 · Lo que NO cabe en el patrón (declarado, no forzado)

**E1 — `ciudad-lifecycle`: puerto FUERA del env central** — **✎
orquestador: HISTÓRICA desde 2026-07-31.** U227 ✅ añadió el slot a la
fuente única (`presets-sdk/src/env/index.mjs`: `ciudadLifecycle.disk`
default 3051 + `ZEUS_MCP_CIUDAD_LIFECYCLE`) y el env generado ya lo emite
(comentado). La pieza sigue leyendo el mismo nombre
(`packages/mesh/ciudad-lifecycle/src/server.mjs:13-16`); su migración a
consumir el resolver central es de U234/lane F. [Texto original: cita
inerte — el hallazgo era de U179; ya no hay servicio cuyo puerto no
resuelva contra la fuente única.]

**D2 — `operator-ui`: comando fuera de la forma única.** El alias raíz es
`node packages/mesh/operator-ui/serve.mjs` (raíz:32), no `npm run start -w`.
Además exige **build previo** (`build:operator-ui`, raíz:56) porque sirve
`dist/index.html` (`packages/mesh/operator-ui/serve.mjs:131`; M:111).

**V1 — override con doble nombre** (variante: la celda override es lista,
no excepción estructural — el default sí está en env):
- `socket-server`: `ZEUS_PORT_SCRIPTORIUM` / `ZEUS_SCRIPTORIUM_PORT`
  (`packages/mesh/socket-server/src/config.mjs:27-32`; env:104; M:114).
- `operator-ui`: `OPERATOR_UI_PORT` / `ZEUS_PORT_OPERATOR_UI`
  (`packages/mesh/operator-ui/serve.mjs:65-67`; env:100; M:111).
- `webrtc-viewer`: `WEBRTC_VIEWER_PORT` / `ZEUS_PORT_WEBRTC_VIEWER`
  (`packages/mesh/webrtc-viewer/serve.mjs:54-57`; env:102; M:117).

**V3 — una pieza, un proceso, varios servers.** Un solo comando arranca
varios listeners con puertos propios: `linea-system` (2: espana 4111 +
wp-historia 4112; `packages/mesh/linea-system/src/start.mjs:1-3`; M:107) y
`solar-system` (3: sun/moon/earth 4101-4103;
`packages/mesh/solar-system/src/start.mjs:1-3`; M:115). Cabe en el patrón
con `puerto` = lista; O no debe asumir 1 puerto por servicio.

**N1 — `console-monitor` es TUI + MCP en el mismo start** («TOP-style
console monitor + MCP server», `packages/mesh/console-monitor/package.json:4`,
start `:8`; M:102): proceso con cara de consola — dato para O al decidir
tty/headless; aquí solo se describe.

**N2 — `ssb-system` tiene un segundo comando que NO es el servicio**: el job
`volumes:sync:ssb` (raíz:43) escribe DISK_04; el servicio (raíz:19) solo lee
(M:116).

**Inverso (no derivable a servicio)** — el catálogo declara entradas **sin
pieza en el workspace**: `arg-player-uno`/`arg-player-dos`/`pozo-player`/
`solve-player` con `workspace: null`
(`packages/mesh/mcp-launcher/src/catalog.mjs:167`, `:178`, `:188`, `:198`) y
6 hojas `workspace: null` del catálogo extendido
(`packages/mesh/ciudad-lifecycle/src/catalog-extend.mjs:96`) (M:24-27). De
una entrada de catálogo sin pieza **no sale servicio compose**: no hay
comando ni package que arrancar.

---

## 3 · Las 19 instancias (orden por puerto)

Cada celda cita la fila de la matriz (`M:<n>`) o `ruta:línea` directa; la
evidencia de 8 columnas vive en la fila M citada.

| # | servicio (`@zeus/…`) | comando (raíz) | puerto default · override | disco | deps `@zeus/*` runtime | peercard |
|---|---|---|---|---|---|---|
| 1 | linea-firehose | `start:firehose-mcp` raíz:28 | 3008 env:42 · `ZEUS_MCP_FIREHOSE` env:60 (M:106) | lee DISK_01/FIREHOSE (M:106) | firehose-core, presets-sdk (M:106) | no (M:106) |
| 2 | editor-ui | `start:editor` raíz:23 | 3012 env:71 · `ZEUS_PORT_EDITOR` env:94 (M:91) | escribe `world-draft.json` en dataDir (M:91) | app-shell, game-engine, http-contract, linea-kit, playbook-kit, presets-sdk, story-board-schema, test-utils, ui-kit (M:91) | no (M:91) |
| 3 | player-ui | `start:player` raíz:24 | 3013 env:72 · `ZEUS_PORT_PLAYER` env:95 (M:113) | lee DISK_02/LINEAS (M:113) | app-shell, firehose-core, http-contract, presets-sdk, protocol, room-client-browser, rooms, test-utils, ui-kit (M:113) | no (M:113) |
| 4 | console-monitor | `start:console-monitor` raíz:25 (N1: TUI) | 3014 env:44 · `ZEUS_PORT_PLAYER_DEBUG` env:62 (M:102) | ninguno (M:102) | app-shell, presets-sdk (M:102) | no (M:102) |
| 5 | cache-browser | `start:cache-browser` raíz:26 | 3015 env:73 · `ZEUS_PORT_VIEW` env:96 (M:100) | lee DISK_02/LINEAS (M:100) | app-shell, http-contract, linea-system, presets-sdk, rooms, test-utils, ui-kit (M:100) | no (M:100) |
| 6 | firehose-browser | `start:firehose` raíz:27 | 3016 env:74 · `ZEUS_PORT_FIREHOSE` env:97 (M:103) | lee DISK_01 vía firehose-core (M:103) | app-shell, firehose-core, http-contract, presets-sdk, rooms, test-utils, ui-kit (M:103) | no (M:103) |
| 7 | socket-server | `start:socket-server` raíz:29 | 3017 env:87 · `ZEUS_PORT_SCRIPTORIUM`/`ZEUS_SCRIPTORIUM_PORT` (V1) (M:114) | lee admin-ui estático; sin VOLUMES (M:114) | presets-sdk, rooms, socket-core (M:114) | no en src — el porte lo hace el cliente rooms (M:114) |
| 8 | player-3d-ui | `start:player-3d` raíz:30 | 3018 env:75 · `ZEUS_PORT_PLAYER_3D` env:98 (M:112) | ninguno propio; config vía app-shell (M:112) | app-shell, presets-sdk, room-client-browser, ui-3d-kit, ui-kit, view-kit, game-engine (M:112) | no (M:112) |
| 9 | 3d-monitor | `start:3d-monitor` raíz:31 | 3019 env:76 · `ZEUS_PORT_DEBUG_3D` env:99 (M:97) | ninguno propio; config vía app-shell (M:97) | app-shell, presets-sdk, room-client-browser, ui-3d-kit, ui-kit, view-kit (M:97) | no (M:97) |
| 10 | operator-ui | `start:operator-ui` raíz:32 (**D2**: `node serve.mjs` + build previo raíz:56) | 3020 env:77 · `OPERATOR_UI_PORT`/`ZEUS_PORT_OPERATOR_UI` (V1) (M:111) | lee `dist/index.html` (M:111) | operator-bridge, room-client-browser, ui-3d-kit (M:111) | **verifica** en `/api/puerta/enter` (M:111) |
| 11 | oasis-webrtc | `start:oasis-webrtc` raíz:122 | 3022 env:82 · `ZEUS_PORT_OASIS_WEBRTC` env:103 (M:109) | lee assets public; sin VOLUMES (M:109) | presets-sdk, webrtc-signaling (M:109) | no (M:109) |
| 12 | webrtc-viewer | `start:webrtc-viewer` raíz:121 | 3023 env:79 · `WEBRTC_VIEWER_PORT`/`ZEUS_PORT_WEBRTC_VIEWER` (V1) (M:117) | lee assets (M:117) | linea-kit, presets-sdk, protocol, room-client-browser, webrtc-signaling (M:117) | **porta** (M:117) |
| 13 | mcp-launcher | `start:mcp-launcher` raíz:20 | 3050 env:43 · `ZEUS_MCP_LAUNCHER` env:61 (M:108) | ninguno — estado en memoria (M:108) | presets-sdk (M:108) | no (M:108) |
| 14 | ciudad-lifecycle | `start:ciudad-lifecycle` raíz:22 | 3051 `server.mjs:13` · `ZEUS_MCP_CIUDAD_LIFECYCLE` `server.mjs:16` — **E1: fuera del env central** (M:101) | ninguno (M:101) | lifecycle-kit, mcp-launcher, presets-sdk (M:101) | no (M:101) |
| 15 | solar-system | `start:solar` raíz:16 (**V3**: 1 proceso, 3 servers) | 4101/4102/4103 env:37 · `ZEUS_MCP_SUN/MOON/EARTH` env:52-54 (M:115) | ninguno — datos deterministas (M:115) | http-contract, presets-sdk (M:115) | no (M:115) |
| 16 | linea-system | `start:lineas` raíz:17 (**V3**: 1 proceso, 2 servers) | 4111/4112 env:38 · `ZEUS_MCP_LINEA_ESPAN`/`ZEUS_MCP_LINEA_WP` env:55-56 (M:107) | lee DISK_02/LINEAS (M:107) | http-contract, linea-kit, presets-sdk (M:107) | no (M:107) |
| 17 | force-system | `start:forces` raíz:18 | 4113 env:39 · `ZEUS_MCP_FORCES` env:57 (M:104) | lee DISK_03/FORCES (M:104) | http-contract, linea-kit, presets-sdk (M:104) | no (M:104) |
| 18 | ssb-system | `start:ssb` raíz:19 (N2: el job sync raíz:43 es aparte) | 4114 env:40 · `ZEUS_MCP_SSB` env:58 (M:116) | lee DISK_04/SSB (M:116) | linea-kit, presets-sdk (M:116) | no (M:116) |
| 19 | linea-editor | `start:linea-editor` raíz:21 | 4115 env:41 · `ZEUS_MCP_LINEA_EDITOR` env:59 (M:105) | base VOLUMES/LINEAS; escribe story-board exportado (M:105) | http-contract, linea-kit, presets-sdk, reparto-kit, story-board-schema (M:105) | **verifica** (gate peer-card + approval token) (M:105) |

Resumen peercard sobre el denominador: 2 **verifican** (operator-ui,
linea-editor), 1 **porta** (webrtc-viewer), 16 **no** tocan peercard en su
src (el porte de sesión viaja en la lib cliente `@zeus/rooms` — M:77, M:114).
Quien emite (authority-kit, embajador-kit) y quien define el formato
(protocol) son **libs**, no servicios (M:62-63, M:74).

---

## 4 · Lo que O NO debe asumir

1. **Secretos jamás en volúmenes.** GATE-O-CLAVES es doctrina de O (solo se
   cita: en este árbol aparece únicamente en `plan/BACKLOG.md:310`, `:360` y
   `sincronia/notas/` — `plan/GOBIERNO-EJECUCION-F2.md:478`). U231 (P0,
   `plan/BACKLOG.md:310`) lo convertirá en gate sobre `VOLUMES/**` y
   contexto de imagen: un volumen que exige secreto para leerse = mal
   diseñado. O no monta identidad ni claves dentro de un volumen.
2. **Root de volúmenes por env, obligatorio (◆5/U200 ✅).**
   `ZEUS_VOLUMES_ROOT` es MANDATORIO: sin env → fallo honesto «not
   operable»; sin default, sin walk por cwd; root dentro de `node_modules`
   **rechazado** aunque el env apunte ahí
   (`packages/engine/presets-sdk/src/volumes/resolve.mjs:8`, `:14-23`;
   `plan/BACKLOG.md:257`). O no puede asumir que el proceso «encuentra» sus
   volúmenes: el compose debe inyectar el root por env, siempre.
3. **Manifiesto sellado RO+hash (U199 ✅).** `VOLUMES/volumes.json` es
   read-only en runtime y va hasheado; los contadores vivos van en
   `volumes.state.json`, que nunca entra en el hash
   (`packages/engine/volumes-ops/src/counters.mjs:2-9`;
   `plan/BACKLOG.md:256`). O no debe montar el manifiesto escribible ni
   esperar que el runtime lo mute.
