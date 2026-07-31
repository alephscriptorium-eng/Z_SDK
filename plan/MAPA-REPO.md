# MAPA-REPO — packages/ por grupos + VOLUMES/ · docs/ · scripts/ · e2e/

**WP-U223** (regla #19 — `plan/BACKLOG.md:297`) · 2026-07-31.
**Apunta, no duplica**: la ficha de runtime por pieza (tipo · catálogo · engine/mesh ·
comando · puerto · disco · deps · peercard) vive en `plan/MATRIZ-RUNTIME-51.md` —
este mapa solo asegura que ninguna pieza ni fichero nuevo aparezca sin fila.

## packages/ — 48 dirs en 3 grupos (+2 examples workspace +1 anidada = 51)

Denominador canónico: `plan/MATRIZ-RUNTIME-51.md` §Denominador — globs de `workspaces`
(`package.json:6-11`) y su comando de enumeración (50 manifests + 1 anidada).
Verificación de este mapa: `ls -1A packages/engine packages/editor packages/mesh` →
26 + 1 + 21 dirs; cada nombre de abajo es una fila de la MATRIZ.

### packages/engine (26)

`acta-kit` · `app-shell` · `authority-kit` · `embajador-kit` · `feed-kit` ·
`firehose-core` · `game-engine` · `http-contract` · `lifecycle-kit` · `linea-kit` ·
`parte-kit` · `playbook-kit` · `player-mcp-kit` · `presets-sdk` · `protocol` ·
`reparto-kit` · `room-client-browser` · `rooms` · `socket-core` · `story-board-schema` ·
`test-utils` · `ui-3d-kit` · `ui-kit` · `view-kit` · `volumes-ops` · `webrtc-signaling`
→ fichas en MATRIZ §`packages/engine`.

### packages/editor (1)

`editor-ui` → ficha en MATRIZ §`packages/editor`.

### packages/mesh (21)

`3d-monitor` · `blob-sync-harness` · `blobstore-client` · `cache-browser` ·
`ciudad-lifecycle` · `console-monitor` · `firehose-browser` · `force-system` ·
`linea-editor` · `linea-firehose` · `linea-system` · `mcp-launcher` · `oasis-webrtc` ·
`operator-bridge` · `operator-ui` · `player-3d-ui` · `player-ui` · `socket-server` ·
`solar-system` · `ssb-system` · `webrtc-viewer` → fichas en MATRIZ §`packages/mesh`.

### examples/ (4 dirs · 2 cuentan en el denominador)

| entrada | qué es | referencia |
| --- | --- | --- |
| `game-demos/` | workspace `@zeus/game-demos` (fila MATRIZ) | MATRIZ §examples |
| `ping-pong-bots/` | workspace `@zeus/ping-pong-bots` (fila MATRIZ; `test:bots` `package.json:59`) | MATRIZ §examples |
| `external-consumer/` | consumidor **sin** `package.json` — excluido del denominador con motivo; se ejercita vía `smoke:external-consumer` (`package.json:133`) | §2 GOBIERNO: U214 · U212 |
| `ts-registry-consumer/` | consumidor **sin** `package.json` — excluido; se ejercita vía `smoke:ts-registry` (`package.json:134`) | MATRIZ §Denominador |

### pieza anidada (1)

`packages/mesh/operator-ui/projects/threejs-ui-lib/` — `@zeus/threejs-ui-lib`,
workspace Angular aislado del npm workspace (MATRIZ §Denominador y §pieza anidada).

## VOLUMES/ — fixtures sintéticos (post WP-U62)

Verificación: `ls -1A VOLUMES/` → 4 entradas. Contrato del árbol: `VOLUMES/README.md`.

| entrada | qué es | quién la posee/toca |
| --- | --- | --- |
| `DISK_02/` | fixture línea demo (`linea-kit/test/fixtures/lineas`) — tracked | carril D (§2 GOBIERNO: `VOLUMES/DISK_*` → U199 · U202 · U203 · U231 · U240 · U71R) |
| `DISK_03/` | fixture force-sample (`linea-kit/test/fixtures/forces`) — tracked | carril D (ídem) |
| `README.md` | contrato del árbol: qué queda aquí y qué sale por start packs / `ZEUS_VOLUMES_ROOT` | **caliente** §2 GOBIERNO: U211 (ola 1) → U210 (ola 2) → U209 (C-ext) |
| `volumes.json` | ids canónicos (`firehose`, `lineas`, `forces`, `ssb`) + slots `deferred` | carril D (ídem `DISK_*`) |

## docs/ — sitio VitePress

Verificación: `ls -1A docs/` → 11 entradas. Owner de conjunto: Lane E (BACKLOG :269-279).

| entrada | qué es | referencia |
| --- | --- | --- |
| `.vitepress/` | `config.mjs` + `theme/` — build `docs:build` (`package.json:74`), verify `docs:verify` (`:75`) | Lane E |
| `contracts/` | páginas de specs (`asyncapi.md`, `mcp-resources.md`, `openapi.md`) alimentadas por `spec:*` (`package.json:61-72`) | Lane E |
| `editor/` | sección del territorio editor | Lane E |
| `engine/` | sección del territorio engine | Lane E |
| `games/` | sección de juegos (catálogo Pages: reporte WP-U107) | Lane E |
| `guide/` | guías de uso; destino del puente documental U210 (GOBIERNO :328) | Lane E · U210 |
| `index.md` | portada del sitio | Lane E |
| `mesh/` | sección del territorio mesh (incl. `coturn-runbook.md`, GOBIERNO :208) | Lane E |
| `playbook/` | sección playbook | Lane E |
| `proyecto.md` | página del proyecto | Lane E |
| `public/` | assets estáticos del sitio | Lane E |

## scripts/ — operación a nivel repo

Verificación: `ls -1A scripts/` → 19 entradas. `estacion/` y `gates/` se detallan en
`plan/MAPA-TALLER.md` (zona de obra); aquí su fila de primer nivel.

| entrada | qué es (ref npm en `package.json`) | quién la posee/toca |
| --- | --- | --- |
| `audit-publish-allowlist.mjs` | audita allowlist de publicación (`audit:publish-allowlist` `:131`) | allowlist WP-U162 |
| `docs-dev.mjs` | dev server de docs (`docs:dev` `:73`) | Lane E |
| `estacion/` | watcher/checks de la estación — filas en MAPA-TALLER | **caliente** §2: U222 · U226 |
| `gate-publish-ready.mjs` | gate de publish-ready (`gate:publish-ready` `:132`) | flujo publish (WP-U105) |
| `gates/` | runner de gates del repo — filas en MAPA-TALLER | **caliente** §2: U233 · U231 |
| `import-legado/` | importación de legado | **caliente** §2: U207 · U71R |
| `mcp-inspector.mjs` | inspector MCP (`spec:inspector` `:72`) | Lane E (specs) |
| `release-changeset-dry.mjs` | dry-run de release por changesets (`release:changeset-dry` `:130`) | flujo release |
| `release-dry.mjs` | dry-run de release (`release:dry` `:129`) | flujo release |
| `seed-aleph-presets.mjs` | siembra `data/seeds/aleph-presets.json` (`seed:aleph` `:84`) | — |
| `smoke-dual-ui.mjs` | smoke dual UI — **sin script npm** (grep en `package.json` → 0) | — (huella; candidata a revisión) |
| `smoke-external-consumer.mjs` | smoke del consumidor externo (`smoke:external-consumer` `:133`) | **caliente** §2: U214 · U212 (lee patrón) |
| `smoke-ts-registry.mjs` | smoke del consumidor TS-registry (`smoke:ts-registry` `:134`) | — |
| `spec-asyncapi-html.mjs` | HTML de AsyncAPI (`spec:asyncapi:html` `:70`) | Lane E (specs) |
| `spec-generate.mjs` | genera spec HTTP (`spec:generate:http` `:62`) | Lane E (specs) |
| `spec-redoc.mjs` | Redoc de OpenAPI (`spec:redoc` `:69`) | Lane E (specs) |
| `spec-studio.mjs` | Studio de specs (`spec:studio` `:71`) | Lane E (specs) |
| `stop-ports.sh` | libera puertos (`stop:ports` `:90`) | — |
| `stop-services.mjs` | para servicios (`stop:services` `:88`) | — |

## e2e/ — demos y aceptación por escenario

Verificación: `ls -1A e2e/` → 26 entradas. Invocación: scripts `e2e:*`
(`package.json:46,91-124`). **Hueco detectado**: `e2e:playbook-kit` (`package.json:124`)
apunta a `e2e/playbook-kit-demo.mjs`, que **no existe** (`ls` → No such file);
se registra aquí, no se corrige en este WP (`package.json` prohibido).

| entrada | qué es (ref npm) |
| --- | --- |
| `deck-demo.mjs` | `e2e:deck` (`:92`) |
| `deck-room-demo.mjs` | `e2e:deck:room` (`:93`) |
| `demo.mjs` | `e2e` (`:91`) |
| `domain-firehose.mjs` | `e2e:domain:firehose` (`:108`) |
| `domain-helpers.mjs` | lib compartida — importada por los `domain-*.mjs` (grep `domain-helpers` en `e2e/`) |
| `domain-manifest.mjs` | `e2e:domain:manifest` (`:106`) |
| `domain-map.mjs` | `e2e:domain:map` (`:107`) |
| `domain-selection.mjs` | `e2e:domain:selection` (`:109`) |
| `domain.mjs` | `e2e:domain` (`:105`) |
| `dual-ui-demo.mjs` | `e2e:dual-ui` (`:96`) |
| `e2e-bridge.mjs` | `e2e:bridge` (`:104`) |
| `feed-families-demo.mjs` | `e2e:feed-families` (`:46`) |
| `firehose-deck-demo.mjs` | `e2e:firehose-deck` (`:103`) |
| `firehose-demo.mjs` | `e2e:firehose` (`:101`) |
| `firehose-links-demo.mjs` | `e2e:firehose-links` (`:102`) |
| `games-root.mjs` | **sin script npm** (grep → 0); huella |
| `helpers.mjs` | lib compartida — importada por varios demos (grep `helpers.mjs` en `e2e/`) |
| `operator-ui-demo.mjs` | `e2e:operator-ui` (`:95`) |
| `peer-card-chain.mjs` | `e2e:peer-card-chain` (`:111`) — referencia de U186 (GOBIERNO :133) |
| `player-3d-demo.mjs` | `e2e:player-3d` (`:94`) |
| `player-ui-dj-demo.mjs` | `e2e:player-ui-dj` (`:123`) |
| `ssb-webrtc-signaling.mjs` | `e2e:ssb-webrtc-signaling` (`:117`) — evidencia Lane C (GOBIERNO :210) |
| `tablero-aleph-demo.mjs` | `e2e:tablero` (`:99`) |
| `view-demo.mjs` | `e2e:view` (`:100`) |
| `webrtc-signaling.mjs` | `e2e:webrtc-signaling` (`:110`) — Lane C (GOBIERNO :203) |
| `webrtc-viewer.mjs` | `e2e:webrtc-viewer` (`:116`) |

---

Gate de este mapa: propuesta en `plan/MAPA-TALLER.md` §«Propuesta de gate `verificar-territorio-mapa`».

**entrada sin fila = FAIL** — todo lo nuevo en este territorio añade su fila en el mismo cambio.
