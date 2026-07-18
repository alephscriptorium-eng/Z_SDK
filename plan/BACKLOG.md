# BACKLOG — refundación por olas

Convención: WPs autocontenidos con **CA** (criterios de aceptación
verificables) y **Demolición** (lo que se borra en el mismo WP). Estados:
⬜ pendiente · 🔶 en curso (agente + fecha) · ✅ aceptado (solo orquestador).
Dependencias explícitas; dentro de una ola, lo no dependiente es paralelizable.

El backlog de features del juego **delta** vive aparte en
`packages/arg/spec/BACKLOG.md` (fases 1.6/2) y puede avanzar en paralelo:
la refundación está ordenada para no pisarlo (delta ya habla el patrón bueno).

---

## Remate — estado swarm (2026-07-18 · post-U87 · micro 7+9 ✅ · U114 ✅ · U115 ✅ · U116 🔶 · U117 🔶)

> **Refundación drenada** (olas 0–10 + higiene + remate D-22 / A-14–A-15).
> **0 DA** abiertas; **U111 ✅**; **U112 ✅**; **U113 ✅**; **U114 ✅**;
> **U115 ✅**. Balance propio: [RE-PLAN.md](RE-PLAN.md)
> (addenda triaje registro vigilante 2026-07-18 + post-U114 view-kit
> alias + post-U115 schema único). Línea de producto en **`main`**.
> **Ola 6** ✅ · **Ola 9** ✅ (U70 · U86 · U87 merge zeus `bd5f46c`).
> Publish real ⏳ ops → U55 — **no 🔶**. DNS custom U106/U107 ⏳ ops.
>
> **Priorización usuario (GO capa B):** (1) micro higiene ~~U109~~ ✅ ·
> ~~U110~~ ✅ (lote 7+9 cerrado) · (2) frente editor **U111–U114** —
> **GO** 2026-07-18 · ~~**U111**~~ ✅ · ~~**U112**~~ ✅ · ~~**U113**~~ ✅
> · ~~**U114**~~ ✅ · **lote 1–4+8 cerrado** · (3)
> diferidos U87 §5–6 → DECISIONES / horizonte (sin WP ejecutable) ·
> (4) triaje vigilante → ~~**U115**~~ ✅ (schema story-board real / AJV
> en kit carpeta) · (5) vigilante post-U114 → **U116** 🔶 (GO diseño
> **A** · alias `cast-table` + `panel-elenco`; swarm 2026-07-18) ·
> (6) vigilante post-U115 → **U117** 🔶 (schema story-board único en
> zeus; library+editor; swarm 2026-07-18).

**Orden frentes (D-22 residual + ola 6):** ~~(1) U104~~ → ~~(3) U60~~ →
~~(5) U106~~ → ~~(2) U105~~ → ~~**U61**~~ → ~~**U62**~~ →
publish real (ops) → U55. Sidecar / `ZEUS_BLOB_*` = **DIFERIDO**.
Post-ola 6 (A-14): ~~**U107**~~ ✅ (Pages catálogo `games.z-sdk…`;
remoto ⏳ Custom domain Settings).
Post-U62 (A-15): ~~**U108**~~ ✅ (candado gitignore VOLUMES).

| Frente | WP | Estado |
| ------ | --- | ------ |
| (1) Economía builds (`paths` / `paths-ignore`) | **U104** | ✅ |
| (2) Publish prep `engine/*` (`release:dry` + changeset versión) | **U105** | ✅ |
| (3) Ola 6 — crear `Z_SDK-games-library` | **U60** | ✅ |
| (5) Dominio custom Pages (`z-sdk.escrivivir.co`) | **U106** | ✅ |
| Ola 6 — migración juegos | **U61** | ✅ |
| Ola 6 — pipeline releases de datos | **U62** | ✅ |
| A-14 — catálogo público games-library | **U107** | ✅ |
| A-15 — candado VOLUMES / gitignore fixtures | **U108** | ✅ |
| Ola 9 — editor gamemaps / releases | **U70** | ✅ |
| Ola 9 — CARPETA DRAMATURGO | **U86** | ✅ |
| Ola 9 — SOLVE ET COAGULA (3.er juego) | **U87** | ✅ |
| Post-U87 — slots puertos `solve*` (+ residual pozo) | **U109** | ✅ |
| Post-U87 — `@zeus/startpack-kit` | **U110** | ✅ |
| Post-U87 — editor materializa juegos reales | **U111** | ✅ |
| Post-U87 — carpeta: importar obra | **U112** | ✅ |
| Post-U87 — widgets SOLVE en view-kit | **U113** | ✅ |
| Post-U87 — dialectos story-board en editor | **U114** | ✅ |
| Vigilante — schema story-board real (kit) | **U115** | ✅ |
| Vigilante post-U114 — alias neutro view-kit | **U116** | 🔶 |
| Vigilante post-U115 — schema story-board único (zeus) | **U117** | 🔶 |
| Publish real → demoler `file:` | ops + **U55** | gated registry+token |
| Sidecar blob live U100/U101 | — | diferido sin plazo |

**⬜ / bloqueados (post-lote):**
- **U55** — demoler `file:` (dep **publish real**; no prep; **no 🔶** aún)
- Sidecar / live `ZEUS_BLOB_*` — diferido D-22; harness listo

**En curso:** **U116** 🔶 (swarm / 2026-07-18 · GO diseño **A** ·
rama `wp/u116-cast-table-alias` · worktree `.worktrees/wp-u116-cast-table-alias`);
**U117** 🔶 (swarm / 2026-07-18 · rama `wp/u117-story-board-schema` ·
worktree `.worktrees/wp-u117-story-board-schema` · repos zeus+library)

**Next steps:**
1. ~~Housekeeping / push main / triaje CI / U102 / U103 / Pages~~ — **hecho**
2. ~~WP-U104~~ ✅ — economía CI (paths-ignore / paths)
3. ~~WP-U60~~ ✅ — repo `Z_SDK-games-library`
4. ~~WP-U105~~ ✅ — publish prep + árbol versión; **publish real ⏳**
   ops (`NPM_TOKEN` + registry) → desbloquea **U55** (no asignar aún)
5. Usuario/ops (U106 ✅ código; CA remoto ⏳): DNS
   `CNAME · z-sdk → alephscriptorium-eng.github.io` + Custom domain /
   Enforce HTTPS en Pages Settings
6. Residual **viewer peer-card** (cola U93) antes de mesh abierto —
   **pregunta usuario** (firma SSB vs WP micro «visor pide card»)
7. ~~Sidecar `ZEUS_BLOB_*`~~ — **no esperar** (D-22 diferido)
8. ~~WP-U61~~ ✅ — migración delta/pozo → games-library
9. ~~Ola 6 / WP-U62~~ ✅ — pipeline startpack; ola 6 cerrada
10. ~~**Ola 9**~~ ✅ — U70 ✅ · U86 ✅ · U87 ✅ (lote-ola9-a +
    lote-ola9-b)
11. ~~**WP-U107**~~ ✅ (A-14) — catálogo; merge zeus `c0a35d6` · library
    `dfd6f06`; remoto `games.z-sdk` ⏳ Custom domain Settings
12. ~~**WP-U108**~~ ✅ (A-15) — candado VOLUMES/gitignore; merge
    `a8608ab`
13. ~~**WP-U87**~~ ✅ — SOLVE ET COAGULA; merge zeus `bd5f46c` ·
    library `1f85294`; revisión `f2cdc2a`
14. ~~**WP-U109**~~ ✅ — slots solve/pozo ports; merge zeus `6abe3ba` ·
    library `aea9e04`; revisión `3e602e3`
15. ~~**WP-U110**~~ ✅ — `@zeus/startpack-kit`; merge zeus `4bcd045` ·
    library `294c97c`; revisión `8b91a84` · **micro lote 7+9 cerrado**
16. ~~**WP-U111**~~ ✅ — editor materialize narrativo (plaza); merge
    zeus `16ee4a0` · library `e778bdf`; revisión `084a006`
17. ~~**WP-U112**~~ ✅ — carpeta: instantiate `--from` obra; merge
    zeus `2fc9021` · library `a76c93f`; revisión `3807aac`
18. ~~**WP-U113**~~ ✅ — widgets SOLVE runtime en view-kit; merge
    zeus `a8a28dc` · library `5ba0b33`; revisión `be86bad`
19. ~~**WP-U114**~~ ✅ — dialectos story-board en editor; merge zeus
    `79c042c` (sin library); revisión `188e4a2` · **lote 1–4+8 cerrado**
20. ~~**WP-U115**~~ ✅ — schema story-board real (AJV kit); merge zeus
    `aedd4f3` · library `ff30419`; revisión `d2b6604`
21. **WP-U116** 🔶 — view-kit: alias neutro `cast-table` (**GO A** ·
    factory; swarm 2026-07-18; ver WP abajo)
22. **WP-U117** 🔶 — schema story-board único en zeus (library+editor);
    swarm 2026-07-18 (ver WP abajo)
23. Diferidos U87 §5–6 — ver DECISIONES §abiertas / horizonte (sin WP;
    **sin GO** → no inventar micros / STOP_SERVICES)
24. Residual STOP_SERVICES pozo/solve en cola (sin WP; **sin GO**)

**NO subir:** ramas `wp/*` (ya mergeadas) · `claude/*`.

**Cola residuales (sin WP grande nuevo; higiene / candidatos):**
- ~~Triaje CI U03 (4 WS no herméticos)~~ → **WP-U102** ✅ (merge
  `ddefdcf`; cierra CA remoto U03 pendiente cuando CI `main` verde)
- ~~Docs públicas Pages + piel zine (cierre U41)~~ → **WP-U103** ✅
  (merge `76034ec`)
- ~~Economía builds (paths)~~ → **WP-U104** ✅
- ~~Dominio custom Pages `z-sdk.escrivivir.co`~~ → **WP-U106** ✅
  (merge `49bf72f`; CA remoto z-sdk.escrivivir.co ⏳ tick DNS/HTTPS usuario)
- ~~Catálogo público games-library (Pages + zine + `games.z-sdk…`)~~ →
  ~~**WP-U107**~~ ✅ (A-14; D-23; merge zeus `c0a35d6`; library `dfd6f06`;
  remoto games.z-sdk ⏳ Custom domain Settings)
- ~~Candado VOLUMES gitignore (whitelist ancha post-U62)~~ →
  ~~**WP-U108**~~ ✅ (A-15; merge `a8608ab`)
- Viewer fabrica peer-card local (cara ciega §3 / cola U93)
- Harness U100 cid hex → formato SSB `&…sha256` (cola U101; live diferido)
- CRLF `spec-sync` / `types-sync` Windows (cola U95 / higiene 11c)
- dual-emit `arg:*` ×3 sitios; domain-helpers `session:state`; flake e2e DJ
- salvage dual / cache milestone (cola U94); gamemap SCRIPTORIUM (cola U96)
- ~~`release:changeset-dry` / linea-kit `exports ./schemas/*`~~ → **WP-U105** ✅
- (U102) `resolveStopServicePorts` switch → tabla (PRACTICAS §1.2)
- (U102) fixture firehose duplicada (`firehose-core` × `linea-firehose`) —
  extraer helper compartido
- (U102) linea-system: skip ⏳ sin corpus; falta fixture mínima
  «espana-shaped» para cobertura activa en CI
- (U102) `resolveRoomClientConfig` ignora `ZEUS_SCRIPTORIUM_ROOM` (solo
  `ZEUS_ARG_ROOM`); 3d-monitor parchea en `resolveViewerConfig` — otros
  consumidores (p.ej. player-3d-ui) pueden heredar el hueco
- (U102) linea-system: import de `loader` falla si `ZEUS_VOLUMES_ROOT`
  apunta a `volumes.json` sin volume `lineas` (más duro que CI; skip no
  alcanza) — endurecer lazy-resolve o try/catch en load path
- (U114) env local: sibling `Z_SDK-games-library` sin link
  `@zeus/startpack-kit` → routes release sketch/plaza del editor fallan
  (`Cannot find package`); ops/link library — sin WP nuevo

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
- ~~9/31 workspaces fallan `npm test -w`~~ — triaje 2026-07-18 run
  [29634248585](https://github.com/alephscriptorium-eng/Z_SDK/actions/runs/29634248585):
  27/31 verde; lint+gates ✅; 4 rojos = tests no herméticos (no bugs
  producto) → **WP-U102** ✅ (merge `ddefdcf`; cierra CA remoto U03
  pendiente cuando CI `main` verde)
- mismatch credencial git/gh (nota operativa)

- ✅ **WP-U102 · Tests herméticos para CI** — aceptado (orquestador /
  2026-07-18) — Micro WP: los 4 workspaces rojos del run CI 29634248585
  fallaban por tests no herméticos en el runner (paths VOLUMES / env /
  puertos / room), no por bugs de producto. Alcance estricto:
  | WS | Causa |
  | --- | --- |
  | linea-system | ENOENT `VOLUMES/DISK_02/LINEAS/registry.yaml` |
  | linea-firehose | mismo patrón VOLUMES |
  | presets-sdk | `resolveStopTargets` / `ZEUS_STOP_SERVICES` / puertos zeus-docs |
  | 3d-monitor | `PUBLIC_ROOM` < env < `?room=` |
  Fixture mínima VOLUMES (o skip ⏳ honesto sin datos) + env explícito en
  presets-sdk / 3d-monitor. Sin cambios de producto salvo lo imprescindible
  para que los tests no dependan del host.
  **CA:** run CI completamente verde en `main` (matriz tests + lint +
  gates). Cierra CA remoto U03 pendiente.
  **Demolición:** asunciones de paths/env del host en esos 4 suites (o
  skip documentado si el dato no puede vivir en repo).
  **Nota cierre:** CA remoto U03 queda pendiente de verificación en el
  run CI post-push de este merge (no bloquea ✅ de plan).

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
- ~~duda worker: ¿Peer Card en handshake U11 o basta `role` hasta ola WebRTC?~~
  → **vencida** (ola WebRTC cerró sin cablear) — resuelta **D-20** + WP-U93
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
- dual-wire hasta migrar vistas (canónico + alias `arg:*`; ~2× tráfico state/track/ledger).
  Nota vigilante 2026-07-18: tabla dual-emit repetida en 3 sitios
  (player-ui / operator-bridge / room-client-browser) — consolidar antes de
  retirar alias.
- `stop:services` no limpia puertos e2e aislados (≠ env canónico; p.ej. 13027 huérfano)
- ~~Peer Card handshake diferido (`role` en intent basta hasta ola WebRTC)~~
  → **vencida** — resuelta **D-20** + WP-U93

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
  arg-console, 3d-monitor, player-mcp-kit (lateral; no bloquear U23).
  Nota vigilante 2026-07-18: browser ya consolidó en
  `view-kit/channel-events`; queda el lado Node
  (`player-mcp-kit/room-bridge.mjs` unwrap+dedup bespoke).

### Cola hallazgos ola 2 (WP-U20)

Diferidos del reporte/revisión WP-U20 (no bloquean cierre):
- e2e:arg G-ARG-E2E.10 flaky (timeout track:cast; 1ª rojo / 2ª verde)
- ~~`packages/platform/3d-monitor` aún tiene `assets/js/kit/` propio — WP-U22~~ → **cumplida en WP-U22**
- ~~colisión de nombre: arg-console `src/view-kit/` (SSR defineView) ≠
  `@zeus/view-kit` (browser)~~ → **cumplida en WP-U96**
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
- ~~colisión SSR `src/view-kit/` vs `@zeus/view-kit`~~ → **cumplida en WP-U96**
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
- ~~colisión SSR `src/view-kit/` vs `@zeus/view-kit` en 3d-monitor~~ →
  **cumplida en WP-U96**
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
- ~~Portal VitePress sin publish~~ → **WP-U103** ✅ (merge `76034ec`)

- ✅ **WP-U41 · Portal de docs refundado** *(dep U10, U40)* — aceptado
  (orquestador / 2026-07-17) — VitePress
  refleja la realidad: engine/editor/mesh/games, contrato único (AsyncAPI),
  rutas REST (OpenAPI/Redoc), resources MCP, y el método playbook. README
  raíz y README de cada paquete publicable al día (el de `packages/arg` lista
  hoy 3 de 5 paquetes).
  **CA:** `npm run docs:build` verde; navegación sin enlaces rotos; cero
  menciones al protocolo muerto.
  **Demolición:** páginas/specs de la sesión Scriptorium.

- ✅ **WP-U103 · Docs públicas: Pages + piel zine** — aceptado
  (orquestador / 2026-07-18) — portal VitePress de U41 publicado.
  Tres piezas: (1) workflow `.github/workflows/docs.yml` (build +
  deploy GitHub Pages); (2) piel zine vía theme override
  (`docs/.vitepress/theme/custom.css`) — monoespaciada, b/n, acentos
  diagonal, hover negativo, `@media print`; (3) portada zine en
  `docs/index.md` (manifiesto + puertas Guía / Contratos / Juegos).
  **CA (código):** `npm run docs:build` verde; workflow `docs.yml`
  presente; API HTML (AsyncAPI + OpenAPI) en nav; contraste AA; piel
  no rompe búsqueda ni nav VitePress.
  **Ops usuario:** Pages Settings (GitHub Actions) — **hecho**; URL
  Pages = verificación post-push (`https://alephscriptorium-eng.github.io/Z_SDK/`).
  **Demolición:** n/a (U41 se conserva; piel aditiva).
  **Nota cierre:** merge `76034ec`; revisión `0a36656`.

- ✅ **WP-U104 · Economía de builds (paths CI)** — aceptado
  (orquestador / 2026-07-18) — D-22 frente (1); path filters en
  `ci.yml` (`paths-ignore` plan/md), `release.yml` (`paths`
  changeset/packages), `docs.yml` (`paths` docs + `workflow_dispatch`).
  **CA:** commit solo-plan no dispara matriz; `packages/**` sigue CI;
  docs solo con `docs/**` o dispatch.
  **Demolición:** triggers anchos en pushes solo plan/markdown.
  Merge: `e6d2410` (revisión `3acf359`). Brief:
  `plan/REPORTES/briefs/WP-U104-ci-path-filters.md`.

- ✅ **WP-U106 · Dominio custom Pages (`z-sdk.escrivivir.co`)** *(D-22
  frente (5); dep U103 ✅ U104 ✅)* — aceptado
  (orquestador / 2026-07-18; merge `49bf72f`; revisión `0401212`) —
  VitePress `base` `/Z_SDK/` → `/` (`resolveDocsBase()` / Actions);
  reporte documenta DNS CNAME `z-sdk` → `alephscriptorium-eng.github.io`.
  **CA (código):** navegación y API HTML intactos con base `/` — ✅.
  **CA remoto ⏳ (tick usuario):** `https://z-sdk.escrivivir.co/` 200 +
  HTTPS; Settings → Pages → Custom domain; Enforce HTTPS tras DNS.
  **Nota:** con base `/`, el site en `…github.io/Z_SDK/` puede dejar de
  servir rutas bajo `/Z_SDK/` hasta que el custom domain esté activo.
  **Demolición:** `base: /Z_SDK/` hardwired para Pages.
  Reporte: `plan/REPORTES/WP-U106-docs-custom-domain.md`.
  Brief: `plan/REPORTES/briefs/WP-U106-docs-custom-domain.md`.

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

> **Nota orquestador (2026-07-18h / cierre U62):** U105 ✅. U55 sigue
> **pausado** hasta publish real (registry + `NPM_TOKEN`) — **no 🔶**.
> Ola 6: **U60–U62 ✅** (cerrada).

- ⬜ **WP-U55 · Demoler deps `file:` operator-ui/threejs-ui-lib** — tras
  **publish real** de `engine/*` (no basta U105 prep). Sustituye los
  `file:` vivos justificados hasta registry vivo.
  **CA:** operator-ui / threejs-ui-lib resuelven `@zeus/*` sin `file:`;
  install aislado Angular verde.
  **Demolición:** dependencias `file:` residuales en esos paquetes.
  _(pausado — dep publish real ops; no asignar hasta registry+token)_

- ✅ **WP-U105 · Publish prep `engine/*`** *(D-22 frente (2))* — aceptado
  (orquestador / 2026-07-18; merge `8b12e73`; revisión `9983478`) —
  `release:dry` acepta `exports` subpath wildcards (`ece9074`); árbol
  versión changesets lockstep (`fe1ee3e`); games NO publicados.
  **CA:** `release:dry` verde; árbol versión mergeado — ✅.
  **Publish real ⏳ ops:** registry `npm.scriptorium.escrivivir.co` +
  secret `NPM_TOKEN` → desbloquea **U55** (no asignar aún).
  **Demolición:** n/a (prep; no dos caminos de release).
  Reporte: `plan/REPORTES/WP-U105-publish-prep.md`.
  Brief: `plan/REPORTES/briefs/WP-U105-publish-prep.md`.

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
— **cerrada** (orquestador / 2026-07-18h; U60–U62 ✅); residual A-14 →
  ~~**WP-U107**~~ ✅; residual A-15 → ~~**WP-U108**~~ ✅

> **Cerrada** (orquestador / 2026-07-18h): **U60 ✅** · **U61 ✅**
> (merge zeus `6d38287`; library `9baf67a`) · **U62 ✅** (merge zeus
> `2ad8c36`; library `688be30`). **Ola 9 cerrada**: U70 ✅ · U86 ✅ ·
> U87 ✅. Residual **A-14** (2026-07-18): catálogo público →
> ~~**WP-U107**~~ ✅ (merge zeus `c0a35d6`; library `dfd6f06`; remoto
> `games.z-sdk` ⏳ Custom domain Settings). Residual **A-15**
> (2026-07-18): candado VOLUMES → ~~**WP-U108**~~ ✅ (merge `a8608ab`).

- ✅ **WP-U60 · Repo Z_SDK-games-library** (D-11; D-22) — aceptado
  (orquestador / 2026-07-18; merge `wp/u60-games-library`; revisión
  `5c664f0`) — repo
  `github.com/alephscriptorium-eng/Z_SDK-games-library` con `plan/`-lite
  (PRACTICAS/PLANTILLA enlazadas), `.npmrc` scopes, CI mínima, scaffold
  smoke. Migración de juegos = U61.
  **CA:** repo existe; clone limpio + `npm install` + tests verdes — ✅.
  **Demolición:** n/a.
  Reporte: `plan/REPORTES/WP-U60-games-library.md`.
- ✅ **WP-U61 · Migración de los juegos** *(dep U60 ✅, U51 ✅)* —
  aceptado (orquestador / 2026-07-18; merge zeus `6d38287`; library
  `9baf67a`) — `games/delta` y `games/pozo` viven en
  `Z_SDK-games-library`; monorepo sin `packages/games/`; e2e/docs
  apuntan a la library.
  **CA:** demos de ambos juegos verdes desde la library contra mesh del
  monorepo; e2e adaptados — ✅.
  **Demolición:** `packages/games/` en el monorepo — ✅.
  Reporte: `plan/REPORTES/WP-U61-migrate-games.md`.
  Brief: `plan/REPORTES/briefs/WP-U61-migrate-games.md`.
- ✅ **WP-U62 · Pipeline de releases de datos** *(dep U61 ✅)* —
  aceptado (orquestador / 2026-07-18h; merge zeus `2ad8c36`; library
  `688be30`) — Notario + `@zeus/startpack-delta`/`pozo`; GitHub Release
  espejo (tarball + acta); VOLUMES monorepo = fixtures sintéticos;
  publish npm registry ⏳ ops (`NPM_TOKEN`).
  **CA:** ronda produce release instalable (tarball/`npm install` file
  equiv. sin token) + Release GitHub; mesh arranca desde start pack — ✅
  (publish registry ⏳ ops).
  **Demolición:** `VOLUMES/` vivos del monorepo — ✅ (fixtures only).
  Reporte: `plan/REPORTES/WP-U62-release-pipeline.md`.
  Brief: `plan/REPORTES/briefs/WP-U62-release-pipeline.md`.

- ✅ **WP-U108 · Candado VOLUMES / gitignore fixtures** *(A-15; dep U62 ✅)*
  — aceptado (orquestador / 2026-07-18; merge `a8608ab`; revisión
  `08ce936`) — whitelist VOLUMES acotada a fixtures exactos; demolidas
  wildcards `!VOLUMES/DISK_0{2,3}/**`; datos vivos (espana, force-a..g,
  cima, sima/escenas) ignorados; docs/reporte U62 honestos.
  **CA:** `git check-ignore` vivos → IGNORADO; `git add VOLUMES/
  --dry-run` vacío; `git ls-files VOLUMES/` = 15; fixtures no
  ignorados — ✅ (re-verificado post-merge).
  **Demolición:** wildcards anchas `!VOLUMES/DISK_0{2,3}/**` — ✅.
  Reporte: `plan/REPORTES/WP-U108-volumes-gitignore.md`.
  Brief: `plan/REPORTES/briefs/WP-U108-volumes-gitignore.md`.

- ✅ **WP-U107 · Catálogo público de la games-library** *(A-14; D-23;
  dep U60 ✅, U61 ✅, U62 ✅)* — aceptado (orquestador / 2026-07-18;
  merge zeus `c0a35d6`; library `dfd6f06`; revisión `37069f6`) — Pages
  en `Z_SDK-games-library` con la misma técnica que el portal del
  monorepo (VitePress + workflow `concurrency` + `paths: ['docs/**']` +
  piel zine reutilizada / copiada): (1) **portada-catálogo** — un card
  por juego (delta, pozo, futuros) con descripción corta, cómo
  jugarlo/levantarlo y enlace a su spec; (2) **sección releases** —
  por juego, start packs publicados (versión, acta Notario,
  `npm install @zeus/startpack-<game>`, enlace GitHub Release; si aún
  no hay, «⏳ sin releases» honesto); (3) **dominio custom**
  `games.z-sdk.escrivivir.co` (D-23) — mismo patrón U106: usuario DNS
  `CNAME · games.z-sdk → alephscriptorium-eng.github.io`; Custom domain
  + Enforce HTTPS en Settings. **CA remoto** `games.z-sdk` ⏳ ops
  (Custom domain Settings; DNS CNAME parece listo).
  **CA:** URL viva con HTTPS — ⏳ tick ops; un card por juego migrado —
  ✅; sección releases refleja estado real (⏳ o lista) — ✅; workflow
  solo dispara con cambios en `docs/**` — ✅; piel zine aplicada
  (mono/b-n/rayas/print) — ✅.
  **Demolición:** n/a.
  Reporte: `plan/REPORTES/WP-U107-games-catalog-pages.md`.
  Brief: `plan/REPORTES/briefs/WP-U107-games-catalog-pages.md`.

## Ola 7 — El plano de datos (diseño en [DATOS.md](DATOS.md); paralelizable
con olas 2–5 salvo deps indicadas) — **cerrada** (orquestador / 2026-07-18;
último WP: U83; U80–U83 + U91–U92 ✅)

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

- ✅ **WP-U81 · Herramientas de segmentación del dramaturgo** *(dep U80)* —
  aceptado (orquestador / 2026-07-18) — migrar el CONCEPTO de los
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

### Cola hallazgos ola 7 (WP-U81)

Diferidos del reporte/revisión WP-U81 (no bloquean cierre):
- `release-dry` vs export `./schemas/*` (verificador busca literal `schemas/*`;
  candidata: `scripts/release-dry.mjs` saltar globs `*`)
- Gate two-games vs `byte-delta` (CLI usa `--byte-threshold`; documentar o
  afinar gate si el dominio necesita el término)

- ✅ **WP-U82 · CRUD de volúmenes: medir y vaciar** *(dep U80; encaja con la
  ola 4)* — aceptado (orquestador / 2026-07-18) — capa de operación
  sobre volumes.json/DISKs, files-first: medición (tamaño por
  volumen/corpus/línea) y **vaciado** con roles (DATOS.md §4: operator =
  purga dura con asiento; player/dj = vaciado jugable vía intent). Todo
  expuesto REST + MCP resource desde una definición (patrón WP-U40); nada
  toca disco sin pasar por autoridad (intents) u operación con ledger.
  **CA:** e2e — llenar un corpus sintético, medirlo por resource, vaciarlo
  por rol operator (asiento en ledger, archivos fuera) y rechazo del mismo
  vaciado con rol player; `volumes.json` refleja contadores.
  **Demolición:** scripts sueltos de limpieza si los hubiera (auditar).

### Cola hallazgos ola 7 (WP-U82)

Diferidos del reporte/revisión WP-U82 (no bloquean cierre):
- VOLUMES/README.md scripts fantasma (`volumes:sync:firehose` /
  `volumes:init:lineas` no existen en package.json raíz)
- `release:changeset-dry` sobre paquete aún untracked ensucia el árbol
  (checkout falla al restaurar package.json nuevo)

- ✅ **WP-U83 · Las tramas integran crecer/vaciar** *(dep U82, U30, U23)* —
  aceptado (orquestador / 2026-07-18) — delta y pozo incorporan el ciclo
  completo del mapa a su trama y CASOS: crecer (cachear/curar/milestone ya
  en WP-U30) y **vaciar** como mecánica con coste narrativo (qué significa
  purgar en el delta; qué en el pozo), con casos C-* nuevos en formato
  playbook-kit y checklist visual. Los WPs de detalle por juego se espejan
  en el backlog del juego cuando se tomen.
  **CA:** casos nuevos pasan el test de coherencia; e2e MCP de al menos un
  caso de vaciado por juego; scoring/ledger reflejan el ciclo.
  **Demolición:** n/a.

### Cola hallazgos ola 7 (WP-U83)

Diferidos del reporte/revisión WP-U83 (no bloquean cierre; **cierra ola 7**):
- ⬜ **timeout_confirmacion MCP** — rechazo idempotente de `empty` a veces
  llega como `timeout_confirmacion` en el wrapper aunque la autoridad ya
  aplicó `nada_que_vaciar` (confirmIntent/unchanged). Candidato: pulido
  player-mcp-kit.
- ⬜ **murk/grifo e2e** — e2e arg-mcp acumula murk alto (~28) antes de C-33;
  reabrir grifo para más vertido colapsa la ronda. Gate vacía hundidas
  residuales.
- ⬜ **V4.9 sin browser** — proyección visual del vaciado (gotas que
  desaparecen); checklist V4.9 queda para pasada humana (`ZEUS_OPEN_BROWSER`).

- ✅ **WP-U91 · Loader MCP del volumen FORCES** *(dep U80; D-19)* — aceptado
  (orquestador / 2026-07-18) — el volumen YA EXISTE:
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

### Cola hallazgos ola 7 (WP-U91)

Diferidos del reporte/revisión WP-U91 (no bloquean cierre):
- ⬜ **DISK_03 gitignore / ZEUS_VOLUMES_ROOT** — mismo hilo U80: worktrees no
  heredan DISK gitignored; hace falta `ZEUS_VOLUMES_ROOT` o symlink (runbook).
- ⬜ **presets-sdk openapi CRLF (Windows)** — `assertSpecMatches` compara
  strings crudos; YAML CRLF vs generate LF falla sync sin drift de contenido.
  Candidato: normalizar LF en la comparación o `.gitattributes` para `*.yaml`.

- ✅ **WP-U92 · Intents de force: el sistema inyecta entropía** *(dep U91,
  U30)* — aceptado (orquestador / 2026-07-18) — el dominio gana
  `force:activate`/`force:deactivate` con roles `operator`/`dj`: la
  autoridad valida contra el registry del volumen (`session_budget`,
  `pairs_with`, exclusiones declaradas — las reglas viven en los datos, el
  reducer solo las aplica) y asienta en ledger; las escenas ancla de las
  forces activas se sirven como tracks. Cotas: el estado de ronda expone
  su posición entre sima y cima (los polos colapso/victoria ya existentes
  ganan corpus navegable como track).
  **CA:** tests de reducer — activar una 3ª force = rechazo explicable por
  dry-run; par excluido = rechazo; activación válida = asiento + track
  navegable; delta y pozo consumen el mecanismo (regla de los dos juegos).
  **Demolición:** n/a (adición al dominio).

### Cola hallazgos ola 7 (WP-U92)

Diferidos del reporte/revisión WP-U92 (no bloquean cierre):
- ⬜ **authority/demo sin `forcesRegistry`** — sin inyectar registry el intent
  responde `forces_no_configuradas`; candidato cablear `loadForcesData` /
  fixture en demos (borde node).
- ⬜ **`resolveTrackRef` no resuelve `force://`** — track sale en outbox con
  URI; deep-link browser / MCP pendiente.
- Nota: `pairs_with` queda blando (solo exclusiones hard del registry);
  endurecer afirmativo = WP aparte si hace falta.
- Higiene: worktrees necesitan `npm install` local para exports nuevos del
  kit (no WP).

## Ola 8 — Feeds federados (dep U80) — **cerrada** (orquestador / 2026-07-18;
último WP: U85; U84–U85 ✅)

- ✅ **WP-U84 · Conector SSB → VOLUMES (Tribes y Parliament)** — aceptado
  (orquestador / 2026-07-18) — exportador del log del pub OASIS (mensajes
  tipados `tribe*`, `parliament*`, votos — modelos en DATOS.md §7) a **JSON
  en disco**: volumen `DISK_04/SSB` (el slot DISK_03 lo ocupa FORCES desde
  2026-07-15) con entrada en volumes.json (readonly, provenance del pub),
  mismo procedimiento que firehose. Servidor MCP loader read-only hermano de
  linea-firehose. Files-first: el exportador es un proceso de sync, no un
  demonio nuevo del mesh.
  **CA:** e2e contra fixture de log SSB (sin red): export → volumen válido
  (U80) → resources MCP navegables; documentado el runbook contra el pub real
  (`ZEUS_SSB_*`), ejecutado si hay acceso (⏳ si no, honesto).
  **Demolición:** n/a.

### Cola hallazgos ola 8 (WP-U84)

Diferidos del reporte/revisión WP-U84 (no bloquean cierre):
- ⬜ **tribe box / tribeCrypto** — mensajes tribe cifrados no se desencriptan
  en el exportador (solo contents tipados legibles); WP si el dump del pub
  trae envelopes opacos.
- Nota: scripts fantasma `volumes:sync:firehose` en VOLUMES/README — ya en
  cola U82; aquí solo se añadió `volumes:sync:ssb` real.
- Nota: `ZEUS_VOLUMES_ROOT` / worktrees — mismo hilo U80/U91 (DISK gitignored
  no heredado; runbook o symlink).

- ✅ **WP-U85 · Familias de feed unificadas en el engine** *(dep U84)* —
  aceptado (orquestador / 2026-07-18; merge `1064cc8`) — la interfaz de
  feeds (hoy en el juego delta, patrón arg-feeds §4) se generaliza a las
  tres naturalezas de DATOS.md §3 (estática/stream/gossip) con la cadena de
  curación unificada de U80; conexión ATProto directa (jetstream → DISK_01)
  como implementación de referencia del stream, con degradación a sintético
  intacta. Nace `@zeus/feed-kit`; delta/pozo consumen la interfaz común.
  **CA:** delta y pozo consumen feeds por la interfaz común (dos juegos =
  regla cumplida); e2e de degradación auto→sintético; un feed SSB y uno
  ATProto navegables desde un juego en demo.
  **Demolición:** lo genérico de feeds que quede duplicado en el juego delta.

### Cola hallazgos ola 8 (WP-U85)

Diferidos del reporte/revisión WP-U85 (no bloquean cierre; **cierra ola 8**):
- Nota: `release:changeset-dry` ensucia tree si paquete nuevo untracked —
  reconfirmado U85; ya en cola U82.
- Nota: tras `bag.close()` en e2e, warn `stream prefetch failed: Not
  connected` (prefetch async tardío; no falla gates).
- Nota: visores firehose/cache aún no resuelven `ssb://` en browser (track
  hint `ssb-browser` es contrato; UI dedicada pendiente).
- Nota: `KNOWN_ZEUS_PORTS` aún no lista `4114` (SSB) — preexistente U84.

## Ola 9 — El mundo del dramaturgo (dep olas 6–8)
— **cerrada** (orquestador / 2026-07-18; U70 · U86 · U87 ✅)

> **Cerrada** (orquestador / 2026-07-18): **U70 ✅** · **U86 ✅** ·
> **U87 ✅** (merge zeus `bd5f46c`; library `1f85294`; revisión
> `f2cdc2a`). ~~**U107**~~ ✅ (A-14; fuera de ola 9; merge zeus
> `c0a35d6`; library `dfd6f06`). U55 **no** (gated publish real).
> Hallazgos U87 §1–8 (+ vigilante startpack) → **WPs post-U87**
> (U109–U114 + diferidos); ver sección siguiente y [RE-PLAN.md](RE-PLAN.md).

- ✅ **WP-U70 · Editor de gamemaps y releases** — aceptado
  (orquestador / 2026-07-18; merge zeus `54f08d6`; library `cdddf59`
  / `b4a8fb6`+; revisión `6d82741`) — editor-ui evoluciona de CRUD de
  presets a editor del mundo A: gamemaps, labelsets, cloaks, casos, y las
  líneas del dramaturgo (U80/U81) como materia prima seleccionable; botón
  «release» = start pack + versiones + acta (pipeline WP-U62 /
  `@zeus/startpack-sketch` en library).
  **CA:** desde el editor se define un juego mínimo (escena, labelset, línea,
  casos) y se produce un release instalable — ✅.
  **Demolición:** vistas CRUD (`home_view`/`preset_view`/assets) — ✅.
  Reporte: `plan/REPORTES/WP-U70-editor-gamemaps.md`.
  Brief: `plan/REPORTES/briefs/WP-U70-editor-gamemaps.md`.

- ✅ **WP-U86 · CARPETA DRAMATURGO (kit de experiencia)** — aceptado
  (orquestador / 2026-07-18; merge zeus `f9b8ad4`; library `a28b9ad`;
  revisión `859a5b3`) — en la games-library: plantilla destilada de
  ALEPH_ET_OMEGA y SOLVE_ET_COAGULA (DATOS.md §6): constitución
  parametrizable (título/tema + 4 ejes REIC), cadenas de 4 capas con
  README-plantilla, `story-board.json` (schema actos→widgets), plantillas
  `uichain/panel-*.prompt.md`, `AYUDA.md`, marcas epistémicas y hot files.
  Con stubs/desacople documentado de las skills externas de network-engine
  (disfraz-rude-bot y browsers de caché) que hoy ambos juegos asumen.
  **CA:** desde la carpeta, un dramaturgo (humano o agente) instancia un
  juego narrativo nuevo de juguete sin editar nada fuera de su carpeta; el
  schema del story-board valida los dos story-boards reales existentes — ✅.
  **Demolición:** n/a (la plantilla se destila, los juegos originales quedan
  intactos en scriptorium-network-games).
  Reporte: `plan/REPORTES/WP-U86-carpeta-dramaturgo.md`.
  Brief: `plan/REPORTES/briefs/WP-U86-carpeta-dramaturgo.md`.

- ✅ **WP-U87 · SOLVE ET COAGULA, el tercer juego** *(dep U70 ✅, U86 ✅)* —
  aceptado (orquestador / 2026-07-18; merge zeus `bd5f46c`; library
  `1f85294`; revisión `f2cdc2a`) — la prueba de fuego del mundo A:
  recrear SOLVE_ET_COAGULA **con el editor y los dos kits**, conectado a
  su corpus natural (linea-aleph ES el historial de SolveCoagula en
  Wikipedia). Entra al mesh como juego de la games-library con su
  CASOS.md y su acta. Lo que no se pudo hacer sin tocar engine/editor
  quedó en §hallazgos del reporte (backlog mundo A; no WPs en este
  cierre).
  **CA:** el juego corre en el mesh desde release de la games-library; acta
  de validación en verde; informe «qué faltó al editor/kits» — ✅.
  **Demolición:** n/a. delta+pozo siguen siendo el mínimo de la regla de los
  dos juegos.
  Reporte: `plan/REPORTES/WP-U87-solve-coagula.md`.
  Brief: `plan/REPORTES/briefs/WP-U87-solve-coagula.md`.

## Ola 10 — Peers WebRTC (dep U10; paralelizable con olas 7–9; recursos
clonados en [recursos/](recursos/README.md), decisión D-17) — **cerrada**
(orquestador / 2026-07-18; último WP: U89; U88–U90 ✅)

- ✅ **WP-U88 · Señalización WebRTC vía nuestro mesh + ICE propio** —
  aceptado (orquestador / 2026-07-18; merge `1a275e5`) — la señalización
  viaja por lo que ya tenemos: implementación de la `SignalingService`
  abstracta del repo A sobre las **rooms del socket-server** (adoptando su
  contrato de mensajes `webrtc-offer/answer/ice-candidate/join-room/…`, con
  trickle ICE en vez del `waitForIceComplete` de B). ICE: **coturn**
  (STUN+TURN FOSS) desplegado en el VPS junto al pub; `iceServers` SIEMPRE
  desde `presets-sdk/env` (`ZEUS_WEBRTC_STUN`, `ZEUS_WEBRTC_TURN*`) — el STUN
  de Google que ambos repos hardcodean queda solo como fallback de pruebas
  tras flag explícito (`ZEUS_WEBRTC_ALLOW_GOOGLE_STUN=1`) que imprime un
  WARNING gigante; gate U00 amplía: `stun.l.google` en código = rojo.
  Nace `@zeus/webrtc-signaling`.
  **CA:** e2e — dos clientes headless negocian DataChannel vía señalización
  por room (sin Google); runbook de coturn en el VPS documentado y probado
  (⏳ honesto si no hay acceso); gate rojo con STUN google sintético.
  **Demolición:** los `iceServers` hardcodeados en lo que se adapte de A/B.

### Cola hallazgos ola 10 (WP-U88)

Diferidos del reporte/revisión WP-U88 (no bloquean; U89/U90 → lote-10b):
- Coturn en VPS: prueba real pendiente de acceso ops (⏳ del CA).
- Quirk repo A: `emit(type.replace('webrtc-', ''))` vs listen `webrtc-*` —
  documentado; nuestra impl emite nombre completo. Nota para U89 / upstream
  si se porta más de A.

- ✅ **WP-U89 · Visor WebRTC del mesh (salas y privados)** *(dep U88)* —
  (aceptado 2026-07-18 / merge `ec0cccb`) — el visor nuevo, hermano Angular de
  operator-ui, construido sobre la lib del repo A (`WebRTCEngine` +
  peer-list/media-controls/chat): **datos, audio y vídeo por salas o en
  privado (2 peers)**. En las vistas de juego, usuarios y admins tienen los
  **botones** (llamar/compartir/colgar) integrados vía canales
  rabbit-spider-horse: la oferta HORSE de un actor puede incluir «contactar
  por WebRTC» y el contacto del juego abre la negociación. Regla dura:
  **WebRTC no toca la verdad del estado** — la autoridad y el ledger siguen
  mandando (los peers conectados por WebRTC mantienen TODA la infra de rooms
  debajo para recibir `state`/`ledger`/`track`); el DataChannel es para
  media, chat y **bulk de datos: consolidación de caches de feeds/firehose
  entre peers** (transferir objetos de volumen validando contra manifests —
  la primera materialización del transporte p2p de D-14).
  **CA:** demo — dos navegadores en una sala del juego abren video-llamada y
  chat desde los botones del juego; un peer recibe de otro un objeto de
  cache que valida contra su manifest (U80) y su vista lo refleja; el estado
  del juego sigue llegando por la room aunque caiga el canal WebRTC.
  **Demolición:** lo que se adapte de la lib A entra por import/port con su
  procedencia anotada, no como copia muerta.

- ✅ **WP-U90 · El pub como mediador (señalización SSB)** *(dep U88)* —
  (aceptado 2026-07-18 / merge `191550f`) — segunda implementación de la
  `SignalingService`: mensajes SSB privados (`type: 'webrtc-signal'`,
  cifrado `ssb-box`, DM al feedId del peer) para que **nuestro pub haga de
  mediador** entre dos usuarios OASIS — el módulo `/webrtc` del repo B deja
  el copy-paste y usa este transporte (necesita el endpoint backend sobre el
  `sbot`, hoy el módulo es solo frontend). Basta offer+answer completos (sin
  trickle) para tolerar la latencia del gossip.
  **CA:** dos identidades SSB contra el pub negocian un DataChannel sin
  servidor de señalización central ni copy-paste; documentado como PR
  candidato upstream al fork.
  **Demolición:** el flujo copy-paste del módulo en nuestra adaptación (el
  fork original queda intacto en recursos/).

### Cola hallazgos ola 10 (WP-U90)

Diferidos del reporte/revisión WP-U90 (resueltos en merge U89 salvo ops):
- ~~Colisión puerto 3022~~ → resuelto: `oasisWebrtc` **3022** /
  `webrtcViewer` **3023** (slots + defaults distintos).
- ~~Solape U89↔U90~~ → resuelto en rebase U89 (`peer-session` /
  `messages` / presets / root package.json).
- Bridge sbot real: `createSbotPrivateTransport(sbot)` + HTTP oasis-webrtc
  listos; integración contra sbot OASIS en vivo queda ops/PR upstream
  (`@zeus/ssb-system` es files-first, no demonio).
- Coturn VPS: prueba real sigue ⏳ (ops); ya en cola U88.

### Cola hallazgos ola 10 (WP-U89)

Diferidos del reporte/revisión WP-U89 (no bloquean; ola 10 cerrada):
- Demo A/V dos browsers ⏳ (`ZEUS_OPEN_BROWSER=1` + fake devices; e2e
  headless cubre chat/bulk/state).
- Angular `ng build` no ejecutado (toolchain); runtime = shell ESM +
  fuentes Angular anotadas.
- ~~`ZEUS_STOP_SERVICES` incluye `'webrtc-viewer'` sin `case` en
  `resolveStopServicePorts`~~ — cerrado en **WP-U102**.
- Coturn VPS sigue ⏳ (ops); ya cola U88/U90.
- Puerto default visor: **3023** (`webrtcViewer` /
  `ZEUS_PORT_WEBRTC_VIEWER`) — documentado; no colisiona con 3022.

## Lote higiene / hallazgos vigilante (2026-07-18)

> Revisión externa (ADDENDA `ENTREGA-2026-07-18-revision-externa.md`).
> No bloqueado por Ola 6. Higiene vigilante **U94–U99 cerrada**.
> Lote 11c cerrado (U98+U99 ✅). **A-11 recibida** → **D-21**; **U93 ✅**
> (merge `0d38755`). Ola 6 no.

### Coordinación re-plan identidad/transporte (2026-07-18)

**Frentes — conjunta parcial (escalonados):**
1. **Nota conjunta identidad/transporte** — D-20 + U93 (peer-card torno
   WebRTC + fila 1 conector: DataChannel = carril VOLUMES LAN). Un solo
   hilo de decisión; no mezclar con higiene en el mismo commit de plan.
2. **Lote higiene U95+U97** (lote-higiene-11a) — **cerrado** (U95 ✅ +
   U97 ✅).
3. **Lote higiene U94+U96** (lote-higiene-11b) — **cerrado** (U94 ✅ +
   U96 ✅).
4. **Lote higiene U98+U99** (lote-higiene-11c) — **cerrado** (U98 ✅
   merge `f94282d`; U99 ✅ merge `7b20002`).
5. **A-11 / DA-OasisTransport** — **recibida y cerrada en D-21**
   (2026-07-18). Filas 2–6 → veredictos; **U93 ✅** (merge `0d38755`);
   WP **U100** (spike) ✅ (merge `626cbde`; veredicto spike **«no
   despeja»** U101); **U101** ✅ (merge `c2d9b22`).
6. **Lote transporte U100+U101** (lote-transporte-12) — **cerrado**
   (U100 ✅ merge `626cbde`; U101 ✅ merge `c2d9b22`).

**Colisión addendas A-09/A-10 (histórico):** el lote higiene/vigilante
ocupó `A-09` → **WP-U97** y `A-10` → **WP-U93**. El conector renumeró a
**A-11** (entregada). Fila 6 (follows) = **operación**, no WP.

- ✅ **WP-U93 · Peer-card como torno del carril WebRTC** *(dep U88–U90 ✅;
  D-20; A-11 no bloquea)* — aceptado (orquestador / 2026-07-18; merge
  `0d38755`) — Cadena puente: la autoridad de sala **emite** peer-card
  al join (`makePeerCard` / `issuePeerCard`); `webrtc-signaling`
  **valida** rol/frescura (`peerCardGrantsRole`, `isPeerCardFresh`)
  antes de retransmitir offer/answer/ICE; el WP **documenta el punto
  de enganche SSB** (extensión futura: asiento/credencial en grafo
  Oasis / follows — sin implementar el puente ni blobs). El DataChannel
  es carril de datos / VOLUMES LAN (D-17; fila 1 nota conector:
  complementario a `ssb-blobs` WAN). Con D-21 fila 4 (b): el sidecar
  pub respetará este peer-card como portero del carril LAN. Sustituye
  identidad plana (`userId`/`peerId`/`displayName` del handshake).
  **CA:** `makePeerCard` con consumidores de producción fuera de
  protocol: autoridad **emite** al join **y** signaling **exige**
  (ambos extremos obligatorios — anti A-02 / media cadena); test que
  rechaza card caducada o sin rol; **e2e de la cadena completa**
  emite-y-exige; e2e WebRTC verde; README del paquete de señalización
  nombra el hook SSB como extensión explícita (cero código SSB nuevo en
  este WP).
  **Demolición:** campos de identidad ad-hoc del handshake que el card
  sustituya.

### Cola hallazgos WP-U93 (peer-card)

Diferidos del reporte/revisión WP-U93 (no bloquean; U100 ✅; U101 ✅):
- Viewer fabrica peer-card local (`webrtc-viewer/.../viewer-app.mjs`
  `makePeerCard` como ticket UI); no consume `onPeerCard` de autoridad
  viva. Emisión canónica de sala = authority-kit al join.
  **Nota cara ciega (3):** mitigación barata = el visor **pida** el card
  a la autoridad (no fabricárselo); firma SSB del asiento = carril listo
  cuando toque — higiene del visor (candidato WP; no bloquea).
- Coturn VPS sigue ⏳ (ops; ya cola U88/U90).
- `userId` de socket = dirección de transporte (routing to/from); no
  demolido — correcto: el card cubre identidad de handshake, no routing.

### Transporte Oasis / blobs (post A-11 · D-21)

> Ejecutor (b): el equipo del pub entrega sidecar; zeus valida.
> U71 permanece horizonte — no asignable. No Ola 6.

- ✅ **WP-U100 · Spike blob-sync Oasis 2-nodos** *(dep D-21; antes de
  U101)* — aceptado (orquestador / 2026-07-18; merge `626cbde`; revisión
  `4fcf132`) — Spike barato de sync content-addressed (`ssb-blobs` /
  chunks) entre dos nodos antes de comprometer el carril saliente.
  Harness `@zeus/blob-sync-harness` (fixture 2-nodos + portero U93);
  live ops ⏳ (sidecar pub no entregado). **Veredicto spike: «no
  despeja»** compromiso de U101 (sin evidencia live sync Oasis).
  **CA:** acta/reporte con evidencia de sync 2-nodos (o ⏳ honesto si el
  pub aún no entrega); verdicto «despeja / no despeja» compromiso de
  U101; cero código de producto del sidecar en monorepo zeus salvo
  harness de validación mínimo si hace falta.
  **Demolición:** n/a (spike).

- ✅ **WP-U101 · Carril saliente VOLUMES/blobs (hermano U84)** *(dep
  U84 ✅, U100 ✅, U93 ✅)* — aceptado (orquestador / 2026-07-18; merge
  `c2d9b22`; revisión `bd30786`) — Encaje del carril **saliente**
  (blobs/pinning) como WP hermano de U84 (entrante SSB→VOLUMES ya ✅).
  Cliente `@zeus/blobstore-client` (HTTP `/x/blobstore/v0/*` + cid SSB +
  manifests chunk-as-blob + portero LAN U93); live ops ⏳ (`ZEUS_BLOB_*`
  unset). **Refinado desde HANDOFF_VIGIA… §Cara ciega** (voz equipo del
  pub; solo el bloque citado — no el resto del handoff). Zeus
  **consume** el servicio de objetos del pub; **no** reimplementa
  `blobs.*` / sbot.
  **Contrato (cara ciega §2):** dos planos nunca mezclados — (a)
  **control** HTTP JSON bajo `/x/blobstore/v0/*` (`objetos`,
  `objetos/:cid`, `estado/:cid`, `deseos`, `salud`); (b) **datos** por
  gossip `ssb-blobs` (`want`/`has`/`get`). `cid` = ref blob
  `&<base64>.sha256` (mismo `cid` que manifests VOLUMES, D-14). Objetos
  >50 MB: manifiesto **chunk-as-blob** (chunks 5 MB) como blob; 
  `manifestCid` = referencia canónica. Invariantes: (i) mensajes de
  room solo cids/manifiestos, nunca bytes; (ii) ningún blob >50 MB;
  (iii) mismo contenido ⇒ mismo cid; (iv) alcance = grafo de follows
  (operación, D-21 fila 6). Enganche LAN: peer-card U93 = portero
  DataChannel; WAN = `ssb-blobs`. **No** re-abre U84. **No** es U71.
  **Entorno live (cara ciega §1 → `ZEUS_BLOB_*` de U100):** nodo A =
  cliente Oasis local (`ZEUS_BLOB_SYNC_NODE_A`); nodo B = pub VPS 0.8.8
  (`ZEUS_BLOB_SYNC_NODE_B`); `ZEUS_BLOB_SIDECAR_URL` = base del
  namespace `/x/blobstore/v0`. Precond ops: follows mutuos A↔B. Live
  ⏳ honesto si unset (igual U100).
  **CA:** cliente zeus del plano control (HTTP) + validación contra
  manifests VOLUMES/`cid`; rechazo sin peer-card válida en carril LAN;
  U84 entrante intacto; cero reimplementación de `blobs.*` en monorepo;
  tests de contrato (fixture) verdes; evidencia live vía `ZEUS_BLOB_*`
  o ⏳; runbook de los invariantes (i)–(iv).
  **Demolición:** stubs/notas «saliente diferido» que este WP sustituya.
  **Veredictos 5 preguntas (cara ciega §2 → D-21 nota):** ① poll
  `estado/:cid` (v0; sin webhook); ② auth HTTP: nada en LAN / token
  opcional env; ③ campos `cid`/`manifestCid`/chunks 5 MB; ④ zeus
  consume **HTTP** control (no muxrpc); ⑤ auth sbot↔servicio = ops
  (unix socket local; fuera de monorepo).

### Cola hallazgos WP-U101 (carril saliente)

Diferidos del reporte/revisión WP-U101 (no bloquean; lote-transporte-12
cerrado):
- Viewer fabrica peer-card — ya cola U93 (cara ciega §3); persiste hasta
  higiene del visor.
- Harness U100 cid hex vs SSB — `blob-sync-harness` sigue `sha256` hex
  en fixture spike; producto U101 usa `&…sha256`. Convergencia harness →
  formato SSB = higiene aparte (candidato WP).

- ✅ **WP-U94 · Una sola fuente por transición del dominio** *(dep U30, U83 ✅)* —
  aceptado (orquestador / 2026-07-18; merge `38ff80b`) — en
  `games/delta/arg-domain`: curate (gate `reducer` ↔ mutador `line-board`)
  y vaciar (gate ↔ `flow-engine`) unificados en `validateCurate` /
  `validateEmptySea`; domain-state comprueba `{ok,error}` / boolean.
  **CA:** cada regla y sus codes en un solo sitio; test por mecánica: caso
  inválido → gate y mutador el mismo error desde la misma función; cero
  mutadores invocados sin comprobar resultado; tests arg-domain verdes.
  **Demolición:** copias de arrays de orden / error codes.

- ✅ **WP-U95 · Un solo helper para `./node`** —
  aceptado (orquestador / 2026-07-18; merge `719cf6b`) — el one-liner
  `path.dirname(fileURLToPath(import.meta.url))` está en 5 paquetes con dos
  nombres de fichero (`node.mjs` / `paths.node.mjs`). Extraer
  `nodeSrcDir(import.meta.url)` a util compartido; unificar nombre.
  **CA:** una sola implementación en `packages/` (fuera de node_modules);
  los 5 `exports["./node"]` homogéneos; servidores Express que lo consumen
  verdes.
  **Demolición:** las 4 copias.

- ✅ **WP-U96 · Un solo registro SSR** — aceptado (orquestador / 2026-07-18;
  merge `adaaee4`) — formaliza el diferido «colisión SSR `src/view-kit/` vs
  `@zeus/view-kit`» (colas U20/U21/U22). `defineView` / `createViewRegistry`
  / `renderViewLayout` en `@zeus/app-shell/ssr-view-registry`; arg-console y
  3d-monitor consumen; demolidas ambas copias `src/view-kit/`.
  **CA:** una sola implementación; `*view-kit*` deja de dar 3 rutas de código
  con la misma API; SSR de ambos consumidores verde.
  **Demolición:** la segunda copia.

- ✅ **WP-U97 · feed-kit cuenta volúmenes por volumes-ops** *(dep U85 ✅)* —
  aceptado (orquestador / 2026-07-18; merge `6b4c275`) —
  `feed-kit/jetstream-sync.mjs` duplica recuento de corpus y parcheo de
  `volumes.json` que `volumes-ops` ya provee (`syncVolumeCounters` +
  `resetVolumesCache`). Divergencia: feed-kit solo cuenta `.json` y nunca
  invalida caché. Sustituir por `syncVolumeCounters('firehose')` +
  `loadVolumesConfig()` / `resolveVolumesRoot()`.
  **CA:** `rg "countJsonFiles|readFileSync\(volumesPath" engine/feed-kit/src`
  sin matches; `npm test -w @zeus/feed-kit` verde; recuento cubre cualquier
  tipo e invalida caché.
  **Demolición:** `countJsonFiles` y el parcheo manual.

- ✅ **WP-U98 · Una sola fuente de forma en el contrato** *(dep U10 ✅)* —
  aceptado (orquestador / 2026-07-18; revisión `058cc67`; merge `f94282d`) —
  AsyncAPI (`EVENT_META`) declara forma de 4 kinds; runtime solo valida
  `intent` (`isIntentShaped`) con reglas más laxas; `spec-sync.test` solo
  verifica YAML consigo mismo. Vía (a): derivar validadores desde
  `EVENT_META`; vía (b): documentar en CONTRATO.md que solo `intent` se
  valida por diseño.
  **CA (a):** `isShaped(kind, data)` derivado de EVENT_META + test con evento
  inválido por kind rechazado. **CA (b):** CONTRATO.md fija el alcance;
  test-doc lo referencia.
  · Anexo trivial: tests domain-state usan `32 * 1024` a mano →
  `checkSnapshotBudget`.

- ✅ **WP-U99 · `game` obligatorio también en `makeIntent`** *(dep U10, U24 ✅;
  sin urgencia)* — aceptado (orquestador / 2026-07-18; merge `7b20002`) —
  `makeIntent` deja `game` opcional (`if (game != null)`), asimétrico con
  `makeEnvelope`. Emisores actuales ya pasan `game` (U30/U92). Vía (a):
  exigirlo y lanzar; vía (b): test engine 4-kinds + doc del alcance.
  **CA (a):** `makeIntent` sin `game` lanza; wrappers delta/pozo verdes.
  **CA (b):** test 4-kinds + CONTRATO.md.
  **Demolición (a):** el condicional.

### Cola hallazgos lote higiene 11c (WP-U98 / WP-U99) — cerrado

- (U98) asimetría `makeIntent` / `game` → **U99 ✅** (merge `7b20002`).
- (U98/U99) `release:changeset-dry` / `@zeus/linea-kit` `exports ./schemas/*`
  missing from tarball — residual → cola U96.
- (U98/U99) CRLF `spec-sync`/`types-sync` Windows — residual → cola U95;
  post-merge: suite protocol 17/19 (solo EOL); contract+roles CA 11/11.

### Cola hallazgos vigilante 2026-07-18 (sin WP propio)

- A-05 Node residual: `player-mcp-kit/room-bridge.mjs` unwrap+dedup bespoke
  (browser ya en `view-kit/channel-events`) — ampliar nota A-05 cola ola 2.
- Tabla dual-emit `{[canónico,'arg:state']…}` definida 3 veces
  (`mesh/player-ui/dj-transport`, `mesh/operator-bridge`,
  `engine/room-client-browser`) — al migrar wire `arg:*` → vistas,
  consolidar primero en un punto único.
- `feed-kit/item.mjs` `withDropletAlias`: vocabulario de un consumidor
  (delta) en API compartida; generalizar solo si nace un 3.er consumidor.
- Prefijo CSS `arg-` en `engine/view-kit` + comentario «gota/cauce» en
  stick-poses — cosmética D-8; agrupar cuando se toque CSS/docs.
- (U97) `ensureFirehoseVolumeLayout` aún hace upsert manual de la entrada
  `firehose` en `volumes.json` (layout, no recount) — candidata a helper
  volumes-ops/presets.
- (U97) Tras refresh, `source.syncedAt` ya no se reestampa (queda el del
  `ensure*`) — WP aparte si hace falta stamp post-count.
- (U95) `protocol` `spec-sync` / `types-sync` fallan en Windows por CRLF
  (`\r\n` vs `\n`); misma familia que presets-sdk OpenAPI — normalizar EOL
  en `assertSpecMatches` / generators, no regenerar en WPs de producto.
- (U95) Otros `fileURLToPath(import.meta.url)` fuera de `exports["./node"]`
  (http-contract, app-shell, ui-kit, test-utils, playbook-kit, …) — higiene
  aparte si se quiere unificar más allá del contrato `./node`.
- (U95) Worktree sin `node_modules` propio: exports nuevos de `@zeus/*`
  (p.ej. `./node-src-dir`) no resuelven hasta `npm install` en el worktree
  (o merge a master con install en el checkout principal).

### Cola hallazgos lote higiene 11b (WP-U94)

- (U94) **salvage dual** — gate `mar_colapsado` vs mutador `colapsado`
  (mismo patrón pre-U94 que vaciar). Candidato `validateSalvage` /
  extender estilo `validateEmptySea`.
- (U94) **cache / milestone** — reglas/codes aún duplicados gate↔mutador
  (`ya_cacheado`, `no_curado`, …) sin validador compartido.
- (U94) `applyOps` ante `!res.ok` hace **break silencioso** (patrón
  excavate) — no propaga error al caller de `applyIntent`; WP aparte si
  se quiere ledger de inconsistencia gate/mutador.

### Cola hallazgos lote higiene 11b (WP-U96)

- (U96/U102) **`ZEUS_SCRIPTORIUM_ROOM`** — `resolveViewerConfig` alineado
  en **WP-U102**; residual: `resolveRoomClientConfig` sigue sin leer
  `ZEUS_SCRIPTORIUM_ROOM` (ver cola residuales U102).
- (U96) **`release:changeset-dry` / `@zeus/linea-kit`** —
  `exports ./schemas/*` missing from tarball; al fallar el dry **restaura**
  el working tree (riesgo mid-WP). Candidato higiene / publish.

## Post-U87 — higiene + frente editor (GO capa B · 2026-07-18)

> Fuente: §hallazgos WP-U87 + residual pozo (cola U23) + vigilante
> `loadStartPack` ×4 + triaje
> `SCRIPT_SDK/VIGILANCIA/revisiones/registro-codereviews-2026-07-18.md`.
> Balance: [RE-PLAN.md](RE-PLAN.md). **No mezclar** con
> `packages/arg/spec/BACKLOG.md`. ~~**U109**~~ ✅ · ~~**U110**~~ ✅
> (merge zeus `4bcd045` · library `294c97c`; revisión `8b91a84`) —
> **micro lote 7+9 cerrado**; frente editor **GO** · ~~**U111**~~ ✅
> (merge zeus `16ee4a0` · library `e778bdf`; revisión `084a006`);
> ~~**U112**~~ ✅ (merge zeus `2fc9021` · library `a76c93f`; revisión
> `3807aac`); ~~**U113**~~ ✅ (merge zeus `a8a28dc` · library `5ba0b33`;
> revisión `be86bad`); ~~**U114**~~ ✅ (merge zeus `79c042c`; sin
> library; revisión `188e4a2`) · **lote 1–4+8 cerrado**; ~~**U115**~~ ✅
> (merge zeus `aedd4f3` · library `ff30419`; revisión `d2b6604`);
> **U116** 🔶 (GO **A** · alias factory; swarm 2026-07-18);
> **U117** 🔶 (schema único `@zeus/story-board-schema`; swarm 2026-07-18).

### Lote «higiene post-U87» — micro YA (cerrado)

- ✅ **WP-U109 · Slots puertos `solve*` (+ residual `pozo*`) en
  presets-sdk** *(U87 §7; cola U23 pozo; PRACTICAS §1.1)* — aceptado
  (orquestador / 2026-07-18) · merge zeus `6abe3ba` · library
  `aea9e04` · revisión `3e602e3` · reporte
  `plan/REPORTES/WP-U109-solve-ports.md`. Slots canónicos en
  `presets-sdk/env`; consumidores library (solve + pozo) leen el
  resolver.

- ✅ **WP-U110 · `@zeus/startpack-kit` — una sola `loadStartPack`**
  *(vigilante post-U87; PRACTICAS §1.4)* — aceptado (orquestador /
  2026-07-18) · merge zeus `4bcd045` · library `294c97c` · revisión
  `8b91a84` · reporte `plan/REPORTES/WP-U110-startpack-kit.md`.
  Paquete `@zeus/startpack-kit` en library; los cuatro
  `@zeus/startpack-*` consumen una sola `loadStartPack`.
  **Residual U109 (cola, sin WP):** `ZEUS_STOP_SERVICES` /
  `resolveStopServicePorts` aún sin ids `pozo*`/`solve*` (slots de
  puerto sí existen; `stop:services all` no los para — no revienta;
  micro futuro).

### Lote «editor produce juegos» — frente CERRADO 1–4+8 (GO 2026-07-18)

> Holón 2 ([RE-PLAN.md](RE-PLAN.md) §3.6). Micro U109–U110 ✅.
> Lote 1–4+8: ~~**U111**~~ ✅; ~~**U112**~~ ✅; ~~**U113**~~ ✅;
> ~~**U114**~~ ✅ — **cerrado**. ~~**U115**~~ ✅ (schema kit).
> En curso: **U116** 🔶 (GO **A**) · **U117** 🔶 (schema único zeus).

- ✅ **WP-U111 · Editor materializa juegos reales (no solo sketch)**
  *(U87 §1+§2; dep U70 ✅, U86 ✅)* — aceptado (orquestador /
  2026-07-18) · merge zeus `16ee4a0` · library `e778bdf` · revisión
  `084a006` · reporte
  `plan/REPORTES/WP-U111-editor-materialize-narrativo.md`. Demolido
  hard-gate sketch-only; materialize plaza (startpack-plaza) vía
  dialecto mínimo `solve-inline`; tests editor + Notario/path release
  verdes.
  **Deps:** U70 ✅ · U86 ✅.

- ✅ **WP-U112 · Carpeta dramaturgo: instantiate desde obra**
  *(U87 §3; dep U86 ✅ · U111 ✅)* — aceptado (orquestador /
  2026-07-18) · merge zeus `2fc9021` · library `a76c93f` · revisión
  `3807aac` · reporte
  `plan/REPORTES/WP-U112-carpeta-instantiate-from-obra.md`.
  `instantiate --from <obra>` (slug o path) copia dramaturgia a
  instancia confinada; schema U86 valida; originales intactos; tests
  kit + docs.
  **Deps:** U86 ✅ · U111 ✅.

- ✅ **WP-U113 · Widgets SOLVE con runtime en view-kit**
  *(U87 §4; dep U20 ✅, U87 ✅)* — aceptado (orquestador /
  2026-07-18) · merge zeus `a8a28dc` · library `5ba0b33` · revisión
  `be86bad` · reporte
  `plan/REPORTES/WP-U113-widgets-solve-view-kit.md`. Runtime genérico
  en `@zeus/view-kit` (registry + cast-table); solve monta
  `panel-elenco` en vista; tests view-kit + library.
  **Deps:** U20 ✅ · U87 ✅.

- ✅ **WP-U114 · Dialectos story-board en el editor**
  *(U87 §8; dep U70 ✅, U86 ✅)* — aceptado (orquestador /
  2026-07-18) · merge zeus `79c042c` (sin library) · revisión
  `188e4a2` · reporte
  `plan/REPORTES/WP-U114-dialectos-story-board-editor.md`.
  Registro `STORY_BOARD_DIALECTS` (`solve-inline`, `plantilla`,
  `aleph-blocks`); demole `story-board-min`; fixtures SOLVE+ALEPH;
  dialecto desconocido → rechazo explicable.
  **Deps:** U70 ✅ · U86 ✅. **Residual (cola):** env sibling library
  sin link `@zeus/startpack-kit` (routes release e2e editor) — sin WP.

- ✅ **WP-U115 · Schema story-board real (no solo existsSync)**
  *(vigilante registro 2026-07-18 · H1 U70/U86; dep U86 ✅)* —
  aceptado (orquestador / 2026-07-18) · merge zeus `aedd4f3` · library
  `ff30419` · revisión `d2b6604` · reporte
  `plan/REPORTES/WP-U115-schema-story-board-ajv.md`.
  `validate-story-board` aplica schema AJV (no solo existsSync);
  fixtures/dialectos verdes; board sintético inválido → rechazo claro;
  README kit: schema = contrato.
  **Deps:** U86 ✅.

- 🔶 **WP-U116 · view-kit: id neutro del cast-table (post-U113)**
  *(vigilante post-U114; dep U113 ✅)* — **en curso** (swarm /
  2026-07-18) · rama `wp/u116-cast-table-alias` · worktree
  `.worktrees/wp-u116-cast-table-alias` · brief
  `plan/REPORTES/briefs/WP-U116-cast-table-alias.md`.
  **GO diseño: (A) Alias en factory** — canónico `cast-table` **y**
  sinónimo `panel-elenco` → mismo `renderCastTableWidget` (tabla de
  ids; no camino legacy). SOLVE no migra boards. Hallazgo: factory
  solo registraba `panel-elenco`; renderer ya genérico (`vk-cast-table`).
  **No solapa U115 / U117** (schema; distinto paquete/capa).
  **(B) descartada** en este GO (map id-por-dialecto).
  **CA:** factory expone id neutro usable sin conocer SOLVE; test que
  monta por ese id; SOLVE (`panel-elenco`) sigue verde; gate
  two-games limpio; README view-kit veraz (canónico = `cast-table`).
  **Demolición:** default de fábrica que *solo* conoce `panel-elenco`
  como id de producto (el sinónimo queda documentado como alias de
  dialecto, no como único entry); fallback
  `ctx.id || 'panel-elenco'` en el render → id neutro `cast-table`.
  **Deps:** U113 ✅. Sin coord. U114 (solo hacía falta para B).
  **Residual opcional (cola, no bloquea CA):** labels ES hardwired
  («elenco vacío», columnas participante/rol/eje) — parametrizar vía
  `data` en WP futuro si hace falta.


- 🔶 **WP-U117 · Schema story-board único en zeus (post-U115)**
  *(vigilante post-U115; dep U115 ✅ · U114 ✅)* — **en curso** (swarm /
  2026-07-18) · rama `wp/u117-story-board-schema` · worktree
  `.worktrees/wp-u117-story-board-schema` · library
  `wp/u117-story-board-schema` · brief
  `plan/REPORTES/briefs/WP-U117-story-board-schema.md`.
  Hallazgo: U115 centralizó AJV+schema en library
  (`kits/carpeta-dramaturgo/schema/story-board.schema.json` +
  `validate-story-board.mjs`); el editor
  (`packages/editor/editor-ui/src/world/story-board-dialects.mjs`)
  mantiene validación a mano (`ACT_ID` / `WIDGET_ID` +
  `validateSolveShape` / `validateAlephBlocks`). Dos fuentes de verdad
  en tecnologías distintas — PRACTICAS §1.4 / RE-PLAN §3.8.
  **Dirección de deps:** library → zeus (ARQUITECTURA §4 / §6); el
  schema **no** puede vivir solo en library si el editor lo consume.
  **Paquete destino (propuesto, no over-decidido):**
  - **Recomendado:** `@zeus/story-board-schema` en
    `packages/engine/story-board-schema` — schema JSON + export
    (patrón `linea-kit/schemas/*`) + helper validate AJV opcional;
    changeset; library y `editor-ui` dependen de él.
  - **Descartado como hogar:** `linea-kit` (dominio VOLUMES, no
    story-board); kit carpeta (vive en library — deps invertidas).
  - Si el usuario prefiere otro nombre/hogar antes de 🔶, decirlo;
  sin eso el worker usa el recomendado.
  **Alcance:** mover el schema (contenido = el de U115) a zeus;
  library importa y deja de tener copia local; editor valida forma
  contra el mismo schema (AJV); el registro `STORY_BOARD_DIALECTS`
  (ids/labels/resolve/detect) **permanece** en editor — solo se
  demuele la validación de forma a mano. Post-check semántico
  `blocks[].act → act id` (library) puede vivir junto al helper del
  paquete o quedar en el script kit; no reintroducir regex de forma
  en editor.
  **CA:**
  1. Un solo fichero `story-board.schema.json` en zeus+library
     combinados (library: 0 copia propia; grep path local schema kit
     = 0 o reexport/documentado como import).
  2. `rg ACT_ID packages/editor/editor-ui` → **0** matches.
  3. Tests library (`test:carpeta-dramaturgo`) y editor
     (`world-draft` / dialectos) verdes contra el mismo schema
     (fixtures SOLVE+ALEPH + inválido rechazado).
  4. README del paquete + kit carpeta + editor: schema = contrato
     único en `@zeus/story-board-schema`.
  **Demolición:**
  - `kits/carpeta-dramaturgo/schema/story-board.schema.json` (copia)
  - en editor: `ACT_ID`, `WIDGET_ID`, cuerpos a mano
    `validateSolveShape` / `validateAlephBlocks` (sustituidos por
    validate del paquete / AJV).
  **Deps:** U115 ✅ · U114 ✅. **No solapa U116** (view-kit ids).
  **Repos:** zeus (paquete + editor) + library (import + demoler
  schema local). Changeset en el paquete publicable.

### Cola triaje vigilante registro 2026-07-18 (sin WP propio)

Fuente: `SCRIPT_SDK/VIGILANCIA/revisiones/registro-codereviews-2026-07-18.md`
(orquestador; no reabre addendas A-02…A-15 ya cerradas).

- ~~U109/U110 cumplidos~~ — ya ✅; residual STOP_SERVICES pozo/solve →
  nota bajo U110 arriba (**sin GO** → sin WP).
- U86 H1 schema decorativo → ~~**WP-U115**~~ ✅ (arriba).
- U86 H2 one-liner paths en editor-ui — **ignorado** (mitigado en review).
- U93 grieta viewer auto-fabrica peer-card — ya cola U93; **no WP** hasta
  GO usuario (firma SSB vs «visor pide card»); no abrir mesh a
  desconocidos antes.
- Histórico olas 0–10 / A-02…A-15 / U87 §1–8 — **ya cubierto** (WPs o
  colas existentes). Meta-lecciones → addenda [RE-PLAN.md](RE-PLAN.md)
  §3.1/3.3/3.7/3.8.
- Vigilante **post-U114** · factory view-kit solo `panel-elenco` →
  **WP-U116** 🔶 (arriba; GO **A** · swarm 2026-07-18).
- Vigilante **post-U115** · editor regex vs schema AJV library →
  **WP-U117** 🔶 (arriba; schema único en zeus).

### Diferidos U87 §5–6 — sin WP ejecutable

Anotados en [DECISIONES.md](DECISIONES.md) §abiertas y abajo en
horizonte. **No** crear U-number ni 🔶 hasta GO explícito del usuario.

- U87 §5 — montaje **linea-aleph vivo** (corpus ~48 MB; fixture subset
  ya en startpack; `ZEUS_LINEA_ALEPH_ROOT` documentado, no cableado al
  editor).
- U87 §6 — **skills stub** (`disfraz-rude-bot`, browsers de caché) solo
  en network-engine / `STUBS.md`; no reimplementar en zeus aún.

---

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
  de dramaturgo sobre U86 + U91/U92. Valida kits y forces, no toca la
  regla de los dos juegos. U87 ✅ entregó informe «qué faltó» (§hallazgos
  reporte); candidata horizonte (no asignada).
- **(diferido U87 §5 · sin WP)** linea-aleph vivo / montaje editor —
  ver DECISIONES §abiertas.
- **(diferido U87 §6 · sin WP)** skills stub network-engine —
  ver DECISIONES §abiertas.