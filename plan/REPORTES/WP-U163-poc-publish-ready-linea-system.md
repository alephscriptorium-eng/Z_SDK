# WP-U163 · poc-publish-ready-linea-system — reporte

| dato | valor |
| ---- | ----- |
| agente | Worker-U163 |
| fecha | 2026-07-24 |
| rama | `wp/u163-poc-publish-ready-linea-system` |
| commits | `1818180` (feat) · _(docs = este reporte)_ |
| eje(s) CA | IV (plantilla P0 como contrato; segundo cliente = U164) |
| estado propuesto | listo para revisión |
| DC | DC-15 LOCAL-ONLY |

## Qué se hizo

POC publish-ready medible de `@zeus/linea-system` (P0 allowlist) **sin**
flip de `private`, **sin** `npm publish`, **sin** changeset de release y
**sin** tocar workflows:

1. Añadido `publishConfig.registry` =
   `https://npm.scriptorium.escrivivir.co` (mismo valor que `.npmrc`
   `@zeus:registry`).
2. Añadido `files: ["src"]` — tarball dry-run sin `test/`, fixtures ni
   `node_modules`.
3. Pineadas deps productivas `@zeus/*` a semver exacto resoluble en
   registry (`npm view`): `http-contract@0.1.3`, `linea-kit@0.3.0`,
   `presets-sdk@0.1.3`. DevDep `@zeus/test-utils` pineada a `0.1.3`
   (también `latest` en registry).
4. Decisión **JS-only** documentada: el paquete es ESM `.mjs`; se
   mantienen `exports` (`.` → `src/index.mjs`, `./loader` →
   `src/loader.mjs`); **no** se añade campo `types` ni `.d.ts`.
5. Checklist §5 de `plan/PUBLISH-ALLOWLIST.md` evidenciado abajo; ítems
   5–6 (changeset/release + C8 install externo) quedan fuera de frontera
   dura de este WP → `<pendiente>` GO de publish / WPs posteriores.

## Archivos tocados

- `packages/mesh/linea-system/package.json` — modificado: `publishConfig`,
  `files`, pines `@zeus/*` (prod + dev); `private: true` intacto
- `plan/REPORTES/WP-U163-poc-publish-ready-linea-system.md` — creado
  (este reporte)

**No tocados:** `plan/BACKLOG.md`, `.changeset/**` de release,
`.github/workflows/*`, otros P0/P1, flip `private`, `npm publish`.

## Evidencia

> No inventes observaciones. Salida literal o `⏳ sin verificar`.

### `npm view` — versiones registry (justificación de pines)

```
$ REGISTRY=https://npm.scriptorium.escrivivir.co

$ npm view @zeus/http-contract version --registry "$REGISTRY"
0.1.3

$ npm view @zeus/linea-kit version --registry "$REGISTRY"
0.3.0

$ npm view @zeus/presets-sdk version --registry "$REGISTRY"
0.1.3

$ npm view @zeus/test-utils version --registry "$REGISTRY"
0.1.3
```

Pines aplicados (exactos, alineados a `latest` del registry canónico):

| dep | rango previo | pine | rol |
| --- | ------------ | ---- | --- |
| `@zeus/http-contract` | `*` | `0.1.3` | dependencies |
| `@zeus/linea-kit` | `*` | `0.3.0` | dependencies |
| `@zeus/presets-sdk` | `*` | `0.1.3` | dependencies |
| `@zeus/test-utils` | `*` | `0.1.3` | devDependencies |

### `npm pack --dry-run` (sin publish)

```
$ npm pack --dry-run -w @zeus/linea-system

npm notice 📦  @zeus/linea-system@0.1.0
npm notice Tarball Contents
npm notice 915B package.json
npm notice 2.6kB src/cache-wikitext.mjs
npm notice 88B src/index.mjs
npm notice 24.6kB src/linea-server.mjs
npm notice 803B src/lineas.mjs
npm notice 1.8kB src/loader.mjs
npm notice 3.2kB src/logic.mjs
npm notice 1.6kB src/start.mjs
npm notice Tarball Details
npm notice name: @zeus/linea-system
npm notice version: 0.1.0
npm notice filename: zeus-linea-system-0.1.0.tgz
npm notice package size: 9.3 kB
npm notice unpacked size: 35.6 kB
npm notice total files: 8
```

Antes (U162): 11 entradas, incluía `test/helpers/live-volumes.mjs`,
`test/resource-contract.test.mjs`, `test/smoke.mjs`. Ahora: 8 entradas =
`package.json` + 7 × `src/*.mjs`. Cero `test/`, cero fixtures, cero
`node_modules`, cero secretos.

### `private` intacto · cero changesets · cero publish

```
$ node -e "console.log(require('./packages/mesh/linea-system/package.json').private)"
true

$ git status --short .changeset/
(sin salida — ningún changeset nuevo de este WP)

$ git diff --name-only
packages/mesh/linea-system/package.json
plan/REPORTES/WP-U163-poc-publish-ready-linea-system.md
```

No se ejecutó `npm publish`. No se editó `release.yml`.

### Gates

```
$ npm run gates

> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs

gates: OK (0 offenders)
```

### Checklist PUBLISH-ALLOWLIST §5

| # | condición | estado U163 |
| - | --------- | ----------- |
| 1 | `publishConfig.registry` = registry `.npmrc` | ✅ `https://npm.scriptorium.escrivivir.co` |
| 2 | `files` explícito; tarball sin tests/secretos/`node_modules` | ✅ `files: ["src"]`; dry-run 8 files |
| 3 | `exports` / `types` o decisión JS-only | ✅ **JS-only** (exports `.mjs`; sin `types`) |
| 4 | deps `@zeus/*` pineadas (no `*`) resolubles en registry | ✅ ver tabla `npm view` |
| 5 | changeset + relevancia en workflow release | `<pendiente>` — frontera dura U163: **no** changeset de pub / **no** edit `release.yml` (GO publish aparte) |
| 6 | C8: install consumidor = registry, no tarball workspace | `<pendiente>` — requiere publish real + GO; paquete sigue `private: true` |

### Decisión types / JS-only

El árbol del paquete es solo `src/*.mjs` + `test/*.mjs`. No existen
`.d.ts` ni build TypeScript. Se conserva el mapa `exports` ya usado por
consumidores workspace (`.` y `./loader`) apuntando a fuentes ESM.
**No** se introduce `types` ni dual package hasta un WP que aporte
declaraciones reales. Plantilla para U164: si el P0 hermano es `.mjs`
sin types → misma decisión JS-only + documentar en su reporte.

### Eje IV — segundo consumidor

Este WP fija la **plantilla medible** P0. El segundo cliente independiente
del contrato publish-ready es **U164** (replicar en
`linea-firehose`, `force-system`, `ssb-system`) — programado como WP
siguiente, no como feature tardía. U163 no toca esos paquetes
(frontera dura).

## Plantilla reproducible para U164

Aplicar en cada P0 restante (`@zeus/linea-firehose`, `@zeus/force-system`,
`@zeus/ssb-system`) el mismo checklist, cwd worktree del WP:

1. En `package.json` del candidato:
   - `publishConfig.registry` =
     `https://npm.scriptorium.escrivivir.co` (leer de `.npmrc`
     `@zeus:registry`)
   - `files` explícito: incluir solo runtime (`src` y, si aplica,
     assets públicos); **excluir** `test/`, `fixtures/`, `node_modules`
   - Pinear cada `@zeus/*` en `dependencies` (y `devDependencies` si se
     desea) a `npm view <pkg> version --registry <registry>`
   - Mantener `"private": true`
   - Documentar JS-only **o** añadir `types`/`exports` tipados si el
     paquete ya tiene `.d.ts`
2. Evidencia obligatoria:
   ```
   npm pack --dry-run -w <name>
   ```
   Verificar: cero paths `test/` / `fixtures/` / `node_modules` en
   «Tarball Contents».
3. Fronteras: no `npm publish`, no `.changeset/**` de release, no
   `release.yml`, no flip `private`, no tocar otros candidatos.
4. Gates si el diff toca código/manifest de paquete: `npm run gates`.
5. Especial ssb-system (nota U162): asegurar que `files` excluye
   `fixtures/` además de `test/`.

Referencia manifest post-U163: `packages/mesh/linea-system/package.json`.

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`:
      `packages/mesh/linea-system/**` + reporte
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia
- [x] Sellos con fuente; rutas citadas existentes (allowlist §5, U162,
      `.npmrc`)
- [x] Sin fluff; §5.5–5.6 marcados `<pendiente>` (no afirmados)
- [x] Eje IV: plantilla + U164 citado como segundo cliente
- [x] Gates ejecutados de verdad: `gates: OK (0 offenders)`
- [x] Commits convencionales
- [x] Diff solo del alcance del WP; `private: true` intacto; cero
      changesets de pub; cero publish

## Hallazgos fuera de alcance

- §5.5–5.6 (changeset + wire en `release.yml` + C8 install externo)
  requieren GO de publish / WP dedicado — no autorizados aquí.
- U164 puede reutilizar el script `audit:publish-allowlist --measure`
  (U162) como sensor de regresión tras replicar pines/`files`.

## Dudas / bloqueos

Ninguno para cerrar U163. Pines alineados a `latest` del registry al
momento de la evidencia; si el registry bumba antes de U164, re-correr
`npm view` y ajustar.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con lista numerada)_
