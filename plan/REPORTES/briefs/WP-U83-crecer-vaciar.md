# Brief — WP-U83 · Las tramas integran crecer/vaciar

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U83 · Las tramas integran crecer/vaciar
Rama: wp/u83-crecer-vaciar
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u83-crecer-vaciar
Reporte: plan/REPORTES/WP-U83-crecer-vaciar.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U83-crecer-vaciar.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).
  Espejar WPs de detalle por juego en ese backlog cuando se tomen — no
  editarlo aquí salvo si el CA del juego lo exige y se documenta.

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — Ola 7; lote-7b; dep U82 ✅, U30 ✅,
U23 ✅; paralelo con U92 (otro worktree):
- delta y pozo incorporan el ciclo completo del mapa a su trama y CASOS.
- Crecer: cachear/curar/milestone ya en WP-U30 (no reimplementar).
- Vaciar: mecánica con coste narrativo (qué significa purgar en delta;
  qué en pozo), usando la capa de operación U82 (intents/roles).
- Casos C-* nuevos en formato playbook-kit + checklist visual.
- CA:
  · casos nuevos pasan el test de coherencia (playbook-kit)
  · e2e MCP de al menos un caso de vaciado por juego (delta Y pozo)
  · scoring/ledger reflejan el ciclo crecer/vaciar
- Demolición: n/a.

Alcance orientativo:
- Trabajo en `packages/games/delta` y `packages/games/pozo` (trama,
  dominio de juego, CASOS.md, e2e MCP) — NO en engine genérico salvo
  hallazgos (→ §hallazgos; no parches al SDK desde el juego).
- Consumir U82 (medir/vaciar vía autoridad/ledger); no reescribir la
  capa CRUD de volúmenes.
- NO U92 (intents force:activate/deactivate) — otro WP / otro worktree.
- NO tocar packages/games/delta/spec/BACKLOG.md como si fuera el de
  refundación; regla de no mezclar.

Regla de los dos juegos (PRACTICAS §1.11):
- Ambos juegos deben incorporar el ciclo. Si algo falta en engine para
  que pozo pueda vaciar sin tocar engine, es hallazgo SDK (WP aparte),
  no parche desde el juego.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DATOS.md §4 (roles / vaciado) y mapa del ciclo
- plan/REPORTES/WP-U82-volumenes-crud.md (capa medir/vaciar)
- plan/REPORTES/WP-U30-dj-intents.md (crecer: cache/curate/milestone)
- plan/REPORTES/WP-U23-pozo.md (segundo juego / CASOS pozo)
- packages/games/delta/spec/CASOS.md + packages/games/pozo/ (CASOS)
- playbook-kit (coherencia + e2e MCP)

Notas del orquestador:
- Lote-7b paralelo: U83 = tramas delta/pozo crecer/vaciar; U92 =
  intents force. Conflicto bajo si U83 no toca dominio force ni
  authority-kit genérico de forces.
- Pregunta obligatoria (CA): ¿casos nuevos pasan coherencia? ¿e2e MCP
  vaciado en delta Y pozo? ¿ledger/scoring reflejan el ciclo?
  Evidencia literal.
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
