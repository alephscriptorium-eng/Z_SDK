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
[ENTREGA-2026-07-18c.md](ENTREGA-2026-07-18c.md). Sprint 1 bug-fixing:
[ENTREGA-2026-07-18d-sprint1.md](ENTREGA-2026-07-18d-sprint1.md) · **D-24**.
Sprint 2 (ADDENDA + CAPA):
[ENTREGA-2026-07-19-sprint2/](ENTREGA-2026-07-19-sprint2/) · **D-25**.
**AMEND Sprint 2** (CAPA rev2 · verdad de canales): **D-26** · fuentes
canónicas en `WEBS/ENTREGA-CAPA/` (no copiar a `plan/`).

---

## Remate — estado swarm (2026-07-19 · AMEND Sprint 2 🔶)

> **esperando: workers U132∥U133∥U134** (AMEND Sprint 2 · **D-26**).
> Sprint 2 base cerrado ✅ (**D-25**). **0 DA** abiertas. Lote AMEND:
> **A** U132 (W-B′ canales) · **B** U133 (C8/C9 PRACTICAS) · **C** U134
> (archivar ENTREGA-*) — **A ∥ B ∥ C**. Ops: publish npm startpacks =
> residual (NO WP). Diferidos U87 §5–6 → **sin GO**.

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
| **AMEND Sprint 2 A** — W-B′ verdad canales | **U132** | 🔶 |
| **AMEND Sprint 2 B** — C8/C9 → PRACTICAS | **U133** | 🔶 |
| **AMEND Sprint 2 C** — archivar ENTREGA-* | **U134** | 🔶 |
| Sidecar blob live U100/U101 | — | diferido D-22 |

**AMEND Sprint 2:** **A ∥ B ∥ C** (no se pisan: library docs / PRACTICAS /
plan higiene).

**En curso:** **U132** 🔶 · **U133** 🔶 · **U134** 🔶.
**Aceptado Sprint 2 base:** **U124** ✅ ∥ **U125** ✅ · **U126–U129** ✅ ·
**U130** ✅ · **U131** ✅.

**NO subir:** ramas `wp/*` mergeadas · `claude/*`.

---

## AMEND Sprint 2 — CAPA rev2 / verdad de canales (GO · 2026-07-19 · D-26)

Fuente canónica (**leer en WEBS; no copiar a `plan/`**):
`C:\Users\aleph\OASIS\SCRIPTORIUM_V0\WEBS\ENTREGA-CAPA\00-NOTA.md` +
`C:\Users\aleph\OASIS\SCRIPTORIUM_V0\WEBS\ENTREGA-CAPA\01-PAQUETE-CAPA.md`
(rev2). Tip claim `main` ~`cb5f675`. Nada reabre U124/U125 ✅ — WPs nuevos.
**Hecho de canal:** `@zeus/startpack-*` → 404 en registry npm; canal
operativo = tarball del GitHub Release.

### (A) Correctivo W-B′ — verdad de canales

#### WP-U132 · Correctivo W-B′ (library docs · CAPA rev2) — 🔶

- 🔶 **WP-U132 · Aplicar CAPA rev2 verbatim (6 ficheros library/docs)** —
  en curso (orquestador / 2026-07-19). Brief:
  [REPORTES/briefs/WP-U132-wb-prime-canales.md](REPORTES/briefs/WP-U132-wb-prime-canales.md).
  Rama zeus `wp/u132-wb-prime-canales` · library `wp/u132-wb-prime-canales`.
  Alcance: fichas delta/pozo/solve → tarball Release; `releases.md` sin
  tabla manual + registry doctrinal; `startpacks.md` dos canales;
  `config.mjs` nav/sidebar solve-coagula. **CA:** paquete §Verificación
  (docs:build; C8/C9 greps; 6 ficheros). **Demolición:** comandos
  `npm install @zeus/startpack-*` operativos + tabla manual releases.

### (B) Método WEBS → PRACTICAS

#### WP-U133 · Portar C8/C9 a PRACTICAS — 🔶

- 🔶 **WP-U133 · C8 + C9 como criterio estándar de WPs de docs** —
  en curso (orquestador / 2026-07-19). Brief:
  [REPORTES/briefs/WP-U133-practicas-c8-c9.md](REPORTES/briefs/WP-U133-practicas-c8-c9.md).
  Rama `wp/u133-practicas-c8-c9`. Portar de `00-NOTA` §(B): C8 (comando
  copiable = canal verificado) + C9 (listas manuales = rot; generar /
  link / caducidad); valorar auditoría CANTERA/01 como práctica o gate.
  **CA:** texto en PRACTICAS; greps/criterio citables por workers futuros.
  **Demolición:** N/A (gobernanza).

### (C) Higiene plan/ — archivar handoffs

#### WP-U134 · Archivar ENTREGA-* + regla handoffs — 🔶

- 🔶 **WP-U134 · Mover ENTREGA-* de raíz plan/ + regla de archivo** —
  en curso (orquestador / 2026-07-19). Brief:
  [REPORTES/briefs/WP-U134-archivar-entregas.md](REPORTES/briefs/WP-U134-archivar-entregas.md).
  Rama `wp/u134-archivar-entregas`. Mover
  `ENTREGA-2026-07-18c.md`, `ENTREGA-2026-07-18d-sprint1.md`,
  `ENTREGA-2026-07-19-sprint2/` → `plan/REPORTES/entregas/` (patrón
  HISTORICO); actualizar links BACKLOG/DECISIONES; regla en
  `plan/roles/ORQUESTADOR.md` (no tocar PRACTICAS — U133). **CA:**
  `ls plan/` = solo canónicos; cero links rotos a ENTREGA. **Demolición:**
  ENTREGA-* en raíz de `plan/`.

---

## Sprint 2 — ADDENDA + CAPA (GO · 2026-07-19 · D-25) — ✅

Fuente canónica:
[00-ADDENDA.md](ENTREGA-2026-07-19-sprint2/00-ADDENDA.md) +
[01-PAQUETE-CAPA.md](ENTREGA-2026-07-19-sprint2/01-PAQUETE-CAPA.md)
([00-INDICE.md](ENTREGA-2026-07-19-sprint2/00-INDICE.md)).
Paquete marketing WEBS/ENTREGA-SPRINT2 →
[SUPERADA-marketing-webs-sprint2/](ENTREGA-2026-07-19-sprint2/SUPERADA-marketing-webs-sprint2/)
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
  [02-ACTA-CIERRE.md](ENTREGA-2026-07-19-sprint2/02-ACTA-CIERRE.md) estrena
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

Fuente: [ENTREGA-2026-07-18d-sprint1.md](ENTREGA-2026-07-18d-sprint1.md).
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
- (U125) nav/sidebar library sin entrada `solve-coagula` — ficha reachable
  por card de portada; CAPA no pedía nav (candidato micro)
- (U131) VitePress en worktree Windows: path largo falla dead-links; library
  no gitignorea `docs/.vitepress/cache/` (zeus sí) — candidato higiene
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
