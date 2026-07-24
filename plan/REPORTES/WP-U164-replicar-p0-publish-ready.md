# WP-U164 · replicar-p0-publish-ready — reporte

| dato | valor |
| ---- | ----- |
| agente | Worker-U164 |
| fecha | 2026-07-24 |
| rama | `wp/u164-replicar-p0-publish-ready` |
| commits | `89b2b5c` (feat) · `3d935bf` (docs) |
| eje(s) CA | IV (segundo cliente del contrato publish-ready U163) |
| estado propuesto | listo para revisión |
| DC | DC-15 LOCAL-ONLY |

## Qué se hizo

Replicación del checklist publish-ready U163 ×3 P0
(`@zeus/linea-firehose`, `@zeus/force-system`, `@zeus/ssb-system`)
**sin** flip de `private`, **sin** `npm publish`, **sin** changeset de
release, **sin** tocar `release.yml` / allowlist / U165 / P1 /
`linea-system` (salvo lectura):

1. Añadido `publishConfig.registry` =
   `https://npm.scriptorium.escrivivir.co` (mismo valor que `.npmrc`
   `@zeus:registry`) en los tres manifests.
2. Añadido `files: ["src"]` en los tres — tarball dry-run sin `test/`,
   `fixtures/` ni `node_modules`. npm sigue incluyendo `README.md` por
   defecto del packer cuando existe (force/ssb); no es test ni secreto.
3. Pineadas deps `@zeus/*` (prod + dev) a semver exacto via `npm view`
   contra el registry canónico (tabla abajo). Cero `*` restantes.
4. Decisión **JS-only** heredada de U163: los tres son ESM `.mjs` sin
   `.d.ts`; se mantienen `exports` existentes; **no** se añade `types`.
5. Checklist §5 evidenciado ×3; ítems 5–6 quedan `<pendiente>` (frontera
   dura / GO publish aparte).

## Archivos tocados

- `packages/mesh/linea-firehose/package.json` — modificado: `publishConfig`,
  `files`, pines `@zeus/*`; `private: true` intacto
- `packages/mesh/force-system/package.json` — ídem
- `packages/mesh/ssb-system/package.json` — ídem (excluye `fixtures/` +
  `test/` del tarball)
- `plan/REPORTES/WP-U164-replicar-p0-publish-ready.md` — creado
  (este reporte)

**No tocados:** `plan/BACKLOG.md`, `plan/PUBLISH-ALLOWLIST.md`,
`.changeset/**` de release, `.github/workflows/*`, flip `private`,
`npm publish`, P1, gate U165, `linea-system` (salvo lectura).

## Evidencia

> No inventes observaciones. Salida literal o `⏳ sin verificar`.

### `npm view` — versiones registry (justificación de pines)

```
$ REGISTRY=https://npm.scriptorium.escrivivir.co

$ npm view @zeus/firehose-core version --registry "$REGISTRY"
0.1.3

$ npm view @zeus/presets-sdk version --registry "$REGISTRY"
0.1.3

$ npm view @zeus/http-contract version --registry "$REGISTRY"
0.1.3

$ npm view @zeus/linea-kit version --registry "$REGISTRY"
0.3.0

$ npm view @zeus/test-utils version --registry "$REGISTRY"
0.1.3
```

Pines aplicados (exactos, alineados a `latest` del registry canónico):

| paquete | dep | rango previo | pine | rol |
| ------- | --- | ------------ | ---- | --- |
| linea-firehose | `@zeus/firehose-core` | `*` | `0.1.3` | dependencies |
| linea-firehose | `@zeus/presets-sdk` | `*` | `0.1.3` | dependencies |
| linea-firehose | `@zeus/test-utils` | `*` | `0.1.3` | devDependencies |
| force-system | `@zeus/http-contract` | `*` | `0.1.3` | dependencies |
| force-system | `@zeus/linea-kit` | `*` | `0.3.0` | dependencies |
| force-system | `@zeus/presets-sdk` | `*` | `0.1.3` | dependencies |
| force-system | `@zeus/test-utils` | `*` | `0.1.3` | devDependencies |
| ssb-system | `@zeus/linea-kit` | `*` | `0.3.0` | dependencies |
| ssb-system | `@zeus/presets-sdk` | `*` | `0.1.3` | dependencies |
| ssb-system | `@zeus/test-utils` | `*` | `0.1.3` | devDependencies |

### Baseline pack (antes) — tests/fixtures presentes

```
$ npm pack --dry-run -w @zeus/linea-firehose
… total files: 7 … (incluía test/smoke.mjs)

$ npm pack --dry-run -w @zeus/force-system
… total files: 9 … (incluía test/smoke.mjs + README)

$ npm pack --dry-run -w @zeus/ssb-system
… total files: 14 … (incluía fixtures/ssb-log.json + test/*.mjs + README)
```

### `npm pack --dry-run` post-cambio (sin publish)

```
$ npm pack --dry-run -w @zeus/linea-firehose

npm notice 📦  @zeus/linea-firehose@0.1.0
npm notice Tarball Contents
npm notice 1.0kB package.json
npm notice 434B src/config.mjs
npm notice 1.0kB src/firehose-server.mjs
npm notice 347B src/index.mjs
npm notice 13.2kB src/logic.mjs
npm notice 546B src/start.mjs
npm notice Tarball Details
npm notice name: @zeus/linea-firehose
npm notice version: 0.1.0
npm notice filename: zeus-linea-firehose-0.1.0.tgz
npm notice package size: 4.8 kB
npm notice unpacked size: 16.6 kB
npm notice total files: 6
```

```
$ npm pack --dry-run -w @zeus/force-system

npm notice 📦  @zeus/force-system@0.1.0
npm notice Tarball Contents
npm notice 1.1kB README.md
npm notice 930B package.json
npm notice 148B src/config.mjs
npm notice 5.3kB src/force-server.mjs
npm notice 182B src/index.mjs
npm notice 1.1kB src/loader.mjs
npm notice 3.1kB src/logic.mjs
npm notice 803B src/start.mjs
npm notice Tarball Details
npm notice name: @zeus/force-system
npm notice version: 0.1.0
npm notice filename: zeus-force-system-0.1.0.tgz
npm notice package size: 4.0 kB
npm notice unpacked size: 12.6 kB
npm notice total files: 8
```

```
$ npm pack --dry-run -w @zeus/ssb-system

npm notice 📦  @zeus/ssb-system@0.1.0
npm notice Tarball Contents
npm notice 1.9kB README.md
npm notice 969B package.json
npm notice 143B src/config.mjs
npm notice 6.2kB src/export.mjs
npm notice 612B src/index.mjs
npm notice 4.5kB src/loader.mjs
npm notice 7.1kB src/logic.mjs
npm notice 833B src/ssb-server.mjs
npm notice 757B src/start.mjs
npm notice 2.9kB src/sync-cli.mjs
npm notice 2.1kB src/types.mjs
npm notice Tarball Details
npm notice name: @zeus/ssb-system
npm notice version: 0.1.0
npm notice filename: zeus-ssb-system-0.1.0.tgz
npm notice package size: 8.3 kB
npm notice unpacked size: 28.2 kB
npm notice total files: 11
```

**ssb-system:** 0 paths `fixtures/` / `test/` en Tarball Contents
(verificado con `rg -i 'fixture|test/'` sobre la salida → sin match).

Resumen pack:

| paquete | files antes | files después | test/fixtures en tarball |
| ------- | ----------- | ------------- | ------------------------ |
| `@zeus/linea-firehose` | 7 | 6 | 0 (antes: `test/smoke.mjs`) |
| `@zeus/force-system` | 9 | 8 | 0 (antes: `test/smoke.mjs`; README queda por default npm) |
| `@zeus/ssb-system` | 14 | 11 | 0 (antes: `fixtures/ssb-log.json` + 2 tests; README default npm) |

### `private` intacto · cero changesets · cero publish

```
$ node -e "for (const p of ['linea-firehose','force-system','ssb-system']) { console.log(p, require('./packages/mesh/'+p+'/package.json').private) }"
linea-firehose true
force-system true
ssb-system true

$ git status --short .changeset/
(sin salida — ningún changeset nuevo de este WP)

$ git diff --name-only
packages/mesh/force-system/package.json
packages/mesh/linea-firehose/package.json
packages/mesh/ssb-system/package.json
```

(+ reporte bajo `plan/REPORTES/` al commit docs). No se ejecutó
`npm publish`. No se editó `release.yml` ni `PUBLISH-ALLOWLIST.md`.

### Gates

```
$ npm run gates

> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs

gates: OK (0 offenders)
```

### Checklist PUBLISH-ALLOWLIST §5 ×3

| # | condición | linea-firehose | force-system | ssb-system |
| - | --------- | -------------- | ------------ | ---------- |
| 1 | `publishConfig.registry` = registry `.npmrc` | ✅ | ✅ | ✅ |
| 2 | `files` explícito; tarball sin tests/secretos/`node_modules` | ✅ 6 files | ✅ 8 files (README default) | ✅ 11 files; **0 fixtures/tests** |
| 3 | `exports` / `types` o decisión JS-only | ✅ JS-only | ✅ JS-only | ✅ JS-only |
| 4 | deps `@zeus/*` pineadas (no `*`) resolubles | ✅ | ✅ | ✅ |
| 5 | changeset + relevancia en workflow release | `<pendiente>` — frontera dura: **no** changeset de pub / **no** edit `release.yml` | ídem | ídem |
| 6 | C8: install consumidor = registry | `<pendiente>` — requiere publish real + GO; siguen `private: true` | ídem | ídem |

### Decisión types / JS-only

Herencia explícita de la plantilla U163: los tres árboles son
`src/*.mjs` (+ `test/*.mjs` / `fixtures/` fuera de pack). No existen
`.d.ts` ni build TypeScript. Se conservan los mapas `exports` ya usados
por consumidores workspace. **No** se introduce `types` ni dual package
hasta un WP que aporte declaraciones reales. `ssb-system/src/types.mjs`
es runtime JS (schema/helpers), no TypeScript declarations.

### Eje IV — segundo consumidor del contrato U163

U163 fijó la plantilla medible P0. Este WP es el **segundo cliente
independiente**: aplica el mismo checklist a tres P0 hermanos sin tocar
`linea-system` ni ampliar allowlist.

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`:
      `packages/mesh/{linea-firehose,force-system,ssb-system}/**` + reporte
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia
- [x] Sellos con fuente; rutas citadas existentes (allowlist §5, U163,
      `.npmrc`, `npm view`)
- [x] Sin fluff; §5.5–5.6 marcados `<pendiente>` (no afirmados)
- [x] Eje IV: segundo cliente del contrato U163 evidenciado ×3
- [x] Gates ejecutados de verdad: `gates: OK (0 offenders)`
- [x] Commits convencionales
- [x] Diff solo del alcance del WP; `private: true` intacto ×3; cero
      changesets de pub; cero publish; cero edits allowlist/BACKLOG

## Hallazgos fuera de alcance

- §5.5–5.6 (changeset + wire en `release.yml` + C8 install externo)
  requieren GO de publish / WP dedicado — no autorizados aquí.
- npm pack incluye `README.md` por defecto aunque `files` solo liste
  `src` (force/ssb). Comportamiento del packer; no bloquea CA
  (cero tests/fixtures/secretos).
- U165 re-gate integrado tras merge U164+U166 — no tocado aquí.

## Dudas / bloqueos

Ninguno para cerrar U164. Pines alineados a `latest` del registry al
momento de la evidencia; si el registry bumba antes del merge, re-correr
`npm view` y ajustar.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con lista numerada)_
