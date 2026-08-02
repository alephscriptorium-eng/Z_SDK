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

- **D-18 · 2026-07-15 · Zeus publica para consumidores anónimos** (por el
  usuario). El registry es una **frontera pública unidireccional**: terceros
  construyen sobre `@zeus/*` (paquetes con tipos `.d.ts`, protocolo
  documentado, handshake de rooms publicado) sin que Zeus sepa quiénes son
  ni les publique nada a medida. Este plan **no nombra consumidores
  concretos**: si un consumidor necesita algo, entra como issue/WP genérico
  de la frontera (WP-U54). Corolario: zeus-sdk es y sigue siendo mjs — el
  mundo que lo rodea (OASIS) es mjs; la frontera tipada basta para
  cualquier otro runtime.

- **D-19 · 2026-07-15 · Forces y cotas: la física del sistema** (por el
  usuario; DATOS §8). Además de las líneas (dramaturgo), el plano de datos
  gana la entropía que aporta EL SISTEMA: **forces** (corpus indexados de
  logs de agente segmentados en escenas, con metadata de activación
  declarativa y presupuesto por registry) acotadas por **sima/cima** (cotas
  inferior/superior = polos colapso/victoria de una ronda). Formatos
  adoptados de un corpus probado (registry de 10 forces + 2 cotas en
  network-engine, cobertura verificable por segmentadores). Mapeo: activar
  force = intent `operator`/`dj` con asiento en ledger; budget/pares/
  exclusiones = validación del reducer; escenas ancla = tracks; corpus =
  volúmenes read-only. Naming obligatorio: «force», jamás «engine»
  (colisión con `engine/*`). Las forces concretas son datos (VOLUMES/start
  packs de la games-library); `engine/*` solo conoce el formato — corolario
  de la regla de los dos juegos, con gate. WPs: U80 (formatos), U91
  (loader), U92 (intents); horizonte WP-U74 (juego trenzado).
  **Ejecutado el mismo día**: corpus importado y curado a
  `VOLUMES/DISK_03/FORCES` (12 corpus, 68 escenas; capa trace y raw fuera,
  manifests unificados, IDs zeus, refs tipadas — ver IMPORT_NOTES.md del
  volumen). El plan queda autocontenido: zeus ya no depende de codebases
  externas para las forces. **DISK_03 viaja en git** como excepción a la
  política de VOLUMES (corpus curado ~1,3 MB de texto; DISK_01/02 siguen
  gitignorados); el slot SSB de WP-U84 pasa a DISK_04. El import simuló la
  salida del linea-kit; WP-U81 lo convierte en herramienta
  (`segmentar-force`, `crear-cotas`) para que el dramaturgo cree sus
  forces desde sus propios contextos y sus líneas de cota.

- **D-20 · 2026-07-18 · Peer-card como puente autoridad → WebRTC → SSB**
  (resuelve DA-PeerCard; opción **A cablear-puente**, no B). Premisa
  «SSB = horizonte lejano» queda retirada: pub Oasis 0.8.8 desplegado y
  sano; U88–U90 ya son **carril de datos** (DataChannel / VOLUMES LAN),
  no solo A/V — el control de acceso es función básica del torno.
  Cadena hoy: (1) la autoridad de sala **emite** el peer-card al join;
  (2) la señalización WebRTC **exige** card válida (rol/frescura) antes
  de offer/answer/ICE — **WP-U93**; (3) el asiento SSB (credencial de
  room / grafo de follows del pub) queda como **punto de extensión
  explícito** en U93 (documentado, sin implementar el puente), alineado
  con la **fila 1** de la nota-tabla del conector Oasis (carril
  WebRTC/DataChannel LAN complementario a `ssb-blobs` WAN). No demoler
  `makePeerCard` / helpers de protocol. Consecuencia: U93 desbloqueado.

- **D-21 · 2026-07-18 · Transporte VOLUMES sobre pub Oasis (filas 2–6)**
  (resuelve **DA-OasisTransport**; nota-tabla **A-11** recibida; orquestador
  rellena veredictos, no redacta la nota). Fila 1 ya cerrada en D-20/U93.
  | # | Tema | Veredicto | Destino |
  |---|------|-----------|---------|
  | 2 | VOLUMES blobs content-addressed (hash=`cid`; chunk-as-blob >50 MB) | **aceptar (adoptar)** | Alineado a **D-14** (manifests ya toleran `cid`); no WP solo por el modelo |
  | 3 | Encaje carril **saliente** vs U84 ✅ entrante | **WP nuevo ⬜** (opción **b**) | **WP-U101** hermano post-U84; **no** re-abrir U84; **no** asignar horizonte U71 |
  | 4 | Quién ejecuta | **aceptar (b)** | Equipo del pub entrega servicio/sidecar sobre `blobs.*`; zeus consume y valida contra CAs. Enganche LAN: **peer-card U93 = portero** (no bloquea U93) |
  | 5 | Spike blob-sync 2-nodos antes de comprometer | **WP nuevo ⬜** (**sí**) | **WP-U100** — barato; su evidencia despeja compromiso de U101; necesita cliente levantado (ops/pub) |
  | 6 | Grafo de follows como prerequisito P2P | **aceptar como operación** | Nodos se siguen entre sí; **no** WP de producto ni «romper follows como feature» |
  Consecuencia: U93 sigue desbloqueado (frontera A-11). U100→U101 ⬜;
  U71 permanece horizonte (no inventar como asignable). Ola 6 no.
  **Nota ops (2026-07-18):** ~~cadena transporte U100→U101 pausada en
  U101 hasta refinement~~ — **cerrada**. U100 ✅ (veredicto spike «no
  despeja»; live `ZEUS_BLOB_*` ⏳).
  **Nota refinement U101 (2026-07-18):** pausa levantada con la
  **§Cara ciega** del handoff vigía (solo el bloque citado al
  orquestador — voz «equipo del pub»). (1) Entorno 2 nodos calza
  `ZEUS_BLOB_SIDECAR_URL` / `ZEUS_BLOB_SYNC_NODE_A` /
  `ZEUS_BLOB_SYNC_NODE_B` (A=cliente Oasis local; B=pub VPS 0.8.8;
  precond follows mutuos). (2) Interfaz servicio objetos adoptada como
  contrato de U101; **veredictos orquestador a las 5 preguntas:**
  ① poll `estado/:cid` basta en v0 (sin webhook/evento); ② auth HTTP
  del namespace: nada en LAN / token opcional vía env (mTLS fuera);
  ③ campos manifiesto: `cid`, `manifestCid`, chunks 5 MB (alineado
  D-14); ④ U101 consume por **HTTP** el plano control (no muxrpc en
  monorepo); datos siguen `ssb-blobs` gossip; ⑤ autorización
  sbot↔cliente del servicio = ops (socket unix local; zeus no habla
  sbot). (3) Residual peer-card del visor = informativo → cola U93;
  no abre alcance en U101. U101 asignable (🔶).

- **D-22 · 2026-07-18 · Frentes post-docs (U103 ✅)** (por el usuario /
  custodio; entrega `ENTREGA-2026-07-18b-frentes-post-docs`). Cinco
  frentes, orden de ejecución:
  | # | Frente | Veredicto | Destino |
  |---|--------|-----------|---------|
  | 1 | Economía de builds (paths/`paths-ignore` en ci/release/docs) | **GO ahora** | **WP-U104** — completar lo que falta tras concurrency ✅ |
  | 2 | Publish `engine/*` | **prep GO; publish real gated ops** | **WP-U105** (`release:dry` + PR versión changesets); publish real cuando registry D-7 + `NPM_TOKEN`; juegos NO (ola 6). Tras publish real → **U55** |
  | 3 | Ola 6 — `Z_SDK-games-library` | **GO** (creds GitHub) | **WP-U60** crea repo (D-11); luego U61/U62; abre ola 9 |
  | 4 | Sidecar / `ZEUS_BLOB_*` | **DIFERIDO sin plazo** | Live U100/U101 queda ⏳ **por diseño**; no preguntar ni reabrir hasta ops |
  | 5 | Dominio propio docs Pages (`z-sdk.escrivivir.co`) | **GO** (WP micro) | **WP-U106** — VitePress `base` `/Z_SDK/`→`/`; Custom domain + Enforce HTTPS (Settings); DNS `CNAME z-sdk → alephscriptorium-eng.github.io` = **ops usuario**. ⬜ hasta U104 ✅ (solapa path-filters `docs.yml`) |
  Orden: **(1) → (3) ∥ (5) ∥ (2)-prep → publish real (ops) → U55**.
  **Addendum orquestador (2026-07-18):** el punto (5) llegó en la misma
  entrega b; D-22 se amplía de 4→5 frentes. Hostname con guion medio
  (`z-sdk`; guion bajo inválido en DNS/certs). URL viva hoy:
  `https://alephscriptorium-eng.github.io/Z_SDK/` (`base: /Z_SDK/` en
  Actions vía `resolveDocsBase()`).

- **D-23 · 2026-07-18 · Catálogo público games-library + dominio
  `games.z-sdk.escrivivir.co`** (por el usuario / custodio; addenda
  **A-14**). La library (`Z_SDK-games-library`, U60–U62 ✅) gana un
  catálogo FOSS (portada por juego + sección releases/start packs), no
  solo «docs». Técnica = réplica U103/U106 (VitePress + Pages + piel
  zine). Subdominio **decidido**: `games.z-sdk.escrivivir.co` (mismo
  patrón U106; DNS `CNAME · games.z-sdk → alephscriptorium-eng.github.io`
  = ops usuario). Destino: **WP-U107** ⬜. No abre DA; no interrumpe
  lote-ola9-a (U70/U86).

- **D-24 · 2026-07-18 · Sprint 1 bug-fixing (ENTREGA-18d)** (GO
  usuario). Tres bloques en orden **A → B1∥B2 → C**:
  | # | Bloque | Destino |
  |---|--------|---------|
  | A | CI main verde (4 workspaces rojos) | **WP-U119** (primero; gate) |
  | B1 | Prosa portal zeus/docs | **WP-U120** (tras U119; ∥ U121) |
  | B2 | Prosa portal library/docs | **WP-U121** (tras U119; ∥ U120) |
  | C | Auth durable registry | **WP-U122** (final; desbloquea ops→U55) |
  **Exención prosa (usuario):** heros y lemas de marca («Crear juegos,
  no dialectos», etc.) **NO se tocan**; P1-sin-negación solo en páginas
  doctrinales (no en heros). **Credencial registry (tick ops/usuario):**
  modelo **(a)** basic-auth no caducable (`_password` base64) — no JWT
  `_authToken` de 7d. Frontera: swarm ajusta `release.yml` (U122); ops
  carga el secret cuando U119 deje CI verde. Fuente:
  [ENTREGA-2026-07-18d-sprint1.md](REPORTES/entregas/ENTREGA-2026-07-18d-sprint1.md).

- **D-25 · 2026-07-19 · Sprint 2 ADDENDA + CAPA** (GO usuario · ruta
  canónica `ADDENDA/ENTREGA-2026-07-19-sprint2.md`). Lote:
  | # | Bloque | Destino |
  |---|--------|---------|
  | A W-A | Capa editorial hero zeus (`01-PAQUETE-CAPA`) | **WP-U124** |
  | A W-B | Capa editorial library docs (5 ficheros CAPA) | **WP-U125** |
  | B1 | YAML `release-startpack.yml` (library) | **WP-U126** |
  | B2 | Higiene worktrees library (huérfanos) | **WP-U127** |
  | B3 | Deps `@zeus/*: "*"` → caret semver | **WP-U128** |
  | B4 | Links `estado.md` → repo `Z_SDK` | **WP-U129** |
  | C | Plantilla de sprint (PRACTICAS/roles) | **WP-U130** (cierre) |
  | D | Docs regeneración web (`publicar-la-web.md`) | **WP-U131** |
  **Orden:** A ∥ B; D cabe con A; C = acta de cierre. **Reglas CAPA:**
  verbatim; anclas ANTES; conflicto = reporte; slugs intactos. **Heros:**
  CAPA **cambia** lemas (A → `Z_SDK` / Ventana de Contexto; B → Juegos
  Z_SDK) — prioriza ADDENDA sobre exención D-24 y sobre el paquete
  marketing WEBS/ENTREGA-SPRINT2 (archivado
  [SUPERADA-…](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/SUPERADA-marketing-webs-sprint2/)).
  Sustituye micro pendiente «hero en positivo». Fuente:
  [00-ADDENDA.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/00-ADDENDA.md) ·
  [01-PAQUETE-CAPA.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/01-PAQUETE-CAPA.md).
  **Pendiente aparte (no bloquea Sprint 2):** si WEBS/ENTREGA-CAPA recibe
  otra iteración de backtracking, GO explícito del usuario. → **cumplida
  en D-26** (AMEND CAPA rev2).

- **D-26 · 2026-07-19 · AMEND Sprint 2 — CAPA rev2 / verdad de canales**
  (GO usuario · ampara D-25). Auditoría WEBS (CANTERA/01 rev1) halló
  Web B con afirmaciones falsas de canal: `@zeus/startpack-*` **no**
  están en registry npm (404); canal operativo = tarball del Release.
  Nada reabre U124/U125 ✅ — WPs nuevos. Lote **A ∥ B ∥ C**:
  | # | Bloque | Destino |
  |---|--------|---------|
  | A | Correctivo W-B′ — CAPA rev2 verbatim (6 ficheros library) | **WP-U132** |
  | B | Port C8/C9 (+ valorar auditoría) → PRACTICAS | **WP-U133** |
  | C | Archivar ENTREGA-* raíz + regla handoffs | **WP-U134** |
  **Fuentes (absolutas; orquestador NO copia a `plan/`):**
  `nota externa recibida (temp-review, 2026-07-19)` (WEBS/ENTREGA-CAPA/00-NOTA) ·
  `nota externa recibida (temp-review, 2026-07-19)` (WEBS/ENTREGA-CAPA/01-PAQUETE-CAPA)
  (rev2). **Fuera de lote:** publish npm startpacks = residual ops (NO
  WP). Al ocurrir: `futuros.md` + fichas re-anuncian canal por nombre
  previa C8.

- **D-27 · 2026-07-19 · GO protocolo Actions Fase 0+(b)** (GO usuario).
  Micro gobernanza: ritual/`gh run*` en roles + PRACTICAS + PLANTILLA.
  Alcance = editar solo `plan/` (no workflows, no Cursor-in-CI, no MCP/
  Automations obligatorios). Destino: **WP-U135**.

- **D-28 · 2026-07-19 · GO micros post-AMEND** (GO **usuario** · lote
  AMEND D-26–D-28). El vigilante entregó hallazgos; **no** es fuente de
  GO (no sentar precedente «GO implícito vía vigilante»). Micros
  library + reporte zeus, en paralelo con U135 (no lo pisan):
  | # | Micro | Destino | Estado |
  |---|-------|---------|--------|
  | 1 | C8 residual fence Registry en `docs/startpacks.md` | **WP-U136** | ✅ |
  | 2 | Docs deploy saltado ≠ verde (premisa) | **WP-U137** | **N/A** (causa real = push faltante; no gate skip=rojo) |
  Espíritu CAPA / PRACTICAS §8 C8. Fuentes CAPA en WEBS (no copiar a
  `plan/`). Publish npm startpacks sigue residual ops (NO WP).

- **D-29 · 2026-07-19 · GO bug nav API HTML / SPA** (GO **usuario**).
  Micro: menú «API HTML» 404ea en navegación in-app (`cleanUrls` + router
  SPA vs assets `docs/public/api/*.html`). Destino: **WP-U138** (zeus
  `docs/.vitepress/config.mjs` + ampliación C8 en PRACTICAS: canal de
  verificación = canal de uso; no `curl` para bugs de router). Fuente:
  nota externa recibida (temp-review, 2026-07-19) (`ENTREGA-2026-07-19b-bug-api-nav.md`)
  (no copiar a `plan/`). Library: N/A código si no enlaza `/api/`.
  Vigilante puede haber reportado el bug — **GO = usuario**.

- **D-30 · 2026-07-19 · GO bug API links cuerpo md / SPA** (GO **usuario**).
  Seguimiento de U138 ✅ (**no reabrir**): mismos assets `/api/*.html`
  enlazados desde el **cuerpo** markdown sin `target` → clic SPA → 404.
  Destino: **WP-U139**. CA por **clase** (no solo síntoma de 3 páginas):
  cero `href="/api/` sin `target` en `docs/**`. Fuente:
  nota externa recibida (temp-review, 2026-07-19) (`ENTREGA-2026-07-19c-bug-api-nav-cuerpo.md`)
  (no copiar a `plan/`). Vigilante = hallazgo/devolución CA; **GO =
  usuario**.

- **D-31 · 2026-07-19 · GO micro higiene rutas absolutas (U140)** (GO
  **usuario** / GO I5 externo). Nota externa recibida (temp-review,
  2026-07-19) — «Higiene · rutas absolutas de máquina local en el plan
  público»; archivada en
  `plan/REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md`.
  Destino: **WP-U140**. Sustituir cada ruta local por «nota externa
  recibida (temp-review, &lt;fecha&gt;)»; CA por clase: grep patrones
  (1)/(2) de esa §Nota = 0 en todo el repo (incl. hit WP-U122).
  Prioridad: antes del próximo push (`main` público).
  **Adenda vigía (misma fecha, pre-✅):** alcance incluye la entrega
  archivada; ejemplo de patrón neutro sin nombre de repo; CA **sin
  eximir** ese fichero.

- **D-32 · 2026-07-19 · GO residual ceguera reporte U140 (U141)** (GO
  residual post-U140 / re-verificación externa). Tras U140 ✅ en main
  (`0e604ae`), rutas absolutas y scrub de clase OK; el reporte U140 cita
  en claro el token objetivo (nombre-repo-externo) en evidencia de grep.
  Nota archivada:
  `plan/REPORTES/entregas/ENTREGA-2026-07-19-ceguera-reporte-u140.md`.
  Destino: **WP-U141**. Enmascarar token en
  `plan/REPORTES/WP-U140-scrub-rutas-locales.md`; CA: grep del token = 0
  en todo el repo (incluido ese reporte). No reabre U140.

- **D-33 · 2026-07-19 · GO ENTREGA Sprint 3 / I50** (GO **usuario**,
  aparte; paralelo a U141). Autoriza recepción del anuncio Sprint 3:
  frágiles restantes + oferta paquete público skills v0.2 como recurso
  registry (blind-safe). **§Nota recibida** (2026-07-19) —
  [REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md).
  **WP-U142** ✅ (recepción/triage orquestador). Triage: 4 ítems del
  anuncio previo ya resueltos en main → N/A; quedan **U143** (CNAME) y
  **U144** (`npm ci` consulta) — implementación amparada por **D-34**.
  Oferta `@alephscript/skills-scriptorium@0.2.0` = recurso opcional
  (no WP). No mezcla con U141.

- **D-34 · 2026-07-19 · GO implementación U143 ∥ U144** (GO **usuario**).
  Cierra el «espera GO por ítem» de D-33 para los dos micros Sprint 3
  restantes. Lote paralelo:
  | # | Micro | Destino | Notas |
  |---|-------|---------|-------|
  | 1 | CNAME `docs/public/` (portal + catálogo) | **WP-U143** | Contenidos: zeus `z-sdk.escrivivir.co` · library `games.z-sdk.escrivivir.co`. No tocar DNS/Settings. |
  | 2 | Consulta `npm ci` vs `npm install` (docs.yml catálogo) | **WP-U144** | No imposición: o `npm ci` + build verde, o comentario en el yml. Orquestador/worker decide desenlace. |
  Fuente: [ENTREGA-2026-07-19-sprint3.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md).
  **U142** ✅ intacto. Briefs + 🔶 al asignar. I51 (cierre Sprint 3)
  espera aceptación de ambos.

- **D-35 · 2026-07-20 · Adoptar skills-scriptorium@0.3.0 como referencia
  versionada** (GO **usuario** · opción **(a)** de la oferta externa).
  Nota archivada:
  [REPORTES/entregas/ENTREGA-2026-07-20-skills-0.3.0-decision.md](REPORTES/entregas/ENTREGA-2026-07-20-skills-0.3.0-decision.md).
  **Decisión:** adoptar `@alephscript/skills-scriptorium@0.3.0` (registry)
  como **referencia versionada canónica** del protocolo de swarm.
  **Consecuencia para `plan/roles/`:** en este paso **no se borra ni se
  migra**; permanece como **copia operativa** del repo (ancestro local que
  funciona). La procedencia apunta al paquete 0.3.0; una eventual
  sustitución gradual (`roles/` → README-referencia con versión fijada)
  queda fuera de esta decisión — requiere GO + WP aparte. **CA:**
  decisión registrada; nada más cambia (sin worker, sin migración).

- **D-36 · 2026-07-20 · Versionado del paquete skills: rango
  `>=0.10.0 <1.0.0`, pin solo de major** (GO **usuario**, orden directa
  en sesión; formalización delegada al orquestador). **Decisión:** la
  dependencia `@alephscript/skills-scriptorium` se declara con rango
  **`>=0.10.0 <1.0.0`** (cualquier `0.y.z` con `y≥10`; la versión
  efectiva la fija `package-lock.json`). **Deroga** el «pin exacto
  0.3.0» que D-35 daba por doctrina. Motivación original (2026-07-20):
  adoptar sin WP por release dentro del major 0. **Reconciliación
  2026-07-24 (GO custodio · adoptar `@0.10.0`):** el rango vivo pasa de
  `0.x` a **`>=0.10.0 <1.0.0`** (piso 0.10.0; sin `latest`; sin
  cherry-pick). **Consecuencias:** `package.json` raíz en ese rango ·
  prosa alineada en `roles/README.md` / `README.md` / `PRACTICAS.md` /
  `ESTACION.md` · adopción = `npm update @alephscript/skills-scriptorium`
  + `npm run skills:sync` (sin WP; si un update rompe CA, se abre WP).
  **CA:** decisión registrada; lock pin exacto `0.10.0` tras adopción
  GO 2026-07-24.

- **D-37 · 2026-07-20 · Adoptar 0.3.1 como baseline + «a partir de ahora
  con el sistema nuevo»** (GO **usuario**). El rango `0.x` (D-36) ya
  resolvió `0.3.1`. Se adopta como línea base y se asienta que **de aquí
  en adelante el mundo opera con el contrato 0.3.1** (regla 15, CHANGELOG
  derivado, gates site-web, checks de vigía). Sub-decisiones del usuario
  (custodio), que definen el **lote Sprint 5**:
  - **(a) Regla 15** (efimeralidad): zeus ya cumple de facto → solo se
    **cita** como contrato (sin refactor retro).
  - **(b) CHANGELOG de gobierno**: se **crea** `CHANGELOG.md` de raíz
    derivado del `BACKLOG`, **granularidad gruesa por ola/sprint** (no
    changelog de paquete; no choca con changesets — ver [Punto 2 del
    handoff](REPORTES/entregas/HANDOFF-2026-07-20-skills-0.3.1-feedback.md)).
  - **(c) Vigilancia**: se **materializa estación** (watcher parametrizado
    + checks 0.3.1).
  - **(d) site-web**: gate `verificar-sitio.mjs` en CI de docs; back-links
    al back **a nivel de tema** (cabecera/pie/placeholders, **no** por
    página — antipatrón elevado al diseñador, [Punto 3 del
    handoff](REPORTES/entregas/HANDOFF-2026-07-20-skills-0.3.1-feedback.md)).
  - **(e) Handoff al diseñador**: nota asentada en disco
    ([HANDOFF-2026-07-20](REPORTES/entregas/HANDOFF-2026-07-20-skills-0.3.1-feedback.md))
    con 3 puntos (semver, gate-CHANGELOG-en-monorepo, back-links por
    tema). **Estado: pendiente de validación**, esperando feedback;
    canal de envío sin definir (§abiertas OA-1). **CA:** decisión
    registrada; lote Sprint 5 abierto (U149–U153).

- **D-38 · 2026-07-20 · Vocabulario publicable de método (OA-2 vía a)**
  (GO **usuario** / custodio en chat orquestador). **Decisión:** los
  roles de método **`custodio`**, **`vigía`/`vigilante`** son
  **publicables** en cara proyectada; se **sacan** de
  `CEGUERA_PATTERN`. Quedan prohibidos en el patrón de calibración
  local: `mediaci|marco|addenda|§interna|instancia-ejemplo` (+ tokens
  locales sensibles que el operador añada en runtime; no se
  commitean). **Consecuencia:** el gate de ceguera deja de abortar por
  vocabulario de roles de método; la proyección pública queda
  **desbloqueada en vocabulario** *cuando* el texto pase el gate
  restante. **No** es GO de proyección real a Issues (`Z_SDK` sigue
  LOCAL-ONLY / DC-15 hasta GO explícito aparte). Calibración documentada
  en `plan/roles/README.md` §6. Cierra **OA-2**. Evidencia preview
  post-ajuste (2026-07-20): con patrón residual, `alcance=todos` sigue
  en exit 1 por hit **`addenda`** en WP-U139 (literal `ADDENDA` en
  cuerpo); `custodio|vig[íi]a` solos → 0 hits; `alcance=abiertos` →
  exit 0. Sin scrub masivo (requiere GO aparte).

- **D-39 · 2026-07-20 · `addenda` también es publicable (falso positivo
  del residual D-38)** (GO **usuario** / custodio). El vigía verificó que
  el hit `addenda` de WP-U139 es el literal `ADDENDA` de la **capa
  editorial de dominio** (Sprint 2), no el meta-mecanismo del método.
  **Decisión:** `addenda` **no** es palabra reservada → **sale** de
  `CEGUERA_PATTERN`. Patrón residual: `mediaci|marco|§interna|instancia-ejemplo`.
  **Consecuencia (verificada de facto):** `alcance=todos` + patrón residual
  → **exit 0** (22 WP validados, 0 hits); el «scrub pendiente» de D-38
  queda **descartado** (era problema de patrón, no de contenido). Doc en
  `plan/roles/README.md §6`. No cambia LOCAL-ONLY (proyección real a
  Issues sigue sin GO).

- **D-40 · 2026-07-21 · Firma del conector peer-card = «visor pide card»**
  (GO-4 ops · residual U93 / cara ciega §3). Cierra la pregunta
  «firma SSB vs micro «visor pide card»» **sin** abrir epic peercards /
  embajador. Veredicto: el conector a terceros **exige** peer-card
  emitido por autoridad (`issuePeerCard` / `onPeerCard`); el cliente
  (visor u otro) **pide/inyecta** la card — no se auto-fabrica como
  credencial de sala. Mitigación mínima en
  `@zeus/webrtc-viewer` browser: preferir `__ZEUS__.peerCard`;
  `makePeerCard` local solo con `__ZEUS__.allowLocalPeerCard === true`
  (lab). **Firma SSB del asiento** permanece el hook de extensión ya
  documentado en U93 / D-20 — carril cuando toque; no es la firma del
  conector v0. Consecuencia: residual U93 de cola viva → cerrado;
  peercards a terceros pavimentados a nivel contrato.

- **D-41 · 2026-07-24 · Ratificación ex post acotada U162 (no GO previo)**
  (custodio). Tras **R7-Z FAIL** de gobierno: U162 fue despachado sin GO
  de ronda válido (`854ed4e` afirmó GO inexistente). El custodio
  **RATIFICA ex post U162 exclusivamente** para conservar la auditoría
  ya realizada (merge `696ffff`). **No** es GO previo retroactivo; **no**
  sienta precedente; **no** autoriza U163–U167. Correcciones = commits
  nuevos / addendas (sin rewrite de historia). Acta:
  [REPORTES/entregas/ACTA-R7-Z-INCIDENTE-despacho-sin-GO-U162.md](REPORTES/entregas/ACTA-R7-Z-INCIDENTE-despacho-sin-GO-U162.md).

- **D-42 · 2026-07-24 · GO publish condicionado P0×4 + linea-editor aparte
  + exclusión por decisión de producto** (custodio · asentado por
  orquestador-Z; fuente:
  [ADDENDA-R12-Z-GO-PUBLICACION-ALLOWLIST.md](REPORTES/entregas/ADDENDA-R12-Z-GO-PUBLICACION-ALLOWLIST.md),
  espejo `vigilancia/z/`). **Decisión (a) — lote P0×4:** el publish real de
  `@zeus/linea-system` · `@zeus/linea-firehose` · `@zeus/force-system` ·
  `@zeus/ssb-system` queda autorizado de forma **condicionada**. Condiciones
  de activación (todas):
  1. skills `0.10.0` adoptado y validado en el mundo (mecánica D-36);
  2. **R12-Z PASS** + GO implementación del sprint;
  3. **U168–U171 aceptados ✅**;
  4. política **major-band** aplicada + gate semver adaptado (U168/U169);
  5. **contrarrevisión independiente PASS** en los WPs de riesgo;
  6. changesets creados + matriz CI/Release completa de los cuatro;
  7. gate online/C8 pre-publicación **verde**; tarballs limpios y
     contratos JS-only documentados.
  Cumplidas todas, **no hace falta un nuevo GO del custodio** para el
  publish P0×4 (retirar `private` + Release + verificación de install
  desde registry); el orquestador conserva secuencia y evidencia de
  release. Hasta cumplirlas: **cero** `npm publish` / flip `private` /
  changesets de pub efectivos. El flag `private: true` operativo **no**
  excluye un nombre presente en allowlist §3 (se mantiene hasta la fase
  de publicación).
  **Acto 2026-07-25:** custodio eleva **GO publish FINAL** junto a
  **R14-Z PASS** (archivo
  [GATE-R14-Z-PASS.md](REPORTES/entregas/GATE-R14-Z-PASS.md)); activa
  la fase restante D-42 solo para P0×4.
  **Acto 2026-07-25 (cierre):** publish FINAL P0×4 **DONE** tras relanzar
  post-pausa — tip `e8c5ac2` · Release publish `30134579637` · C8
  **0.1.1** ×4 · aviso
  [AVISO-PUBLISH-FINAL-P0-DONE.md](REPORTES/entregas/AVISO-PUBLISH-FINAL-P0-DONE.md).
  **Decisión (b) — `@zeus/linea-editor` (P1):** sigue
  candidato (no privado por producto) pero no está preparado → WP
  publish-ready **separado** (**WP-U178** ⬜); GO publish condicionado
  tras su **propio** PASS; **no** se mezcla con U171 ni con el lote P0×4.
  **Decisión (c) — exclusión por decisión de producto:**
  `@zeus/console-monitor`, `@zeus/blobstore-client` (demociones
  U166/U167), UIs/visores/monitores visuales, demos/fixtures/harnesses,
  apps editor y mesh no nominal en allowlist quedan privados **por
  decisión de producto, no por carencia técnica accidental**: sin flip
  `private`, sin changesets ni publish sin enmienda explícita de la
  allowlist + nueva decisión del custodio. Consecuencias asentadas en
  [PUBLISH-ALLOWLIST.md](PUBLISH-ALLOWLIST.md) §3–§5 y BACKLOG remate.

- **D-43 · 2026-07-24 · Tercer frente Dramaturgo + Zigurat — GO de
  planificación (DA-S21 asentada · `2eb4784`)**
  (fuente:
  [ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md](REPORTES/entregas/ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md),
  espejo `vigilancia/z/`).
  > **HISTÓRICO / SUPERADO (secuencia · 2026-07-24 post-adopción):** los
  > tramos «R12 pedido vigente / no pedir R13 ahora / espera R12» de este
  > asiento quedan **superados** por **R12-Z PASS** vigente + adopción
  > `@alephscript/skills-scriptorium@0.10.0` (tip `b348c59` · CI
  > `30128202345` · Docs `30128202336`). La autoridad de planificación
  > (DA-S21 · camino A · U73 / U172–U177) **permanece vigente**. Acto
  > siguiente: petición **R13-Z PASS** —
  > [AVISO-R13-Z-pedido-PASS.md](REPORTES/entregas/AVISO-R13-Z-pedido-PASS.md).
  > **PAUSA / CORTE TÉCNICO** y **sin despacho** se mantienen.
  **DA-S21 asentada · `2eb4784`** (scriptorium)
  — el HOLD de autoridad queda **levantado** (DA-S21 autoriza
  planificar). El GO es **de planificación**; **no** es GO de
  implementación. Camino A ratificado: **absorber el dominio narrativo
  en contratos y paquetes existentes** (DRY: `@zeus/http-contract`
  proyección RouteEntry→MCP · identidad/seats de
  `@zeus/protocol`/authority-kit · `@zeus/story-board-schema` ·
  `@zeus/linea-editor` · componentes de reparto existentes · épica
  Zigurat histórica U73), sin reconstruir el editor legado. Alcance
  zeus: **U172–U177** ⬜ + **épica U73 reactivada ⬜** (Zigurat
  **acotada**; no capa federada completa). **Fuera de zeus** (ownership
  de otros carriles): archivo del editor legado, DAS-1, extensión VS
  Code; sidecar/pub. Rutas fuente del legado = **solo lectura** para
  diseñar el importador; ningún vocabulario ni artefacto legado se
  copia al código público (conteo literal **0**). **Secuencia
  obligada (texto histórico del asiento):** ~~**R12-Z** (pedido vigente)
  → **petición R13-Z** (solo tras R12-Z PASS; no ahora)~~ → **sin
  despacho** hasta **R13-Z PASS** + **GO implementación aparte** (solo
  entonces 🔶/workers/código del tercer frente). **Estado vigente de
  secuencia:** R12-Z PASS + adopción 0.10.0 → **petición R13-Z emitida**
  · hold operativo = **PAUSA** + **sin despacho** (no hold de DA-S21).
  Se permiten (prep R13): replan, briefs, dependencias, olas y entradas
  ⬜ — **0** workers · **0** 🔶 · **0** implementación · **0**
  publicación. **No** declarar R13 PASS desde este asiento. **Nota de
  runtime para despachos futuros R13:** preferir modelo **Fable**; si no
  está disponible, **GPT-5.6 Sol**; si tampoco, el mejor disponible —
  anotar la cascada empleada en el aviso correspondiente. Replan:
  [REPLAN-2026-07-24-r13-dramaturgo-zigurat.md](REPORTES/entregas/REPLAN-2026-07-24-r13-dramaturgo-zigurat.md).

- **D-44 · 2026-07-24 · Ratificación Issues #16–#53 + sync-map (excepción
  DC-15 acotada · Custodio · Vigía S / Dionisos)**
  (fuente: GO custodio · ratificación cerrada; materialización
  `46c3e5c`). **Autoridad:** Custodio · Vigía S / Dionisos (**Aprobado**).
  **Conservar** los Issues GitHub **#16–#53** y el
  `plan/.sync-map.json` materializados en el tip/materialización
  **`46c3e5c`** (`plan(gobierno): sync-map post-apply · refresh proyección
  issues (alcance=todos, #16-#53)`). **Excepción a DC-15:** únicamente
  para el conjunto ya materializado **#16–#53** (conservación; no borrado
  ni “rollback” de esa proyección). **DC-15 sigue LOCAL-ONLY por
  defecto** para toda proyección nueva. **Sin** autorización para
  crear Issues nuevos. **Sin** implementación, despacho ni publish.
  **No** es GO de proyección adicional ni de workers. **PAUSA / CORTE
  TÉCNICO** permanece vigente. Pedido R12 a SOL (**histórico /
  superado**): ~~**R12-Z PASS (segundo reintento)**~~ —
  [AVISO-R12-Z-pedido-PASS.md](REPORTES/entregas/AVISO-R12-Z-pedido-PASS.md)
  → **R12-Z PASS vigente** + adopción 0.10.0 (`b348c59`). Pedido
  vigente a SOL: **R13-Z PASS** —
  [AVISO-R13-Z-pedido-PASS.md](REPORTES/entregas/AVISO-R13-Z-pedido-PASS.md)
  (patrón **base auditada** + **commit sello**; sin tip autorreferencial).

- **D-45 · 2026-07-26 · Consenso mesa Scriptorium H-01 `volumes-concepto` +
  fusión de la épica F2 al backlog (orden del custodio)**
  (fuente: `INFORME-R4` del Anfitrión, validado por el custodio — cero ⛔ de
  fondo en 54 votos; copia durable en repo `scriptorium-cuadernos`, rama
  `z_sdk-vigilancia`, `sprint-CIUDAD/`; notas locales en
  `sincronia/notas/NOTA-Z-2026-07-26-H01-*.md`). **Lo votado y validado que
  vincula a Z:**
  1. **C-2** namespace lógico + mounts plurales, con **env obligatorio**
     (`ZEUS_VOLUMES_ROOT` o equivalente por contrato): la resolución de root
     **no** puede depender del cwd ni de descubrimiento ascendente (◆5,
     validado custodio 5/6 · disenso L registrado).
  2. **C-3** manifiesto ≠ estado ≠ corpora: `volumes.json` pasa a RO+hash;
     `counters.mjs` deja de mutarlo; nace estado regenerable aparte; el
     import pobla `corpora`. **Compromiso Z = WP única** C-3 + sellado-hash
     (→ **U199**).
  3. **C-4** canal C1 preferente: npm = kit FOSS ligero · Release = pack
     import-once con versión+hash; condición = CA de canal limpio (→ U212).
  4. **C-5** shape de concepto = `startpack-pozo` + FORCES (no exclusivo).
  5. **◆4(a)**: `volumesRoot` del loader deja de ser root consumible —
     cambio de **G** (banda major); (b) = puente documental de Z mientras
     tanto (→ U210).
  6. **Cerco §10.8**: anclas vivas (git/rad/IPFS) jamás como dependencia de
     arranque; solo fuente de import + procedencia inerte. Reencuadra
     **WP-U71** (ver Horizonte).
  7. **CA local-first** = tick nuevo post-COMPACTO con LECTURA renovada
     (→ U206).
  **Fusión F2:** por orden del custodio (cierre de sesión 2026-07-26), la
  proyección `plan/BACKLOG-F2.md` se apila en `plan/BACKLOG.md` como
  **ÉPICA F2** con numeración **U179–U231** (53 nuevos; `F2-Z-53` = U178
  existente · `F2-Z-39` = U71 reencuadrado · el diferido «U87 §5 sin ID»
  recibe ID = **U207**). Todo ⬜: **el GO por WP sigue siendo del custodio**
  (cherry-pick). Ejecutor de la fusión: vigía Z con gorro de orquestador,
  origen declarado = orden expresa del custodio en consola.

- **Decisión ⑧ (custodio, 2026-08-01) · el pack del pozo para U206 lo
  construye Z.** Hallazgo que la motiva (reconocimiento previo al despacho de
  la ola 4, verificado abriendo ficheros): el `startpack-pozo` **existe pero
  no es importable** — su `manifest.json` es de esquema `zeus.startpack/v0`,
  sin `name` ni `hashes`, y la guarda de `import.mjs` lo rechaza con
  `pack_manifest_incompleto`. El productor del descriptor **no existe en G**
  (cero `sha256` en `g-sdk/scripts`), y las WPs que lo construirían están en
  P0 **sin arrancar**; una de ellas declara que **bloquea el adaptador
  local-first**, o sea U206.
  Lo que abarata la decisión: los **8 ficheros del pozo son byte a byte
  idénticos** a la fixture con la que cerró el driver FORCES (los ocho sha256
  recalculados coinciden). Lo que falta **no son los datos, es el
  descriptor**.
  **Resolución**: Z construye un adaptador que lee el pozo en **SOLO
  LECTURA**, computa los hashes y emite el manifiesto v1. Con eso U206 deja
  de depender de otro mundo y se cierra además la CA que **U203** dejó ⏳
  («CA contra `startpack-pozo` REAL»).
  **Se declara como reencuadre, no se cuela**: el reparto asignaba ese
  descriptor a G, así que cuando G lo entregue habrá **dos productores que
  reconciliar** — queda anotado aquí para que ese día no parezca un
  accidente. **Frontera dura: `C:/S_LAB/g-sdk` es solo lectura, jamás
  escritura.** No inaugura acoplamiento: `e2e/games-root.mjs` ya resuelve el
  mundo hermano por env, y el runner debe reutilizar ese resolvedor en vez de
  inventarse una ruta.
  ✎ *Corrección al plan que sale del mismo reconocimiento*: «7 pasos verdes
  con shape pozo» (`BACKLOG.md:267`) es **infalsable tal como está escrito** —
  el paso 5 exige «divergencia reportada» y el pozo trae un único volumen
  FORCES, familia que **por diseño no tiene camino de divergencia** (solo lo
  tienen LINEAS y FIREHOSE). La shape del CA de U206 debe declarar **dos**
  volúmenes: el pozo para los pasos 1-4, 6 y 7, y uno con divergencia para el
  paso 5.

- **⑧-bis · Las cuatro incógnitas operativas de U206, cerradas por el
  orquestador (2026-08-01) al despachar la ola 5.** El reconocimiento las dejó
  abiertas nombrándolas; ninguna es del worker, así que se deciden aquí y se
  citan en su BRIEF.
  1. **«Sin red» tiene predicado escrito**, o el CA-2 es infalsable: *cero
     conexiones salientes a destino **no-loopback***, instrumentando
     `net.Socket.prototype.connect`, `dns.lookup` y `globalThis.fetch`. **No**
     es «cero sockets»: los MCP bindean loopback al arrancar, así que esa
     lectura haría el paso imposible en vez de falsable. Y la trampa se arma
     **también sin plantar nada**, corriendo el arranque real: si toca la red,
     falla nombrando el módulo.
  2. **El verificador de corrupción (paso 6) vive en
     `packages/engine/volumes-ops/src/`, no sólo en `e2e/`.** Si vive en el
     runner, el CA pasa y **el producto sigue desprotegido**; ahí lo hereda
     además la generalización de drivers. El fail-closed que hay hoy es de
     **ausencia**, no de **corrupción**: corromper una escena `.md` pasa la
     validación sin una queja.
  3. **La shape del CA declara DOS volúmenes**: el pozo (FORCES) para los
     pasos 1-4, 6 y 7, y **uno con camino de divergencia** (LINEAS o FIREHOSE)
     para el 5. **No** se declara volumen `ssb` aunque U205 ya registró el
     cuarto driver: no hay fixture SSB válida en el árbol —la única que existe
     **miente sobre la forma del dato**, ver `U254`— y montar el CA sobre ella
     sería apoyarlo en material que ya sabemos falso.
  4. **El §10.8 numerado no está en este árbol** (`DECISIONES.md:608-610` lo
     remite a `scriptorium-cuadernos`). Mientras no vuelva, el texto operable
     es la nota local `sincronia/notas/NOTA-Z-2026-07-26-H01-*.md`; **se cita
     ésa y se declara que es la copia**, en vez de citar un § que aquí no
     existe.
  ✎ Operativa del mundo hermano: `e2e/games-root.mjs` ya resuelve G por
  `ZEUS_GAMES_LIBRARY`, pero **su fallback busca un nombre de directorio que
  no es el nuestro**, así que la variable es obligatoria. Se **reutiliza ese
  resolvedor**; inventarse una ruta a `g-sdk` está prohibido.

- **⑨ (custodio, 2026-08-01) · el VPS real sigue DEFERRED: la ola 5 es sólo
  nuestra base de código.** Confirma y estrecha ④. Consecuencia directa para
  U206: **la réplica A→B es LOCAL** —dos raíces en la misma máquina— y el WP
  **no toca host remoto, ni Docker, ni imágenes, ni `U209`**. «Réplica» aquí
  significa *el mismo material medido igual en dos rutas*, no *dos máquinas*.

- **⑩ (custodio, 2026-08-01) · `GD` NO se abre con el verificador de
  integridad sin cablear.** El worker de U206 lo declaró él mismo, sin que
  nadie preguntara: **`assertRootIntegrity()` existe, está probado y no lo
  llama nadie** — `packages/mesh/**` no estaba en su ALCANCE_DIFF, así que lo
  demuestra desde el runner pero **el producto no lo usa**.
  Por qué la orden es correcta y no cautela: el paso 6 del CA se llama
  «**corrupción falla**» y existe **precisamente** porque el fail-closed
  anterior era de **ausencia** y no de **corrupción**. Aceptar así dejaría un
  CA que **pasa** sobre un producto que **no comprueba nada** — la clase de
  defecto que este programa lleva seis olas persiguiendo: *la frase dice más
  de lo que el estado sostiene*. Y sería peor que no tenerlo, porque el gate
  `GD` daría fe de una protección inexistente.
  **Resolución**: U206 **no se acepta** hasta que el verificador esté cableado
  en el arranque real, con su rojo. El alcance de U206 se **amplía** a los
  puntos de arranque que cargan un root de volúmenes; los puntos exactos los
  fija la contrarrevisión en curso, a la que se le pidió localizarlos con
  `fichero:línea` y responder **qué protege hoy el producto contra un root
  corrompido**.
  ✎ Consecuencia de método, a `L-H09`: **un verificador que nadie llama no es
  una protección, es una biblioteca.** Cuando un CA diga «X falla», la CA debe
  ejercitar **el camino del producto**, no una demostración paralela desde el
  arnés. Vale para todo gate futuro.

- **⑩-bis · Excepción declarada a la congelación de manifiestos, para poder
  cumplir ⑩** (orquestador, 2026-08-01). La contrarrevisión de U206 halló el
  obstáculo real del cableado: **ningún paquete de `packages/mesh/**` declara
  `@zeus/volumes-ops` como dependencia** (sólo `feed-kit` y el propio
  paquete). O sea que el encargo choca con el congelado de manifiestos
  —owner U237— **antes de escribir una línea de código**.
  **Resolución**: U206 queda **autorizado a añadir esa dependencia** a los
  paquetes que cablee, y a regenerar el lock **en el mismo commit**. Es
  seguro: en esta ola **ningún otro worker toca dependencias**, así que el
  fichero de máxima colisión queda en exclusiva.
  Se descarta replicar el predicado con nota de sitio —el recurso que usaron
  U204 y U205 cuando no podían añadir dep— por una razón que conviene fijar:
  **replicar un verificador de integridad es duplicar lógica de seguridad**,
  y dos copias divergen. Vale para un predicado de forma; no para un gate.
  Condición: **cero movimientos de versión**; si regenerar el lock mueve algo,
  se para y se declara.
  ✎ Hallazgo asociado que **no** se resuelve aquí: `linea-system` resuelve su
  base **en tiempo de import de módulo** (`src/loader.mjs:28`), así que una
  guarda en el arranque **llega tarde** para esa familia. Se declara, no se
  fuerza: cablear donde no protege sería teatro.

- **⑪ (orquestador, por delegación expresa del custodio, 2026-08-01) · `GD`
  ABIERTO con su alcance escrito dentro.**
  **Por qué se abre**: `GD` está definido como *«CA local-first de U206 verde,
  7 pasos»*, y eso **es cierto**, verificado por el orquestador y no por el
  worker. La orden ⑩ —cablear el verificador— **está cumplida y verificada**:
  4 puntos de producción reales, punto único, sin réplica del verificador, y
  un quinto candidato **enrutado en vez de cableado** tras comprobar que no
  consume root.
  **Por qué no espera a los dos huecos**: lo que `GD` guarda es que *el
  territorio del carril deje de moverse*, y ha dejado. La campaña que destapa
  declara **cero cambios en runtime**, así que no depende de la detección de
  corrupción. Retenerlo bloquearía trabajo ajeno a los huecos — y `U209`, el
  otro desbloqueo, sigue **DEFERRED** por decisión ⑨.
  **Por qué se escribe el alcance dentro**: el defecto de firma de este
  programa es *la frase más ancha que la evidencia*. Un gate que se abre sin
  declarar lo que no midió es esa misma frase, con sello. La declaración va en
  `GOBIERNO-EJECUCION-F2.md`, junto a la definición, no en un reporte.
  **Se abren con dueño**: `U258` (sellar el root de referencia — hoy la guarda
  pasa de largo sobre el único root que el producto usa) y `U259` (extender
  snapshot verificable a LINEAS y FIREHOSE: hoy la detección cubre **1 de 4**
  familias).
  ✎ Regla que deja fijada, a `L-H10`: **un gate se abre por lo que midió, y su
  declaración dice lo que no midió** — o acaba dando fe de lo que no vio.

- **⑫ (custodio, 2026-08-02) · la autoría `you@example.com` del historial
  publicado SE QUEDA COMO ESTÁ. Asunto cerrado, no vuelve a la cola.**
  **Lo que hay, re-medido hoy al registrarlo** — y la cifra que este swarm
  venía arrastrando (**«37 commits»**) **era falsa por un orden de magnitud**:
  `z-sdk` **305 de 1325** commits de `origin/main` · `scriptorium` **3** ·
  `s-sdk` **3** · `v-sdk` **0**. Total **311 commits publicados**, entre
  **2026-07-23 y 2026-08-01**. Es la huella de un git sin `user.email`
  configurado en la máquina durante ese tramo, no de un tercero: el autor es
  el mismo custodio bajo el correo por defecto de git.
  **Por qué se cierra en vez de arreglarse**: reescribir autoría es reescribir
  cada commit afectado, y publicar esa reescritura exige **`push --force`
  sobre `main`**, que este programa tiene prohibido de forma permanente. El
  coste no es el renombrado: es que **todo hash publicado cambia**, y este
  backlog cita hashes de merge y de CI como prueba de aceptación en decenas de
  actas. Forzar la reescritura **invalidaría la trazabilidad que sostiene el
  libro entero** para corregir un campo de correo.
  **Lo que NO significa**: no es una afirmación de que la autoría sea correcta.
  Queda escrito aquí para que quien lea ese tramo del historial sepa **por qué**
  dice lo que dice y no lo lea como intrusión.
  ✎ Regla de método que deja: **una cifra heredada de otra sesión se re-mide al
  registrarla, o se propaga.** Ésta llevaba días viajando como «37».

## Abiertas (bloquean lo indicado)

- ~~**OA-2 · Vocabulario publicable antes de proyectar el backlog a un
  tracker PÚBLICO.**~~ **RESUELTA** (usuario · 2026-07-20 · **D-38** +
  **D-39**): roles de método `custodio`/`vigía`/`vigilante` **y** el
  término `addenda` (capa editorial de dominio, no meta-mecanismo) son
  **publicables**; fuera de `CEGUERA_PATTERN`. Patrón residual **vigente**:
  `mediaci|marco|§interna|instancia-ejemplo` (+ locales en runtime).
  Verificado de facto (D-39): con ese patrón `alcance=todos` → **exit 0**
  (22 WP, 0 hits); el «scrub» que temíamos quedó **descartado** (era
  patrón, no contenido). Proyección real a tracker público sigue
  requiriendo **GO aparte** (DC-15 / LOCAL-ONLY).

- ~~**OA-1 · Canal de envío del handoff a skills-scriptorium.**~~
  **RESUELTA** (usuario · 2026-07-20): canal = **entrega manual del
  custodio**. La nota
  [HANDOFF-2026-07-20](REPORTES/entregas/HANDOFF-2026-07-20-skills-0.3.1-feedback.md)
  (revisada contra 0.3.3; los 3 puntos siguen abiertos) queda asentada; el
  usuario la hace llegar al diseñador por su cuenta. El swarm no publica
  contenido externo. Sin acción pendiente del swarm.

*(Ninguna decisión de diseño abierta tras D-23. Ops residuales — no son
DA: (a) endpoint registry + secret `NPM_TOKEN` para publish real → U55;
(b) sidecar blob cuando ops lo entregue; (c) DNS CNAME `z-sdk` +
Custom domain/HTTPS en Pages Settings → CA de U106; (d) DNS CNAME
`games.z-sdk` + Custom domain/HTTPS en Pages de la library → CA de
U107. Horizontes WP-U71/72/73 siguen esperando evidencia o diseño
externo.)*

### Diferidos post-U87 (no DA; no WP ejecutable hasta GO)

Anotados tras GO capa B (2026-07-18). **No bloquean** micro U109–U110
ni el frente U111–U114. Activar = usuario pide WP explícito.

- **U87 §5 · linea-aleph vivo** — starterkit = `juguete`; corpus
  ~48 MB fuera de git; fixture subset en `@zeus/startpack-solve-coagula`;
  montaje completo vía `ZEUS_LINEA_ALEPH_ROOT` documentado, **no**
  cableado al editor ni como VOLUMES de producto en monorepo. Candidato
  futuro: WP de montaje/editor o pipeline de datos — **sin ID** aún.
- **U87 §6 · skills stub (network-engine)** — `disfraz-rude-bot` y
  browsers de caché siguen solo documentados en `STUBS.md` (carpeta
  U86); no reimplementar en zeus/library hasta GO. Candidato futuro:
  WP de skills o puente — **sin ID** aún.
