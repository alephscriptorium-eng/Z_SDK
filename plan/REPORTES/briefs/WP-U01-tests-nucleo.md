# Brief — WP-U01 · Tests que faltan en el núcleo

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U01 · Tests que faltan en el núcleo
Rama: wp/u01-tests-nucleo
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u01-tests-nucleo
Reporte: plan/REPORTES/WP-U01-tests-nucleo.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U01-tests-nucleo.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

WP completo (de plan/BACKLOG.md):
- `firehose-core` (hoy `test: echo 'sin tests'`) y `room-client-browser`
  (0 test files): tests de comportamiento de su API pública.
- CA: `npm test -w` verde en ambos con ≥1 test real por export principal.
- Demolición: el `echo 'sin tests'`.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- packages/lib/firehose-core — API pública (exports / package.json)
- packages/lib/room-client-browser — API pública (exports / package.json)

Notas del orquestador:
- Lote 0a paralelo con U00 y U02. Demolición incluye borrar el
  `echo 'sin tests'` — viejo y nuevo no conviven.
- Posibles conflictos de merge en scripts raíz / workspaces con U00; no
  toques gates ni identidad CAUDAL→delta.
- Solo tests de comportamiento de la API pública; no refactors colaterales
  (hallazgos → §hallazgos del reporte).

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
