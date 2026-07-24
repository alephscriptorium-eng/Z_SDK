# BACKLOG — refundación por olas

Convención: WPs autocontenidos con **CA** (criterios de aceptación
verificables) y **Demolición** (lo que se borra en el mismo WP). Estados:
⬜ pendiente · 🔶 en curso (agente + fecha) · ✅ aceptado (solo orquestador).
Dependencias explícitas; dentro de una ola, lo no dependiente es paralelizable.

El backlog de features del juego **delta** vive aparte en
`packages/arg/spec/BACKLOG.md` (fases 1.6/2) y puede avanzar en paralelo:
la refundación está ordenada para no pisarlo (delta ya habla el patrón bueno).

**Historia de olas 0–10 + colas cerradas:** [BACKLOG-HISTORICO.md](BACKLOG-HISTORICO.md)
(archivado WP-U118). Balance: [RE-PLAN.md](RE-PLAN.md). Acta cierre:
[ENTREGA-2026-07-18c.md](REPORTES/entregas/ENTREGA-2026-07-18c.md). Sprint 1 bug-fixing:
[ENTREGA-2026-07-18d-sprint1.md](REPORTES/entregas/ENTREGA-2026-07-18d-sprint1.md) · **D-24**.
Sprint 2 (ADDENDA + CAPA):
[ENTREGA-2026-07-19-sprint2/](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/) · **D-25**.
**AMEND Sprint 2** (CAPA rev2 · verdad de canales): **D-26** · fuentes
canónicas en `WEBS/ENTREGA-CAPA/` (no copiar a `plan/`).
**GO Sprint 3 / I50:** **D-33** · §Nota recibida · recepción **U142** ✅.
**GO implementación U143 ∥ U144:** **D-34**.
**Ratificación ex post U162 (acotada):** **D-41** (despachado sin GO;
conservar auditoría; no precedente; no U163–U167).
**Skills referencia versionada:** **D-35** (adoptar
`@alephscript/skills-scriptorium@0.3.0`; `plan/roles/` copia operativa).
**GO Sprint 4 — ejecución diferida D-35** (usuario · 2026-07-20):
instalación + migración skills · **U145 ∥ U146 → U147**. Procedimiento
probado: emmanuel `WP-I60` (activación skill, 0.2.0) adaptado a 0.3.0.

---

## Remate — estado swarm (2026-07-24 · Sprint 8 Ola B ✅ · pedir R11-Z)

> **Ola A CERRADA** · **U163 ✅ ∥ U167 ✅**. **Ola B CERRADA** ·
> **U164 ✅ ∥ U166 ✅ → U165 ✅** (último; tip código `3481838`).
> **R10-Z PASS** + GO Ola B consumidos. Pedido **R11-Z PASS** (cierre
> Ola B / Sprint 8). Frontera dura intacta: **cero** flip `private` ·
> **cero** changesets de pub · **cero** `npm publish`. Replan:
> [REPLAN-2026-07-24-sprint8.md](REPORTES/entregas/REPLAN-2026-07-24-sprint8.md).
> **U162** ✅ (D-41 · no precedente). **Sprint 7 CERRADO / IDLE.**
> Allowlist: [PUBLISH-ALLOWLIST.md](PUBLISH-ALLOWLIST.md). DC-15 LOCAL-ONLY.
> Skills espejo `@0.8.0` (no commitear `.claude/skills/`).
>
> **Sprint 6 CERRADO** (GO usuario · 0.3.3): **U154** ✅ mergeado
> (`1a24a60`) — proyección backlog→Issues montada y validada en
> **dry-run local**; CA re-verificadas de facto (gate: exit 3/1/0/4;
> `custodio` en WP-U139 atrapado; 0 issues en `Z_SDK`). **Adopción 0.3.3**
> mecánica hecha (`c6d9ffb`, D-36). **OA-1 RESUELTA** (canal handoff =
> entrega manual). **OA-2 RESUELTA** (**D-38** · vía a · GO usuario):
> roles `custodio`/`vigía`/`vigilante` publicables → fuera de
> `CEGUERA_PATTERN`; patrón residual
> `mediaci|marco|addenda|§interna|instancia-ejemplo` (+ locales runtime).
> Consecuencia: proyección pública **desbloqueada en vocabulario**
> *cuando* el texto pase el gate; **no** es GO de Issues reales
> (DC-15 / LOCAL-ONLY hasta GO aparte). **D-39:** `addenda` también
> publicable (falso positivo dominio); patrón residual vigente
> `mediaci|marco|§interna|instancia-ejemplo` → gate `todos` exit 0.
> **Handoff:** 3/4 puntos **resueltos en skills 0.3.4** (semver DC-22 ·
> gate gobierno DC-23 · back-links tema DC-24, verificados de facto);
> **Punto 4 (parser)** trasladado al mundo del paquete (su **DC-25**,
> pendiente de triaje) — en zeus = cola residual (formato bullets).
>
> **Sprint 4–5 CERRADOS** (ver histórico abajo). Publish npm startpacks =
> residual (NO WP) · diferidos U87 §5–6 sin GO · persistencia custom
> domain Pages ⏳ post-deploy U143 (no bloquea).

| Frente | WP | Estado |
| ------ | --- | ------ |
| Olas 0–10 + higiene + remate D-22 | U00…U108 | ✅ (histórico) |
| Post-U87 — micro + editor + schema | **U109–U117** | ✅ |
| Estabilización mesa plan | **U118** | ✅ |
| **Sprint 1** — CI / prosa / registry | **U119–U122** | ✅ |
| Publish real → demoler `file:` | **U55** ∥ **U123** | ✅ |
| **Sprint 2 A** — capa editorial CAPA | **U124** ∥ **U125** | ✅ |
| **Sprint 2 B** — higiene (4 micros) | **U126–U129** | ✅ |
| **Sprint 2 C** — plantilla sprint | **U130** | ✅ |
| **Sprint 2 D** — docs regeneración web | **U131** | ✅ |
| **AMEND Sprint 2 A** — W-B′ verdad canales | **U132** | ✅ |
| **AMEND Sprint 2 B** — C8/C9 → PRACTICAS | **U133** | ✅ |
| **AMEND Sprint 2 C** — archivar ENTREGA-* | **U134** | ✅ |
| **Micro** — protocolo GitHub Actions | **U135** | ✅ |
| **Micro** — C8 residual startpacks | **U136** | ✅ |
| **Micro** — Docs deploy saltado ≠ verde | **U137** | N/A |
| **Micro** — bug nav API HTML (SPA) | **U138** | ✅ |
| **Micro** — bug API links cuerpo md | **U139** | ✅ |
| **Micro** — higiene rutas absolutas locales | **U140** | ✅ |
| **Micro** — ceguera token en reporte U140 | **U141** | ✅ |
| **Sprint 3** — recepción / triage GO I50 | **U142** | ✅ |
| **Sprint 3** — CNAME `docs/public/` (ambos repos) | **U143** | ✅ |
| **Sprint 3** — consulta `npm ci` vs `npm install` (catálogo) | **U144** | ✅ |
| **Sprint 4** — dep registry `skills-scriptorium@0.3.0` | **U145** | ✅ |
| **Sprint 4** — `plan/roles/` → referencia versionada (I60) | **U146** | ✅ |
| **Sprint 4** — `.claude/skills/` runner local (dep U145) | **U147** | ✅ |
| **Sprint 4** — micro demolición `.cursor/`+copilot | **U148** | ✅ |
| **Sprint 5** — baseline 0.3.1 + regla 15 citada | **U149** | ✅ |
| **Sprint 5** — gate `verificar-sitio.mjs` + slug roto | **U150** | ✅ |
| **Sprint 5** — CHANGELOG gobierno (grueso, por ola) | **U151** | ✅ |
| **Sprint 5** — docs: página Proyecto + back-links por tema | **U152** | ✅ |
| **Sprint 5** — materializar estación de vigilancia | **U153** | ✅ |
| **Sprint 6** — proyección backlog→Issues (local-only dry-run) | **U154** | ✅ |
| **Sprint 7 A** — ts-compat (types subpaths + d.ts + smoke TS) | **U155–U158** | ✅ U155–U158 · CERRADO |
| **Sprint 7 B** — extracción `@zeus/socket-core` / corte mcp-core | **U159–U161** | ✅ U159–U161 |
| **Post-Sprint 7** — auditoría publish-ready / allowlist | **U162** | ✅ |
| **Sprint 8 A** — publish-ready mesh (Ola A) | **U163 ∥ U167** | ✅ |
| **Sprint 8 B** — publish-ready mesh (Ola B) | **U164–U166** | ✅ U164 · U166 · U165 (cerrada) |
| Sidecar blob live U100/U101 | — | diferido D-22 |

**AMEND Sprint 2:** **A ∥ B ∥ C** — lote ✅.

**En curso:** ninguno (Ola B ✅ · IDLE tras quietud; pedido R11-Z).
**Pendiente:** ninguno en Ola B / Sprint 8.
**Cerrado N/A:** **U137** (premisa incorrecta; ver abajo) · ítems
Sprint 3 ya resueltos en main (guard base · dist/ · gap paths ·
economía CI) — ver triage U142.
**Aceptado:** **U165** ✅ · **U164** ✅ · **U166** ✅ · **U163** ✅ ·
**U167** ✅ · **U162** ✅ · **U158** ✅ · **U161** ✅ · **U160** ✅ ·
**U157** ✅ · **U159** ✅ · **U156** ✅ · **U155** ✅ · **U154** ✅ ·
**U153** ✅ · **U151** ✅ · **U152** ✅ · **U150** ✅ · **U149** ✅ ·
sprints 1–5 (ver histórico).
**D-35** / **D-37** · **D-41** (U162 ex post acotado).

**NO subir:** ramas `wp/*` mergeadas · `claude/*`.

---

## Sprint 8 — publish-ready mesh (Ola A ✅ · Ola B ✅ · 2026-07-24)

Fuente: plan U162 + allowlist + **R8-Z PASS** (Ola A) + **GO
implementación Ola A** + **R9-Z PASS** (cierre Ola A) + **R10-Z PASS**
+ **GO implementación Ola B** (custodio). Detalle olas/deps:
[REPLAN-2026-07-24-sprint8.md](REPORTES/entregas/REPLAN-2026-07-24-sprint8.md).
Gates: [GATE-R10-Z-PASS.md](REPORTES/entregas/GATE-R10-Z-PASS.md) ·
[GATE-R9-Z-PASS.md](REPORTES/entregas/GATE-R9-Z-PASS.md) ·
`vigilancia/z/GATE-R8-Z-PASS.md`. Pedido cierre: **R11-Z**.

**Fronteras duras (hasta GO publish aparte):** sin flip `private` ·
sin changesets de publicación · sin `npm publish`. **No** reabre U162
como GO previo legítimo (D-41).

| ola | WPs | deps | paralelismo |
| --- | --- | ---- | ----------- |
| **A** | U163 · U167 | U162 ✅ | U163 ∥ U167 (**✅ cerrada**) |
| **B** | U164 · U166 · U165 | U163 ✅ | U164 ✅ · U166 ✅ → **U165 ✅** último + re-gate (**✅ cerrada**) |
| Publish | — | GO aparte | private + changesets de pub + npm publish |

### WP-U163 · POC publish-ready `@zeus/linea-system` — ✅

- ✅ **WP-U163 · POC publish-ready `@zeus/linea-system`** — aceptado
  (orquestador / 2026-07-24). Est. M. Dep: U162 ✅. Ola A. Rama
  `wp/u163-poc-publish-ready-linea-system` · tip rama `5f0a5d5` · merge
  `8d3820e`. Brief:
  [REPORTES/briefs/WP-U163-poc-publish-ready-linea-system.md](REPORTES/briefs/WP-U163-poc-publish-ready-linea-system.md).
  Reporte:
  [REPORTES/WP-U163-poc-publish-ready-linea-system.md](REPORTES/WP-U163-poc-publish-ready-linea-system.md).
  **Qué:** plantilla P0 — `publishConfig`, `files`, pines `@zeus/*`,
  JS-only, pack dry-run 8 files. **Fuera:** private · publish ·
  changesets de pub. **Eje:** IV.

### WP-U164 · Replicar P0 (firehose / force / ssb) — ✅

- ✅ **WP-U164 · Replicar P0: linea-firehose, force-system, ssb-system**
  — aceptado (orquestador / 2026-07-24). Est. M. Dep: **U163 ✅**
  (∥ **U166**; antes de aceptar U165). Ola B. Rama
  `wp/u164-replicar-p0-publish-ready` · tip `246ba77` · merge `6a2a409`.
  Brief:
  [REPORTES/briefs/WP-U164-replicar-p0-publish-ready.md](REPORTES/briefs/WP-U164-replicar-p0-publish-ready.md).
  Reporte:
  [REPORTES/WP-U164-replicar-p0-publish-ready.md](REPORTES/WP-U164-replicar-p0-publish-ready.md).
  **Qué:** mismo checklist POC ×3; ssb sin fixtures en tarball.
  **Fuera:** private · publish · changesets de pub · allowlist · gate
  U165. **Eje:** IV.

### WP-U165 · Gate pre-publicación mesh allowlist — ✅

- ✅ **WP-U165 · Gate pre-publicación mesh allowlist** — aceptado
  (orquestador / 2026-07-24 · último Ola B + re-gate integrado). Est.
  S–M. Dep: **U163 ✅** + **U164 ✅** + **U166 ✅**. Ola B. Rama
  `wp/u165-gate-prepub-mesh-allowlist` · tip `e10411d` · merge
  `3481838`. Brief:
  [REPORTES/briefs/WP-U165-gate-prepub-mesh-allowlist.md](REPORTES/briefs/WP-U165-gate-prepub-mesh-allowlist.md).
  Reporte:
  [REPORTES/WP-U165-gate-prepub-mesh-allowlist.md](REPORTES/WP-U165-gate-prepub-mesh-allowlist.md).
  **Qué:** `npm run gate:publish-ready` (P0×4; pack dry-run; registry
  C8 desde `.npmrc`); allowlist solo lectura; re-gate OK sobre base
  U164+U166. **Fuera:** publish · changesets de pub · enmendar
  allowlist (dueño = U166). **Eje:** IV + C8.

### WP-U166 · Triage P1 linea-editor + console-monitor — ✅

- ✅ **WP-U166 · Triage P1 linea-editor + console-monitor** — aceptado
  (orquestador / 2026-07-24). Est. M. Dep: **U163 ✅** (∥ **U164**;
  antes de aceptar U165). Ola B. Rama
  `wp/u166-triage-p1-linea-editor-console-monitor` · tip `43169ee` ·
  merge `25cf693`. Brief:
  [REPORTES/briefs/WP-U166-triage-p1-linea-editor-console-monitor.md](REPORTES/briefs/WP-U166-triage-p1-linea-editor-console-monitor.md).
  Reporte:
  [REPORTES/WP-U166-triage-p1-linea-editor-console-monitor.md](REPORTES/WP-U166-triage-p1-linea-editor-console-monitor.md).
  **Qué:** exports/console-monitor; decidir publicabilidad o deslistar;
  **posee** enmiendas allowlist/audit P1. **Fuera:** private · publish ·
  changesets de pub · gate U165 · P0. **Eje:** IV.

### WP-U167 · Triage P1 blobstore-client (o deslistar) — ✅

- ✅ **WP-U167 · Triage P1 blobstore-client (o deslistar)** — aceptado
  (orquestador / 2026-07-24). Est. M. Dep: U162 ✅. Ola A (∥ U163).
  Rama `wp/u167-triage-blobstore-client` · tip rama `00c8bc7` · merge
  `f46743b`. Brief:
  [REPORTES/briefs/WP-U167-triage-blobstore-client.md](REPORTES/briefs/WP-U167-triage-blobstore-client.md).
  Reporte:
  [REPORTES/WP-U167-triage-blobstore-client.md](REPORTES/WP-U167-triage-blobstore-client.md).
  **Qué:** **vía B** — democión P1→mantener privado (allowlist §3/§4 +
  audit). **Fuera:** private · publish · changesets de pub. **Eje:** IV.

---

## Sprint 7 — ts-compat + extracción (CERRADO / IDLE · 2026-07-24 · U155–U161 ✅)

Fuente handoff apertura orquestador-Z (R1-Z). Detalle triage + olas:
[REPLAN-2026-07-23-sprint7-ts-extraccion.md](REPORTES/entregas/REPLAN-2026-07-23-sprint7-ts-extraccion.md).
**Gate Ola 1:** `R2-Z PASS`. **Gate Ola 2:** `R3-Z PASS`.
**Gate Ola 3 (apertura):** `R4-Z PASS`
(`vigilancia/z/GATE-R4-Z-PASS.md` · tip `30136cb`) + GO secuencial
custodio — solo **U161**; U158 tras Release verde y R5-Z PASS.
**Gate remate U158:** `R5-Z PASS` (`vigilancia/z/GATE-R5-Z-PASS.md` ·
tip `ff2557c`). **Ola 1:** U155 ✅ · U156 ✅ · U159 ✅. **Ola 2:**
U157 ✅ · U160 ✅ (tip merge `53af36b`). **Ola 3:** U161 ✅.
**Remate:** U158 ✅ · merge `e62a990` · CI `30071337545` success.
**Cierre SOL:** **R6-Z PASS** (`vigilancia/z/GATE-R6-Z-PASS.md`).
**Sprint 7 CERRADO / IDLE** — 0 🔶; sin obra abierta. DC-15 LOCAL-ONLY.

### (A) Compatibilidad TypeScript `@zeus/*`

#### WP-U155 · `@zeus/protocol` types en subpaths — ✅

- ✅ **WP-U155 · Condiciones `"types"` en subpaths de `@zeus/protocol`
  (primero `./peer-card-seat`)** — aceptado (orquestador / 2026-07-23).
  Rama `wp/u155-protocol-types-subpaths` tip `6b3308d` · merge
  `54d60d2`. Est. M. Brief:
  [REPORTES/briefs/WP-U155-protocol-types-subpaths.md](REPORTES/briefs/WP-U155-protocol-types-subpaths.md).
  Reporte:
  [REPORTES/WP-U155-protocol-types-subpaths.md](REPORTES/WP-U155-protocol-types-subpaths.md).
  Re-smoke: `npm test -w @zeus/protocol` 40/40. **CA:** cumplidos.
  **Demolición:** exports string-only en subpaths JS públicos — ✅.
  **Eje:** IV. CI remoto ⏳ al push.

#### WP-U156 · types subpaths presets / webrtc / ui-3d — ✅

- ✅ **WP-U156 · `"types"` en subpaths de `@zeus/presets-sdk`,
  `@zeus/webrtc-signaling`, `@zeus/ui-3d-kit`** — aceptado
  (orquestador / 2026-07-23). Rama
  `wp/u156-types-subpaths-presets-webrtc-ui3d` tip `602fcf1` · merge
  `3c7d15d`. Est. M. `@zeus/rooms` = N/A. Brief:
  [REPORTES/briefs/WP-U156-types-subpaths-presets-webrtc-ui3d.md](REPORTES/briefs/WP-U156-types-subpaths-presets-webrtc-ui3d.md).
  Reporte:
  [REPORTES/WP-U156-types-subpaths-presets-webrtc-ui3d.md](REPORTES/WP-U156-types-subpaths-presets-webrtc-ui3d.md).
  Re-smoke: presets 43 · webrtc 22 · ui-3d 24. **CA:** cumplidos.
  **Eje:** IV. Deferidos horse/contract/http-contract → residual. CI ⏳.

#### WP-U157 · `.d.ts` grafo cercano (fase 2) — ✅

- ✅ **WP-U157 · Declaraciones `.d.ts` kits publicables BARE del grafo
  de los cinco tipados** — aceptado (orquestador / 2026-07-23 · Ola 2).
  Rama `wp/u157-dts-grafo-cercano` tip `7554472` · merge `2567189`.
  Est. L. Dep: U155+U156 ✅. Brief:
  [REPORTES/briefs/WP-U157-dts-grafo-cercano.md](REPORTES/briefs/WP-U157-dts-grafo-cercano.md).
  Reporte:
  [REPORTES/WP-U157-dts-grafo-cercano.md](REPORTES/WP-U157-dts-grafo-cercano.md).
  Lote cerrado ×9: view-kit, game-engine, authority-kit,
  room-client-browser, http-contract, ui-kit, app-shell, player-mcp-kit,
  socket-server. Re-smoke orquestador: http-contract 20/20. **CA:**
  cumplidos. **Eje:** IV. Residuales fans protocol / deferidos U156 →
  cola. CI ⏳.

#### WP-U158 · smoke TS desde registry + CI — ✅

- ✅ **WP-U158 · Consumidor TypeScript limpio desde registry (C8) en
  CI** — aceptado (orquestador-Z / 2026-07-24 · R5-Z PASS). Est. M.
  Dep: U155+U156 ✅ (U157 refuerza; U161 publish resuelve costura).
  Brief:
  [REPORTES/briefs/WP-U158-smoke-ts-registry-ci.md](REPORTES/briefs/WP-U158-smoke-ts-registry-ci.md).
  Rama `wp/u158-smoke-ts-registry` tip `cad90a6` · merge `e62a990`.
  Reporte:
  [REPORTES/WP-U158-smoke-ts-registry.md](REPORTES/WP-U158-smoke-ts-registry.md).
  **CA:** install `@zeus/*` tipados **desde registry real**
  (`https://npm.scriptorium.escrivivir.co`) GREEN; `tsc --noEmit` sin
  `any` de escape exit 0; cableado CI. Run main `30071337545` success,
  job registry `89412677473` success (no skip). **Demolición:** N/A
  (añade gate; U54/U161 intacto).

### (B) Extracción dependencia cruzada `@alephscript/mcp-core-sdk`

Grafo confirmado: dep runtime en `@zeus/rooms` + `@zeus/socket-server`;
tipos en `@zeus/webrtc-signaling`. Paquete destino: **`@zeus/socket-core`**.

#### WP-U159 · scaffold `@zeus/socket-core` — ✅

- ✅ **WP-U159 · Paquete propio con SocketClient/SocketServer (superficie
  usada)** — aceptado (orquestador / 2026-07-23). Rama
  `wp/u159-socket-core-scaffold` tip `6080b5e` · merge `46c6de2`.
  Est. L. Brief:
  [REPORTES/briefs/WP-U159-socket-core-scaffold.md](REPORTES/briefs/WP-U159-socket-core-scaffold.md).
  Reporte:
  [REPORTES/WP-U159-socket-core-scaffold.md](REPORTES/WP-U159-socket-core-scaffold.md).
  Re-smoke: 6/6 · IMPORTS_MCP=0. **CA:** cumplidos. **Eje:** I
  (cableado producción = U160). CI ⏳.

#### WP-U160 · migrar + cortar dep en `@zeus/*` — ✅

- ✅ **WP-U160 · rooms + socket-server → socket-core; cortar
  `@alephscript/mcp-core-sdk` en packages Zeus** — aceptado
  (orquestador / 2026-07-23 · Ola 2). Rama
  `wp/u160-migrar-corte-mcp-core` tip `dcf0a3c` · merge `53af36b`.
  Est. M. Dep: U159 ✅. Brief:
  [REPORTES/briefs/WP-U160-migrar-corte-mcp-core.md](REPORTES/briefs/WP-U160-migrar-corte-mcp-core.md).
  Reporte:
  [REPORTES/WP-U160-migrar-corte-mcp-core.md](REPORTES/WP-U160-migrar-corte-mcp-core.md).
  Re-smoke orquestador: rooms + socket-server verdes; IMPORTS_MCP=0 /
  PKG_JSON=0 en `packages`; SocketClient/Server solo en socket-core.
  **CA:** cumplidos. **Ejes:** I + II. Residuales root/examples → U161.
  CI ⏳.

#### WP-U161 · smoke scope solo `@zeus` + demolición residual — ✅

- ✅ **WP-U161 · Smoke consumidor un solo scope `@zeus` + cierre
  demolición** — aceptado (orquestador-Z / 2026-07-23 · Ola 3).
  Rama `wp/u161-smoke-zeus-only` tip `3474872` · merge `229c034`.
  Est. M. Dep: U160 ✅. Brief:
  [REPORTES/briefs/WP-U161-smoke-zeus-only-demolicion.md](REPORTES/briefs/WP-U161-smoke-zeus-only-demolicion.md).
  Reporte:
  [REPORTES/WP-U161-smoke-zeus-only.md](REPORTES/WP-U161-smoke-zeus-only.md).
  **CA:** cumplidos (smoke solo-`@zeus` exit 0; tabla demolición +
  excepciones ops `/spec` `/channels` operator-ui lock; tests+smoke).
  **Ejes:** I + II. U158 posterior ✅; Sprint 7 cerrado.

---

## Post-Sprint 7 — auditoría publish (U162 ✅ · despachado sin GO → ratificado ex post · 2026-07-24)

Fuente (archivada en repo; espejo vigilancia):
[ADDENDA-R5-Z-AUDITORIA-PUBLISH.md](REPORTES/entregas/ADDENDA-R5-Z-AUDITORIA-PUBLISH.md)
(`vigilancia/z/ADDENDA-R5-Z-AUDITORIA-PUBLISH.md`). Gate cierre Sprint 7:
`vigilancia/z/GATE-R6-Z-PASS.md` (+ copia
[GATE-R6-Z-PASS.md](REPORTES/entregas/GATE-R6-Z-PASS.md)). **Sprint 7
permanece CERRADO / IDLE** — no reabre U155–U161. **U162** fue
**despachado sin GO** de ronda (`854ed4e` afirmó GO inexistente); custodio
**ratifica ex post (acotado)** solo para conservar la auditoría (**D-41** ·
2026-07-24 · no precedente · no autoriza U163–U167). **R7-Z FAIL** de
gobierno:
[ACTA-R7-Z-INCIDENTE-despacho-sin-GO-U162.md](REPORTES/entregas/ACTA-R7-Z-INCIDENTE-despacho-sin-GO-U162.md).
Corrección registrada → **R7-Z PASS**
([GATE-R7-Z-PASS.md](REPORTES/entregas/GATE-R7-Z-PASS.md); no GO
implementación; no reabre U162 como GO previo). Frontera dura del WP:
**cero** flip `private` · **cero** npm publish. DC-15 LOCAL-ONLY.

### WP-U162 · Auditoría publish-ready y allowlist de paquetes Zeus — ✅

- ✅ **WP-U162 · Auditoría publish-ready y allowlist de paquetes Zeus** —
  aceptado (orquestador · 2026-07-24 · **despachado sin GO → ratificado
  ex post acotado D-41**). Tip rama `891379d` · merge `696ffff`. Est. L.
  Dep: post-U158 ✅ · Sprint 7 IDLE · R6-Z PASS. Fuente:
  [REPORTES/entregas/ADDENDA-R5-Z-AUDITORIA-PUBLISH.md](REPORTES/entregas/ADDENDA-R5-Z-AUDITORIA-PUBLISH.md).
  Brief:
  [REPORTES/briefs/WP-U162-auditoria-publish-allowlist.md](REPORTES/briefs/WP-U162-auditoria-publish-allowlist.md).
  Reporte:
  [REPORTES/WP-U162-auditoria-publish-allowlist.md](REPORTES/WP-U162-auditoria-publish-allowlist.md)
  (PASS técnico). Fuente única:
  [PUBLISH-ALLOWLIST.md](PUBLISH-ALLOWLIST.md). **Resultado:** inventario
  reproducible 49/49 = 29 publicados + 7 candidatos + 13 privados;
  `npm view` y `npm pack --dry-run` medidos para P0/P1; gates OK.
  Plan U163–U167 → **encolado ⬜** bajo GO planificación Sprint 8
  (no GO implementación; ver § Sprint 8). **CA técnicos:** cumplidos.
  **Proceso:** R7-Z FAIL → corrección → **R7-Z PASS**. **Frontera U162:**
  cero cambios `private`, cero publish, cero workflows/changesets de
  release. **Demolición:** n/a. **Eje:** IV.

---

## AMEND Sprint 2 — CAPA rev2 / verdad de canales (GO · 2026-07-19 · D-26)

Fuente canónica (**leer en WEBS; no copiar a `plan/`**):
`nota externa recibida (temp-review, 2026-07-19)` (WEBS/ENTREGA-CAPA/00-NOTA) +
`nota externa recibida (temp-review, 2026-07-19)` (WEBS/ENTREGA-CAPA/01-PAQUETE-CAPA)
(rev2). Tip claim `main` ~`cb5f675`. Nada reabre U124/U125 ✅ — WPs nuevos.
**Hecho de canal:** `@zeus/startpack-*` → 404 en registry npm; canal
operativo = tarball del GitHub Release.

### (A) Correctivo W-B′ — verdad de canales

#### WP-U132 · Correctivo W-B′ (library docs · CAPA rev2) — ✅

- ✅ **WP-U132 · Aplicar CAPA rev2 verbatim (6 ficheros library/docs)** —
  aceptado (orquestador / 2026-07-19). Tip library `c55955bb` · zeus merge
  `852f8d1`. Brief:
  [REPORTES/briefs/WP-U132-wb-prime-canales.md](REPORTES/briefs/WP-U132-wb-prime-canales.md).
  Reporte:
  [REPORTES/WP-U132-wb-prime-canales.md](REPORTES/WP-U132-wb-prime-canales.md).
  Fichas → tarball Release; releases sin tabla + registry doctrinal;
  startpacks dos canales; nav/sidebar solve. Residual C8
  `startpacks.md:41` → **U136** ✅. **CA:**
  cumplidos acotados al verbatim. **Demolición:** npm-por-nombre operativo
  en fichas + tabla manual releases — ✅.

### (B) Método WEBS → PRACTICAS

#### WP-U133 · Portar C8/C9 a PRACTICAS — ✅

- ✅ **WP-U133 · C8 + C9 como criterio estándar de WPs de docs** —
  aceptado (orquestador / 2026-07-19). Tip `f1a71a2`. Brief:
  [REPORTES/briefs/WP-U133-practicas-c8-c9.md](REPORTES/briefs/WP-U133-practicas-c8-c9.md).
  Reporte:
  [REPORTES/WP-U133-practicas-c8-c9.md](REPORTES/WP-U133-practicas-c8-c9.md).
  PRACTICAS §8 C8/C9 + checklist §3 + plantilla + punteros WORKER/REVISION;
  candidata CANTERA/01 (prosa). **CA:** citables por workers. **Demolición:**
  N/A (gobernanza).

### (C) Higiene plan/ — archivar handoffs

#### WP-U134 · Archivar ENTREGA-* + regla handoffs — ✅

- ✅ **WP-U134 · Mover ENTREGA-* de raíz plan/ + regla de archivo** —
  aceptado (orquestador / 2026-07-19). Tip merge `84e43d6` · revisión
  `4f351f8`. Brief:
  [REPORTES/briefs/WP-U134-archivar-entregas.md](REPORTES/briefs/WP-U134-archivar-entregas.md).
  Reporte:
  [REPORTES/WP-U134-archivar-entregas.md](REPORTES/WP-U134-archivar-entregas.md).
  ENTREGA-* → `REPORTES/entregas/`; links actualizados; regla handoffs en
  `roles/ORQUESTADOR.md`. **CA:** `ls plan/` limpio; 0 links rotos.
  **Demolición:** ENTREGA-* en raíz de `plan/` — ✅.

---

## Micro — protocolo GitHub Actions (GO · 2026-07-19 · D-27)

Fuente: investigación swarm (Fase 0 + (b) ligera). Solo gobernanza `plan/`.
Canónico: `gh run list` / `gh run view`. **No** Cursor-in-CI · **no** MCP /
Automations obligatorios en este WP.

#### WP-U135 · Protocolo Actions (`gh`) en roles + PRACTICAS — ✅

- ✅ **WP-U135 · Ritual / evidencia / gates CI vía Actions** — aceptado
  (orquestador / 2026-07-19). Tip merge `d00af86` · revisión `ed98ddf`. Brief:
  [REPORTES/briefs/WP-U135-protocolo-actions-gh.md](REPORTES/briefs/WP-U135-protocolo-actions-gh.md).
  Reporte:
  [REPORTES/WP-U135-protocolo-actions-gh.md](REPORTES/WP-U135-protocolo-actions-gh.md).
  Ritual `gh run*` en roles + PRACTICAS; PLANTILLA Evidencia CI; N/A U104;
  prohibido secrets/dispatch publish. **CA:** cumplidos. **Demolición:**
  N/A (gobernanza).

---

## Micros post-AMEND — C8 residual + Docs (GO usuario · 2026-07-19 · D-28)

Amparados por **GO usuario** del lote AMEND (**D-26–D-28**). El
**vigilante** aporta hallazgos/devoluciones — **nunca** GO. **U136** ✅.
**U137** cerrado N/A (premisa incorrecta). Fuentes CAPA: leer
`WEBS/ENTREGA-CAPA/01-PAQUETE-CAPA.md` § startpacks (no copiar a `plan/`).

#### WP-U136 · Fix C8 residual `docs/startpacks.md` — ✅

- ✅ **WP-U136 · Alinear fence Registry startpacks con patrón 2c / C8** —
  aceptado (orquestador / 2026-07-19). Library merge `b463a1a` (tip WP
  `b3efec1`) + **`git push origin main`**. Zeus reporte tip `276ee14`.
  Brief:
  [REPORTES/briefs/WP-U136-c8-startpacks-residual.md](REPORTES/briefs/WP-U136-c8-startpacks-residual.md).
  Reporte:
  [REPORTES/WP-U136-c8-startpacks-residual.md](REPORTES/WP-U136-c8-startpacks-residual.md).
  Fence `npm install @zeus/startpack-delta` demolido; prosa 2c como
  `releases.md`. Greps: 0 fences bash/sh; hits doctrinales OK. Actions
  rama Docs/CI `29689322704`/`29689322686` success (protocolo b).
  **CA:** cumplido. **Demolición:** fence Registry operativo npm-por-nombre.

#### WP-U137 · Docs deploy saltado = fallo visible — N/A

- **N/A · WP-U137** — cerrado (orquestador / 2026-07-19). Premisa del
  hallazgo vigilante era incorrecta: deploy saltado con run verde en
  **rama** es correcto (build-only; deploy solo-`main`). Causa real del
  tip no servido = **`main` local ahead sin `git push`** (U132
  `c55955b`). **No** implementar gate genérico «skip=rojo» (rompería
  builds de rama). Sin código útil en ramas/worktrees → N/A (no
  re-scope). Brief archivado con STOP:
  [REPORTES/briefs/WP-U137-docs-deploy-gate.md](REPORTES/briefs/WP-U137-docs-deploy-gate.md).
  Nota:
  [REPORTES/WP-U137-docs-deploy-gate.md](REPORTES/WP-U137-docs-deploy-gate.md).
  Worker `f92b3a9b`: **no reanudar** con premisa vieja.

---

## Micro — bug nav API HTML / SPA (GO usuario · 2026-07-19 · D-29)

Fuente (**leer; no copiar a `plan/`**):
nota externa recibida (temp-review, 2026-07-19) (`ENTREGA-2026-07-19b-bug-api-nav.md`).
Repo: **zeus-sdk** (`docs/.vitepress/config.mjs` + PRACTICAS §8 C8).
Library: verificar (hoy **no** enlaza `/api/` — N/A código). Tip claim
`~5a0079c`. **No** desactivar `cleanUrls` global.

#### WP-U138 · Menú «API HTML» 404ea (SPA vs assets) — ✅

- ✅ **WP-U138 · Nav API HTML → enlaces externos al router SPA** —
  aceptado (orquestador / 2026-07-19). Merge tip `aa2b940` (fix
  `cb55c3d`). Rama `wp/u138-api-nav-spa`. Reporte:
  [REPORTES/WP-U138-api-nav-spa.md](REPORTES/WP-U138-api-nav-spa.md).
  Brief:
  [REPORTES/briefs/WP-U138-api-nav-spa.md](REPORTES/briefs/WP-U138-api-nav-spa.md).
  `target: '_blank'` + `rel` ×6 en nav «API HTML»; PRACTICAS C8 nav/SPA;
  Playwright 6/6; Docs `29690453464` · CI `29690453486` success.
  Residual: links inline md → **WP-U139** (D-30).

---

## Micro — bug API links cuerpo md / SPA (GO usuario · 2026-07-19 · D-30)

Fuente (**leer; no copiar a `plan/`**):
nota externa recibida (temp-review, 2026-07-19) (`ENTREGA-2026-07-19c-bug-api-nav-cuerpo.md`).
Seguimiento de U138 ✅ (nav arreglado; **no reabrir**). Misma raíz SPA vs
assets; superficie = **cuerpo** markdown. Tip claim `~acbb7ed`.
**GO = usuario** (pase custodio); vigilante = hallazgo/CA, no GO.

#### WP-U139 · Links `/api/*.html` en cuerpo md 404ean — ✅

- ✅ **WP-U139 · Cuerpo md → enlaces externos al router SPA** —
  aceptado (orquestador / 2026-07-19). Merge tip `a493214` (WP tip
  `6fb223c` / claim `bc0b2ac`). Rama `wp/u139-api-nav-cuerpo`. Brief:
  [REPORTES/briefs/WP-U139-api-nav-cuerpo.md](REPORTES/briefs/WP-U139-api-nav-cuerpo.md).
  Reporte:
  [REPORTES/WP-U139-api-nav-cuerpo.md](REPORTES/WP-U139-api-nav-cuerpo.md).
  5 md cuerpo (ADDENDA + mesh + protocol) → `target="_blank"`; PRACTICAS
  C8 clase; Playwright 12/12; Docs rama `29691867603` success · CI N/A
  U104. Grep clase: 0 `href="/api/` sin `target`. Residual U138 cerrado.

---

## Micro — higiene rutas absolutas locales (GO · 2026-07-19 · D-31)

Fuente (**archivada en repo; citar ruta interna**):
[REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md](REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md)
(§Nota «Higiene · rutas absolutas…»; GO I5 externo). Repo público:
rutas de máquina local en `plan/` = deuda de portabilidad/privacidad.
**Prioridad:** antes del próximo push a `main`.

#### WP-U140 · Scrub rutas absolutas locales en plan/ — ✅

- ✅ **WP-U140 · Sustituir rutas absolutas de máquina local por cita
  neutral** — aceptado (orquestador / 2026-07-19). Merge tip `32e5124`
  (WP tip `465ba99`). Rama `wp/u140-scrub-rutas-locales`. Brief:
  [REPORTES/briefs/WP-U140-scrub-rutas-locales.md](REPORTES/briefs/WP-U140-scrub-rutas-locales.md).
  Alcance: cada cita de ruta local → «nota externa recibida
  (temp-review, &lt;fecha&gt;)», conservando texto pegado. CA **por
  clase** (no solo lista): grep repo patrones (1)/(2) de la §Nota = 0
  — incluye hit `WP-U122`. Guía futura: notas externas pegadas en
  `plan/REPORTES/` y citadas por ruta interna. **Demolición:** rutas
  absolutas de máquina local como procedencia en el árbol público.
  **Adenda vigía (pre-✅):** el alcance incluye la propia entrega
  archivada
  (`REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md`);
  ejemplo de patrón = forma redactada sin nombre de repo (`C:` +
  `\Users\...\<externo>\...`, partido); CA **sin eximir** ese fichero.
  **Residual post-✅:** evidencia de grep del reporte citaba el token
  (nombre-repo-externo) en claro → **WP-U141** ✅ (cerrado).

---

## Micro — ceguera token en reporte U140 (GO residual · 2026-07-19 · D-32)

Fuente (**archivada en repo; citar ruta interna**):
[REPORTES/entregas/ENTREGA-2026-07-19-ceguera-reporte-u140.md](REPORTES/entregas/ENTREGA-2026-07-19-ceguera-reporte-u140.md)
(§Nota «Enmascarar token…»; residual post-U140). El reporte U140 ✅
reintroduce el needle al documentar CA. Regla: evidencia de grep se
enmascara siempre.

#### WP-U141 · Enmascarar token en reporte U140 — ✅

- ✅ **WP-U141 · Sustituir menciones literales del token
  (nombre-repo-externo) por máscara neutra en
  `plan/REPORTES/WP-U140-scrub-rutas-locales.md`** — aceptado
  (orquestador / 2026-07-19). Rama `wp/u141-ceguera-reporte-u140`.
  Tip WP `2fd869b` · merge `dcd7892`. Brief:
  [REPORTES/briefs/WP-U141-ceguera-reporte-u140.md](REPORTES/briefs/WP-U141-ceguera-reporte-u140.md).
  Alcance: **solo** ese reporte (+ reporte WP-U141; sin reintroducir
  token). CA: grep del token = 0 en **todo** el repo, incluido el
  reporte U140. **Demolición:** token literal en evidencia/prosa del
  reporte U140. No reabre scrub de rutas (U140 ✅).

---

## Sprint 4 — instalación/migración skills (GO · 2026-07-20 · ejecución diferida D-35)

> GO usuario en chat orquestador. Ejecuta la parte que **D-35 dejó fuera**
> («requiere GO + WP aparte»). Procedimiento de referencia: emmanuel
> **WP-I60** (activación skill 0.2.0) — adaptado aquí a **0.3.0** con dos
> deltas del usuario: dep real en `package.json` (consumo multi-IDE desde
> `node_modules`) y materialización `.claude/skills/` para el runner
> Claude Code. Paralelismo: **U145 ∥ U146** (archivos disjuntos) →
> **U147** (dep U145).

### WP-U145 · Dependencia registry `@alephscript/skills-scriptorium@0.3.0` — ✅

- ✅ **WP-U145** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u145-dep-skills-scriptorium` tip `2b4eee3` (dep `b7110ad`).
  **Merge pendiente de GO usuario**; al pushear, `package*.json`
  dispara CI → exigir success (condición en la revisión). Reporte (en
  la rama):
  `plan/REPORTES/WP-U145-dep-skills-scriptorium.md`. CA1–CA3 ✅.
  Hallazgos → cola residual. Brief:
  [REPORTES/briefs/WP-U145-dep-skills-scriptorium.md](REPORTES/briefs/WP-U145-dep-skills-scriptorium.md).
  Añadir `@alephscript/skills-scriptorium` **versión exacta `0.3.0`**
  (devDependency, sin `^`) en `package.json` raíz + `npm install`
  (registry ya en `.npmrc`). **CA:** (1)
  `node_modules/@alephscript/skills-scriptorium/skills/vigilancia/SKILL.md`
  existe; (2) `npm view …@0.3.0 version` exit 0; (3) diff solo
  `package.json` + `package-lock.json` + reporte. **Demolición:** n/a.

### WP-U146 · `plan/roles/` → referencia versionada + calibración zeus — ✅

- ✅ **WP-U146** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u146-roles-referencia` tip `67fefd4`. **Merge pendiente de GO
  usuario** (CI = N/A por U104, solo `plan/`). CA1–CA5 ✅ (CA5 con
  medida honesta filtrando token propio). Reporte (en la rama):
  `plan/REPORTES/WP-U146-roles-referencia.md`. Hallazgos: `.cursor/`
  desactualizado → candidato **U148**; token en historial `main` →
  decisión usuario; prosa README → cola residual. Brief:
  [REPORTES/briefs/WP-U146-roles-referencia.md](REPORTES/briefs/WP-U146-roles-referencia.md).
  Replicar I60: `git rm` de los 5 prompts genéricos; `roles/README.md` →
  referencia versionada **0.3.0** (`skills/swarm-orquestacion` +
  `skills/vigilancia`) + **calibración local zeus** (delta no cubierto
  por el paquete); coser `plan/README.md` y `plan/PRACTICAS.md`.
  **CA (I60 adaptado):** CA1 dedup (grep prompts = exit 1) · CA2
  `npm view …@0.3.0` resoluble · CA3 calibración visible sin abrir el
  paquete · CA4 diff solo `plan/` · CA5 ceguera. **Demolición:** los 5
  prompts copiados (ORQUESTADOR, WORKER, REVISION, CORRECCION, BRIEF).

### WP-U147 · `.claude/skills/` — materialización runner local — ✅

- ✅ **WP-U147** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u147-claude-skills` tip `81036fa` (base = rama U145 `2b4eee3`;
  merge **U145 → U147** obligado). **Merge pendiente de GO usuario**;
  al pushear, `scripts/**`+`package.json` disparan CI → exigir success.
  CA1–CA4 ✅ + verificación de facto: el runner del orquestador
  **descubrió las 3 skills** al materializarse el espejo. Reporte (en
  la rama): `plan/REPORTES/WP-U147-claude-skills.md`. Rama
  `wp/u147-claude-skills`. Brief:
  [REPORTES/briefs/WP-U147-claude-skills.md](REPORTES/briefs/WP-U147-claude-skills.md).
  Script `scripts/sync-claude-skills.mjs` (npm script `skills:sync`):
  copia `node_modules/@alephscript/skills-scriptorium/skills/*` →
  `.claude/skills/` + README de procedencia (fuente = paquete, no
  editar a mano). **CA:** `.claude/skills/vigilancia/SKILL.md` existe e
  idéntico a `node_modules`; script idempotente; procedencia visible.
  **Demolición:** n/a.

---

## Sprint 6 — proyección backlog→Issues (GO usuario · 2026-07-20 · 0.3.3)

**Modo declarado (DC-15):** zeus opera **LOCAL-ONLY**. Ninguna proyección
a GitHub sin GO explícito del usuario **por acción**. `Z_SDK` es repo
**público** → gate de ceguera obligatorio antes de cualquier API.

### WP-U154 · Montar proyección backlog→Issues (dry-run local) — ✅

- ✅ **WP-U154** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u154-proyeccion-backlog` merge `1a24a60`. CA1–CA4 re-verificadas de
  facto por el orquestador (exit 3/1/0/4 remedidos; `custodio`@WP-U139;
  `.sync-map.json={}`; `gh issue list`=[]). Reporte:
  `plan/REPORTES/WP-U154-proyeccion-backlog.md`. Hallazgos → OA-2 (vocab
  público) + cola residual (formato bullets). Brief:
  [REPORTES/briefs/WP-U154-proyeccion-backlog.md](REPORTES/briefs/WP-U154-proyeccion-backlog.md).
  **(histórico del brief abajo)**

- (brief) **WP-U154** (worker background · 2026-07-20). Rama
  `wp/u154-proyeccion-backlog`. **Qué:** cablear la herramienta del paquete
  `proyectar-backlog.mjs` (0.3.3, WP-09/10/12) como npm script; definir la
  calibración local de zeus: `CEGUERA_PATTERN` (tokens de marco + locales
  prohibidos en cara pública), `--alcance abiertos` (solo ⬜/🔶; los ~140
  ✅ no se proyectan), ubicación `plan/.sync-map.json`. Ejecutar
  **`export --dry-run`** (sin API) y capturar salida literal como evidencia.
  **FRONTERA DURA:** `PROYECCION_GITHUB=1` / crear-cerrar issues reales =
  **fuera de alcance**; requiere GO explícito aparte (cara pública). El
  worker **no** toca la API de GitHub. **CA:** npm script existe; dry-run
  corre y lista los WP abiertos que proyectaría (salida literal); gate de
  ceguera activo (sin patrón → rehúsa; con patrón → 0 hits, probado);
  `.sync-map.json` vacío/inicial; cero issues creados (evidencia:
  `gh issue list` sin novedades). **ALCANCE_DIFF:** `package.json` (script),
  `plan/.sync-map.json`, calibración en `plan/roles/README.md` o config,
  `.gitignore` si aplica, reporte. **Eje:** ceguera (transversal).
  **Demolición:** n/a.

---

## Sprint 5 — adopción 0.3.1 (GO · 2026-07-20 · D-37) — ✅

Lote GO · 2026-07-20. MUNDO_RAIZ = zeus-sdk. Merge stack vía **U152**
(trae U149+U150). U151 ∥ U153 indep. post-stack.

### WP-U149 · Baseline 0.3.1 + regla 15 citada — ✅

- ✅ **WP-U149** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u149-baseline-031` tip `9290073` (en main vía stack U152).
  Reporte:
  [REPORTES/WP-U149-baseline-031.md](REPORTES/WP-U149-baseline-031.md).
  Brief:
  [REPORTES/briefs/WP-U149-baseline-031.md](REPORTES/briefs/WP-U149-baseline-031.md).
  **Qué:** (1) fijar `package-lock.json` en 0.3.1 + `npm run skills:sync`
  (espejo local, gitignorado); (2) citar la **regla 15**
  (`reglas-metodo-v04`) en `plan/roles/README.md` §Runners/IDEs y
  checklist cierre ola v0.4 en `plan/PRACTICAS.md §7`. **CA:**
  verificados de facto (npm view 0.3.1 · grep regla 15 · lock 0.3.1 ·
  gates OK). **ALCANCE_DIFF** OK · ceguera OK. **Eje:** ninguno
  (gobierno). **Nota CI:** lockfile dispara CI al push.

### WP-U150 · Gate `verificar-sitio.mjs` en docs CI + slug roto — ✅

- ✅ **WP-U150** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u150-gate-sitio` tip `9ef2eaf` (en main vía stack U152).
  Reporte:
  [REPORTES/WP-U150-gate-sitio.md](REPORTES/WP-U150-gate-sitio.md).
  Brief:
  [REPORTES/briefs/WP-U150-gate-sitio.md](REPORTES/briefs/WP-U150-gate-sitio.md).
  **Qué:** `verificar-sitio.mjs` post-`docs:build` en `docs.yml` + script
  `docs:verify`; slug monorepo unificado a `Z_SDK` (remoto real;
  `zeus-sdk` 404). **CA:** fail-probe exit 1 · build+verify verdes ·
  ALCANCE OK. **Eje:** site-web. **Nota CI:** exigir run_id Docs tras
  push (`.github/**`).

### WP-U151 · CHANGELOG de gobierno (grueso, por ola) — ✅

- ✅ **WP-U151** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u151-changelog-gobierno` tip `7f0103f` · merge `d32c4a5`.
  Reporte:
  [REPORTES/WP-U151-changelog-gobierno.md](REPORTES/WP-U151-changelog-gobierno.md).
  Brief:
  [REPORTES/briefs/WP-U151-changelog-gobierno.md](REPORTES/briefs/WP-U151-changelog-gobierno.md).
  **Qué:** `CHANGELOG.md` raíz Keep a Changelog, grueso por ola/sprint
  (1–4 + olas 0–10), derivado BACKLOG; sin `verificar-changelog.mjs`.
  **CA:** formato OK · sprints presentes · packages/* intactos. **Eje:**
  ninguno. **Nota CI:** paths-ignore N/A probable.

### WP-U152 · Docs: página Proyecto + back-links por tema — ✅

- ✅ **WP-U152** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u152-docs-back` tip `9c5b842` (ff a main; trae U149+U150).
  Reporte:
  [REPORTES/WP-U152-docs-back.md](REPORTES/WP-U152-docs-back.md).
  Brief:
  [REPORTES/briefs/WP-U152-docs-back.md](REPORTES/briefs/WP-U152-docs-back.md).
  **Qué:** `docs/proyecto.md` en nav/sidebar; back-links vía `SITE_BACK`
  en `themeConfig` (socialLinks/footer) — una fuente, 0 hardcode por
  página. **CA:** nav OK · grep registry solo en config · verificar-sitio
  verde (33 html). **Eje:** site-web. **Nota CI:** Docs tras push.

### WP-U153 · Materializar estación de vigilancia — ✅

- ✅ **WP-U153** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u153-estacion-vigilancia` tip `4458380` · merge `bd62759`.
  Reporte:
  [REPORTES/WP-U153-estacion-vigilancia.md](REPORTES/WP-U153-estacion-vigilancia.md).
  Brief:
  [REPORTES/briefs/WP-U153-estacion-vigilancia.md](REPORTES/briefs/WP-U153-estacion-vigilancia.md).
  **Qué:** wrappers `scripts/estacion/*` invocan `watcher.sh` del
  paquete; `.vigilancia/` gitignorado; checks 0.3.1. **CA:** pulso
  literal · ignore OK · checks ejecutados (CHANGELOG cruz operativo
  post-U151). **Eje:** vigilancia. Hallazgos → cola residual.

---

## ENTREGA Sprint 3 / GO I50 (GO · 2026-07-19 · D-33) + GO U143∥U144 (D-34)

> **§Nota recibida** (2026-07-19). Archivada:
> [REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md).
> Triage orquestador (U142 ✅): 4 ítems previos → N/A; **U143** ∥
> **U144** con **GO implementación D-34**. Recurso registry opcional
> (no WP). **U142** ✅ intacto.

### WP-U142 · Recepción / triage Sprint 3 — ✅

- ✅ **WP-U142 · Recibir §Nota ciega Sprint 3, archivar y proponer
  WPs por ítem** — aceptado (orquestador / 2026-07-19 · **D-33**).
  Nota:
  [REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md).
  **CA:** nota archivada (ruta interna); mapa triage abajo; ceguera
  intacta; U141 no tocado. **Demolición:** n/a (recepción).

### Triage (mapa ítem → WP / N/A)

| # §Nota | Ítem | Destino | Estado |
| ------- | ---- | ------- | ------ |
| 1 | CNAME en `docs/public/` (portal + catálogo) | **WP-U143** | ✅ · **D-34** |
| 2 | `npm ci` vs `npm install` en docs.yml del catálogo (consulta) | **WP-U144** | ✅ · **D-34** |
| — | Guard de `base` (MSYS) | N/A | ya en `config.mjs` |
| — | `dist/` en índice (library) | N/A | 0 ficheros |
| — | Gap `paths: docs/**` | N/A | documentado (WP-U104 / D-22 + dispatch) |
| — | Economía CI (paths-ignore / concurrency) | N/A | ya en ci.yml |
| — | Oferta `@alephscript/skills-scriptorium` | recurso · no WP | **D-35** adoptó `@0.3.0` como referencia versionada; `plan/roles/` copia operativa |

### WP-U143 · CNAME `docs/public/` (ambos repos) — ✅

- ✅ **WP-U143 · Commitear `docs/public/CNAME` con el dominio de cada
  portal** — aceptado (orquestador / 2026-07-19 · **D-34**). Brief:
  [REPORTES/briefs/WP-U143-cname-docs-public.md](REPORTES/briefs/WP-U143-cname-docs-public.md).
  Reporte:
  [REPORTES/WP-U143-cname-docs-public.md](REPORTES/WP-U143-cname-docs-public.md).
  Zeus CNAME `bbad244` · merge `4d2d805` · library `963841f` · merge
  `a25ca08`. Dominios: `z-sdk.escrivivir.co` /
  `games.z-sdk.escrivivir.co`. Docs+CI success en ramas WP.
  Persistencia Settings→Pages: ⏳ post-deploy. **CA:** ls-files +
  contenido ✅; Settings ⏳. **Demolición:** n/a.

### WP-U144 · Consulta `npm ci` en docs.yml del catálogo — ✅

- ✅ **WP-U144 · Alinear o documentar `npm install` vs `npm ci` en
  docs.yml del catálogo** — aceptado (orquestador / 2026-07-19 ·
  **D-34** · opción A). Brief:
  [REPORTES/briefs/WP-U144-npm-ci-consulta.md](REPORTES/briefs/WP-U144-npm-ci-consulta.md).
  Reporte:
  [REPORTES/WP-U144-npm-ci-consulta.md](REPORTES/WP-U144-npm-ci-consulta.md).
  Library tip merge `ad9627c` (`npm ci` en `docs.yml`) · Docs Actions
  `29704186751` success. Zeus solo reporte. **U143** no tocado.

---

## Sprint 2 — ADDENDA + CAPA (GO · 2026-07-19 · D-25) — ✅

Fuente canónica:
[00-ADDENDA.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/00-ADDENDA.md) +
[01-PAQUETE-CAPA.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/01-PAQUETE-CAPA.md)
([00-INDICE.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/00-INDICE.md)).
Paquete marketing WEBS/ENTREGA-SPRINT2 →
[SUPERADA-marketing-webs-sprint2/](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/SUPERADA-marketing-webs-sprint2/)
(no aplicar). **Heros/lemas: CAPA los cambia** (prioridad ADDENDA sobre
exención D-24 / marketing SUPERADO).

### (A) Capa editorial — CAPA verbatim

#### WP-U124 · Capa editorial W-A (hero zeus) — ✅

- ✅ **WP-U124 · Aplicar CAPA W-A en `zeus-sdk/docs/index.md`** —
  aceptado (orquestador / 2026-07-19). Rama `wp/u124-copy-web-a` merge
  `53f976e`. Reporte:
  [REPORTES/WP-U124-copy-web-a.md](REPORTES/WP-U124-copy-web-a.md).
  Hero CAPA verbatim (`Z_SDK` / Ventana de Contexto / tagline FOSS 1 línea);
  `actions`/`features` intocados; lema antiguo demolido en index.
  **CA:** cumplido (docs:build Windows quirk → residual preserveSymlinks).
  **Demolición:** N/A (reemplazo verbatim del bloque hero).

#### WP-U125 · Capa editorial W-B (library docs) — ✅

- ✅ **WP-U125 · Aplicar CAPA W-B en library/docs (5 ficheros)** —
  aceptado (orquestador / 2026-07-19). Rama `wp/u125-copy-web-b` (zeus
  reporte + library). Reporte:
  [REPORTES/WP-U125-copy-web-b.md](REPORTES/WP-U125-copy-web-b.md).
  Verbatim CAPA W-B; `config.mjs` intocado; residual nav/sidebar OK.
  **Demolición:** entrada SOLVE como «futuro» en `futuros.md` (ya released).

### (B) Higiene — 4 micros (∥ A)

#### WP-U126 · YAML `release-startpack.yml` — ✅

- ✅ **WP-U126 · Arreglar o demoler `release-startpack.yml` (library)** —
  aceptado (orquestador / 2026-07-19). Rama library
  `wp/u126-release-startpack-yml` merge `542b2ad` + reporte zeus
  `cb683f7`. Reporte:
  [REPORTES/WP-U126-release-startpack-yml.md](REPORTES/WP-U126-release-startpack-yml.md).
  Opción (a): prosa cabecera comentada; parser YAML OK; Notario vía canónica.
  **CA:** cumplido. **Demolición:** N/A (opción a).

#### WP-U127 · Higiene worktrees library — ✅

- ✅ **WP-U127 · Retirar worktrees/dirs huérfanos library** —
  aceptado (orquestador / 2026-07-19). Tip claim `0f9b53f` + revisión;
  higiene FS library (sin merge producto). Reporte:
  [REPORTES/WP-U127-higiene-worktrees.md](REPORTES/WP-U127-higiene-worktrees.md).
  `u107-review` + `wp-u121-*` + `wp-u123-*` fuera de `git worktree list` y
  `.worktrees/`. Sprint 2 activos intactos. **CA:** cumplido.
  **Demolición:** worktree/dirs obsoletos nombrados.

#### WP-U128 · Deps `@zeus/*` caret semver — ✅

- ✅ **WP-U128 · Fijar `"*"` → caret de versiones publicadas (library)** —
  aceptado (orquestador / 2026-07-19). Rama library `wp/u128-zeus-deps-semver`
  merge `0d99e89` + reporte zeus `7c432a8`. Reporte:
  [REPORTES/WP-U128-zeus-deps-semver.md](REPORTES/WP-U128-zeus-deps-semver.md).
  7 package.json + lock; cero `"*"` en deps `@zeus` de `packages/`.
  **CA:** cumplido. **Demolición:** rangos `"*"` en esos package.json.

#### WP-U129 · Links portal `zeus-sdk` → `Z_SDK` — ✅

- ✅ **WP-U129 · URL repo en `docs/guide/estado.md` (cola U120)** —
  aceptado (orquestador / 2026-07-19). Rama `wp/u129-estado-repo-links`
  merge `cf6699d`. Reporte:
  [REPORTES/WP-U129-estado-repo-links.md](REPORTES/WP-U129-estado-repo-links.md).
  2 links portal → `Z_SDK`; `docs:build` OK en reporte.
  **CA:** cumplido. **Demolición:** URLs `zeus-sdk` incorrectas en ese fichero.

### (C) Gobernanza — al cierre

#### WP-U130 · Plantilla de sprint (PRACTICAS/roles) — ✅

- ✅ **WP-U130 · Formalizar ciclo de sprint en `plan/PRACTICAS.md` o roles/**
  — aceptado (orquestador / 2026-07-19). Tip claim `2b448be`. Brief:
  [REPORTES/briefs/WP-U130-plantilla-sprint.md](REPORTES/briefs/WP-U130-plantilla-sprint.md).
  Reporte:
  [REPORTES/WP-U130-plantilla-sprint.md](REPORTES/WP-U130-plantilla-sprint.md).
  PRACTICAS §7 + punteros roles; acta
  [02-ACTA-CIERRE.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/02-ACTA-CIERRE.md) estrena
  fórmula. **CA:** cumplido. **Demolición:** N/A (gobernanza).

### (D) Docs — regeneración web («pipeline» documental)

#### WP-U131 · Documentar publicar la web — ✅

- ✅ **WP-U131 · Página `docs/guide/publicar-la-web.md` (+ puntero library)** —
  aceptado (orquestador / 2026-07-19). Tip claim zeus `2a41a0c` · library
  `2014816`. Brief:
  [REPORTES/briefs/WP-U131-publicar-la-web.md](REPORTES/briefs/WP-U131-publicar-la-web.md).
  Reporte:
  [REPORTES/WP-U131-publicar-la-web.md](REPORTES/WP-U131-publicar-la-web.md).
  Ciclo VitePress → Actions `docs.yml` → Pages + catálogo ← Releases.
  **CA:** página en portal; comandos corren; calza con `docs.yml` real;
  library enlaza o replica en corto — cumplido.
  **Demolición:** N/A (docs nuevas).

---

## Sprint 1 — bug-fixing (GO · ENTREGA-18d · D-24) — ✅

Fuente: [ENTREGA-2026-07-18d-sprint1.md](REPORTES/entregas/ENTREGA-2026-07-18d-sprint1.md).
Heros/lemas de marca **EXENTOS** (D-24). Cerrado en código.

### WP-U119 · CI main verde (4 workspaces) — ✅

- ✅ **WP-U119 · Diagnosticar y dejar CI de main verde** — aceptado
  (orquestador / 2026-07-18). Merge `c58d5ea` · tip WP `3d45b8b`.
  Reporte:
  [REPORTES/WP-U119-ci-main-verde.md](REPORTES/WP-U119-ci-main-verde.md).
  Root causes: http pin+EOL · linea demo≠espana · firehose deferred corpora ·
  editor throw sin library. Patrón U102; re-smoke orquestador fail 0.
  Run CI remoto en main tras merge: ⏳ seguimiento.
  **CA:** cumplido en código (4 WS verdes local; skips ⏳ documentados).
  **Demolición:** throw module-level library; pin `0.1.0`; skip linea débil.

### WP-U120 · Prosa portal zeus/docs — ✅

- ✅ **WP-U120 · Refactor prosa `docs/` (zeus, ~23 md)** — aceptado
  (orquestador / 2026-07-18). Merge `e9b5047` · tip WP `7703768`.
  Reporte:
  [REPORTES/WP-U120-prosa-zeus-docs.md](REPORTES/WP-U120-prosa-zeus-docs.md).
  `guide/estado.md` nueva; doctrinales scrub; heros intactos; `docs:build`
  + grep → 0 (re-smoke orquestador).
  **CA:** cumplido. **Demolición:** prosa swarm en doctrinales; puertos
  muertos en tablas producto. Residual: links blob `estado.md` → `Z_SDK`.

### WP-U121 · Prosa portal library/docs — ✅

- ✅ **WP-U121 · Refactor prosa `Z_SDK-games-library/docs/` (~6 md)** —
  aceptado (orquestador / 2026-07-18). Library merge tip `2314b8e` · zeus
  reporte `b196075`+. Reporte:
  [REPORTES/WP-U121-prosa-library-docs.md](REPORTES/WP-U121-prosa-library-docs.md).
  Releases=mecanismo+GitHub vivo; startpacks separa publish; `file:`
  provisional; futuros=estado; heros intactos. Re-smoke `docs:build` +
  grep → 0.
  **CA:** cumplido. **Demolición:** fechas/versiones a mano; publish-⏳ en
  doctrina. Hallazgo: scrub README raíz library → cola residual.

### WP-U122 · Auth durable registry (`_password`) — ✅

- ✅ **WP-U122 · `release.yml` → patrón `_password` (basic-auth)** —
  aceptado (orquestador / 2026-07-18). Merge `286ca02`. Reporte:
  [REPORTES/WP-U122-registry-password-auth.md](REPORTES/WP-U122-registry-password-auth.md).
  Secrets `NPM_USERNAME` + `NPM_PASSWORD` → `.npmrc` `:\_password=`;
  demolido JWT/`NPM_TOKEN`/`NODE_AUTH_TOKEN`/`registry-url` en job release;
  skip ⏳ sin secrets; contrato test pass. `npm view` ⏳ hasta ops.
  **CA:** skip path cumplido; publish real = ops post-merge.
  **Demolición:** cumplida en `release.yml`. Hallazgo: `ARQUITECTURA.md`
  §5 aún cita `NPM_TOKEN` → cola residual.

---

## WP-U118 · Estabilización mesa plan — ✅

- ✅ **WP-U118 · Estabilización mesa `plan/`** — aceptado (orquestador /
  2026-07-18). Archiva olas/colas cerradas en
  [BACKLOG-HISTORICO.md](BACKLOG-HISTORICO.md); compacta remate + una cola
  residual viva; punteros claros a RE-PLAN / ENTREGA-18c; scrub vocabulario
  externo ajeno → idioma zeus (frente / capa B / ola). **Sin** activar
  U55, ops, diferidos §5–6, micros peer-card / STOP_SERVICES.
  **CA:** BACKLOG vivo legible; histórico consultable; 0 🔶; scrub
  vocabulario externo ajeno → 0 hits en `plan/`.
  **Demolición:** ruido de remate (next-steps ✅ interminables) y ~33
  secciones «Cola hallazgos» del tablero vivo (viven en histórico).

---

## Cola residual viva (sin GO → sin 🔶 / sin WP nuevo)

Candidatos de higiene; **no** abrir frente sin GO explícito del usuario.

- (U154) **formato de bullets del backlog vs parser de proyección:** ~16
  bullets usan `**WP-XX**` (prosa) en vez de `**WP-XX · título**` que exige
  `proyectar-backlog.mjs`; no se parsean. Candidato: unificar formato del
  backlog, o esperar parser flexibilizado (Punto 4 del handoff al diseñador).
- (U153) **falso positivo regla 15:** `skills:sync` deja markdowns de
  método bajo `.claude/skills/`; watcher 0.3.1 los eleva como RESIDUO —
  feedback diseñador (excluir espejo) o no materializar espejo en
  `.claude/` (solo `node_modules`)
- (U153) huérfanos FS `.worktrees/wp-u12|u23|u89-*` sin registro git
  (basura preexistente) — higiene residual
- ~~Viewer fabrica peer-card local (cara ciega / residual U93) — firma SSB vs
  micro «visor pide card»~~ — **CERRADO** (GO-4 · **D-40**): firma del
  conector = «visor pide card»; SSB = extensión U93 diferida.
- `ZEUS_STOP_SERVICES` / stop targets pozo·solve (residual U109 / presets)
- Harness U100 cid hex → formato SSB `&…sha256` (live diferido D-22)
- CRLF `spec-sync` / `types-sync` Windows; dual-emit `arg:*`; flake e2e DJ
- (U102) `resolveStopServicePorts` switch→tabla; fixture firehose duplicada;
  linea-system fixture mínima; `ZEUS_SCRIPTORIUM_ROOM` en room-client
- (U114) env sibling library sin link `@zeus/startpack-kit` (ops/link)
- (U121) scrub `README.md` raíz library (WP-U/D-#/file: temporal) — fuera
  del portal VitePress; coherencia repo↔portal
- (U120) links blob en `docs/guide/estado.md` → **WP-U129 ✅**; scrub README
  raíz zeus (misma clase) queda residual
- (U126) workflow `release-startpack` solo `delta|pozo` en dispatch; Notario
  también sketch/solve-coagula/plaza — candidato micro si hace falta
- (U122) `plan/ARQUITECTURA.md` §5 aún cita `NPM_TOKEN` (gate publish ya
  es `_password` en `release.yml`)
- (U124) VitePress 1.6.4 + Windows: `docs:build` falla por case `C:`/`c:`
  tras `realpath` → candidate
  `vite: { resolve: { preserveSymlinks: true } }` en
  `docs/.vitepress/config.mjs` (no aplicar sin GO)
- (U125) nav/sidebar `solve-coagula` — **cerrado por U132 ✅**
- (U131) VitePress en worktree Windows: path largo falla dead-links; library
  no gitignorea `docs/.vitepress/cache/` (zeus sí) — candidato higiene
- (U132) C8 residual `startpacks.md:41` → **WP-U136** ✅ (D-28)
- (U138) nav API HTML SPA 404 → **WP-U138** ✅ (D-29); residual inline
  cuerpo → **WP-U139** ✅ (D-30 · cola cerrada)
- (U145) lockfile `main` desincronizado con versiones workspace (npm lo
  realineó de pasada) — candidato: regenerar/verificar lockfile en CI
- (U145) `npm audit`: 53 vulns (6 críticas) preexistentes en árbol dev —
  candidato triage
- (U145) EOL `bin/*.mjs` reescritos por `npm install` (ruido git) —
  candidato `.gitattributes` con `eol` explícito
- (U145) `engines.node >=22` del paquete skills vs `>=18` del raíz —
  divergencia a vigilar (sin `engine-strict` no bloquea)
- (U146) `.cursor/README.md` + `.cursor/rules/*.mdc` citan prompts
  borrados de `plan/roles/` — candidato **micro-WP U148** (repuntar
  adaptador a roles/README + paquete); conviene en el lote de merge
- (U146) prosa antigua `plan/README.md` («toma un WP… márcalo 🔶»)
  contradice protocolo (🔶 lo marca el orquestador) — costura futura
- ~~(U146) token en historial de `main`~~ — **RESUELTO** (GO usuario
  2026-07-20): reescritura local pre-push; nunca llegó a origin.
  Aclarado: era ruta local con identificador del custodio (ceguera,
  clase U140/D-32), **no** una credencial
- ~~(post-sprint4) `plan/recursos/*` untracked ensucian lint local~~ —
  **RESUELTO** (GO usuario 2026-07-20): clones retirados del disco;
  eran referencia de ola 10 ya consumida (U88/U90 ✅), 0 cambios
  locales; procedencia + re-clone en `plan/recursos/README.md`
- (U147) test permanente del sync (fixture + tmpdir) — no estaba en CA;
  candidato si se quiere blindar
- (U147) workflow anidado inerte en ejemplo `site-web` del paquete —
  arreglo pertenece a la librería (ticket ya abierto allí)
- Residuales de olas en [BACKLOG-HISTORICO.md](BACKLOG-HISTORICO.md) (colas
  por WP) — no reabrir en bloque

---

## Post-publish — demoler `file:` (GO · 2026-07-18) — ✅

Evidencia ops: `npm view @zeus/protocol` → **0.2.0** registry propio.

### WP-U55 · Demoler deps `file:` operator-ui/threejs-ui-lib — ✅

- ✅ **WP-U55 · Demoler deps `file:`** — aceptado (orquestador /
  2026-07-18). Merge tip `aa1c76d` (+ publish bridge vía Actions).
  Reporte:
  [REPORTES/WP-U55-demoler-file-deps.md](REPORTES/WP-U55-demoler-file-deps.md).
  `@zeus/operator-bridge@0.1.0` publicado; operator-ui/threejs-ui-lib
  sin `file:`; smoke registry OK.
  **CA:** cumplido. **Demolición:** `file:` en esos package.json — ✅.

### WP-U123 · Library retiro `file:` / `.deps` → registry — ✅

- ✅ **WP-U123 · Retiro puente `file:`/`.deps` en games-library** —
  aceptado (orquestador / 2026-07-18). Library merge `08da7f6` · zeus
  reporte `80019b4`. Reporte:
  [REPORTES/WP-U123-retiro-file-deps.md](REPORTES/WP-U123-retiro-file-deps.md).
  Install limpio sin `file:`; tests EXIT 0; **`.deps` = fallback DEV
  documentado** (demos/e2e mesh).
  **CA:** cumplido. **Demolición:** file: raíz + preinstall — ✅.

## Ops gated (fuera del swarm hasta tick)

- DNS / Custom domain ⏳: `z-sdk.escrivivir.co` (U106) ·
  `games.z-sdk.escrivivir.co` (U107)
- Sidecar / `ZEUS_BLOB_*` — **DIFERIDO** D-22
- Publish mesh resto (post operator-bridge) — residual

---

## Horizonte (post-refundación, no tomar aún)

- **WP-U71 · VOLUMES p2p** — content-addressable (IPFS candidato); transporte
  sobre layout inmutable (DATOS.md §5).
- **WP-U72 · Persistencia del estado de rooms** — snapshot/ledger → colas
  files-first (D-13).
- **WP-U73 · El teatro de la capa 2 SSB** — identidad SSB / puente L1↔L2;
  depende spikes externos.
- **WP-U74 · Juego trenzado sobre forces** — myth-maker/debunker sobre
  U86 + U91/U92; candidata horizonte.
- **(diferido U87 §5 · sin WP)** linea-aleph vivo — DECISIONES §abiertas.
- **(diferido U87 §6 · sin WP)** skills stub network-engine — DECISIONES.
