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

> **Refundación + capa B drenadas** (U00–U118 ✅). **GO Sprint 1**
> ([ENTREGA-18d](ENTREGA-2026-07-18d-sprint1.md) · **D-24**): CI verde →
> prosa portales → auth registry durable. **0 DA** abiertas.
> Publish real ⏳ ops (tras **U122** + secret) → **U55**. DNS U106/U107 ⏳.
> Diferidos U87 §5–6 / residuales → **sin GO** (no activar).

| Frente | WP | Estado |
| ------ | --- | ------ |
| Olas 0–10 + higiene + remate D-22 | U00…U108 | ✅ (histórico) |
| Post-U87 — micro + editor + schema | **U109–U117** | ✅ |
| Estabilización mesa plan | **U118** | ✅ |
| **Sprint 1** — CI / prosa / registry | **U119–U122** | ver abajo |
| Publish real → demoler `file:` | ops + **U55** | gated (tras U122) |
| Sidecar blob live U100/U101 | — | diferido D-22 |

**Orden Sprint 1:** ~~**U119**~~ ✅ → **U120 ∥ U121** → **U122** → GO U55 natural.

**En curso:**
- 🔶 **WP-U120** · prosa zeus/docs (orquestador / 2026-07-18)
- 🔶 **WP-U121** · prosa library/docs (orquestador / 2026-07-18)

**⬜ en cola (Sprint 1):**
- **U122** auth `_password` (tras U120/U121 o post-U119 suave)

**⬜ / bloqueados (fuera Sprint 1):**
- **U55** — demoler `file:` (dep publish real; **no 🔶** hasta tick ops post-U122)

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

### WP-U120 · Prosa portal zeus/docs — 🔶

- 🔶 **WP-U120 · Refactor prosa `docs/` (zeus, ~23 md)** — asignado
  (orquestador / 2026-07-18). Brief:
  [REPORTES/briefs/WP-U120-prosa-zeus-docs.md](REPORTES/briefs/WP-U120-prosa-zeus-docs.md).
  Worktree: `.worktrees/wp-u120-prosa-zeus-docs` · rama `wp/u120-prosa-zeus-docs`.
  Mover WP-U## / D-## / «ola» / ⏳ / fechas a `guide/estado.md` (nueva);
  arreglar comandos rotos (p.ej. `getting-started.md`); contador «dos
  juegos» → regla paramétrica; tabla de paquetes mínima con puntero a
  fuente viva. Páginas doctrinales: P1-sin-negación. **Heros/lemas
  intactos** (D-24).
  **CA:** `docs:build` verde; en doctrinales (excluida `estado`): grep
  `WP-U|D-[0-9]|ola [0-9]|⏳|puede estar|consultado 20` → 0; bloques de
  comando corren tal cual (spot-check); heros intactos.
  **Demolición:** prosa de estado/swarm mezclada en doctrinales; números
  muertos (puertos/versiones/fechas) en páginas de producto.
  **Deps:** U119 ✅. **Paralelo con U121.** Repo: solo zeus.

### WP-U121 · Prosa portal library/docs — 🔶

- 🔶 **WP-U121 · Refactor prosa `Z_SDK-games-library/docs/` (~6 md)** —
  asignado (orquestador / 2026-07-18). Brief:
  [REPORTES/briefs/WP-U121-prosa-library-docs.md](REPORTES/briefs/WP-U121-prosa-library-docs.md).
  Worktree zeus: `.worktrees/wp-u121-prosa-library-docs` · rama
  `wp/u121-prosa-library-docs`. Worktree library:
  `../Z_SDK-games-library/.worktrees/wp-u121-prosa-library-docs`.
  `releases.md` describe mecanismo + apunta a GitHub Releases (verdad
  viva; fuera fechas «consultado» / versiones a mano);
  `startpacks.md` separa pipeline de publish-⏳; `file:` / `.deps`
  encajonado como «modo provisional». **Heros/lemas intactos** (D-24).
  **CA:** `docs:build` verde (library); doctrinales: mismo grep → 0;
  comandos spot-check; heros intactos.
  **Demolición:** fechas/versiones a mano en releases; publish-⏳ mezclado
  con pipeline doctrinal.
  **Deps:** U119 ✅. **Paralelo con U120.** Repo: library (+ reporte zeus).

### WP-U122 · Auth durable registry (`_password`) — ⬜

- ⬜ **WP-U122 · `release.yml` → patrón `_password` (basic-auth)** — al
  final del sprint (tras U119; idealmente tras U120/U121). Token JWT
  caduca (`expiresIn: 7d`); modelo **(a)** D-24: basic-auth no caducable
  (user + `_password` base64). Ajuste del bloque auth de `release.yml`;
  el secret lo carga **ops** cuando CI esté verde.
  **CA:** con secret presente y tests verdes, `npm view @zeus/protocol
  --registry=…` devuelve versión publicada; sin secret, skip «⏳» limpio.
  **Demolición:** wiring `_authToken` / JWT-as-NPM_TOKEN como única vía
  en el workflow.
  **Deps:** U119 ✅ (gate CI). Ops carga secret tras merge. Luego → U55.

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
