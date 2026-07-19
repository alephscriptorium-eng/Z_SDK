# Brief — WP-U128 · Deps @zeus caret semver

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: Sprint 2 · ADDENDA bloque **B3** · **D-25**.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U128 · Fijar deps @zeus/* de "*" a caret semver (library)
Rama zeus: wp/u128-zeus-deps-semver
Worktree zeus: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u128-zeus-deps-semver
Rama library: wp/u128-zeus-deps-semver
Worktree library: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/Z_SDK-games-library/.worktrees/wp-u128-zeus-deps-semver
Reporte: plan/REPORTES/WP-U128-zeus-deps-semver.md (zeus)

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero.
NO tocar docs CAPA (U125) ni workflows (U126).

Política:
- Commits + push OK. NO merge a main.
- Rango = caret de la versión publicada real (npm view / lockfile como pista).
- No inventar versiones no publicadas.

Alcance: package.json bajo packages/ de la library con deps/devDeps @zeus/*

CA:
- grep / búsqueda: cero "@zeus/…": "*" en packages/ de la library
- install/tests básicos verdes en lo tocado (documentar evidencia)

Demolición: rangos "*" en esas deps.

Empieza: inventariar "*", fijar carets, verificar, reporta.
```
