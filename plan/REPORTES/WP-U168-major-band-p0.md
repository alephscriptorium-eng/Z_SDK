# WP-U168 · major-band-p0 — reporte

| dato | valor |
| ---- | ----- |
| agente | worker-U168 |
| fecha | 2026-07-25 |
| rama | `wp/u168-major-band-p0` |
| commits | `e626188` |
| eje(s) CA | IV |
| riesgo de revisión | `independiente` |
| revisor distinto del worker | `sí` |
| estado propuesto | listo para contrarrevisión |
| DC | DC-15 LOCAL-ONLY |

## Qué se hizo

Migración de deps internas `@zeus/*` en P0×4
(`linea-system` · `linea-firehose` · `force-system` · `ssb-system`) de
pines exactos a banda major `>=M.m.p <(M+1).0.0`, con mínimo = versión
registry ya justificada en U163/U164. Allowlist §5 actualizada al
criterio major-band. `package-lock.json` alineado en el mismo WP.
`private: true` intacto. Gate `publish-ready` **no** editado (dueño U169);
queda ROJO hasta Ola B (esperado).

## Archivos tocados

- `packages/mesh/linea-system/package.json` — `@zeus/*` → major-band
- `packages/mesh/linea-firehose/package.json` — ídem
- `packages/mesh/force-system/package.json` — ídem
- `packages/mesh/ssb-system/package.json` — ídem
- `plan/PUBLISH-ALLOWLIST.md` — §5 criterio major-band
- `package-lock.json` — coherente con manifests (14 líneas de rango)
- `plan/REPORTES/WP-U168-major-band-p0.md` — este reporte

**No tocados:** `scripts/gate-publish-ready.mjs`, flip `private`,
`.changeset/**` de pub, `npm publish`, U165, R13.

## Rangos aplicados (mínimo = registry)

| paquete | deps `@zeus/*` (prod+dev) |
| ------- | ------------------------- |
| `@zeus/linea-system` | http-contract `>=0.1.3 <1.0.0` · linea-kit `>=0.3.0 <1.0.0` · presets-sdk `>=0.1.3 <1.0.0` · test-utils `>=0.1.3 <1.0.0` |
| `@zeus/linea-firehose` | firehose-core `>=0.1.3 <1.0.0` · presets-sdk `>=0.1.3 <1.0.0` · test-utils `>=0.1.3 <1.0.0` |
| `@zeus/force-system` | http-contract `>=0.1.3 <1.0.0` · linea-kit `>=0.3.0 <1.0.0` · presets-sdk `>=0.1.3 <1.0.0` · test-utils `>=0.1.3 <1.0.0` |
| `@zeus/ssb-system` | linea-kit `>=0.3.0 <1.0.0` · presets-sdk `>=0.1.3 <1.0.0` · test-utils `>=0.1.3 <1.0.0` |

## Consecuencia major `0`

Todos los mínimos están en major `0`. La banda `>=0.m.p <1.0.0`
**permite** saltos de minor dentro de `0.x` (SemVer: pueden romper).
No se usó `^0.m.p` (que fijaría también la minor). Integración
demostrada con tests automatizados en 3/4 P0 (linea-system skip por
corpus ausente en worktree) + install limpia desde registry.

## Evidencia

### Preflight identidad

```text
$ WORLD_ROOT=C:/S_LAB/z-sdk CANONICAL_WORLD_ROOT=C:/S_LAB/z-sdk \
  READ_ONLY_ROOTS='["C:/S_LAB/.worktrees"]' DOWNSTREAM_PATTERNS='[".worktrees/*"]' \
  node .claude/skills/vigilancia/scripts/verificar-identidad-raiz.mjs
identidad-raiz: PASS
world-real: c:/s_lab/z-sdk
git-toplevel: c:/s_lab/z-sdk
```

### Gates repo

```text
$ npm run gates
gates: OK (0 offenders)
```

### Registry (mínimos y rangos)

```text
$ REG=https://npm.scriptorium.escrivivir.co
$ npm view @zeus/http-contract version --registry $REG           → 0.1.3
$ npm view @zeus/linea-kit version --registry $REG               → 0.3.0
$ npm view @zeus/presets-sdk version --registry $REG               → 0.1.3
$ npm view @zeus/firehose-core version --registry $REG             → 0.1.3
$ npm view @zeus/test-utils version --registry $REG                → 0.1.3
$ npm view "@zeus/presets-sdk@>=0.1.3 <1.0.0" version --registry $REG → 0.1.3
```

### Install limpia (C8 · temp dir)

```text
$ npm install "@zeus/presets-sdk@>=0.1.3 <1.0.0" \
    --registry=https://npm.scriptorium.escrivivir.co --no-package-lock
added 186 packages …
installed: @zeus/presets-sdk 0.1.3
```

### Lock coherente

```text
$ git diff --stat package-lock.json
 package-lock.json | 28 ++++++++++++++--------------
 1 file changed, 14 insertions(+), 14 deletions(-)
```

### `npm pack --dry-run` ×4

| paquete | files | tarball |
| ------- | ----- | ------- |
| linea-system | 8 | zeus-linea-system-0.1.0.tgz |
| linea-firehose | 6 | zeus-linea-firehose-0.1.0.tgz |
| force-system | 8 | zeus-force-system-0.1.0.tgz |
| ssb-system | 11 | zeus-ssb-system-0.1.0.tgz |

### Tests integración P0×4

```text
$ npm test -w @zeus/linea-system    → 2 skipped (corpus live ausente; esperado worktree)
$ npm test -w @zeus/linea-firehose  → 1 pass
$ npm test -w @zeus/force-system    → 2 pass
$ npm test -w @zeus/ssb-system      → 4 pass
```

### Gate publish-ready (pre-U169 · esperado FAIL)

```text
$ npm run gate:publish-ready
… FAIL @zeus/linea-system … expected exact registry semver pin …
… (14 violations)
gate:publish-ready: FAIL (14 violations)
```

U169 adaptará el sensor a major-band.

### Fronteras

- `private: true` ×4 intacto
- cero `npm publish`
- cero changesets de pub
- cero edición de `scripts/gate-publish-ready.mjs`

## Evidencia de riesgo y contrarrevisión

- `CASOS_ADVERSARIALES`:
  - `[automatizado]` gate publish-ready rechaza rangos major-band (14
    violaciones) — esperado pre-U169; sensor aún exige pin exacto.
  - `[automatizado]` `npm run gates` → OK (0 offenders).
  - `[manual]` inspección manifests: sin `*`, tags, git/url ni paths en
    deps `@zeus/*` de P0×4.
- `DEPENDENCIAS_DIRECTAS_VERIFICADAS`: cinco paquetes `@zeus/*`
  referenciados (http-contract, linea-kit, presets-sdk, firehose-core,
  test-utils); mínimos y rangos resueltos en registry canónico.
- `INSTALACION_LIMPIA`: `npm install "@zeus/presets-sdk@>=0.1.3 <1.0.0"`
  en temp dir → `0.1.3` desde registry; `npm install` en monorepo → lock
  coherente (workspace links en dev; rangos en manifests).
- `TEST_AUTOMATIZADO_VS_EVIDENCIA_MANUAL`:
  - Automatizado: `npm test` ×4 P0; `npm run gates`; `npm run
    gate:publish-ready` (FAIL esperado).
  - Manual: revisión §5 allowlist; verificación `private: true` ×4.
- `VEREDICTO_REVISOR`: `⏳ pendiente de revisor distinto`

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: manifests P0×4, allowlist §5,
  lock, reporte.
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia.
- [x] Sellos con fuente; rutas citadas existentes.
- [x] Sin fluff ni promesa de futuro sin `<pendiente>`: gate U169
  pendiente explícito.
- [x] Eje IV evidenciado: semver major-band + allowlist + lock.
- [x] Gates ejecutados: `gates` OK; `gate:publish-ready` FAIL esperado.
- [x] Commits convencionales: `feat(mesh): migrar P0×4 a major-band semver (U168)`.
- [x] Diff solo del alcance del WP.
- [x] Riesgo y contraevidencia del brief cubiertos.
- [x] Pruebas automatizadas separadas de evidencia manual.

## Hallazgos fuera de alcance

- `gate:publish-ready` requiere adaptación major-band (U169).
- `linea-system` tests skip en worktree sin corpus live (preexistente).

## Dudas / bloqueos

Ninguno.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con lista numerada)_
