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

- ⬜ **WP-U00 · Gates de prácticas** — test raíz `npm run gates` estilo
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

- ⬜ **WP-U02 · Identidad del juego: delta** (D-8) — retirar el nombre
  «CAUDAL» en favor de **delta**: títulos y prosa de
  `packages/arg/spec/*.md`, README de arg, y las cadenas/banners en código
  (~10 archivos: arg-console kit/vistas/server, authority, launch, contract).
  No cambia rooms, eventos ni rutas (eso es ola 5); solo la identidad.
  **CA:** `grep -ri CAUDAL packages/` limpio (salvo citas históricas en
  plan/DECISIONES.md); `test:arg` + `e2e:arg` verdes.
  **Demolición:** el nombre viejo — sin «(antes CAUDAL)» permanentes en specs;
  la historia queda en git y en D-8.

- ⬜ **WP-U01 · Tests que faltan en el núcleo** — `firehose-core` (hoy
  `test: echo 'sin tests'`) y `room-client-browser` (0 test files): tests de
  comportamiento de su API pública.
  **CA:** `npm test -w` verde en ambos con ≥1 test real por export principal.
  **Demolición:** el `echo 'sin tests'`.

- ⬜ **WP-U03 · Z_SDK + CI** (D-11; ARQUITECTURA §5) — push del monorepo a
  `github.com/alephscriptorium-eng/Z_SDK` (rama main) y GitHub Actions: en
  cada PR/rama `wp/*`, job con `npm ci` + `npm run lint` + `npm run gates`
  (cuando exista, dep U00 blanda: hasta entonces, lint+tests) + matriz de
  tests de paquetes. Sin publish todavía (eso es WP-U53).
  **CA:** una PR de prueba muestra los checks corriendo; rojo si se introduce
  una violación sintética.
  **Demolición:** n/a.

## Ola 1 — El contrato único (engine nace)

- ⬜ **WP-U10 · `@zeus/protocol`** — generalizar
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

- ⬜ **WP-U11 · `@zeus/authority-kit`** *(dep U10)* — autoridad genérica
  extraída de `arg-demos/apps/authority`: loop de tick, aplicación de intents
  vía reducer registrado, emisión state/ledger/track, presupuesto de snapshot,
  arranque/parada limpios (sin huérfanos: cascada SIGINT ya resuelta en
  `arg-demos/launch.mjs` — se hereda, no se reinventa).
  **CA:** la autoridad de delta queda instanciando el kit (diff negativo en
  arg-demos); `e2e:arg` y `test:arg` verdes sin tocar los tests.
  **Demolición:** el código genérico que quede duplicado en arg-demos.

- ⬜ **WP-U12 · `@zeus/player-mcp-kit`** *(dep U10)* — generalizar
  `arg-player-mcp`: patrón «un MCP por actor» con semántica verificable
  (emitir intent → esperar evidencia en state/ledger), dry-run de rechazos,
  resources estándar (`<game>://player/state`, `<game>://scene`,
  `<game>://casos`), health con `connected` + `lastStateTs`.
  **CA:** arg-player-mcp instancia el kit; `e2e:arg-mcp` verde;
  `test:arg-player-mcp` verde.
  **Demolición:** lo genérico duplicado en arg-player-mcp.

- ⬜ **WP-U13 · `@zeus/playbook-kit`** *(dep U12)* — el método CASOS como
  producto: formato de caso (precondición/pasos MCP/observación humana/
  criterio/errores), test de coherencia (generalizar `casos.test.mjs`),
  plantilla de acta (generalizar `spec/VALIDACION.md`), y runner e2e que
  ejecuta la **mitad MCP-verificable** de los casos de un playbook contra una
  demo levantada (la mitad visual sigue siendo humana, por diseño G-ARG.1).
  **CA:** `packages/arg/spec/CASOS.md` pasa el test de coherencia del kit; el
  runner ejecuta C-01/03/04b/05 contra `demo:arg` y produce un acta
  pre-rellenada con la evidencia MCP.
  **Demolición:** el test de coherencia local de arg si queda subsumido.

## Ola 2 — Un solo motor de vistas

- ⬜ **WP-U20 · `@zeus/view-kit`** — extraer el kit de navegador de
  `arg-console/assets/js/kit/` (~4.600 LOC: escena, ventanitas/panel, HUD,
  inspector raycast, stick-puppet, droplets, deep-links honestos) a paquete
  engine browser-safe servido por import-map. arg-console pasa a consumirlo.
  **CA:** `test:arg-console` + `e2e:arg` verdes; `demo:arg` se ve igual
  (verificación humana u captura, anotada honestamente en el reporte).
  **Demolición:** el kit dentro de arg-console (quedan solo las vistas
  tablero/jugador específicas de delta).

- ⬜ **WP-U21 · app-shell aprende de arg-console** *(dep U20)* — las razones
  por las que arg-console evitó `createAppConfig` (whitelist rígida) se
  arreglan EN app-shell; arg-console y las vistas del view-kit usan app-shell.
  **CA:** arg-console sin config propia divergente; los demás consumidores de
  app-shell intactos (sus tests verdes).
  **Demolición:** `arg-console/src/config.mjs` divergente y el comentario «a
  propósito NO usa createAppConfig».

- ⬜ **WP-U22 · 3d-monitor y player-3d-ui sobre view-kit** *(dep U20)* —
  migrar sus vistas al view-kit; evaluar en el reporte si tras la migración
  merecen vivir como apps o pasar a `examples/`.
  **CA:** sus e2e (`e2e:player-3d`, vistas de 3d-monitor) verdes; diff
  negativo neto.
  **Demolición:** el view-kit ancestro duplicado en 3d-monitor (de donde nació
  el de arg-console — el círculo se cierra).

- ⬜ **WP-U23 · pozo, el segundo juego** *(dep U10–U13, U20; D-8)* — juego
  mínimo A PROPÓSITO: un pozo, un puñado de nodos, un feed, UN intent con
  ledger (p. ej. sacar una gota del pozo y etiquetarla), una vista sobre
  view-kit, un MCP de jugador sobre player-mcp-kit, y un CASOS.md corto en
  formato playbook-kit. Regla dura: se construye **solo importando engine/***
  — si para hacer pozo hay que tocar el engine, ese cambio es un hallazgo
  (mejora del SDK) y se hace como WP aparte, no como parche desde el juego.
  Es el gate viviente de la regla de los dos juegos: a partir de aquí, todo
  WP de engine debe dejar verdes a delta Y a pozo.
  **CA:** `demo:pozo` levanta room+autoridad+vista+MCP; e2e — un cliente
  JSON-RPC ejecuta sus casos vía MCP; `gates` verde (engine sin nombres de
  juego); cero imports de `games/delta` ni de `packages/arg`.
  **Demolición:** n/a (es nacimiento). El reporte lista lo que NO se pudo
  hacer sin tocar engine — esa lista es el backlog de mejoras del SDK.

## Ola 3 — Un solo juego

- ⬜ **WP-U30 · Intents del manipulador de líneas** *(dep U10)* — el dominio
  del juego gana los intents del DJ con rol `dj`: `cache` (cachear línea),
  `curate`, `milestone` — hermanos de `label:cast` y `excavate`, con ledger y
  scoring. Diseño previo corto en el spec del juego delta (qué muta cada uno,
  tabla reducer, presupuesto snapshot).
  **CA:** tests de reducer válidos/inválidos por rol; entradas de ledger con
  evidencia; casos nuevos redactados en CASOS.md (formato playbook-kit).
  **Demolición:** n/a (es adición al dominio).

- ⬜ **WP-U31 · player-ui = vista manipuladora** *(dep U30, U11)* — player-ui
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

- ⬜ **WP-U32 · operator-ui = visor de operador** *(dep U31)* —
  `operator-bridge` se recablea del protocolo sesión al contrato único
  (proyección de slice de `state`); sus emisiones se vuelven intents con rol
  `operator`. operator-ui (Angular) consume el bridge nuevo.
  **CA:** `verify:dual-ui`/`e2e:operator-ui` (adaptados) verdes; un intent de
  operador rechazado para rol `player` (test de roles end-to-end).
  **Demolición:** el camino `session:*` en operator-bridge/operator-ui.

## Ola 4 — Resource/REST-driven

- ⬜ **WP-U40 · RouteEntry → MCP resources** — cablear
  `openapi-mcp-projector` dentro de `http-contract`: toda ruta REST declarada
  queda proyectada automáticamente como resource/resource-template MCP. Si al
  implementarlo el projector no aporta (decisión con evidencia en el reporte),
  se implementa la proyección directa en http-contract y **se borra el
  paquete** — lo que no puede pasar es que siga huérfano.
  **CA:** e2e — una ruta de cache-browser o firehose-browser aparece como
  resource-template MCP y responde; `spec:generate:all` la documenta.
  **Demolición:** `openapi-mcp-projector` como huérfano (cableado o borrado).

- ⬜ **WP-U41 · Portal de docs refundado** *(dep U10, U40)* — VitePress
  refleja la realidad: engine/editor/mesh/games, contrato único (AsyncAPI),
  rutas REST (OpenAPI/Redoc), resources MCP, y el método playbook. README
  raíz y README de cada paquete publicable al día (el de `packages/arg` lista
  hoy 3 de 5 paquetes).
  **CA:** `npm run docs:build` verde; navegación sin enlaces rotos; cero
  menciones al protocolo muerto.
  **Demolición:** páginas/specs de la sesión Scriptorium.

## Ola 5 — Monorepo publicable y layout final

- ⬜ **WP-U50 · Scope y publicación** (D-7: scope `@zeus` al registry propio;
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

- ⬜ **WP-U51 · Layout final** *(dep olas 1–4)* — mover a
  `packages/{engine,editor,mesh,games}` + `examples/` según ARQUITECTURA §2,
  (D-8/D-9: `games/{delta,pozo}`, visores en `mesh/`), actualizar workspaces,
  scripts raíz e imports. Un solo WP, mecánico, con el repo ya convergido.
  **CA:** `npm install` limpio; `lint`, `test:arg`, `gates` y los e2e de la
  matriz verdes; `git log --follow` conserva historia de los archivos movidos.
  **Demolición:** las carpetas `lib/ app/ platform/ mcp/ arg/` antiguas.

- ⬜ **WP-U53 · Semver + release desde CI** *(dep U50, U03; ARQUITECTURA §5)*
  — adoptar **changesets** en el monorepo: bump semver por paquete,
  changelog generado, `npm publish` al registry propio desde CI (con el
  pipeline en verde como condición dura), tag git + GitHub Release en Z_SDK.
  Cierra el periodo lockstep 0.x. PRACTICAS §6 pasa de «commit convencional
  basta» a «changeset obligatorio en paquetes publicables».
  **CA:** un cambio de prueba con changeset produce release automático
  end-to-end (bump + changelog + publish + tag) y un pipeline rojo lo
  bloquea.
  **Demolición:** el versionado lockstep manual y cualquier script de publish
  provisional de WP-U50 que el pipeline sustituya.

- ⬜ **WP-U52 · Auditoría de vías muertas** *(última)* — barrido final: por
  cada paquete, lista de consumidores reales (grep de imports); cero
  huérfanos, cero TODO sin backlog, cero código comentado, READMEs veraces.
  Produce el reporte de cierre de la refundación.
  **CA:** reporte con la tabla paquete→consumidores completa; gates verdes.
  **Demolición:** todo lo que la auditoría encuentre, o WP nuevo si es grande.

## Ola 6 — Z_SDK-games-library (dep WP-U50; diseño en ARQUITECTURA §6, D-10)

- ⬜ **WP-U60 · Repo Z_SDK-games-library** (D-11) — crear el repo en
  `github.com/alephscriptorium-eng`, con su propio `plan/`-lite (PRACTICAS y
  plantilla de reporte enlazadas desde aquí, no copiadas), `.npmrc` con los
  scopes, y CI mínima (install + tests de los juegos).
  **CA:** clone limpio + `npm install` + tests verdes en el repo nuevo.
  **Demolición:** n/a.
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

- ⬜ **WP-U80 · `@zeus/linea-kit`** — los formatos canónicos de DATOS.md §2
  como paquete engine: JSON Schemas + validador (nodos.yaml, manifests
  tronco/satélite, registro, snapshots, nodo-sections, registry, sidecars de
  cache, volumes.json) + **loader** de lectura generalizado desde
  `packages/mcp/linea-system` (nodo→secciones→registros, resolución por
  año/oldid). Unificar en el schema la cadena de curación
  (`delta_status`/`labeled`/`editorialStatus` → un solo enum). Browser-safe
  el modelo; node-only el fs.
  **CA:** los datos vivos de `VOLUMES/DISK_02/LINEAS` y `DISK_01/FIREHOSE`
  validan contra los schemas sin tocarlos; linea-system y arg-feeds consumen
  el kit (diff negativo); regla de los dos juegos respetada (el kit no nombra
  juegos).
  **Demolición:** el loader duplicado en linea-system.

- ⬜ **WP-U81 · Herramientas de segmentación del dramaturgo** *(dep U80)* —
  migrar el CONCEPTO de los pythons (segment_linea, segment_poder,
  fetch_wp_historia, fetch_snapshot — punteros en DATOS.md §7) a herramientas
  JS del kit de línea: `crear-linea` (scaffolding desde placeholders:
  nodos.yaml de ejemplo, registry, carpetas), `segmentar` (historial →
  manifest con milestones por reglas), `conectar-satelite` (genera las
  instrucciones/config del MCP satélite y los remotos wiki/ATProto/SSB),
  `fetch` (materializar snapshots con gate de aprobación). Starterkit
  documentado: «crea tu línea en 30 minutos». Los pythons vivos siguen
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

- ⬜ **WP-U82 · CRUD de volúmenes: medir y vaciar** *(dep U80; encaja con la
  ola 4)* — capa de operación sobre volumes.json/DISKs, files-first: medición
  (tamaño por volumen/corpus/línea) y **vaciado** con roles (DATOS.md §4:
  operator = purga dura con asiento; player/dj = vaciado jugable vía intent).
  Todo expuesto REST + MCP resource desde una definición (patrón WP-U40);
  nada toca disco sin pasar por autoridad (intents) u operación con ledger.
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

## Ola 8 — Feeds federados (dep U80)

- ⬜ **WP-U84 · Conector SSB → VOLUMES (Tribes y Parliament)** — exportador
  del log del pub OASIS (mensajes tipados `tribe*`, `parliament*`, votos —
  modelos en DATOS.md §7) a **JSON en disco**: volumen `DISK_03/SSB` con
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

## Ola 11 — El puente al mundo TS (diseño en [PUENTE.md](PUENTE.md); dep U50)

- ⬜ **WP-U91 · @zeus consumible desde Bun/TS** *(dep U50, U10)* — el
  protocolo cruza la frontera con tipado: `@zeus/protocol` (y los paquetes
  que el gemelo pida) publican **`.d.ts`** generados de los schemas, y se
  verifica el consumo real: proyecto Bun de humo que instala `@zeus/*` desde
  el registry (`bunfig`/`.npmrc` con el scope) y se une a una room emitiendo
  un intent tipado. Documentar el handshake para clientes externos
  (`ZEUS_SCRIPTORIUM_URL`, auth `{token, room, user}` — lo mismo que su
  Pub.Rooms espera).
  **CA:** el smoke Bun corre en CI (o runbook ejecutado con evidencia);
  tipos publicados en el tarball; sin cambios de runtime en mjs.
  **Demolición:** n/a.

- ⬜ **WP-U92 · Sembrar el plan gemelo en NETWORK-ENGINE** *(dep U91)* —
  inicializar el programa del bridge EN SU repo y EN SU idioma (PUENTE.md
  §3): dossier + epic AGILE + contexto LAYER_2 según su AOS, con el
  bootstrap del scope `@zeus`, la feature `edge-zeus`, los spikes (relay,
  Peer Card) y la regla de oro «construir desde el registry fresh». Se
  entrega como PR/propuesta respetando su constitución (Bun, modos,
  Markdown-First); su swarm implementa el lado TS — el nuestro no.
  **CA:** el seed existe en su repo, pasa su DoD documental, y una sesión
  de su AOS puede arrancar el epic sin contexto de nuestra conversación;
  hallazgos para ellos anotados (package-lock legacy, hueco del relay).
  **Demolición:** n/a (repo ajeno: propuesta, no imposición).

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