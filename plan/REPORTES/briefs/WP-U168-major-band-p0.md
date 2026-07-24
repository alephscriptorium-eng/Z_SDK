# Brief — WP-U168 · Migrar P0×4 a major-band

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U168 · Migrar P0×4 a major-band
Rama: wp/u168-major-band-p0
Worktree: C:\S_LAB\.worktrees\z\wp-u168-major-band-p0
Reporte: plan/REPORTES/WP-U168-major-band-p0.md

## Lecturas
- plan/REPORTES/entregas/REPLAN-2026-07-24-r12-major-band.md
- plan/REPORTES/entregas/ADDENDA-R12-Z-REVISION-SEMVER-IDLE.md (§ semver)
- plan/PUBLISH-ALLOWLIST.md §3 P0 · §5 (actualizar criterio pines→banda)
- plan/REPORTES/entregas/GATE-R11-Z-PASS.md (CA lock-coherence)
- package.json de los cuatro P0 bajo `packages/mesh/`

## Tarea
1. En `@zeus/linea-system`, `@zeus/linea-firehose`, `@zeus/force-system`,
   `@zeus/ssb-system`: sustituir deps internas `@zeus/*` pineadas exactas
   por banda major `>=M.m.p <(M+1).0.0` (mínimo = versión registry
   justificada; no `^0.m.p` silencioso).
2. Enmendar allowlist §5: criterio = major-band (no solo pin exacto).
3. Actualizar `package-lock.json` en el **mismo** WP si el cambio de
   manifests lo exige; evidenciar coherencia.
4. Medir resolución / install limpia; documentar consecuencia major `0`
   (minor puede romper) + evidencia de integración.
5. **No** editar `scripts/gate-publish-ready.mjs` (dueño U169).
6. **No** flip `private`, **no** `npm publish`, **no** changesets de
   publicación, **no** reabrir U165.

## CA
- Cuatro P0 con rangos major-band válidos; sin `*` / tags / git / url /
  paths.
- Allowlist §5 alineada; mínimo y resolución existen en registry.
- Lock coherente si hubo cambio de manifests (R11 hallazgo).
- Contrarrevisión independiente PASS documentada antes de pedir ✅.
- Cero private / publish / changesets de pub; gate no tocado.

## ALCANCE_DIFF
- `packages/mesh/linea-system/**`
- `packages/mesh/linea-firehose/**`
- `packages/mesh/force-system/**`
- `packages/mesh/ssb-system/**`
- `plan/PUBLISH-ALLOWLIST.md` (§5)
- `package-lock.json` (si manifests lo requieren)
- reporte bajo `plan/REPORTES/`
- **Prohibido:** gate scripts, flip private, publish, changesets de
  release, reabrir U165 / Sprint 8

## Notas
- Estado planificado: **⬜** (no despachar hasta R12-Z PASS + GO impl.)
- Estimación: M · Eje IV · Ola A (∥ U170)
- Contrarrevisión: obligatoria (ADDENDA-R12 / U170)
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY
- No editar `plan/BACKLOG.md` (solo orquestador)
