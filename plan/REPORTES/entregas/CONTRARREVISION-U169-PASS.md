# Contrarrevisión independiente — WP-U169

| dato | valor |
| ---- | ----- |
| WP | WP-U169 · Adaptar gate publish-ready a major-band |
| rama | `wp/u169-gate-major-band` |
| tip revisado | `98f21bfde667191005a11ef9af61ae0cfecfb207` |
| worktree | `C:\S_LAB\.worktrees\z\wp-u169-gate-major-band` |
| revisor | contrarrevisión independiente (read-only) |
| fecha | 2026-07-25 |
| veredicto | **PASS** |

## Entrada recibida

1. Brief `plan/REPORTES/briefs/WP-U169-gate-major-band.md` con `RIESGO_REVISION=independiente`, rama, worktree, reporte y `ALCANCE_DIFF` — **OK**.
2. Reporte worker `plan/REPORTES/WP-U169-gate-major-band.md` presente en la rama — **OK**.
3. Base de diff `main...HEAD` acordada — **OK** (`git rev-parse HEAD` → `98f21bf…`; `git diff main...HEAD --stat` → 2 archivos).

## Checklist (intentar refutar)

### 1. Gate acepta major-band canónica; rechaza `*` / latest / git / url / paths

**Resultado: no refutado — P0×4 en verde; seis fail-probes en rojo (exit 1).**

Gate verde (reproducido):

```text
$ cd C:/S_LAB/.worktrees/z/wp-u169-gate-major-band
$ npm run gate:publish-ready
gate:publish-ready (WP-U169; P0 allowlist · major-band)
PASS @zeus/linea-system … zeusDeps=4
PASS @zeus/linea-firehose … zeusDeps=3
PASS @zeus/force-system … zeusDeps=4
PASS @zeus/ssb-system … zeusDeps=3
gate:publish-ready: OK (4 P0 candidates)
exit 0
```

Fail-probes (reproducidos; todos `EXIT:1`):

| kind | exit | motivo en salida |
| ---- | ---- | ---------------- |
| `star` | 1 | `wildcard *` |
| `latest` | 1 | `tags/other ranges rejected` |
| `git` | 1 | `git/github locator` |
| `url` | 1 | `http(s) URL` |
| `windows-path` | 1 | `Windows/absolute path` |
| `missing-version` | 1 | `E404` (9.9.9 no en registry) |

Comando: `node scripts/gate-publish-ready.mjs --package @zeus/linea-system --fail-probe <kind>` ×6.

Clasificación adversarial adicional (lógica `parseMajorBand` / `classifyZeusVersion` extraída del script): `^0.1.3`, `~0.1.3`, `>=0.1.3 <2.0.0` → rechazo; `>=0.1.3 <1.0.0`, `0.1.3` → aceptación — **OK**.

### 2. Deps no declaradas / install limpia

**Resultado: no refutado.**

- Runtime directo `semver` ya declarado en `package.json` raíz (`"semver": "^7.8.5"`); U169 no mutó manifest ni lock.
- Gate ejecutado sobre worktree con `node_modules` existente; resolución registry vía `npm view` contra `https://npm.scriptorium.escrivivir.co` OK en P0×4.

### 3. Prueba vs test (automatizado con salida literal)

**Resultado: no refutado.**

Probes rojos/verdes son CLI automatizados (`--fail-probe`, `npm run gate:publish-ready`) con salidas literales reproducidas arriba. El brief pide tests automatizados «cuando sea razonable»; no se añadió archivo de test dedicado, pero el mecanismo `--fail-probe` integrado cubre el set adversarial documentado — aceptable en alcance M.

### 4. Fronteras publish — allowlist, `private`, changesets, publish

**Resultado: no refutado.**

```text
$ git diff main...HEAD -- packages/ package.json package-lock.json plan/PUBLISH-ALLOWLIST.md .changeset/
(sin salida)

$ node -e "…" (×4 P0)
linea-system private=true
linea-firehose private=true
force-system private=true
ssb-system private=true
```

Cero flip `private`, cero `npm publish`, cero changesets de pub en el diff.

### 5. Lock-coherence (CA R11)

**Resultado: no refutado.**

U169 no mutó manifests P0 ni `package-lock.json`. Reporte worker documenta regla enforceable (manifest+lock en el mismo WP). Coherente con hallazgo R11-Z PASS.

### 6. Alcance ⊆ `ALCANCE_DIFF`

**Resultado: no refutado.**

```text
$ git diff main...HEAD --name-only
plan/REPORTES/WP-U169-gate-major-band.md
scripts/gate-publish-ready.mjs
```

Sin tocar `plan/BACKLOG.md`, manifests P0 (dueño U168), allowlist, reopen U165, ni fronteras publish.

## Veredicto

**PASS** — No se refutaron los CA del brief con la evidencia ejecutada.

`PASS` no autoriza ✅ ni merge.
