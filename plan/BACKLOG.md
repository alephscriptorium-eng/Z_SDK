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

**Orden Sprint 1:** **U119** → **U120 ∥ U121** → **U122** → GO U55 natural.

**En curso:**
- 🔶 **WP-U119** · CI main verde (orquestador / 2026-07-18)

**⬜ en cola (Sprint 1):**
- **U120** prosa zeus/docs · **U121** prosa library/docs · **U122** auth `_password`

**⬜ / bloqueados (fuera Sprint 1):**
- **U55** — demoler `file:` (dep publish real; **no 🔶** hasta tick ops post-U122)

**NO subir:** ramas `wp/*` mergeadas · `claude/*`.

---

## Sprint 1 — bug-fixing (GO · ENTREGA-18d · D-24)

Fuente: [ENTREGA-2026-07-18d-sprint1.md](ENTREGA-2026-07-18d-sprint1.md).
Heros/lemas de marca **EXENTOS** (D-24). No mezclar residuales sin GO.

### WP-U119 · CI main verde (4 workspaces) — 🔶

- 🔶 **WP-U119 · Diagnosticar y dejar CI de main verde** — asignado
  (orquestador / 2026-07-18). Brief:
  [REPORTES/briefs/WP-U119-ci-main-verde.md](REPORTES/briefs/WP-U119-ci-main-verde.md).
  Worktree: `.worktrees/wp-u119-ci-main-verde` · rama `wp/u119-ci-main-verde`.
  Desde ~U116/U117, fallan en CI/Release (runs 29656058145 / 29656058148):
  `@zeus/http-contract`, `@zeus/linea-system`, `@zeus/firehose-browser`,
  `@zeus/editor-ui`. Re-smokes locales de esos WP salían verdes → sospecha
  regresión de integración U111–U117 (candidato: `@zeus/story-board-schema`
  U117 + consumidores; linea-system ya tuvo dep de entorno en U102) o
  deriva local-vs-runner.
  **CA:** run de CI completo verde en `main`; causa raíz de **cada**
  workspace anotada en el reporte (no solo el fix); si el fix es «test no
  hermético», patrón U102 (fixture/env explícito/skip-⏳) — **nunca**
  debilitar asserts.
  **Demolición:** stubs/skips que oculten el fallo sin causa; asserts
  aflojados «para pasar CI»; workarounds que no documenten root cause.
  **Deps:** ninguna (prioridad del sprint; gate de publish/U122).
  **No:** U120–U122 · U55 · residuales · docs prosa.

### WP-U120 · Prosa portal zeus/docs — ⬜

- ⬜ **WP-U120 · Refactor prosa `docs/` (zeus, ~23 md)** — tras U119 ✅.
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

### WP-U121 · Prosa portal library/docs — ⬜

- ⬜ **WP-U121 · Refactor prosa `Z_SDK-games-library/docs/` (~6 md)** —
  tras U119 ✅. `releases.md` describe mecanismo + apunta a GitHub
  Releases (verdad viva; fuera fechas «consultado» / versiones a mano);
  `startpacks.md` separa pipeline de publish-⏳; `file:` / `.deps`
  encajonado como «modo provisional». **Heros/lemas intactos** (D-24).
  **CA:** `docs:build` verde (library); doctrinales: mismo grep → 0;
  comandos spot-check; heros intactos.
  **Demolición:** fechas/versiones a mano en releases; publish-⏳ mezclado
  con pipeline doctrinal.
  **Deps:** U119 ✅. **Paralelo con U120.** Repo: library (+ reporte zeus).

### WP-U122 · Auth durable registry (`_password`) — ⬜

- ⬜ **WP-U122 · `release.yml` → patrón `_password` (basic-auth)** — al
  final del sprint (tras U119; idealmente tras U120/U121 o en paralelo
  suave post-U119 si no solapa). Token JWT caduca (`expiresIn: 7d`);
  modelo **(a)** D-24: basic-auth no caducable (user + `_password`
  base64, como `.npmrc.example` del registry). Ajuste del bloque auth de
  `release.yml`; el secret lo carga **ops** cuando U119 deje el gate
  verde.
  **CA:** con secret presente y tests verdes, `npm view @zeus/protocol
  --registry=…` devuelve versión publicada; sin secret, skip «⏳» limpio
  (hoy ni se evalúa: muere antes en test).
  **Demolición:** wiring `_authToken` / JWT-as-NPM_TOKEN como única vía
  en el workflow (sustituir por `_password` durable).
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
