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
  `C:\Users\aleph\OASIS\SCRIPTORIUM_V0\WEBS\ENTREGA-CAPA\00-NOTA.md` ·
  `C:\Users\aleph\OASIS\SCRIPTORIUM_V0\WEBS\ENTREGA-CAPA\01-PAQUETE-CAPA.md`
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
  `C:\Users\aleph\SCRIPT_SDK\ADDENDA\ENTREGA-2026-07-19b-bug-api-nav.md`
  (no copiar a `plan/`). Library: N/A código si no enlaza `/api/`.
  Vigilante puede haber reportado el bug — **GO = usuario**.

## Abiertas (bloquean lo indicado)

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
