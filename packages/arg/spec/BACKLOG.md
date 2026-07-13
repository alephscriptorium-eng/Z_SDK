# CAUDAL — Backlog para el swarm

Convención: cada WP es autocontenido, con criterios de aceptación (CA)
verificables por test o e2e. El **vertical slice** (marcado ✅ slice) lo
entrega la sesión fundacional; el resto es paralelizable por el swarm.
Referencias: [CONTRATO.md](CONTRATO.md), [UX.md](UX.md), [LORE.md](LORE.md).

## Fase 0 — Fundación (✅ slice)

- **WP-00 · Esqueleto workspace** — `packages/arg/{arg-domain,arg-console,arg-demos}`
  en workspaces raíz, scripts `start:arg-console`, `demo:arg`, `test:arg`.
  CA: `npm install` limpio; `npm run test:arg` verde.
- **WP-01 · arg-domain: escena y nav-graph** — `delta-v0` (cimas, terrazas,
  embarcaderos, orillas, boyas, entrada cantera) como datos puros + helpers
  de muestreo (reutiliza el modelo link/progress de `@zeus/game-engine`).
  CA: test de integridad del grafo (todo nodo alcanzable).
- **WP-02 · arg-domain: flow-engine** — grifos (presión/apertura/burst),
  ríos (gotas, spawn desde feed, cristal/spill), mar (crystals/murk/colapso).
  CA: tests de la regla de presión, ciclo de gota, colapso.
- **WP-03 · arg-domain: maze-engine** — cámaras/pasillos, ghost→digging→open,
  tracking de cámara pisada. CA: tests excavate + idempotencia.
- **WP-04 · arg-domain: reducers + domain-state** — `reduceArgIntent` puro
  (tabla del contrato §3), `createArgDomainState` (applyIntent/tick/snapshot
  compacto §G-ARG.5). CA: tests de intents válidos/inválidos (G-ARG.4).
- **WP-05 · feeds sintéticos** — firehose determinista con seed + laberinto
  sintético, interfaz §4. CA: mismas seeds ⇒ mismas gotas.
- **WP-06 · arg-console: server + view-kit** — portal :3021 derivado del
  view-kit del 3d-monitor (autocontenido: copia evolucionada, no import).
  CA: `/health` lista vistas; shell con import map y `#viewer-config`.
- **WP-07 · arg-console: monigote stick** — puppet procedural paramétrico
  (13 articulaciones, poses idle/walk/ride/swim/menu + emotes aditivos),
  misma interfaz duck-type que `loadPuppet` (setBase/playAdditive/update).
  CA: demo standalone en vista + unit test de interfaz sin three.
- **WP-08 · arg-console: vista tablero** — overview global (UX §tablero):
  delta completo, grifos con manómetro, ríos instanciados, mar, cantera,
  actores, ledger DOM. CA: renderiza snapshot sintético grabado (fixture).
- **WP-09 · arg-console: vista jugador** — cámara chase, controles teclado →
  `arg:intent`, HUD jugador, panel tracking. CA: e2e — tecla emite intent
  correcto por socket (sin mutar escena local, G-ARG.1).
- **WP-10 · arg-demos: autoridad + demo 3 visores** — proceso authority
  (10 Hz, arg:state/track/ledger), launcher `demo:arg` con URLs impresas.
  CA: e2e Node estilo `e2e/player-3d-demo.mjs` — dos clientes join, uno
  abre grifo, gotas fluyen, un label:cast llega al ledger.

## Fase 1 — Cloak MCP y navegadores reales (swarm)

- **WP-11 · Contacto + menú de cloak** — `contact:request/close` en dominio;
  overlay DOM 3 columnas (UX §menú) consumiendo oferta HORSE real
  (`resolvePresetOffer`/`PresetHorseProxy` de presets-sdk). Grifo como
  artilugio con cloak (tool `tap.set_aperture`). CA: e2e con bot horse:
  contacto → oferta → tools/call → apertura cambia en arg:state.
- **WP-12 · Inventario de presets** — menú `Q`, activar preset ⇒ actualizar
  oferta HORSE + modificadores de físicas (tabla presetId→mods). CA: test
  de derivación de físicas; e2e de re-broadcast de oferta.
- **WP-13 · arg:track → navegadores reales** — suscriptor **server-side** en
  firehose-browser y cache-browser (`@zeus/rooms` + `GET /api/track/focus`);
  página hace poll y navega con `openFile`. CA: e2e G-ARG-E2E.6 — actor en
  `camara-0-2` → focus resuelto en cache-browser.
- **WP-14 · Feeds reales (ledger-first)** — `@zeus/arg-feeds` node-only:
  lectura MCP read-only; `commitLabel` ledger-only (sin escritura :3008);
  `excavate` → `cache_wikitext` con gate `APROBAR`; `auto` probe + degrade;
  start packs opcionales (`gamemap.seeds`). CA: e2e MCP aislado + escenario
  `auto` sin MCP.
- **WP-15 · Gates grep** — test estilo `grep-gates.test.mjs` con G-ARG.1..5.
  CA: gates rojos si se viola (probar con violación sintética).

## Fase 2 — Juego completo (swarm)

- **WP-16 · Gamemaps y cues** — loader de gamemap (§2), cues temporales/por
  evento, objetivos y fin de ronda (colapso/victoria) con pantalla final.
- **WP-17 · Agentes ambiente** — bots stick con cloak que etiquetan/excavan
  solos (drivers estilo `walk-demo`), presión social del Público.
- **WP-18 · Multitud instanciada** — 200+ sticks con InstancedMesh y LOD;
  presupuesto 60 fps con 500 gotas + 200 actores en tablero.
- **WP-19 · Riada y colapso espectacular** — burst con partículas, mar que
  sube, shake de cámara; sonido opcional (WebAudio procedural, sin assets).
- **WP-20 · Persistencia de ronda + Notario** — ledger a disco (append-only
  JSON); compactador post-ronda (único escritor DISK): triage `raw→labeled`,
  manifest cantera, commit git = nuevo start pack. MCP opcional `commit_round`
  con gate `APROBAR` (acto jugable en el mar).
- **WP-23 · Notario MCP** — (si no se fusiona con WP-20) tool `commit_round`,
  replay idempotente del ledger, diff revisable.
- **WP-21 · Puppets GLB para jugadores** — tier puppet en vista jugador
  (clip-map existente), selección de skin al join.
- **WP-22 · Espectador embebido** — vista tablero como iframe/panel en
  player-ui u operator-ui (proyección, sin lógica).

## Riesgos conocidos

- El tamaño de `arg:state` con cientos de gotas (mitigación: arrays
  compactos + maze diff, G-ARG.5; si no basta, delta-encoding de rivers).
- Dos sistemas de animación (stick + GLB): mantener la interfaz duck-type
  única de puppet (WP-07) para que el adapter no distinga tiers.
- Latencia de MCP real en `excavate` (digging asíncrono ya lo modela).
