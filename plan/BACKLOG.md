# BACKLOG — refundación por olas

Convención: WPs autocontenidos con **CA** (criterios de aceptación
verificables) y **Demolición** (lo que se borra en el mismo WP). Estados:
⬜ pendiente · 🔶 en curso (agente + fecha) · ✅ aceptado (solo orquestador).
Dependencias explícitas; dentro de una ola, lo no dependiente es paralelizable.

El backlog de features del juego **delta** vive aparte en
`packages/arg/spec/BACKLOG.md` (fases 1.6/2) y puede avanzar en paralelo:
la refundación está ordenada para no pisarlo (delta ya habla el patrón bueno).

---

## Ola 0 — Suelo firme

- ✅ **WP-U00 · Gates de prácticas** — aceptado (orquestador / 2026-07-17) — test raíz `npm run gates` estilo
  `grep-gates` (ARG WP-15): (a) puertos/URLs hardcodeados fuera de
  `presets-sdk/env`, docs y specs; (b) nombres de transición
  (`legacy|v2|-old|-new`) en código; (c) imports que violen ARQUITECTURA §4
  (cuando exista el layout, empezar con: nada importa de `packages/arg/*`
  salvo arg); (d) **regla de los dos juegos**: los paquetes engine (según
  nazcan en la ola 1) no contienen los nombres ni conceptos exclusivos de un
  juego (`delta`, `pozo`, grifo, cantera…). Archivo de excepciones comentado.
  **CA:** gate rojo con violación sintética de cada tipo; verde en el repo
  actual (o lista de excepciones justificadas para lo preexistente).
  **Demolición:** n/a.

- ✅ **WP-U02 · Identidad del juego: delta** — aceptado (orquestador / 2026-07-17) — (D-8) — retirar el nombre
  «CAUDAL» en favor de **delta**: títulos y prosa de
  `packages/arg/spec/*.md`, README de arg, y las cadenas/banners en código
  (~10 archivos: arg-console kit/vistas/server, authority, launch, contract).
  No cambia rooms, eventos ni rutas (eso es ola 5); solo la identidad.
  **CA:** `grep -ri CAUDAL packages/` limpio (salvo citas históricas en
  plan/DECISIONES.md); `test:arg` + `e2e:arg` verdes.
  **Demolición:** el nombre viejo — sin «(antes CAUDAL)» permanentes en specs;
  la historia queda en git y en D-8.

- ✅ **WP-U01 · Tests que faltan en el núcleo** — aceptado (orquestador / 2026-07-17) — `firehose-core` (hoy
  `test: echo 'sin tests'`) y `room-client-browser` (0 test files): tests de
  comportamiento de su API pública.
  **CA:** `npm test -w` verde en ambos con ≥1 test real por export principal.
  **Demolición:** el `echo 'sin tests'`.

- ✅ **WP-U03 · Z_SDK + CI** — aceptado (orquestador / 2026-07-17) — (D-11; ARQUITECTURA §5) — push del monorepo a
  `github.com/alephscriptorium-eng/Z_SDK` (rama main) y GitHub Actions: en
  cada PR/rama `wp/*`, job con `npm ci` + `npm run lint` + `npm run gates`
  (dep U00 blanda: YA EXISTE `npm run gates` — cablearlo en CI) + matriz de
  tests de paquetes. Sin publish todavía (eso es WP-U53).
  **CA:** una PR de prueba muestra los checks corriendo; rojo si se introduce
  una violación sintética.
  **Demolición:** n/a.

### Cola hallazgos lote 0a

Diferidos del reporte WP-U01 (no bloquean cierre):
- residual CAUDAL en `e2e/arg-*.mjs` y `.vscode/tasks.json` (fuera de CA U02)
- typo `CLIENT_SUSCRIBE`
- `readInjectedRoomConfig` sin export
- `Date.now()` como default user
- worktrees: `npm install` / walk-up de node_modules
- dependencia de `--experimental-test-module-mocks`

Diferidos del reporte WP-U00 (no bloquean cierre):
- limpieza fallbacks `?? 30xx` / localhost
- MCP catalogs ports → env
- mesh→arg-domain hasta layout games
- legacy/v2 session hasta ola 3
- ~~U03 debe cablear `gates` en CI~~ → **cumplida en WP-U03** (workflow `.github/workflows/ci.yml`)

### Cola hallazgos lote 0b (WP-U03)

Diferidos del reporte WP-U03 (no bloquean cierre de ola 0; CA remoto pendiente fuera del swarm):
- CA remoto PR ⏳ (push a `Z_SDK` fuera del swarm; sin credenciales en agente)
- 9/31 workspaces fallan `npm test -w` (matriz CI parcialmente roja al publicar)
- mismatch credencial git/gh (nota operativa)

## Ola 1 — El contrato único (engine nace)

- ✅ **WP-U10 · `@zeus/protocol`** — aceptado (orquestador / 2026-07-17) — generalizar
  `packages/arg/arg-domain/src/contract.mjs` + `spec/CONTRATO.md`: eventos
  `state|intent|track|ledger` con campo `game` en el envelope, `makeIntent`,
  validación de forma, **roles** (`player|dj|operator`) declarados por intent,
  gates genéricos (una autoridad por room; vistas proyectan; dominio puro;
  presupuesto de snapshot). Generación **AsyncAPI desde este contrato**
  (asume el rol del `spec:generate` de session-protocol). Estudiar como
  formato de credencial de rol la **Peer Card** de transmedia-system
  (token revocable con `roomId/endpoint/scopes/expiresAt` — la misma pieza
  sirve luego a WebRTC, ola 10, y a la identidad SSB del horizonte U73):
  si convence, los roles se acreditan con peer cards desde el día 1; si no,
  se documenta por qué.
  **CA:** arg-domain re-exporta/consume `@zeus/protocol` sin cambiar su
  comportamiento (test:arg verde); AsyncAPI generado y renderizado en el
  portal docs; tests de roles (intent de rol no autorizado ⇒ rechazo).
  **Demolición:** el contrato duplicado dentro de arg-domain (queda solo lo
  específico de delta); la parte de session-protocol que solo generaba spec
  (el resto de session-protocol muere en WP-U31).

### Cola hallazgos lote 1a (WP-U10)

Diferidos del reporte/revisión WP-U10 (no bloquean cierre):
- migrar wire `arg:*` → kinds canónicos: autoridad dual-wire en U11; vistas aún pendientes
- comentario residual «generate.mjs» en `session-protocol/spec/build.mjs` (higiene hasta U31)
- portal VitePress ausente → WP-U41; HTML AsyncAPI bajo `docs/public/api/` (gitignored) cumple CA de render
- nota: U10 apoya APIs de http-contract/presets-sdk (2/9 workspaces rojos de cola U03) pero CA no exige esas suites verdes
- duda worker (brief U11 / DECISIONES si el usuario cierra): ¿Peer Card en handshake U11 o basta `role` en intent hasta ola WebRTC?
- e2e banners «CAUDAL» residuales (cola U02) — fuera de alcance

- ✅ **WP-U11 · `@zeus/authority-kit`** *(dep U10)* — aceptado (orquestador / 2026-07-17) — autoridad genérica
  extraída de `arg-demos/apps/authority`: loop de tick, aplicación de intents
  vía reducer registrado, emisión state/ledger/track, presupuesto de snapshot,
  arranque/parada limpios (sin huérfanos: cascada SIGINT ya resuelta en
  `arg-demos/launch.mjs` — se hereda, no se reinventa).
  **CA:** la autoridad de delta queda instanciando el kit (diff negativo en
  arg-demos); `e2e:arg` y `test:arg` verdes sin tocar los tests.
  **Demolición:** el código genérico que quede duplicado en arg-demos.


### Cola hallazgos lote 1b (WP-U11)

Diferidos del reporte/revisión WP-U11 (no bloquean cierre):
- dual-wire hasta migrar vistas (canónico + alias `arg:*`; ~2× tráfico state/track/ledger)
- `stop:services` no limpia puertos e2e aislados (≠ env canónico; p.ej. 13027 huérfano)
- Peer Card handshake diferido (no exigida en U11; `role` en intent basta hasta ola WebRTC / DECISIONES)

- ✅ **WP-U12 · `@zeus/player-mcp-kit`** *(dep U10)* — aceptado (orquestador / 2026-07-17) — generalizar
  `arg-player-mcp`: patrón «un MCP por actor» con semántica verificable
  (emitir intent → esperar evidencia en state/ledger), dry-run de rechazos,
  resources estándar (`<game>://player/state`, `<game>://scene`,
  `<game>://casos`), health con `connected` + `lastStateTs`.
  **CA:** arg-player-mcp instancia el kit; `e2e:arg-mcp` verde;
  `test:arg-player-mcp` verde.
  **Demolición:** lo genérico duplicado en arg-player-mcp.


### Cola hallazgos lote 1b (WP-U12)

Diferidos del reporte/revisión WP-U12 (no bloquean cierre):
- ruido ambiente e2e: `EADDRINUSE` / health null por huérfanos MCP (:14121/:13027) tras arranques interrumpidos — misma clase que cola U11 `stop:services`
- banner e2e «CAUDAL» residual (cola U02) — fuera de alcance
- parseo `casos-md` del kit podrá absorberse/coordinarse en U13 (`playbook-kit`)
- URI histórico de delta sigue `arg://…` (no `delta://`); el kit solo parametriza el prefijo

- ✅ **WP-U13 · `@zeus/playbook-kit`** *(dep U12)* — aceptado (orquestador / 2026-07-17) — el método CASOS como
  producto: formato de caso (precondición/pasos MCP/observación humana/
  criterio/errores), test de coherencia (generalizar `casos.test.mjs`),
  plantilla de acta (generalizar `spec/VALIDACION.md`), y runner e2e que
  ejecuta la **mitad MCP-verificable** de los casos de un playbook contra una
  demo levantada (la mitad visual sigue siendo humana, por diseño G-ARG.1).
  **CA:** `packages/arg/spec/CASOS.md` pasa el test de coherencia del kit; el
  runner ejecuta C-01/03/04b/05 contra `demo:arg` y produce un acta
  pre-rellenada con la evidencia MCP.
  **Demolición:** el test de coherencia local de arg si queda subsumido.


### Cola hallazgos lote 1c (WP-U13)

Diferidos del reporte/revisión WP-U13 (no bloquean cierre; cierra ola 1):
- e2e stack aislado (socket+autoridad+MCP; patrón `e2e:arg-mcp`), no launcher
  `demo:arg` completo (console + browsers) — espíritu CA cumplido; literal
  diferido
- `arg/spec/VALIDACION.md` de delta permanece (plantilla humana V0–V7); kit
  aporta plantilla genérica + relleno MCP
- script root `test:player-mcp-kit` añadido de pasada (útil; fuera del título)

## Ola 2 — Un solo motor de vistas

### Cola hallazgos ola 2

Diferidos / laterales (A-05 no bloquea U23):
- A-05: simetría dual-wire / transporte desnudo|envuelto+dedup en
  arg-console, 3d-monitor, player-mcp-kit (lateral; no bloquear U23)

### Cola hallazgos ola 2 (WP-U20)

Diferidos del reporte/revisión WP-U20 (no bloquean cierre):
- e2e:arg G-ARG-E2E.10 flaky (timeout track:cast; 1ª rojo / 2ª verde)
- ~~`packages/platform/3d-monitor` aún tiene `assets/js/kit/` propio — WP-U22~~ → **cumplida en WP-U22**
- colisión de nombre: arg-console `src/view-kit/` (SSR defineView) ≠
  `@zeus/view-kit` (browser) — sigue diferida (U21 no la tocó)
- clave localStorage de paneles `vk:…` (antes `delta:…`): posiciones
  guardadas del usuario se resetean (aceptable en extracción)

- ✅ **WP-U20 · `@zeus/view-kit`** — aceptado (orquestador / 2026-07-17) — extraer el kit de navegador de
  `arg-console/assets/js/kit/` (~4.600 LOC: escena, ventanitas/panel, HUD,
  inspector raycast, stick-puppet, droplets, deep-links honestos) a paquete
  engine browser-safe servido por import-map. arg-console pasa a consumirlo.
  **CA:** `test:arg-console` + `e2e:arg` verdes; `demo:arg` se ve igual
  (verificación humana u captura, anotada honestamente en el reporte).
  **Demolición:** el kit dentro de arg-console (quedan solo las vistas
  tablero/jugador específicas de delta).

### Cola hallazgos ola 2 (WP-U21)

Diferidos del reporte/revisión WP-U21 (no bloquean cierre):
- `plan/ARQUITECTURA.md` §1: «arg-console evita app-shell a propósito» —
  mentira post-U21; actualizar con U20/U22 (kit / solape 3d-monitor) —
  higiene orquestador
- colisión SSR `src/view-kit/` vs `@zeus/view-kit` — sigue diferida (U20/U22;
  U21 no la tocó)
- OpenAPI drift preexistente (player-ui / editor-ui / cache-browser /
  firehose-browser) — no causado por U21

- ✅ **WP-U21 · app-shell aprende de arg-console** *(dep U20)* — aceptado
  (orquestador / 2026-07-17) — las razones por las que arg-console
  evitó `createAppConfig` (whitelist rígida) se arreglan EN app-shell;
  arg-console y las vistas del view-kit usan app-shell.
  **CA:** arg-console sin config propia divergente; los demás consumidores de
  app-shell intactos (sus tests verdes).
  **Demolición:** `arg-console/src/config.mjs` divergente y el comentario «a
  propósito NO usa createAppConfig».

### Cola hallazgos ola 2 (WP-U22)

Diferidos del reporte/revisión WP-U22 (no bloquean cierre):
- `plan/ARQUITECTURA.md` §1 desactualizado post-U20/U21/U22 (kit
  arg-console / solape 3d-monitor; «arg-console evita app-shell» mentira
  post-U21) — higiene orquestador
- colisión SSR `src/view-kit/` vs `@zeus/view-kit` en 3d-monitor — misma
  deuda U20; U21 no la tocó (sigue diferida)
- vista humana demos 3d ⏳ (headless OK por brief)
- escenas didácticas mínimas en `examples/` (apps quedan mesh / D-9)

- ✅ **WP-U22 · 3d-monitor y player-3d-ui sobre view-kit** *(dep U20)* — aceptado (orquestador / 2026-07-17) — migrar sus vistas al view-kit;
  evaluar en el reporte si tras la migración merecen vivir como apps o pasar
  a `examples/`.
  **CA:** sus e2e (`e2e:player-3d`, vistas de 3d-monitor) verdes; diff
  negativo neto.
  **Demolición:** el view-kit ancestro duplicado en 3d-monitor (de donde nació
  el de arg-console — el círculo se cierra).

### Cola hallazgos ola 2 (WP-U24)

Diferidos del reporte/revisión WP-U24 (no bloquean cierre ni U23):
- Ledger `kind` vs `entryKind`: AsyncAPI/`makeEnvelope` usan `kind: 'ledger'`
  y `entryKind` para el discriminante de hecho; consumidores aún leen
  `entry.kind === 'label'|…`. El kit publica ambos. Migrar a `entryKind`
  (dejar `kind: 'ledger'` en envelope) = WP futuro; no es A-05.

- ✅ **WP-U24 · authority-kit fuerza envelope `game`** *(dep U11; gate pre-U23)* — aceptado (orquestador / 2026-07-17) — Cerrar A-02: `startAuthority`
  exige `game` (string no vacío) y publica `state|track|ledger` vía
  `makeEnvelope` de `@zeus/protocol` (hoy el kit no cablea `makeEnvelope` en
  producción; payloads salen sin `game`). Intent ya va tipado; objetivo 4/4
  kinds con `game`.
  **CA:** tests del kit asertan `payload.game` en state/track/ledger;
  autoridad delta instancia el kit y `test:arg` / `e2e:arg` verdes;
  cero nombres de juego en el kit (el `game` lo inyecta el caller).
  **Demolición:** publicación de payloads sueltos sin envelope en el kit.
  **Nota:** no mezclar A-05 (dual-wire); paralelizable con U21/U22 tras U20.

### Cola hallazgos ola 2 (WP-U23)

Diferidos del reporte/revisión WP-U23 (no bloquean cierre; cierra ola 2):
- slots `pozoPlayer` / `pozoView` ausentes en `presets-sdk/env` (+
  `KNOWN_ZEUS_PORTS`) — defaults MCP/vista viven en el juego vía
  `readEnvPort`; WP aparte
- vista sin `@zeus/app-shell` — CA no lo exige; shell SSR opcional cuando
  createAppConfig se generalice a juegos

- ✅ **WP-U23 · pozo, el segundo juego** *(dep U10–U13, U20; D-8)* — aceptado
  (orquestador / 2026-07-17) — juego mínimo A PROPÓSITO: un pozo,
  un puñado de nodos, un feed, UN intent con ledger (p. ej. sacar una gota
  del pozo y etiquetarla), una vista sobre view-kit, un MCP de jugador sobre
  player-mcp-kit, y un CASOS.md corto en formato playbook-kit. Regla dura: se
  construye **solo importando engine/*** — si para hacer pozo hay que tocar
  el engine, ese cambio es un hallazgo (mejora del SDK) y se hace como WP
  aparte, no como parche desde el juego. Es el gate viviente de la regla de
  los dos juegos: a partir de aquí, todo WP de engine debe dejar verdes a
  delta Y a pozo.
  **CA:** `demo:pozo` levanta room+autoridad+vista+MCP; e2e — un cliente
  JSON-RPC ejecuta sus casos vía MCP; `gates` verde (engine sin nombres de
  juego); cero imports de `games/delta` ni de `packages/arg`.
  **Demolición:** n/a (es nacimiento). El reporte lista lo que NO se pudo
  hacer sin tocar engine — esa lista es el backlog de mejoras del SDK.

## Ola 3 — Un solo juego

### Cola hallazgos ola 3 (WP-U30)

Diferidos del reporte/revisión WP-U30 (no bloquean cierre; van a U31 / cleanup):
- tools MCP `dj_*` / decks player-ui — diferido (U31: CA por HTTP/decks;
  cableado MCP opcional — ver cola U31)
- side-effect de disco `cache_wikitext` / escritura markdown — borde
  autoridad/Notario; U30 dejó dominio puro (como excavate sintético)

- ✅ **WP-U30 · Intents del manipulador de líneas** *(dep U10)* — aceptado
  (orquestador / 2026-07-17) — el dominio
  del juego gana los intents del DJ con rol `dj`: `cache` (cachear línea),
  `curate`, `milestone` — hermanos de `label:cast` y `excavate`, con ledger y
  scoring. Diseño previo corto en el spec del juego delta (qué muta cada uno,
  tabla reducer, presupuesto snapshot).
  **CA:** tests de reducer válidos/inválidos por rol; entradas de ledger con
  evidencia; casos nuevos redactados en CASOS.md (formato playbook-kit).
  **Demolición:** n/a (es adición al dominio).

### Cola hallazgos ola 3 (WP-U31)

Diferidos del reporte/revisión WP-U31 (no bloquean cierre; van a U32 / cleanup):
- tools MCP `dj_*` / playbook C-30..C-32 — cableado opcional (CA cubierta por
  HTTP/decks + e2e player-ui-dj)
- e2e legacy (`deck-demo`, `dual-ui`, etc.): SKIPPED; rewire → **WP-U32** /
  cleanup
- operator-ui / player-3d stubs (`local-projection`) → **WP-U32**
- `package-lock.json` entradas `extraneous` de session-*/tablero-core (ghost npm)
- OpenAPI CRLF flake en `test:player-ui` (Windows): `spec-sync` compara
  bytes; committed vs gen idénticos normalizando `\r\n`→`\n`. **No mezclar
  con U32** — WP cleanup / http-contract aparte

- ✅ **WP-U31 · player-ui = vista manipuladora** *(dep U30, U11)* — aceptado
  (orquestador / 2026-07-17) — player-ui
  deja de ser master de su room: se une a la room del juego como vista con rol
  `dj`, emite los intents de U30 desde sus decks (mismas líneas, misma cache),
  proyecta `state`/`ledger` donde le toque. El estado xstate local se queda
  local; lo compartido viaja solo vía autoridad.
  **CA:** e2e — acción de deck en player-ui produce intent → evidencia en
  ledger → visible en el tablero de delta; suite de player-ui verde
  (recortada a su nuevo rol).
  **Demolición:** `session-transport.mjs` como master, room
  `scriptorium.<id>`, y los paquetes `session-protocol`, `session-domain`,
  `tablero-core`: lo que sea dominio vivo se absorbe (a `games/delta` o
  `engine/protocol`), el resto se borra. Cero re-exports de compatibilidad.

- ✅ **WP-U32 · operator-ui = visor de operador** *(dep U31)* — aceptado
  (orquestador / 2026-07-17) —
  `operator-bridge` se recablea del protocolo sesión al contrato único
  (proyección de slice de `state`); sus emisiones se vuelven intents con rol
  `operator`. operator-ui (Angular) consume el bridge nuevo.
  **CA:** `verify:dual-ui`/`e2e:operator-ui` (adaptados) verdes; un intent de
  operador rechazado para rol `player` (test de roles end-to-end).
  **Demolición:** el camino `session:*` en operator-bridge/operator-ui.

## Ola 4 — Resource/REST-driven

- ✅ **WP-U40 · RouteEntry → MCP resources** — aceptado
  (orquestador / 2026-07-17) — cablear
  `openapi-mcp-projector` dentro de `http-contract`: toda ruta REST declarada
  queda proyectada automáticamente como resource/resource-template MCP. Si al
  implementarlo el projector no aporta (decisión con evidencia en el reporte),
  se implementa la proyección directa en http-contract y **se borra el
  paquete** — lo que no puede pasar es que siga huérfano.
  **CA:** e2e — una ruta de cache-browser o firehose-browser aparece como
  resource-template MCP y responde; `spec:generate:all` la documenta.
  **Demolición:** `openapi-mcp-projector` como huérfano (cableado o borrado).

### Cola hallazgos ola 4 (WP-U41)

Diferidos del reporte/revisión WP-U41 (no bloquean cierre; cierra ola 4):
- READMEs mesh residuales `session:*` (player-3d-ui, 3d-monitor,
  ping-pong-bots) — protocolo muerto vivo fuera del alcance U41

- ✅ **WP-U41 · Portal de docs refundado** *(dep U10, U40)* — aceptado
  (orquestador / 2026-07-17) — VitePress
  refleja la realidad: engine/editor/mesh/games, contrato único (AsyncAPI),
  rutas REST (OpenAPI/Redoc), resources MCP, y el método playbook. README
  raíz y README de cada paquete publicable al día (el de `packages/arg` lista
  hoy 3 de 5 paquetes).
  **CA:** `npm run docs:build` verde; navegación sin enlaces rotos; cero
  menciones al protocolo muerto.
  **Demolición:** páginas/specs de la sesión Scriptorium.

## Ola 5 — Monorepo publicable y layout final

- ✅ **WP-U50 · Scope y publicación** — aceptado
  (orquestador / 2026-07-17) — (D-7: scope `@zeus` al registry propio;
  añadir `@zeus:registry=https://npm.scriptorium.escrivivir.co` al `.npmrc`;
  los juegos NO se publican desde aquí: ola 6) — todos los
  `engine/*`: `publishConfig.registry` al registry propio
  (`npm.scriptorium.escrivivir.co`), `files`, `exports` completos, README,
  versión lockstep 0.x; `private: true` explícito en lo no publicable; script
  `release:dry` (npm pack + verificación de contenido de tarballs).
  **CA:** `release:dry` verde; un `npm install` de prueba desde el registry
  propio en un directorio limpio resuelve el engine.
  **Demolición:** dependencias `file:` que queden (operator-ui) si el registry
  las cubre.

### Cola hallazgos ola 5 (WP-U50)

Diferidos del reporte/revisión WP-U50 (no bloquean cierre):
- CA registry ⏳ (`npm install` de prueba desde registry propio en dir limpio)
- `file:` residual operator-ui
- game-engine «ARG» (identidad residual)

- ✅ **WP-U51 · Layout final** — aceptado
  (orquestador / 2026-07-17) — mover a
  `packages/{engine,editor,mesh,games}` + `examples/` según ARQUITECTURA §2,
  (D-8/D-9: `games/{delta,pozo}`, visores en `mesh/`), actualizar workspaces,
  scripts raíz e imports. Un solo WP, mecánico, con el repo ya convergido.
  **CA:** `npm install` limpio; `lint`, `test:arg`, `gates` y los e2e de la
  matriz verdes; `git log --follow` conserva historia de los archivos movidos.
  **Demolición:** las carpetas `lib/ app/ platform/ mcp/ arg/` antiguas.

### Cola hallazgos ola 5 (WP-U51)

Diferidos del reporte/revisión WP-U51 (no bloquean cierre):
- C-30 playbook (`e2e:playbook-kit` G-PB.0)
- VOLUMES e2e (`e2e:view` / `e2e:firehose`)
- `:13022` (huérfano e2e:operator-ui)
- `file:` residual operator-ui

- ✅ **WP-U54 · Consumidores externos anónimos** *(dep U50, U10; D-18)* — aceptado
  (orquestador / 2026-07-17) — el registry es una frontera
  pública: cualquier tercero (runtime JS/TS, Bun, Node) debe poder construir
  sobre `@zeus/*` sin hablar con nosotros. Los paquetes publicables llevan
  **tipos `.d.ts`** (generados de los schemas del protocolo) y docs de
  handshake para clientes externos (`ZEUS_SCRIPTORIUM_URL`, auth
  `{token, room, user}`, eventos del contrato). Smoke de consumo: un
  proyecto externo mínimo (fuera del workspace, instalando SOLO del
  registry) se une a una room y emite un intent tipado.
  **CA:** smoke reproducible con evidencia (Node y Bun); tipos presentes en
  los tarballs (`release:dry` los verifica); el handshake documentado en el
  portal.
  **Demolición:** n/a.

- ✅ **WP-U53 · Semver + release desde CI** *(dep U50, U03; ARQUITECTURA §5)*
  — aceptado (orquestador / 2026-07-17) — adoptar **changesets**
  en el monorepo: bump semver por paquete, changelog generado, `npm publish`
  al registry propio desde CI (con el pipeline en verde como condición
  dura), tag git + GitHub Release en Z_SDK. Cierra el periodo lockstep 0.x.
  PRACTICAS §6 pasa de «commit convencional basta» a «changeset obligatorio
  en paquetes publicables».
  **CA:** un cambio de prueba con changeset produce release automático
  end-to-end (bump + changelog + publish + tag) y un pipeline rojo lo
  bloquea.
  **Demolición:** el versionado lockstep manual y cualquier script de publish
  provisional de WP-U50 que el pipeline sustituya.

- ✅ **WP-U52 · Auditoría de vías muertas** *(última)* — aceptado
  (orquestador / 2026-07-17) — barrido final: por
  cada paquete, lista de consumidores reales (grep de imports); cero
  huérfanos, cero TODO sin backlog, cero código comentado, READMEs veraces.
  Produce el reporte de cierre de la refundación.
  **CA:** reporte con la tabla paquete→consumidores completa; gates verdes.
  **Demolición:** todo lo que la auditoría encuentre, o WP nuevo si es grande.

### Cola residual post-Ola 5 (WP-U52)

Hallazgos grandes diferidos (no bloquean cierre de ola 5):

> **Nota orquestador (lote-post5 / 2026-07-17):** Ola 6 / **U55** pausados —
> swarm sin credenciales/registry. **U56** y **U80** aceptados.
> NO asignar: U55, U60+ (U60 = nuevo repo GitHub).

- ⬜ **WP-U55 · Demoler deps `file:` operator-ui/threejs-ui-lib** — tras
  registry o unificar install Angular con workspaces raíz. Sustituye los
  `file:` vivos justificados hasta publish real del engine.
  **CA:** operator-ui / threejs-ui-lib resuelven `@zeus/*` sin `file:`;
  install aislado Angular verde.
  **Demolición:** dependencias `file:` residuales en esos paquetes.
  _(pausado — dep registry/credenciales; no asignar en swarm)_

- ✅ **WP-U56 · Retirar wire vivo `session:*` del stack DJ** — aceptado
  (orquestador / 2026-07-17) — player-ui /
  socket-server / console-monitor / ping-pong; alinear a contrato room
  `state`/`intent` (post-U32). Producto mesh, no solo higiene de README.
  **CA:** cero emit/on `session:*` en el stack DJ vivo; demos/e2e del stack
  usan el contrato room actual.
  **Demolición:** allowlists y handlers `session:*` en esos paquetes.

Hallazgos diferidos U56 (no bloquean):

- ⬜ **domain-helpers / demos domain** — `e2e/domain-helpers.mjs` (y
  domain-*) siguen filtrando `type === 'session:state'` fuera del stack DJ
  (residual post-U31). Alinear a `state` / contrato room.
- ⬜ **flake e2e DJ `actor_desconocido`** — race join→intent en
  `e2e:player-ui-dj` (G-U31.4/6 intermitente). Estabilizar e2e / timing.

## Ola 6 — Z_SDK-games-library (dep WP-U50; diseño en ARQUITECTURA §6, D-10)

> **Pausada** (orquestador / 2026-07-17): swarm sin credenciales GitHub /
> registry. U60+ no se asignan hasta que el usuario desbloquee.

- ⬜ **WP-U60 · Repo Z_SDK-games-library** (D-11) — crear el repo en
  `github.com/alephscriptorium-eng`, con su propio `plan/`-lite (PRACTICAS y
  plantilla de reporte enlazadas desde aquí, no copiadas), `.npmrc` con los
  scopes, y CI mínima (install + tests de los juegos).
  **CA:** clone limpio + `npm install` + tests verdes en el repo nuevo.
  **Demolición:** n/a.
  _(pausado — sin credenciales GitHub en swarm)_
- ⬜ **WP-U61 · Migración de los juegos** *(dep U60, U51)* — `games/delta` y
  `games/pozo` se mueven a la library; consumen `@zeus/*` del registry (no
  `file:`); el monorepo se queda con engine/mesh/editor/examples.
  **CA:** demos de ambos juegos verdes desde la library contra un mesh
  levantado del monorepo; e2e de la matriz adaptados.
  **Demolición:** `packages/games/` en el monorepo.
- ⬜ **WP-U62 · Pipeline de releases de datos** *(dep U61)* — el Notario (ARG
  WP-20/23) escribe start packs contra la library: cada release = paquete
  `@zeus/startpack-<game>` en el registry propio + GitHub Release espejo
  (tarball + acta). `VOLUMES/` sale del monorepo; quedan solo datos sintéticos
  de test.
  **CA:** una ronda real produce un release instalable
  (`npm install @zeus/startpack-delta`) y su Release en GitHub; el mesh
  arranca una ronda nueva desde ese start pack.
  **Demolición:** `VOLUMES/` del monorepo.

## Ola 7 — El plano de datos (diseño en [DATOS.md](DATOS.md); paralelizable
con olas 2–5 salvo deps indicadas)

- ✅ **WP-U80 · `@zeus/linea-kit`** — aceptado (orquestador / 2026-07-17) —
  los formatos canónicos de DATOS.md §2
  como paquete engine: JSON Schemas + validador (nodos.yaml, manifests
  tronco/satélite, registro, snapshots, nodo-sections, registry, sidecars de
  cache, volumes.json) + **loader** de lectura generalizado desde
  `packages/mesh/linea-system` (nodo→secciones→registros, resolución por
  año/oldid). Unificar en el schema la cadena de curación
  (`delta_status`/`labeled`/`editorialStatus` → un solo enum). Incluye la
  familia **force/cota** de DATOS.md §8 (D-19): schema de `force.json`,
  registry agregado con `session_budget`/exclusiones, corpus de escenas
  con cobertura; cotas como corpus con rol `sima|cima`. Browser-safe
  el modelo; node-only el fs.
  **CA:** los datos vivos de `VOLUMES/DISK_02/LINEAS`, `DISK_01/FIREHOSE` y
  `DISK_03/FORCES` (fixture force/cota ya en el repo, formato v0 en su
  README) validan contra los schemas sin tocarlos; linea-system y arg-feeds
  consumen el kit (diff negativo); regla de los dos juegos respetada (el kit
  no nombra juegos ni forces concretas).
  **Demolición:** el loader duplicado en linea-system.

Hallazgos diferidos U80 (no bloquean):

- ⬜ **DISK_03 gitignore vs D-19** — `.gitignore` ignora `VOLUMES/*` sin
  `!VOLUMES/DISK_03/**` pese a D-19 (FORCES debería viajar en git). Corpus
  local del operador; fixtures del kit cubren CI. Candidato WP: exceptuar
  DISK_03 + add.
- ⬜ **ZEUS_VOLUMES_ROOT / worktrees** — worktrees no heredan DISK
  gitignored del árbol principal; hace falta `ZEUS_VOLUMES_ROOT` o
  symlinks locales (runbook; no WP si basta documentar).

- 🔶 **WP-U81 · Herramientas de segmentación del dramaturgo** *(dep U80)* —
  en curso (lote-7a / orquestador / 2026-07-17) — migrar el CONCEPTO de los
  pythons (segment_linea, segment_poder, fetch_wp_historia, fetch_snapshot —
  punteros en DATOS.md §7) a herramientas JS del kit de línea: `crear-linea` (scaffolding desde placeholders:
  nodos.yaml de ejemplo, registry, carpetas), `segmentar` (historial →
  manifest con milestones por reglas), `conectar-satelite` (genera las
  instrucciones/config del MCP satélite y los remotos wiki/ATProto/SSB),
  `fetch` (materializar snapshots con gate de aprobación), y las dos del
  lado force (D-19; proceso ensayado a mano en DISK_03 — su IMPORT_NOTES.md
  es la spec informal): `segmentar-force` (contextos conversacionales del
  dramaturgo → escenas prompt/think/output con anclas y cobertura; trace
  fuera) y `crear-cotas` (autoría de las líneas de cota — los máximos y
  mínimos de la experiencia, el termómetro de activación). Starterkits
  documentados: «crea tu línea en 30 minutos» y «crea tu force en 30
  minutos». Los pythons vivos siguen
  siendo válidos como referencia; no se portan línea a línea, se porta el
  contrato. **El contrato es el validador, la herramienta es cortesía**: el
  dramaturgo puede segmentar con sus herramientas base preferidas (python,
  lo que sea) — su línea entra al mesh si valida contra U80, use o no
  nuestras tools.
  **CA:** con el starterkit se crea una línea sintética de juguete end-to-end
  (tronco 3 nodos + satélite con 10 registros) que valida contra U80 y se
  sirve por un linea-system apuntado a ella; documentado como tutorial.
  **Demolición:** n/a (nacimiento; los pythons viven en network-engine, fuera
  de este repo).

- 🔶 **WP-U82 · CRUD de volúmenes: medir y vaciar** *(dep U80; encaja con la
  ola 4)* — en curso (lote-7a / orquestador / 2026-07-17) — capa de operación
  sobre volumes.json/DISKs, files-first: medición (tamaño por
  volumen/corpus/línea) y **vaciado** con roles (DATOS.md §4: operator =
  purga dura con asiento; player/dj = vaciado jugable vía intent). Todo
  expuesto REST + MCP resource desde una definición (patrón WP-U40); nada
  toca disco sin pasar por autoridad (intents) u operación con ledger.
  **CA:** e2e — llenar un corpus sintético, medirlo por resource, vaciarlo
  por rol operator (asiento en ledger, archivos fuera) y rechazo del mismo
  vaciado con rol player; `volumes.json` refleja contadores.
  **Demolición:** scripts sueltos de limpieza si los hubiera (auditar).

- ⬜ **WP-U83 · Las tramas integran crecer/vaciar** *(dep U82, U30, U23)* —
  delta y pozo incorporan el ciclo completo del mapa a su trama y CASOS:
  crecer (cachear/curar/milestone ya en WP-U30) y **vaciar** como mecánica
  con coste narrativo (qué significa purgar en el delta; qué en el pozo), con
  casos C-* nuevos en formato playbook-kit y checklist visual. Los WPs de
  detalle por juego se espejan en el backlog del juego cuando se tomen.
  **CA:** casos nuevos pasan el test de coherencia; e2e MCP de al menos un
  caso de vaciado por juego; scoring/ledger reflejan el ciclo.
  **Demolición:** n/a.

- 🔶 **WP-U91 · Loader MCP del volumen FORCES** *(dep U80; D-19)* — en curso
  (lote-7a / orquestador / 2026-07-17) — el volumen YA EXISTE:
  `VOLUMES/DISK_03/FORCES` importado y curado a mano el 2026-07-15 (12
  corpus, 68 escenas, registry.json con activación, entrada en volumes.json;
  formato v0 en su README — el import simuló la salida del linea-kit). Lo que
  queda: (a) los schemas force/cota de U80 validan DISK_03 sin tocarlo (el
  fixture ya está en el repo); (b) MCP loader read-only hermano de
  linea-system (`force://{id}`, `force://{id}/scene/…`, registry y cotas
  como resources; refs `linea:*` no montadas = pendiente, no error).
  **CA:** e2e — el volumen valida contra U80; un resource de escena ancla y
  el registry con `session_budget` se leen por MCP; el loader no nombra
  ninguna force concreta en código (gate).
  **Demolición:** n/a (el corpus fuente original sigue en network-engine
  como provenance histórica; zeus ya no depende de él).

- ⬜ **WP-U92 · Intents de force: el sistema inyecta entropía** *(dep U91,
  U30)* — el dominio gana `force:activate`/`force:deactivate` con roles
  `operator`/`dj`: la autoridad valida contra el registry del volumen
  (`session_budget`, `pairs_with`, exclusiones declaradas — las reglas
  viven en los datos, el reducer solo las aplica) y asienta en ledger; las
  escenas ancla de las forces activas se sirven como tracks. Cotas: el
  estado de ronda expone su posición entre sima y cima (los polos
  colapso/victoria ya existentes ganan corpus navegable como track).
  **CA:** tests de reducer — activar una 3ª force = rechazo explicable por
  dry-run; par excluido = rechazo; activación válida = asiento + track
  navegable; delta y pozo consumen el mecanismo (regla de los dos juegos).
  **Demolición:** n/a (adición al dominio).

## Ola 8 — Feeds federados (dep U80)

- ⬜ **WP-U84 · Conector SSB → VOLUMES (Tribes y Parliament)** — exportador
  del log del pub OASIS (mensajes tipados `tribe*`, `parliament*`, votos —
  modelos en DATOS.md §7) a **JSON en disco**: volumen `DISK_04/SSB` (el
  slot DISK_03 lo ocupa FORCES desde 2026-07-15) con
  entrada en volumes.json (readonly, provenance del pub), mismo procedimiento
  que firehose. Servidor MCP loader read-only hermano de linea-firehose.
  Files-first: el exportador es un proceso de sync, no un demonio nuevo del
  mesh.
  **CA:** e2e contra fixture de log SSB (sin red): export → volumen válido
  (U80) → resources MCP navegables; documentado el runbook contra el pub real
  (`ZEUS_SSB_*`), ejecutado si hay acceso (⏳ si no, honesto).
  **Demolición:** n/a.

- ⬜ **WP-U85 · Familias de feed unificadas en el engine** *(dep U84)* — la
  interfaz de feeds (hoy en el juego delta, patrón arg-feeds §4) se
  generaliza a las tres naturalezas de DATOS.md §3 (estática/stream/gossip)
  con la cadena de curación unificada de U80; conexión ATProto directa
  (jetstream → DISK_01) como implementación de referencia del stream, con
  degradación a sintético intacta.
  **CA:** delta y pozo consumen feeds por la interfaz común (dos juegos =
  regla cumplida); e2e de degradación auto→sintético; un feed SSB y uno
  ATProto navegables desde un juego en demo.
  **Demolición:** lo genérico de feeds que quede duplicado en el juego delta.

## Ola 9 — El mundo del dramaturgo (dep olas 6–8)

- ⬜ **WP-U70 · Editor de gamemaps y releases** — editor-ui evoluciona de CRUD
  de presets a editor del mundo A: gamemaps, labelsets, cloaks, casos, y las
  líneas del dramaturgo (U80/U81) como materia prima seleccionable; botón
  «release» = start pack + versiones + acta (dispara el pipeline de WP-U62).
  **CA:** desde el editor se define un juego mínimo (escena, labelset, línea,
  casos) y se produce un release instalable.
  **Demolición:** las vistas CRUD que el editor nuevo sustituya.

- ⬜ **WP-U86 · CARPETA DRAMATURGO (kit de experiencia)** — en la
  games-library: plantilla destilada de ALEPH_ET_OMEGA y SOLVE_ET_COAGULA
  (DATOS.md §6.2): constitución parametrizable (título/tema + 4 ejes REIC),
  cadenas de 4 capas con README-plantilla, `story-board.json` (schema
  actos→widgets), plantillas `uichain/panel-*.prompt.md`, `AYUDA.md`, marcas
  epistémicas y hot files. Con stubs/desacople documentado de las skills
  externas de network-engine (disfraz-rude-bot y browsers de caché) que hoy
  ambos juegos asumen.
  **CA:** desde la carpeta, un dramaturgo (humano o agente) instancia un
  juego narrativo nuevo de juguete sin editar nada fuera de su carpeta; el
  schema del story-board valida los dos story-boards reales existentes.
  **Demolición:** n/a (la plantilla se destila, los juegos originales quedan
  intactos en scriptorium-network-games).

- ⬜ **WP-U87 · SOLVE ET COAGULA, el tercer juego** *(dep U70, U86)* — la
  prueba de fuego del mundo A: recrear SOLVE_ET_COAGULA **con el editor y
  los dos kits**, conectado a su corpus natural (linea-aleph ES el historial
  de SolveCoagula en Wikipedia). Entra al mesh como juego de la
  games-library con su CASOS.md y su acta. Lo que no se pueda hacer sin
  tocar engine/editor es el backlog de mejoras del mundo A (mismo patrón que
  WP-U23).
  **CA:** el juego corre en el mesh desde release de la games-library; acta
  de validación en verde; informe «qué faltó al editor/kits».
  **Demolición:** n/a. delta+pozo siguen siendo el mínimo de la regla de los
  dos juegos.

## Ola 10 — Peers WebRTC (dep U10; paralelizable con olas 7–9; recursos
clonados en [recursos/](recursos/README.md), decisión D-17)

- ⬜ **WP-U88 · Señalización WebRTC vía nuestro mesh + ICE propio** — la
  señalización viaja por lo que ya tenemos: implementación de la
  `SignalingService` abstracta del repo A sobre las **rooms del
  socket-server** (adoptando su contrato de mensajes `webrtc-offer/answer/
  ice-candidate/join-room/…`, con trickle ICE en vez del `waitForIceComplete`
  de B). ICE: **coturn** (STUN+TURN FOSS) desplegado en el VPS junto al pub;
  `iceServers` SIEMPRE desde `presets-sdk/env` (`ZEUS_WEBRTC_STUN`,
  `ZEUS_WEBRTC_TURN*`) — el STUN de Google que ambos repos hardcodean queda
  solo como fallback de pruebas tras flag explícito
  (`ZEUS_WEBRTC_ALLOW_GOOGLE_STUN=1`) que imprime un WARNING gigante; gate
  U00 amplía: `stun.l.google` en código = rojo.
  **CA:** e2e — dos clientes headless negocian DataChannel vía señalización
  por room (sin Google); runbook de coturn en el VPS documentado y probado
  (⏳ honesto si no hay acceso); gate rojo con STUN google sintético.
  **Demolición:** los `iceServers` hardcodeados en lo que se adapte de A/B.

- ⬜ **WP-U89 · Visor WebRTC del mesh (salas y privados)** *(dep U88)* — el
  visor nuevo, hermano Angular de operator-ui, construido sobre la lib del
  repo A (`WebRTCEngine` + peer-list/media-controls/chat): **datos, audio y
  vídeo por salas o en privado (2 peers)**. En las vistas de juego, usuarios
  y admins tienen los **botones** (llamar/compartir/colgar) integrados vía
  canales rabbit-spider-horse: la oferta HORSE de un actor puede incluir
  «contactar por WebRTC» y el contacto del juego abre la negociación.
  Regla dura: **WebRTC no toca la verdad del estado** — la autoridad y el
  ledger siguen mandando (los peers conectados por WebRTC mantienen TODA la
  infra de rooms debajo para recibir `state`/`ledger`/`track`); el
  DataChannel es para media, chat y **bulk de datos: consolidación de caches
  de feeds/firehose entre peers** (transferir objetos de volumen validando
  contra manifests — la primera materialización del transporte p2p de D-14).
  **CA:** demo — dos navegadores en una sala del juego abren video-llamada y
  chat desde los botones del juego; un peer recibe de otro un objeto de
  cache que valida contra su manifest (U80) y su vista lo refleja; el estado
  del juego sigue llegando por la room aunque caiga el canal WebRTC.
  **Demolición:** lo que se adapte de la lib A entra por import/port con su
  procedencia anotada, no como copia muerta.

- ⬜ **WP-U90 · El pub como mediador (señalización SSB)** *(dep U88)* —
  segunda implementación de la `SignalingService`: mensajes SSB privados
  (`type: 'webrtc-signal'`, cifrado `ssb-box`, DM al feedId del peer) para
  que **nuestro pub haga de mediador** entre dos usuarios OASIS — el módulo
  `/webrtc` del repo B deja el copy-paste y usa este transporte (necesita el
  endpoint backend sobre el `sbot`, hoy el módulo es solo frontend). Basta
  offer+answer completos (sin trickle) para tolerar la latencia del gossip.
  **CA:** dos identidades SSB contra el pub negocian un DataChannel sin
  servidor de señalización central ni copy-paste; documentado como PR
  candidato upstream al fork.
  **Demolición:** el flujo copy-paste del módulo en nuestra adaptación (el
  fork original queda intacto en recursos/).

## Horizonte (post-refundación, no tomar aún)

- **WP-U71 · VOLUMES p2p** — publicar/pinnear los volúmenes en una red
  content-addressable (IPFS como candidato primero; se evalúa con evidencia
  frente a hyper/dat). Posible gracias a que el layout ya es inmutable y
  direccionable (DATOS.md §5); añade transporte, no re-diseña formatos.
- **WP-U72 · Persistencia del estado de rooms** — cuando el «dummy state»
  volátil se quede corto: el snapshot/ledger de las rooms alimenta colas de
  estado persistentes, diseñadas files-first (append-only en disco, patrón
  Notario) antes de considerar infraestructura anexa (D-13). Concepto guía
  del manifiesto transmedia: las rooms son «blockchains volátiles» — esta
  pieza es darles memoria sin volverlas pesadas.
- **WP-U73 · El teatro de la capa 2 SSB** — BOE-Arrakis-Theater-Elenco sobre
  las rooms federadas del VPS (hoy solo nomenclatura de diseño en los
  dossiers de aleph-scriptorium): identidad SSB como credencial de room,
  puente Layer1↔Layer2 (mensajes de Tribes/Parliament fluyendo a rooms).
  Depende de spikes externos (SPIKE-10-OASIS-IDENTITY) — no se planifica
  aquí hasta que exista diseño cerrado.
- **WP-U74 · Juego trenzado sobre forces (myth-maker/debunker)** — la spec
  multi-bloque de `ENGINE-XZZX/Juego-spec-plan.md` (una force emite unidad
  semántica → la contra-force responde → una tercera absorbe; la exclusión
  del par pasa de rúbrica de prompt a regla del reducer) como experiencia
  de dramaturgo sobre U86 + U91/U92. Mismo estatus que WP-U87: valida kits
  y forces, no toca la regla de los dos juegos. No se toma hasta que U87
  entregue su informe «qué faltó al editor/kits».