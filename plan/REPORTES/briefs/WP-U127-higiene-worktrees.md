# Brief — WP-U127 · Higiene worktrees library

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: Sprint 2 · ADDENDA bloque **B2** · **D-25**.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U127 · Retirar worktrees/dirs huérfanos en library
Rama zeus: wp/u127-higiene-worktrees
Worktree zeus: .worktrees/wp-u127-higiene-worktrees
Rama library: wp/u127-higiene-worktrees
Worktree library: (library)/.worktrees/wp-u127-higiene-worktrees
Reporte: plan/REPORTES/WP-U127-higiene-worktrees.md (zeus)

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero.

Política:
- Commits + push solo si hace falta nota en plan/reporte; la higiene es
  operación git local (worktree remove / borrar dirs huérfanos).
- NO tocar worktrees ACTIVOS del Sprint 2 (wp-u125-*, wp-u126-*, wp-u128-*, …).
- Solo los tres nombrados en ADDENDA.

Alcance:
1. git worktree remove (o prune) de `.worktrees/u107-review` (detached)
2. Retirar dirs huérfanos `.worktrees/wp-u121-*` y `.worktrees/wp-u123-*`
   (si ya no están registrados como worktrees, borrar dirs residuales)

CA (acotado al sprint en vuelo):
- Los tres objetivos fuera de `git worktree list` y de `.worktrees/`
- Listado final documentado: solo main + worktrees Sprint 2 legítimos
- Ideal post-sprint («solo main») = fuera de este WP si aún hay WPs 🔶

Demolición: worktree/dirs obsoletos nombrados.

Empieza: lista worktrees, retira solo los tres, evidencia en reporte.
```
