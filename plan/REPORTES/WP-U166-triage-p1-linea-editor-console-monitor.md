# WP-U166 · triage-p1-linea-editor-console-monitor — reporte

| dato | valor |
| ---- | ----- |
| agente | worker swarm (WP-U166) |
| fecha | 2026-07-24 |
| rama | `wp/u166-triage-p1-linea-editor-console-monitor` |
| commits | `b3d99b7` · `8dfb9ce` |
| eje(s) CA | IV |
| estado propuesto | listo para revisión |
| DC | DC-15 LOCAL-ONLY |

## Qué se hizo

Triage P1 (excepto blobstore → U167 ✅) con **dos decisiones distintas**:

1. **`@zeus/console-monitor` → mantener privado** (vía B / democión,
   patrón U167). Producto clase **D** (TUI TOP + MCP de estación)
   acoplado a `@zeus/player-ui` `/deck-io` (mantener privado / E404).
   Gap `exports` (**null**; solo `main`) documentado y **no** cerrado:
   no se añaden `exports` a un paquete que sale de §3. Enmienda
   allowlist §3/§4 + `CANDIDATES.P1` en el audit (posesión U166).
2. **`@zeus/linea-editor` → sigue candidato** clase **C**. API
   exportada (5 subpaths) — hermano mutación de `@zeus/linea-system`
   (P0), no app `packages/editor/*` (clase F). Checklist §5 **medido**
   sin flip `private` ni publish-ready completo (gaps → WP futuro /
   GO).

Desviación de alcance nominal: además de `plan/PUBLISH-ALLOWLIST.md`,
se actualizó `scripts/audit-publish-allowlist.mjs` (`CANDIDATES.P1`)
porque el CA exige inventario/`audit:publish-allowlist` coherente con
§3 (mismo precedente U167).

No se tocó código de `packages/mesh/{console-monitor,linea-editor}/**`
(vía B + medición). Cero publish, cero changesets de publicación,
`"private": true` intacto en ambos. Cero P0, cero blobstore, cero
gate U165, cero BACKLOG, cero merge main.

## Tabla de decisión

| paquete | decisión | clase | justificación breve | enmienda |
| ------- | -------- | ----- | ------------------- | -------- |
| `@zeus/console-monitor` | **mantener privado** | D (no C) | Monitor/TUI de estación; runtime exige origin `player-ui` (privado E404); sin `exports`; pack incluye `test/` | §3 fuera + §4 democión U166 + audit P1 |
| `@zeus/linea-editor` | **sigue candidato** | C | `exports` (`.` / `gate` / `export` / `horse-preset` / `tools`); MCP gated authorship; deps `@zeus/*` resolubles en registry; no es `packages/editor/*` | ninguna (permanece §3 P1) |

## Archivos tocados

- `plan/PUBLISH-ALLOWLIST.md` — modificado: quitado
  `@zeus/console-monitor` de §3 P1; §4 democión documentada WP-U166.
- `scripts/audit-publish-allowlist.mjs` — modificado: `CANDIDATES.P1`
  = solo `@zeus/linea-editor`.
- `plan/REPORTES/WP-U166-triage-p1-linea-editor-console-monitor.md` —
  creado: este reporte.

**No tocados:** `packages/mesh/console-monitor/**`,
`packages/mesh/linea-editor/**` (código), `plan/BACKLOG.md`,
`.changeset/**` de release, `.github/workflows/*`, P0, blobstore,
gate U165, flip `private`, `npm publish`.

## Evidencia

> No inventes observaciones. Salida literal o `⏳ sin verificar`.

### Naturaleza producto (triage)

**console-monitor** — acoplamiento a player-ui privado:

```
packages/mesh/console-monitor/package.json
  description: "TOP-style console monitor + MCP server for @zeus/player-ui Tablero ALEPH sessions"
  main: src/index.mjs
  exports: <ausente>
  private: true

packages/mesh/console-monitor/src/client.mjs
  createSessionClient → baseUrl (player-ui) required
  deckPath default `/deck-io`

packages/mesh/player-ui/package.json → "private": true
$ npm view @zeus/player-ui version --registry https://npm.scriptorium.escrivivir.co
→ E404
```

**linea-editor** — API exportada (no app editor clase F):

```
packages/mesh/linea-editor/package.json
  exports: {
    ".": "./src/index.mjs",
    "./gate": "./src/gate.mjs",
    "./export": "./src/export-story-board.mjs",
    "./horse-preset": "./src/horse-preset.mjs",
    "./tools": "./src/tools.mjs"
  }
  private: true
  dependencies @zeus/*: http-contract, linea-kit, presets-sdk, story-board-schema (todos `*`)

README: "Sibling of linea-system (read): this pack mutates…"
mcp-launcher catalog notes: "Gated authorship MCP; sibling of linea-system (read)"
path: packages/mesh/linea-editor  (≠ packages/editor/* → clase F)
```

### `npm view` deps linea-editor (registry canónico)

```
$ REGISTRY=https://npm.scriptorium.escrivivir.co
$ npm view @zeus/http-contract version --registry "$REGISTRY" → 0.1.3
$ npm view @zeus/linea-kit version --registry "$REGISTRY" → 0.3.0
$ npm view @zeus/presets-sdk version --registry "$REGISTRY" → 0.1.3
$ npm view @zeus/story-board-schema version --registry "$REGISTRY" → 0.2.0
$ npm view @zeus/test-utils version --registry "$REGISTRY" → 0.1.3
```

### `npm pack --dry-run` (sin publish)

```
$ npm pack -w @zeus/console-monitor --dry-run
→ zeus-console-monitor-0.1.0.tgz · total files: 18
  incluye: test/servers.mjs, test/session-wait.mjs, test/smoke.mjs
  (sin publishConfig / sin files / sin exports)

$ npm pack -w @zeus/linea-editor --dry-run
→ zeus-linea-editor-0.1.0.tgz · total files: 12
  incluye: test/gates-ceguera.test.mjs, test/slice-e2e.test.mjs
  (sin publishConfig / sin files; exports presentes)
```

### Checklist §5 — `@zeus/linea-editor` (sigue candidato; medido)

| # | condición | resultado |
| - | --------- | --------- |
| 1 | `publishConfig.registry` = registry `.npmrc` | **no** — `null` |
| 2 | `files` explícito; tarball sin tests/secretos | **no** — `files: null`; pack 12 entries con `test/` |
| 3 | `exports` / `types` o JS-only documentado | **exports sí** (5 subpaths); `types: null` → decisión JS-only alineable a U163 (`<pendiente>` WP publish-ready) |
| 4 | deps `@zeus/*` semver pineado ≠ `*` | **no** — todas `*` (resolubles en registry; pines = WP futuro) |
| 5 | changeset + relevancia release | **no** — cero changeset pendiente; **no** está en matrix `release.yml` (sí aparece `console-monitor` en matrix de test — hallazgo fuera) |
| 6 | C8 install consumidor = registry | deps productivas OK en registry; paquete mismo E404 hasta GO publish (`<pendiente>`) |

**No** se propone publish-ready en este WP: solo triage + medición.
Publish-ready de `linea-editor` = WP derivado + GO (`<pendiente>`).

### Gap `exports` — `@zeus/console-monitor`

```
exports: null  (solo main: src/index.mjs)
plan: no añadir exports aquí — democión a «mantener privado» (clase D).
Re-evaluación: enmienda §3 + API desacoplada de player-ui + WP
publish-ready + GO (`<pendiente>`).
```

### Diff allowlist (§3 / §4)

- §3 P1: queda solo `@zeus/linea-editor`.
- §4: tabla «Democión documentada (WP-U166)» para
  `@zeus/console-monitor`.

### Inventario / audit coherente (Eje IV — segundo consumidor)

```
$ npm run audit:publish-allowlist
audit:publish-allowlist (WP-U162)
registry: https://npm.scriptorium.escrivivir.co
packages/** package.json files: 49
unique package names: 49
allowlist candidatos: 5 (P0=4 P1=1)

@zeus/console-monitor	mantener privado		true	0.1.0	E404	packages/mesh/console-monitor/package.json
@zeus/linea-editor	candidato	P1	true	0.1.0	E404	packages/mesh/linea-editor/package.json

--- summary ---
total_unique: 49
ya_publicado: 29
candidato: 5
mantener_privado: 15

--- candidatos (allowlist §3, no publicados) ---
@zeus/force-system	P0	…
@zeus/linea-editor	P1	…
@zeus/linea-firehose	P0	…
@zeus/linea-system	P0	…
@zeus/ssb-system	P0	…
(exit 0)
```

Antes (post-U167): candidatos 6 (P0=4 P1=2), `console-monitor` =
candidato P1; `mantener_privado` = 14. Después: +1 privado, −1
candidato; P1 = solo `linea-editor`.

### Frontera dura

```
packages/mesh/console-monitor/package.json → "private": true (intacto)
packages/mesh/linea-editor/package.json → "private": true (intacto)
ls .changeset/ → solo config.json + README.md (cero changesets de pub)
npm publish → no ejecutado
```

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: allowlist + audit + reporte;
      sin código de paquetes (vía B + medición).
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia: N/A.
- [x] Sellos con fuente; rutas citadas existentes: U162 / U167 /
      allowlist §1 D / player-ui privado.
- [x] Sin fluff ni promesa de futuro sin `<pendiente>`: publish-ready
      linea-editor y re-listado console-monitor marcados `<pendiente>`.
- [x] Eje(s) aplicables evidenciado(s): IV — allowlist + audit como
      segundo consumidor; checklist §5 medido para candidato restante.
- [x] Gates ejecutados de verdad: `audit:publish-allowlist` exit 0;
      `npm pack --dry-run` ×2; `npm view` deps.
- [x] Commits convencionales: sí (rama worker).
- [x] Diff solo del alcance del WP: sin P0, sin blobstore, sin BACKLOG,
      sin merge main, sin flip private, sin gate U165.

## Hallazgos fuera de alcance

- `@zeus/console-monitor` sigue en la matrix de test de
  `.github/workflows/release.yml` (y `ci.yml`) pese a democión
  allowlist — coherencia workflow ≠ allowlist; candidato a higiene
  aparte (no tocado: fuera de ALCANCE_DIFF / U165 territory).
- Publish-ready de `@zeus/linea-editor` (plantilla U163: `publishConfig`,
  `files`, pines `@zeus/*`, JS-only) = WP futuro tras este triage
  (`<pendiente>`).
- `defaultLineasRoot` en `linea-editor/src/start.mjs` apunta a
  `VOLUMES/LINEAS` del monorepo (CLI); la API acepta `lineasRoot` —
  no bloquea candidatura C; posible nota ops en WP publish-ready.

## Dudas / bloqueos

Ninguno para cerrar U166. Listo para revisión.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con lista numerada)_
