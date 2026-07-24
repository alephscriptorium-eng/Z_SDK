# Contrarrevisión independiente — WP-U168

| dato | valor |
| ---- | ----- |
| WP | WP-U168 · Migrar P0×4 a major-band |
| rama | `wp/u168-major-band-p0` |
| tip revisado | `e6261889130ccb17202d84ede8935170b79189bc` |
| worktree | `C:\S_LAB\.worktrees\z\wp-u168-major-band-p0` |
| revisor | contrarrevisión independiente (read-only) |
| fecha | 2026-07-25 |
| veredicto | **PASS** |

## Entrada recibida

1. Brief `plan/REPORTES/briefs/WP-U168-major-band-p0.md` con `RIESGO_REVISION=independiente`, rama, worktree, reporte y `ALCANCE_DIFF` — **OK**.
2. Reporte worker `plan/REPORTES/WP-U168-major-band-p0.md` presente en la rama — **OK**.
3. Base de diff `main...HEAD` acordada — **OK** (`git diff main...HEAD --stat` → 7 archivos).

## Checklist (intentar refutar)

### 1. Falsos negativos (gate rojo mal interpretado)

**Resultado: no refutado — FAIL esperado pre-U169.**

```text
$ cd C:/S_LAB/.worktrees/z/wp-u168-major-band-p0
$ npm run gate:publish-ready
FAIL @zeus/linea-system
  - dependencies.@zeus/http-contract=>=0.1.3 <1.0.0; expected exact registry semver pin (...)
  … (idem linea-firehose, force-system, ssb-system)
gate:publish-ready: FAIL (14 violations)
```

El brief prohíbe editar `scripts/gate-publish-ready.mjs` (dueño U169). El sensor actual exige pin exacto; las 14 violaciones corresponden 1:1 a deps `@zeus/*` migradas a major-band en P0×4. No es falso negativo de alcance U168.

Evidencia gate intacto:

```text
$ git diff main...HEAD -- scripts/gate-publish-ready.mjs
(sin salida)
```

### 2. Deps `@zeus/*` — sin `*`, tags, git, url, paths, aliases, `^0.m.p`

**Resultado: no refutado — 14/14 deps en P0×4 cumplen banda `>=M.m.p <(M+1).0.0`.**

Probe manifest+lock (script Node sobre los cuatro P0):

```text
linea-system @zeus/http-contract >=0.1.3 <1.0.0 manifest_ok=true lock_match=true
linea-system @zeus/linea-kit >=0.3.0 <1.0.0 manifest_ok=true lock_match=true
linea-system @zeus/presets-sdk >=0.1.3 <1.0.0 manifest_ok=true lock_match=true
linea-system @zeus/test-utils >=0.1.3 <1.0.0 manifest_ok=true lock_match=true
linea-firehose @zeus/firehose-core >=0.1.3 <1.0.0 manifest_ok=true lock_match=true
linea-firehose @zeus/presets-sdk >=0.1.3 <1.0.0 manifest_ok=true lock_match=true
linea-firehose @zeus/test-utils >=0.1.3 <1.0.0 manifest_ok=true lock_match=true
force-system @zeus/http-contract >=0.1.3 <1.0.0 manifest_ok=true lock_match=true
force-system @zeus/linea-kit >=0.3.0 <1.0.0 manifest_ok=true lock_match=true
force-system @zeus/presets-sdk >=0.1.3 <1.0.0 manifest_ok=true lock_match=true
force-system @zeus/test-utils >=0.1.3 <1.0.0 manifest_ok=true lock_match=true
ssb-system @zeus/linea-kit >=0.3.0 <1.0.0 manifest_ok=true lock_match=true
ssb-system @zeus/presets-sdk >=0.1.3 <1.0.0 manifest_ok=true lock_match=true
ssb-system @zeus/test-utils >=0.1.3 <1.0.0 manifest_ok=true lock_match=true
```

Búsqueda adversarial `*`, `git:`, `file:`, `workspace:`, `^0.`, tags — **0 coincidencias** en los cuatro `package.json` P0.

### 3. Mínimos existentes en registry `https://npm.scriptorium.escrivivir.co`

**Resultado: no refutado — los cinco mínimos resuelven.**

```text
$ REG=https://npm.scriptorium.escrivivir.co
$ npm view @zeus/http-contract@0.1.3 version --registry $REG  → 0.1.3
$ npm view @zeus/linea-kit@0.3.0 version --registry $REG       → 0.3.0
$ npm view @zeus/presets-sdk@0.1.3 version --registry $REG    → 0.1.3
$ npm view @zeus/firehose-core@0.1.3 version --registry $REG  → 0.1.3
$ npm view @zeus/test-utils@0.1.3 version --registry $REG     → 0.1.3
```

### 4. Lock coherente con manifests

**Resultado: no refutado.**

`git diff main...HEAD` toca solo entradas `packages/mesh/{linea-system,linea-firehose,force-system,ssb-system}` en `package-lock.json`; specs lock = specs manifest en las 14 deps `@zeus/*` (probe §2).

### 5. Fronteras publish — `private`, changesets, gate, publish

**Resultado: no refutado.**

```text
$ node -e "…" (×4)
linea-system private=true
linea-firehose private=true
force-system private=true
ssb-system private=true

$ git diff main...HEAD -- .changeset/
(sin salida)
```

`npm pack --dry-run` ×4 OK (reproducido):

```text
zeus-linea-system-0.1.0.tgz   (8 files)
zeus-linea-firehose-0.1.0.tgz (6 files)
zeus-force-system-0.1.0.tgz   (8 files)
zeus-ssb-system-0.1.0.tgz     (11 files)
```

Allowlist §5 ítem 4 actualizado a criterio major-band (literal en diff):

```text
4. deps internas `@zeus/*` en banda major `>=M.m.p <(M+1).0.0` (rechazo de
   `*`, tags, Git/URL, aliases y rutas locales); mínimo `M.m.p` y versión
   resuelta existen en registry.
```

### 6. Alcance ⊆ `ALCANCE_DIFF`

**Resultado: no refutado.**

```text
$ git diff main...HEAD --name-only
package-lock.json
packages/mesh/force-system/package.json
packages/mesh/linea-firehose/package.json
packages/mesh/linea-system/package.json
packages/mesh/ssb-system/package.json
plan/PUBLISH-ALLOWLIST.md
plan/REPORTES/WP-U168-major-band-p0.md
```

Sin tocar `plan/BACKLOG.md`, gate, flip `private`, changesets de pub, ni paquetes fuera de P0×4.

### 7. Consecuencia major `0` documentada

**Resultado: no refutado.** Reporte § «Consecuencia major `0`» documenta que `>=0.m.p <1.0.0` permite saltos minor dentro de `0.x`; no se usó `^0.m.p`.

## Veredicto

**PASS** — No se refutaron los CA del brief con la evidencia ejecutada. El gate `publish-ready` en ROJO es consecuencia esperada hasta U169; no bloquea PASS de U168.

`PASS` no autoriza ✅ ni merge.
