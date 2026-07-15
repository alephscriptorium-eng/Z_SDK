# DECISIONES — registro y pendientes

Formato: D-n, fecha, decisión, consecuencia. Las abiertas las resuelve el
usuario; hasta entonces los WPs que dependan de ellas no se toman.

## Tomadas

- **D-0 · 2026-07-15 · Refundación en el sitio, no repo nuevo.** El patrón
  CAUDAL (autoridad + intents + ledger + gates + playbook) se asciende a motor
  del SDK; el resto converge por olas con demolición obligatoria. Motivo: el
  núcleo lib está vivo; lo frankenstein es la capa app/protocolo; e2e + docs +
  flujo swarm valen más que un historial limpio.
- **D-1 · 2026-07-15 · Un solo juego.** player-ui es el manipulador de líneas
  del MISMO juego (mismas líneas, misma cache); cachear/etiquetar/curar/
  milestone son intents del dominio con rol `dj`. operator-ui es otro visor
  del mismo tipo con rol `operator`.
- **D-2 · 2026-07-15 · Un solo contrato.** `state|intent|track|ledger` con
  roles; el protocolo de sesión Scriptorium se absorbe y muere (ola 3). El
  AsyncAPI se genera del contrato único; foco resource/resource-template/REST
  driven (ola 4).
- **D-3 · 2026-07-15 · Sin nombres de transición ni vías muertas.** Prohibido
  legacy/v2/-old/-new/aliases de compatibilidad; cada WP demuele lo que
  sustituye; git es la memoria histórica.
- **D-4 · 2026-07-15 · Renombrar/mover está permitido**, pero se ejecuta al
  final (ola 5), cuando el contenido ya convergió.
- **D-5 · 2026-07-15 · Dos mundos sobre un engine común**: editor (crear
  juegos) y mesh (operar + jugar), con las nociones game/release/ronda/start
  pack del glosario de VISION.md.
- **D-6 · 2026-07-15 · El swarm implementa, el orquestador planifica y
  revisa** en esta carpeta; reportes por WP en `REPORTES/` con auto-revisión
  obligatoria (PRACTICAS.md §3).

- **D-7 · 2026-07-15 · Scope npm: se mantiene `@zeus`** (resuelve DA-1, por el
  usuario). El scope no existe aún en el registry propio porque lo estamos
  creando: WP-U50 añade `@zeus:registry=https://npm.scriptorium.escrivivir.co`
  al `.npmrc` y publica ahí. Sin renombrado de scope en WP-U51.
- **D-8 · 2026-07-15 · Nombres de juego: `delta` y `pozo`** (resuelve DA-2;
  naming delegado al orquestador). «CAUDAL» fue bautizo de un agente anterior
  y se retira. El juego grande pasa a llamarse **delta** — es el nombre que el
  propio juego ya usa por dentro (escena `delta-v0`, room `ARG_DELTA`, «el ARG
  del delta»): se canoniza lo real en vez de inventar otra palabra. Y se crea
  un **segundo juego mínimo: `pozo`** (un pozo, un nodo, un intent), cuya
  razón de ser es arquitectónica: obliga a desacoplar engine de juego. De aquí
  nace la **regla de los dos juegos** (VISION.md §principios, PRACTICAS.md):
  nada es engine hasta que los DOS juegos lo consumen, y el engine jamás
  nombra un juego concreto (gate).
- **D-9 · 2026-07-15 · Visores: viven en el mesh e ilustran en examples**
  (resuelve DA-3, por el usuario). `player-3d-ui` y `3d-monitor` son los
  visores: se quedan como apps del mesh Y sirven de ilustración del engine.
  Sin copias (PRACTICAS §1.4): el paquete vive una vez en `mesh/`; `examples/`
  contiene escenas/configs mínimas sobre view-kit que los propios visores
  reutilizan — el ejemplo es un consumo real, no un fork.
- **D-10 · 2026-07-15 · Los juegos se distribuyen en `Z_SDK-games-library`**
  (resuelve DA-4, por el usuario; propuesta de almacenamiento en
  ARQUITECTURA.md §6). Repo independiente con la misma terminología
  (`Z_SDK-games-library`, paquetes `@zeus/*`), pensado para contener juegos y
  sus datos/recursos pesados, que NO van en git normal. Estudiado 2026-07-15:
  Git LFS gratuito = 1 GB almacenamiento + 1 GB/mes de banda (se bloquea al
  agotar); GitHub Releases = 2 GiB por archivo, sin límite total ni de banda,
  1000 assets por release. Propuesta: git normal para código+specs+assets
  pequeños; **Releases + registry npm propio para start packs y volúmenes**
  (inmutables, crecen por ronda); LFS solo residual. La extracción del
  monorepo a la library es la ola 6 (tras WP-U50): hasta entonces `games/*`
  se desarrolla en el monorepo.

- **D-11 · 2026-07-15 · Topología de repos en GitHub** (resuelve DA-5, por el
  usuario; splits adicionales delegados al orquestador con vía libre).
  `Z_SDK` = hogar público del monorepo zeus-sdk (engine + editor + mesh +
  examples). El repo nuevo de juegos se llama **`Z_SDK-games-library`**
  (mismo prefijo, sufijo games-library), en `github.com/alephscriptorium-eng`.
  Valoración del orquestador sobre más splits: **dos repos y ya** durante la
  refundación. Criterio para que algo merezca repo propio (los tres a la vez):
  (a) cadencia de release propia, (b) consumidores fuera del monorepo,
  (c) no necesita cambios atómicos con el resto. La games-library los cumple
  (los start packs crecen por ronda, no por commit de engine); el engine NO
  los cumple entre sí (versionado lockstep + las olas cruzan paquetes
  constantemente: separarlo ahora = round-trips por registry en cada WP).
  Único candidato futuro: `operator-ui` (build Angular ya aislado, deps
  `file:` que WP-U50 convierte en deps de registry) — se revisa tras la ola 5,
  no antes. Los docs y el plan viven con el código que documentan.

- **D-12 · 2026-07-15 · Protocolo de swarm en `plan/roles/`; semver+CI/CD por
  fases.** Los prompts de rol (nacidos como `SWARM-*.md` en la raíz) se
  mueven a `plan/roles/` como **protocolo agnóstico de herramienta**;
  `.cursor/rules/` queda como adaptador Cursor (si contradice a `plan/`, gana
  `plan/`). Correcciones de protocolo aplicadas al mover: (a) `BACKLOG.md` lo
  edita SOLO el orquestador y siempre en master — el 🔶 se marca al asignar
  el brief, un 🔶 de worker en su rama no lo ve nadie; (b) workers paralelos
  requieren `git worktree` (un checkout no soporta N ramas a la vez);
  (c) ✅ implica autorización de merge. Y el después de las olas queda
  integrado: **commits convencionales desde ya** (PRACTICAS §6), **CI en
  Z_SDK desde la ola 0** (WP-U03: lint+gates+tests por PR), **changesets +
  release semver por paquete desde CI al cerrar la ola 5** (WP-U53;
  changesets y no semantic-release por ser monorepo npm-workspaces con
  registry propio y bumps por paquete).

- **D-13 · 2026-07-15 · Files-first** (por el usuario; VISION §7, DATOS §5).
  El plano de datos de admins y jugadores es JSON en disco antes que infra
  anexa: ni dockers con base de datos ni colectores de cola. El estado
  volátil de rooms pasará a colas de estado persistentes en algún punto —
  diseñadas también files-first (ledger append-only, patrón Notario) y solo
  después considerando infraestructura (horizonte WP-U72).
- **D-14 · 2026-07-15 · Alineación p2p/IPFS por diseño, transporte después**
  (por el usuario, «antes IPFS que dockers»; DATOS §5). Los objetos pesados
  de VOLUMES se mantienen inmutables y direccionables; los manifests toleran
  `cid` opcional; publicar/pinnear en IPFS (u otra red content-addressable,
  con evidencia) es horizonte WP-U71, no requisito de las olas.
- **D-15 · 2026-07-15 · Tres familias de feed y VOLUMES compartidos** (por el
  usuario; DATOS §1/§3). Estática con autoridad (wiki/oldid), stream
  (ATProto), gossip & peers (SSB: Tribes y Parliament del pub OASIS). Mismo
  procedimiento para todas: JSON a disco + volumes.json + MCP loader
  read-only. Los VOLUMES son del mesh y los comparten todos los juegos, que
  los inflan (cachear/curar/milestone) y los vacían (CRUD por roles, WP-U82)
  siempre con asiento en ledger. La cadena de curación se unifica
  (`delta_status`/`labeled`/`editorialStatus` → un enum, WP-U80).
- **D-16 · 2026-07-15 · El dramaturgo y el tercer juego** (por el usuario;
  DATOS §6). El dramaturgo es la persona del mundo A; recibe dos kits: el de
  línea (formatos + segmentación + conexión de satélites, WP-U80/U81 — no
  hacemos su segmentación, damos spec y herramientas) y el de experiencia
  (CARPETA DRAMATURGO destilada de ALEPH_ET_OMEGA/SOLVE_ET_COAGULA, WP-U86).
  **SOLVE ET COAGULA será el tercer juego**, recreado con el editor + kits
  (WP-U87) como prueba del mundo A. La regla de los dos juegos no cambia:
  delta+pozo siguen siendo el mínimo del engine.

- **D-17 · 2026-07-15 · WebRTC con mediación propia y sin Google** (por el
  usuario; ola 10, recursos en `plan/recursos/`). Un visor WebRTC más para el
  mesh: **salas y privados (2 peers)** con datos, audio y vídeo, botones en
  el juego para usuarios/admins integrados vía rabbit-spider-horse. La
  señalización viaja por NUESTRO sistema (rooms del socket-server; y el pub
  SSB como mediador en WP-U90 — mensajes privados cifrados). STUN/TURN:
  **existe FOSS sólido — coturn** (el TURN/STUN de referencia, usado por
  Matrix/Jitsi/Nextcloud; alternativa eturnal), se autoaloja en el VPS: NO
  hace falta el warning por inexistencia, pero sí la valla — este producto
  es para gente que odia Google, así que el STUN de Google (que ambos repos
  clonados traen hardcodeado) queda SOLO como fallback de pruebas tras flag
  explícito con WARNING gigante, jamás en producción, con gate que pone en
  rojo `stun.l.google` en código. Principio arquitectónico: **WebRTC es
  canal adicional, no verdad** — el estado sigue siendo autoridad+ledger por
  rooms (los peers WebRTC tienen toda la infra debajo para updates); el
  DataChannel sirve media, chat y bulk de consolidación de caches entre
  peers (primera materialización del p2p de D-14, siempre validando contra
  manifests).

- **D-18 · 2026-07-15 · El puente al mundo TS es federación, no fusión**
  (por el usuario, «puro spinoff»; diseño en PUENTE.md, ola 11). zeus-sdk
  sigue siendo mjs (aceptación del mundo OASIS); NETWORK-ENGINE sigue siendo
  TS/Bun con su propia constitución (AOS). Tres tablones: **el registry como
  frontera** (ellos consumen `@zeus/*` fresh desde Verdaccio; dirección
  única — sus paquetes exportan `.ts` crudo y no se importan), **los cables
  como idioma** (Socket.IO rooms + MCP Streamable HTTP, que ambos ya
  hablan; nuestras rooms cubren el hueco de su relay), **los datos como
  suelo** (formatos linea-kit/VOLUMES). El plan gemelo se siembra EN su repo
  y EN su idioma (dossier + epic AGILE + AOS, WP-U92) y su swarm construye
  el lado TS. Carambola estratégica: su gap declarado «orquestador de juego
  no existe» lo cubre nuestra autoridad servida por room.

## Abiertas (bloquean lo indicado)

*(ninguna — todo el backlog hasta la ola 11 está desbloqueado; los horizontes
WP-U71/72/73 esperan evidencia o diseño externo)*
