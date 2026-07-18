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
[ENTREGA-2026-07-18c.md](ENTREGA-2026-07-18c.md). Sprint bug-fixing:
[ENTREGA-2026-07-18d-sprint1.md](ENTREGA-2026-07-18d-sprint1.md) · **D-24**.

---

## Remate — estado swarm (2026-07-18 · Sprint 1 bug-fixing)

> **Refundación + capa B drenadas** (U00–U118 ✅). **Sprint 1 cerrado
> en código** ([ENTREGA-18d](ENTREGA-2026-07-18d-sprint1.md) · **D-24**):
> U119–U122 ✅. **0 DA** abiertas. Publish real ⏳ ops
> (`NPM_USERNAME`/`NPM_PASSWORD` + primer publish) → **U55**.
> DNS U106/U107 ⏳. Diferidos U87 §5–6 / residuales → **sin GO**.

| Frente | WP | Estado |
| ------ | --- | ------ |
| Olas 0–10 + higiene + remate D-22 | U00…U108 | ✅ (histórico) |
| Post-U87 — micro + editor + schema | **U109–U117** | ✅ |
| Estabilización mesa plan | **U118** | ✅ |
| **Sprint 1** — CI / prosa / registry | **U119–U122** | ✅ |
| Publish real → demoler `file:` | ops + **U55** | gated (ops post-U122) |
| Sidecar blob live U100/U101 | — | diferido D-22 |

**Orden Sprint 1:** ~~**U119**~~ ✅ → ~~**U120**~~ ✅ ∥ ~~**U121**~~ ✅ → ~~**U122**~~ ✅ → GO U55 natural (ops).

**En curso:** _(ninguno — Sprint 1 cerrado en código)_

**⬜ / bloqueados (fuera Sprint 1):**
- **U55** — demoler `file:` (dep publish real; **no 🔶** hasta tick ops:
  secrets `NPM_USERNAME`/`NPM_PASSWORD` + primer publish)

**NO subir:** ramas `wp/*` mergeadas · `claude/*`.

---

## Sprint 1 — bug-fixing (GO · ENTREGA-18d · D-24)

Fuente: [ENTREGA-2026-07-18d-sprint1.md](ENTREGA-2026-07-18d-sprint1.md).
Heros/lemas de marca **EXENTOS** (D-24). No mezclar residuales sin GO.

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

- Viewer fabrica peer-card local (cara ciega / residual U93) — firma SSB vs
  micro «visor pide card»
- `ZEUS_STOP_SERVICES` / stop targets pozo·solve (residual U109 / presets)
- Harness U100 cid hex → formato SSB `&…sha256` (live diferido D-22)
- CRLF `spec-sync` / `types-sync` Windows; dual-emit `arg:*`; flake e2e DJ
- (U102) `resolveStopServicePorts` switch→tabla; fixture firehose duplicada;
  linea-system fixture mínima; `ZEUS_SCRIPTORIUM_ROOM` en room-client
- (U114) env sibling library sin link `@zeus/startpack-kit` (ops/link)
- (U121) scrub `README.md` raíz library (WP-U/D-#/file: temporal) — fuera
  del portal VitePress; coherencia repo↔portal
- (U120) links blob en `docs/guide/estado.md` → repo público `Z_SDK` (hoy
  citan path `zeus-sdk`); scrub README raíz zeus (misma clase)
- (U122) `plan/ARQUITECTURA.md` §5 aún cita `NPM_TOKEN` (gate publish ya
  es `_password` en `release.yml`)
- Residuales de olas en [BACKLOG-HISTORICO.md](BACKLOG-HISTORICO.md) (colas
  por WP) — no reabrir en bloque

---

## Ops gated (fuera del swarm hasta tick)

- **⬜ WP-U55 · Demoler deps `file:`** — tras publish real (post **U122**
  + secret basic-auth `_password` en Actions + registry
  `npm.scriptorium.escrivivir.co`). Detalle CA en histórico (Ola 5).
- DNS / Custom domain ⏳: `z-sdk.escrivivir.co` (U106) ·
  `games.z-sdk.escrivivir.co` (U107)
- Sidecar / `ZEUS_BLOB_*` — **DIFERIDO** D-22

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
