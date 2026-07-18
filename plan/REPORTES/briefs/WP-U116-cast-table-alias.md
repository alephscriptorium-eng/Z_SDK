# Brief — WP-U116 · view-kit: id neutro cast-table (alias factory)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U116 · view-kit: id neutro del cast-table (post-U113)
Rama: wp/u116-cast-table-alias
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u116-cast-table-alias
Reporte: plan/REPORTES/WP-U116-cast-table-alias.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U116-cast-table-alias.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

GO usuario 2026-07-18: **opción A** (alias en factory).
- Canónico: `cast-table`
- Sinónimo: `panel-elenco` → mismo `renderCastTableWidget` (tabla de ids)
- SOLVE no migra story-boards / fixtures (sigue declarando `panel-elenco`)
- Opción B (map id-por-dialecto) DESCARTADA en este GO

CA (plan/BACKLOG.md WP-U116):
1. factory expone id neutro usable sin conocer SOLVE
2. test que monta por `cast-table`
3. `panel-elenco` sigue verde (mismo render)
4. gate two-games limpio (engine no nombra solve/SOLVE)
5. README view-kit veraz: canónico = `cast-table`; `panel-elenco` = alias

Demolición:
- default factory que *solo* conoce `panel-elenco` como id de producto
- fallback `ctx.id || 'panel-elenco'` en render → `cast-table`

Alcance:
- Solo `@zeus/view-kit` (widgets.mjs + tests + README + changeset patch)
- NO tocar library / SOLVE boards
- NO tocar editor / dialectos (eso era B)
- NO editar plan/BACKLOG.md
- NO pisar rama/worktree `wp/u117-*` ni reescribir líneas U117 del BACKLOG
- Residual labels ES hardwired → cola (no bloquea CA; no hace falta en este WP)

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- packages/engine/view-kit/src/widgets.mjs
- packages/engine/view-kit/test/widgets.test.mjs
- packages/engine/view-kit/README.md
- plan/REPORTES/WP-U113-widgets-solve-view-kit.md (contexto)

Notas del orquestador:
- Paralelizable con U117 (otro worktree; paths distintos).
- Rama principal = `main`.
- Changeset patch obligatorio (`@zeus/view-kit` publicable).
- Push de rama worker OK (usuario GO pidió push).

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
