# ARQUITECTURA — estado actual y objetivo

## 1. Diagnóstico (mapeado el 2026-07-15; verifica antes de fiarte si pasan semanas)

El repo se importó como baseline git el 2026-07-12: la historia git NO mide
antigüedad real. El mapa salió de leer imports reales, no de suposiciones.

### Lo que está vivo (núcleo consumido por todos)

| paquete | rol | consumidores |
| ------- | --- | ------------ |
| `@zeus/presets-sdk` | columna vertebral: catálogo MCP, presets, env/puertos, HORSE | ~20+ paquetes |
| `@zeus/rooms` | cliente de rooms (envuelve `@alephscript/mcp-core-sdk`), env `ZEUS_SCRIPTORIUM_URL` | ~12 |
| `@zeus/http-contract` | RouteEntry + envelopes zod + OpenAPI + middleware | ~10 |
| `@zeus/ui-kit` / `@zeus/app-shell` | shell UI + bootstrap de apps | ~8 c/u |
| `@zeus/ui-3d-kit` / `@zeus/game-engine` | kit three.js vanilla + motor de gamemap puro | ~6 c/u |
| `@zeus/session-protocol` / `session-domain` / `tablero-core` | protocolo/dominio de la sesión Scriptorium (la familia que muere absorbida en la ola 3) | player-ui y satélites |

### El problema central: dos protocolos para el mismo juego

| | sesión Scriptorium | delta (patrón bueno) |
| --- | --- | --- |
| room | `scriptorium.<sessionId>` | `ARG_DELTA` |
| estado | `session:state` (master = player-ui, snapshot xstate) | `arg:state` 10 Hz (autoridad única, snapshot compacto G-ARG.5) |
| entrada | `selection:cast`, `domain:*` | `arg:intent` (reducer puro, rechazo silencioso) |
| registro | — | `arg:ledger` + `arg:track` |
| validación | tests | tests + CASOS.md + acta + MCP por actor |

### Deuda concreta detectada

- `firehose-core`: `test` = `echo 'sin tests'`. `room-client-browser`: 0
  archivos de test.
- `arg-console` evita `app-shell` a propósito (config con whitelist molesta) y
  lleva su propio kit de navegador (~4.600 LOC en `assets/js/kit/`) que solapa
  con `ui-3d-kit` y el view-kit del `3d-monitor` del que nació.
- `packages/games/delta/README.md` lista 3 de 5 paquetes.
- `arg-demos/launch.mjs` lanza cache/firehose-browser por **ruta de archivo**
  a `packages/mesh/*`, no por import.

## 2. Layout objetivo del monorepo

```
packages/
  engine/    # el SDK: lo genérico, publicable
    protocol/          # NUEVO — envelope state|intent|track|ledger, makeIntent, roles, gates
    authority-kit/     # NUEVO — autoridad genérica: registry de reducers, tick, snapshot, ledger
    player-mcp-kit/    # NUEVO — patrón MCP-por-actor con semántica verificable
    view-kit/          # NUEVO — kit de vistas 3D+HTML (nace del kit de arg-console)
    playbook-kit/      # NUEVO — formato CASOS, test de coherencia, plantilla acta, runner de evidencia
    game-engine/  rooms/  presets-sdk/  http-contract/
    ui-kit/  ui-3d-kit/  app-shell/  firehose-core/  test-utils/
  editor/    # mundo A: crear juegos
    editor-ui/         # de CRUD de presets → editor de gamemap/release
  mesh/      # mundo B: operar y jugar
    socket-server/  player-ui/  operator-ui/  operator-bridge/
    cache-browser/  firehose-browser/  console-monitor/  3d-monitor/
    linea-system/  linea-firehose/  force-system/  ssb-system/  solar-system/
    webrtc-ui/         # ola 10 — visor WebRTC (salas/privados), hermano Angular de operator-ui
  games/     # en el monorepo hasta la ola 6; después, repo Z_SDK-games-library (§6)
    delta/             # el actual packages/games/delta/* (domain, feeds, console, player-mcp, demos, spec)
    pozo/              # el segundo juego, mínimo a propósito (gate de abstracción, D-8)
examples/    # game-demos, ping-pong-bots + escenas mínimas de view-kit — material didáctico
```

Notas:
- El movimiento de carpetas es la ola 5 (WP-U51), **al final**, cuando los
  paquetes nuevos ya existen y los muertos ya no están. Renombrar primero solo
  rompe imports sin dar valor. Excepción: la identidad del juego
  (CAUDAL → delta) se renombra ya en la ola 0 (WP-U02) porque es barata y
  cada día que pasa produce más docs con el nombre muerto.
- **Regla de los dos juegos** (D-8): `engine/*` no menciona `delta` ni `pozo`
  ni ningún concepto exclusivo de un juego (hay gate). Si una abstracción del
  engine solo la consume un juego, es sospechosa de ser juego disfrazado:
  se reporta.
- `session-protocol`, `session-domain` y `tablero-core` no aparecen en el
  objetivo: lo que tienen de dominio de líneas/decks se absorbe en el dominio
  del juego y en `protocol`; el resto muere (ola 3).
- `player-3d-ui` y `3d-monitor` (D-9): viven en `mesh/` como los visores del
  sistema, y el engine se ilustra en `examples/` con escenas/configs mínimas
  de view-kit que esos mismos visores reutilizan. Sin copias.

## 3. El contrato único (lo que implementa `engine/protocol`)

Generalización directa de `packages/games/delta/arg-domain/src/contract.mjs` +
`spec/CONTRATO.md`, que ya funcionan:

- Eventos: `state` (snapshot @Hz de la autoridad), `intent` (petición de
  mutación de un actor), `track` (pista de navegación, no muta), `ledger`
  (hecho registrado). El namespace por juego va en el envelope (`game:
  "delta"`), no multiplicando nombres de evento.
- `makeIntent(actorId, intent, args, from)` con versión de protocolo, ts y
  validación de forma.
- **Roles**: cada definición de intent declara `roles: ['player'|'dj'|'operator']`.
  El reducer rechaza intents de un rol no autorizado igual que rechaza un move
  sin enlace.
- Gates genéricos (heredan de G-ARG.1..5): una autoridad por room; vistas solo
  proyectan y emiten intents; dominio browser-safe sin red; reducers puros con
  tabla de handlers; presupuesto de snapshot.
- **AsyncAPI se genera de este contrato** (sustituye al `spec:generate` de
  session-protocol). OpenAPI sigue saliendo de `http-contract`. La proyección
  MCP resource/resource-template sale de la misma definición (ola 4).

## 4. Reglas de dependencia (gates de la ola 0)

1. `games/*` y `mesh/*` y `editor/*` importan de `engine/*`. Nunca al revés.
2. Nada importa de `games/*` salvo sus propios subpaquetes y los launchers.
3. Dominio de juego: browser-safe, sin red, sin fs (los feeds node-only van en
   paquete propio, patrón `arg-feeds`).
4. Puertos y URLs SOLO desde los resolvers de `presets-sdk/env`
   (`resolveZeusUiPorts`, `resolveZeusMcpPorts`, `ZEUS_SCRIPTORIUM_URL`).
5. Procesos se lanzan por script npm del paquete objetivo, no por ruta de
   archivo cruzada entre paquetes.

## 5. Monorepo publicable (ola 5)

Hechos: `.npmrc` ya enruta `@alephscript` → `https://npm.scriptorium.escrivivir.co`
(de ahí viene `@alephscript/mcp-core-sdk`). Los `@zeus/*` son workspace-only:
sin `publishConfig`, sin `files`, versión `0.1.0` plana.

Objetivo: todo `engine/*` instalable desde el registry propio; los juegos se
distribuyen desde la games-library (§6).

- **Scope: `@zeus`, decidido (D-7).** Aún no existe en el registry propio
  porque lo estamos creando: WP-U50 añade
  `@zeus:registry=https://npm.scriptorium.escrivivir.co` al `.npmrc` junto a
  la línea `@alephscript` existente, y publica.
- Cada paquete publicable: `publishConfig.registry`, `files`, `exports`
  completos, `README.md` propio, y **versión semver por paquete** gestionada
  con **changesets** (WP-U53; el lockstep 0.x de U50 quedó demolido).
- `private: true` explícito en lo no publicable (demos, launchers, viewers si
  se decide no publicarlos; juegos fuera de este pipeline).
- Script raíz `npm run release:dry` que empaqueta todo (`npm pack`) y verifica
  que cada tarball contiene lo que dice `files` y nada más.
  `npm run release:changeset-dry` añade bump+changelog local y restaura el
  árbol (sin publish).

### Camino a semver + CI/CD

Monorepo y repos hermanos siguen **versionado semántico por paquete
integrado en el bucle CI/CD**. Tres pasos (el 3 ya cableado en WP-U53):

1. **Ola 0** — commits convencionales (PRACTICAS §6) + CI (WP-U03): `lint` +
   `gates` + matriz de tests en cada rama `wp/*`/PR.
2. **Hasta la ola 5** — versión **lockstep 0.x** provisional (U50): una
   versión para todo el engine por release. **Demolido en U53.**
3. **WP-U53** — **changesets** + release desde CI
   (`.github/workflows/release.yml`):
   - Changesets (no semantic-release): monorepo npm-workspaces, bumps **por
     paquete**, registry propio.
   - Cada WP que toque un paquete publicable añade su changeset (PRACTICAS
     §6); el job `release` **necesita** `quality` + `test` verdes → bump +
     changelog → `npm publish` (si hay `NPM_TOKEN`) + tag + GitHub Release.
   - `Z_SDK-games-library` replica el patrón con su propio ritmo: release de
     juego = versión de paquetes + start pack (`@zeus/startpack-<game>`) +
     Release espejo + **acta en verde** (sin acta no hay release, VISION §5).
   - Un release no puede salir de un pipeline rojo.

## 5-bis. El plano de datos

Las líneas (troncos + satélites), los formatos canónicos heredados del motor
Python, las tres familias de feed (wiki estática / stream ATProto / gossip
SSB), el ciclo crecer/vaciar de VOLUMES y la alineación files-first/IPFS
tienen documento propio: **[DATOS.md](DATOS.md)**. Regla arquitectónica que
importa aquí: los VOLUMES son **del mesh, compartidos por todos los juegos**;
los juegos los inflan (cachear/curar/milestone) y los vacían (CRUD por roles)
siempre vía intents+ledger o REST/MCP proyectado — nunca tocando disco por su
cuenta desde una vista.

## 6. Z_SDK-games-library — dónde viven los juegos y sus datos pesados

Decisiones D-10/D-11 — topología de repos en `github.com/alephscriptorium-eng`:

| repo | contenido |
| ---- | --------- |
| `Z_SDK` | hogar público del monorepo zeus-sdk (engine + editor + mesh + examples) |
| `Z_SDK-games-library` | los juegos (`delta`, `pozo`, futuros) y sus releases de datos |

**Dos repos y ya** durante la refundación. Criterio para que algo merezca repo
propio (los tres a la vez): (a) cadencia de release propia, (b) consumidores
fuera del monorepo, (c) no necesita cambios atómicos con el resto. La
games-library los cumple; el engine no los cumple entre sí (olas que cruzan
paquetes de forma atómica; semver por paquete vía changesets no implica
repos separados). Único candidato futuro: `operator-ui`,
a revisar tras la ola 5. La extracción de los juegos es la **ola 6**: hasta
que el engine se publique de verdad (WP-U50), `games/*` se desarrolla en el
monorepo — separar antes obligaría al swarm a hacer round-trips por el
registry en cada cambio del engine.

### Qué contiene y dónde se guarda cada cosa

Medido 2026-07-15: `VOLUMES/` = 57 MB en 10.518 archivos (DISK_01 firehose
38 MB, DISK_02 lineas 20 MB) y **crece por diseño** — el juego infla los
volúmenes, y cada ronda produce un start pack. Los GLB de `game-engine/assets`
son pocos y pequeños (unidades de MB). Cuotas estudiadas 2026-07-15:

| mecanismo | límites | coste |
| --------- | ------- | ----- |
| Git normal (GitHub) | archivos <100 MB; repo recomendado ≲1 GB | gratis |
| Git LFS | **1 GB almacenamiento + 1 GB/mes de banda** en el plan gratuito; al agotar la banda con presupuesto $0, LFS se **bloquea** hasta el mes siguiente. Cada clone descarga los LFS (el swarm clonando quema la banda). | metered a partir de ahí |
| GitHub Releases | **2 GiB por archivo, sin límite total ni de banda**, 1000 assets por release | gratis |
| Registry npm propio | lo que aguante el servidor; ya operativo (`@alephscript` resuelve ahí) | propio |

Reparto propuesto:

1. **Código, specs y assets pequeños** (dominios, vistas, CASOS.md, GLB de
   unidades de MB) → **git normal** en Z_SDK-games-library. Hoy nada exige LFS.
2. **Start packs y volúmenes** (inmutables, versionados, crecen por ronda) →
   **nunca en git**. Doble salida desde el mismo pipeline de release:
   - **Registry npm propio** como canal primario: cada start pack es un
     paquete `@zeus/startpack-<game>` versionado — `npm install`-able por el
     mesh, sin cuotas ajenas, y encaja con «release = game + start pack +
     versiones + acta» (VISION.md).
   - **GitHub Release** en Z_SDK-games-library como espejo público y backup:
     un release por ronda/versión con el tarball del start pack y el acta.
     Gratis, sin límite de banda, y le da URL citable a cada release.
3. **Git LFS: solo residual** — si algún día un asset de trabajo (no
   inmutable) supera ~50 MB y necesita vivir en el árbol. Si se activa,
   `GIT_LFS_SKIP_SMUDGE=1` por defecto para agentes/CI para no quemar la
   banda gratuita en clones.
4. Consecuencia para este repo: `VOLUMES/` sale del monorepo en la ola 6
   (el Notario — ARG WP-20/23 — pasa a escribir start packs contra la
   games-library) y el monorepo queda solo con datos sintéticos de test.
