# Brief — WP-U114 · Dialectos story-board en el editor

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: U87 §8 · frente editor GO · U113 ✅.
**Solo U114** — no U115 (schema AJV en kit); no diferidos U87 §5–6.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U114 · Dialectos story-board en el editor
Rama: wp/u114-dialectos-story-board-editor
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u114-dialectos-story-board-editor
Reporte: plan/REPORTES/WP-U114-dialectos-story-board-editor.md

Library: NO obligatorio (fixtures herméticos en editor-ui/test).
  Si se copia fixture SOLVE: desde
  ../Z_SDK-games-library/kits/carpeta-dramaturgo/fixtures/
  (solo lectura; no rama library salvo hallazgo).

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U114-dialectos-story-board-editor.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm — este WP:
- Commits en rama WP zeus + push OK (listo revisión).
- Library: solo si hace falta (preferir fixture hermético en zeus).
- NO merge a main — orquestador revisa.
- NO gh pr create salvo que el usuario lo pida.
- NO publish real / U55 / NPM_TOKEN.
- NO push de credenciales / tokens / .env con secretos.
- Navegador: ZEUS_OPEN_BROWSER opt-in (=1); headless por defecto.
- Rama principal = main (no master).
- NO tocar U115 (AJV / schema kit carpeta).
- NO editar plan/BACKLOG.md.

WP completo (de plan/BACKLOG.md) — post-U87; deps U70 ✅ · U86 ✅:
- U111 dejó validateSolveInlineBoard hardcode + rechazo aleph «→ U114».
- Editor valida/edita story-boards según dialectos **registrados**
  (tabla/map, PRACTICAS §1.2) — no if-creciente.
- Acepta al menos `solve-inline` (+ dialecto plantilla/sketch narrativo
  o `aleph-blocks` alineado U86).
- Dialecto desconocido (campo explícito o id no registrado) → rechazo
  explicable con lista de conocidos.
- CA:
  · validateDraft / normalizeStoryBoard vía registro;
  · test con fixture SOLVE (hermético) → ok dialect solve-inline;
  · dialecto desconocido → error claro;
  · OpenAPI/README al día (dialects en materials / contrato).
- Demolición: `story-board-min.mjs` como único camino hardcode;
  mensajes «U114» / asunción solo-sketch-JSON si quedan.

Alcance orientativo:
- Zeus: packages/editor/editor-ui/src/world/ (registry dialectos,
  materials validateDraft, tests, README, OpenAPI si contrato).
- Fixture: copiar/minificar solve-coagula-story-board bajo
  editor-ui/test/fixtures/ (hermético).
- NO U115: no cablear AJV ni tocar
  kits/carpeta-dramaturgo/scripts/validate-story-board.mjs.
- NO editar plan/BACKLOG.md.

Deps U115 (nota orquestador):
- U114 **no espera** U115. Frentes distintos: editor registry vs
  schema-as-truth en kit. No reescribir validate-story-board del kit.

Regla de los dos juegos (PRACTICAS §1.11):
- Dialect ids genéricos (solve-inline / aleph-blocks / plantilla) —
  no nombres de juego en engine. Editor ≠ engine, pero evita hardcode
  «SOLVE» en mensajes de usuario cuando baste el id de dialecto.
- Pregunta en reporte: ¿un segundo juego narrativo puede registrar
  otro dialecto en la tabla sin tocar validateDraft?

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/REPORTES/WP-U87-solve-coagula.md §hallazgo 8
- plan/REPORTES/WP-U111-editor-materialize-narrativo.md (defer U114)
- packages/editor/editor-ui/src/world/{materials,story-board-min}.mjs
- packages/editor/editor-ui/test/world-draft.test.mjs
- ../Z_SDK-games-library/kits/carpeta-dramaturgo/scripts/validate-story-board.mjs
- ../Z_SDK-games-library/kits/carpeta-dramaturgo/fixtures/solve-coagula-story-board.json

Notas del orquestador:
- Solo U114; tip main ~7707081.
- Preferir renombrar/reemplazar story-board-min → registry (sin
  nombres -old/-v2).
- Worktree zeus listo al asignar.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
