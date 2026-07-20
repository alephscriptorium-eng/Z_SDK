# Brief — WP-U151 · CHANGELOG de gobierno (grueso, por ola)

Orquestador · 2026-07-20 · GO Sprint 5 (D-37).

```text
(rol) plan/roles/WORKER.md

WP: WP-U151 · CHANGELOG de gobierno (grueso, por ola)
Rama: wp/u151-changelog-gobierno
Worktree: .worktrees/wp-u151-changelog-gobierno (indep. de U149)
Reporte: plan/REPORTES/WP-U151-changelog-gobierno.md

Lecturas extra:
- HANDOFF Punto 2: NO adoptar verificar-changelog.mjs (choca changesets)
- plan/BACKLOG.md + plan/BACKLOG-HISTORICO.md (fuente; no inventar prosa)
- Keep a Changelog: https://keepachangelog.com/

Tarea:
1. Crear CHANGELOG.md en la raíz del monorepo (gobierno del mundo).
2. Formato Keep a Changelog; secciones gruesas por ola/sprint (0–10 +
   Sprints 1–4), agregando WP ✅ del BACKLOG (id + título), no WP-a-WP
   narrativo.
3. NO tocar packages/*/CHANGELOG.md.
4. NO añadir gate verificar-changelog.mjs ni script CI de changelog.

CA:
1. CHANGELOG.md raíz existe, formato estándar
2. Cada sprint cerrado (1–4) + olas relevantes tienen entrada
3. Contenido derivado del BACKLOG (sin prosa inventada)
4. Diff no toca packages/*/CHANGELOG*

ALCANCE_DIFF: CHANGELOG.md, reporte.
Eje: ninguno (gobierno).

Notas:
- Independiente: parte de main tip 856cef9 (gobierno 🔶 puede estar mergeado).
- Nota CI: solo **.md raíz → probablemente paths-ignore / N/A.

Empieza: sitúate en rama/worktree, lee PRACTICAS, deriva del BACKLOG.
```
