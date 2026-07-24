# Contrarrevisión independiente — WP-U171

| dato | valor |
| ---- | ----- |
| WP | WP-U171 · Preparar publicación P0×4 (checklist / changeset dry) |
| rama | `wp/u171-prep-publicacion` |
| tip revisado | `59f78f44d1cf9de1277f6e694c0c95a0dc885000` |
| worktree | `C:\S_LAB\.worktrees\z\wp-u171-prep-publicacion` |
| revisor | contrarrevisión independiente (read-only) |
| fecha | 2026-07-25 |
| veredicto | **PASS** |

## Entrada recibida

1. Brief `plan/REPORTES/briefs/WP-U171-prep-publicacion.md` con `RIESGO_REVISION=independiente`, rama, worktree, reporte y `ALCANCE_DIFF` — **OK**.
2. Reporte worker `plan/REPORTES/WP-U171-prep-publicacion.md` presente en la rama — **OK**.
3. Checklist `plan/REPORTES/CHECKLIST-GO-PUBLISH-P0.md` presente en la rama — **OK**.
4. Base de diff `main...HEAD` acordada — **OK** (`git rev-parse HEAD` → `59f78f4…`; `git diff main...HEAD --stat` → 2 archivos, +116 líneas).

## Checklist (intentar refutar)

### 1. Changesets de pub efectivos o flip `private`

**Resultado: no refutado.**

```text
$ ls .changeset/
config.json  README.md
(sin .changeset/*.md pendientes)

$ git diff main...HEAD -- packages/ .changeset/ .github/
(sin salida)
```

Cero archivos `.changeset/*.md` nuevos. Los cuatro P0 conservan `"private": true` en manifests (lectura independiente + diff vacío vs `main`).

### 2. `npm publish` / Release publish efectivo

**Resultado: no refutado.**

Diff acotado a `plan/REPORTES/`; sin mutación de `release.yml`, manifests ni pipeline. No hay evidencia de publish en el diff ni en el worktree.

### 3. Diff fuera de `plan/REPORTES/`

**Resultado: no refutado.**

```text
$ git diff main...HEAD --name-only
plan/REPORTES/CHECKLIST-GO-PUBLISH-P0.md
plan/REPORTES/WP-U171-prep-publicacion.md
```

### 4. Checklist / runbook incompleto o contradictorio con D-42

**Resultado: no refutado.**

`CHECKLIST-GO-PUBLISH-P0.md` cubre las siete condiciones de activación D-42 (`plan/DECISIONES.md` · `plan/PUBLISH-ALLOWLIST.md` §3–§5):

| condición D-42 | checklist |
| -------------- | --------- |
| skills `0.10.0` validado | precondición ✓ |
| R12-Z PASS + GO impl. | precondición ✓ |
| U168–U171 ✅ | precondición ✓ |
| major-band + gate adaptado | precondición ✓ |
| contrarrevisión PASS (riesgo) | precondición ✓ |
| changesets + matriz CI/Release | precondición + secuencia GO ✓ |
| gate online/C8 + tarballs/JS-only | precondición + verificación C8 ✓ |

Runbook futuro coherente: flip `private` solo P0×4 · changesets en fase publish · Release vía CI · **no** `npm publish` manual · `linea-editor` → U178 · exclusiones D-42 §c. No contradice D-42.

### 5. `private: true` intacto en P0×4

**Resultado: no refutado.**

| paquete | `private` | `files` | `publishConfig.registry` |
| ------- | --------- | ------- | ------------------------ |
| `@zeus/linea-system` | `true` | `["src"]` | `https://npm.scriptorium.escrivivir.co` |
| `@zeus/linea-firehose` | `true` | `["src"]` | idem |
| `@zeus/force-system` | `true` | `["src"]` | idem |
| `@zeus/ssb-system` | `true` | `["src"]` | idem |

## Evidencia dry-run (reproducida)

```text
$ cd C:/S_LAB/.worktrees/z/wp-u171-prep-publicacion
$ npm run release:changeset-dry
release:changeset-dry — no publish, restore after verify
No pending changesets under .changeset/*.md
exit 1
```

**Nota menor (no bloqueante):** el reporte worker cita `exit 0`; el script
`scripts/release-changeset-dry.mjs` sale con código **1** cuando no hay
changesets pendientes (rama temprana intencional). Comportamiento esperado
para U171 (sin changesets de pub). No implica publish ni mutación de árbol.

`npm pack --dry-run` ×4 queda documentado como paso de prep en checklist
(fase GO publish), no ejecutado en este WP — acorde al brief (dry de
changeset + runbook; sin activar publish).

## Veredicto

**PASS** — No se refutaron los criterios de refutación ni los CA del brief.

`PASS` no autoriza ✅ ni merge.
