# Brief — WP-U171 · Preparar publicación P0×4 (sin publish)

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U171 · Preparar publicación P0×4 (checklist / changesets dry)
Rama: wp/u171-prep-publicacion
Worktree: C:\S_LAB\.worktrees\z\wp-u171-prep-publicacion
Reporte: plan/REPORTES/WP-U171-prep-publicacion.md

## Lecturas
- plan/PUBLISH-ALLOWLIST.md §3 · §5
- plan/PRACTICAS.md §6 (changesets / release)
- plan/REPORTES/entregas/REPLAN-2026-07-24-r12-major-band.md
- `.github/workflows/release.yml` (**solo lectura**)
- estado post-U168/U169 (major-band + gate verde)

## Tarea
1. Redactar checklist de release prep para P0×4 (publishConfig, files,
   major-band, gate verde, C8, dry-run pack).
2. Ejecutar / documentar `npm run release:changeset-dry` (o equivalente)
   **sin** consumir changesets de publicación reales ni disparar publish.
3. Si se crean archivos `.changeset/**` de **borrador**, deben quedar
   claramente no-aplicados / fuera de release efectivo, o solo
   documentados en reporte sin merge de publish — preferir evidencia dry
   + checklist en `plan/REPORTES/` sin activar pipeline.
4. Documentar pasos exactos del futuro **GO publish** (flip private →
   changesets → Release) como runbook; **no** ejecutarlos.
5. **Prohibido absoluto:** `npm publish`, Release publish efectivo, flip
   `private` sin GO publish.

## CA
- Checklist + runbook GO publish en reporte.
- Evidencia dry-run sin publish real.
- Contrarrevisión independiente PASS antes de ✅.
- `private: true` intacto en P0×4.
- Cero `npm publish` · cero Release publish efectivo.

## ALCANCE_DIFF
- `plan/REPORTES/` (reporte + checklist)
- cambios mínimos documentados solo si el dry-run lo exige y **no**
  publican (preferir cero diff de packages)
- **Prohibido:** `npm publish`, flip `private`, editar `release.yml` para
  forzar publish, ampliar allowlist

## Notas
- Estado: **🔶** despachado (PAUSA parcial · post Ola B ✅ · 2026-07-25)
- Estimación: M · Eje IV · Ola C · deps **U168 ✅** + **U169 ✅**
- Contrarrevisión: obligatoria · RIESGO_REVISION=independiente
- Frontera: **sin npm publish manual**; dry-run/checklist only; D-42
  condiciones restantes las cierra el orquestador post-merge.
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- WORLD_ROOT=C:/S_LAB/z-sdk · CANONICAL_WORLD_ROOT=C:/S_LAB/z-sdk ·
  READ_ONLY_ROOTS=["C:/S_LAB/.worktrees"] · DOWNSTREAM_PATTERNS=[".worktrees/*"]
- DC-15 LOCAL-ONLY
- No editar `plan/BACKLOG.md` (solo orquestador)
