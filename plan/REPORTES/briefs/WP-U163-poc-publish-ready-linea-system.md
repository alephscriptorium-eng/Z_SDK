# Brief — WP-U163 · POC publish-ready `@zeus/linea-system`

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U163 · POC publish-ready `@zeus/linea-system`
Rama: wp/u163-poc-publish-ready-linea-system
Worktree: C:\S_LAB\.worktrees\z\wp-u163-poc-publish-ready-linea-system
Reporte: plan/REPORTES/WP-U163-poc-publish-ready-linea-system.md

## Lecturas
- plan/PUBLISH-ALLOWLIST.md §3 P0 · §5 condiciones publish-ready
- plan/REPORTES/WP-U162-auditoria-publish-allowlist.md (§ Plan / medición)
- plan/REPORTES/entregas/REPLAN-2026-07-24-sprint8.md
- plan/PRACTICAS.md §6 (changesets / release) · C8 registry
- `packages/mesh/linea-system/package.json`

## Tarea
1. Dejar `@zeus/linea-system` **publish-ready medible** como plantilla P0:
   `publishConfig.registry` = registry de `.npmrc`; `files` explícito
   excluyendo tests/fixtures/`node_modules`.
2. Pinear deps internas `@zeus/*` (hoy `*`) a semver resoluble en registry.
3. Decidir y documentar `exports`/`types` vs JS-only.
4. Evidencia: `npm pack --dry-run` (o pack a temp) sin secretos/tests;
   checklist §5 de la allowlist en el reporte.
5. **No** flip `private`, **no** `npm publish`, **no** changeset de
   publicación, **no** editar `release.yml`.

## CA
- `publishConfig.registry` correcto; `files` medido (tarball sin tests).
- Deps `@zeus/*` sin `*`; versiones justificadas en reporte.
- Decisión types/JS-only explícita.
- Cero cambios `"private"`; cero `npm publish`; cero `.changeset/**`
  de release; cero edits de workflow publish.
- Diff acotado a ALCANCE_DIFF + reporte; `npm run gates` OK si toca código.
- Plantilla reproducible citada para U164.

## ALCANCE_DIFF
- `packages/mesh/linea-system/**` (manifest + lo mínimo para files/exports)
- reporte bajo `plan/REPORTES/`
- **Prohibido:** flip `private`, publish, changesets de publicación,
  `release.yml`, tocar otros candidatos P0/P1

## Notas
- Estado: **🔶** · Ola A · deps: U162 ✅ · R8-Z PASS + GO Ola A
- Estimación: M · Eje IV
- Frontera: sin flip `private` / sin changesets de pub / sin publish
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY
- No editar `plan/BACKLOG.md` (solo orquestador)
