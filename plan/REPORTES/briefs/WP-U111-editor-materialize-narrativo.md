# Brief — WP-U111 · Editor materializa juegos reales (no solo sketch)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: U87 §hallazgos 1+2 · frente editor GO usuario 2026-07-18.
**Lote 1–4+8** — solo este WP en la sesión; U112–U114 los encadena el padre.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U111 · Editor materializa juegos reales (no solo sketch)
Rama: wp/u111-editor-materialize-narrativo
Worktree: .worktrees/wp-u111-editor-materialize-narrativo
Reporte: plan/REPORTES/WP-U111-editor-materialize-narrativo.md

Library (si Notario / startpack nuevo): sibling ../Z_SDK-games-library
  Rama: wp/u111-editor-materialize-narrativo
  Worktree: ../Z_SDK-games-library/.worktrees/wp-u111-editor-materialize-narrativo
  (crear si el WP escribe startpack-* / STARTPACK_GAMES)

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U111-editor-materialize-narrativo.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm — este WP:
- Commits en rama WP zeus + push OK (listo revisión).
- SÍ permitido: commits + push rama WP en Z_SDK-games-library si hay
  startpack narrativo / fila STARTPACK_GAMES.
- NO merge a main (zeus ni library) — orquestador revisa.
- NO gh pr create salvo que el usuario lo pida.
- NO publish real / U55 / NPM_TOKEN.
- NO push de credenciales / tokens / .env con secretos.
- Navegador: ZEUS_OPEN_BROWSER opt-in (=1); headless por defecto.
- Rama principal = main (no master).
- NO tocar U112–U114 ni diferidos U87 §5–6.
- NO editar plan/BACKLOG.md.

WP completo (de plan/BACKLOG.md) — post-U87; deps U70 ✅ · U86 ✅:
- Demoler hard-gate validateDraft/materialize `gameId === 'sketch'`
  como único camino (sketch queda como preset/plantilla, no techo).
- Modo mundo A: materiales narrativos de carpeta dramaturgo (actos /
  story-board mínimo dialecto `solve-inline` documentado; U114 amplía).
- Materialize produce start pack / juego instalable con
  gameId !== 'sketch' (p.ej. `plaza` juguete narrativo parametrizable).
- CA:
  · desde editor-ui: draft con actos (o equiv. carpeta) + release
    instalable gameId !== 'sketch';
  · tests editor + Notario/path release verdes;
  · README editor veraz.
- Demolición: el techo sketch-only (grep: cero `gameId must be "sketch"`
  / equivalente como único camino).

Alcance orientativo:
- Zeus: packages/editor/editor-ui/ (materials, materialize, routes, UI,
  tests, README, OpenAPI si contrato cambia).
- Library (si hace falta Notario): packages/startpack-<narrativo>/ +
  fila en scripts/lib/startpack-games.mjs + test pack; reutilizar
  @zeus/startpack-kit (U110). Materiales de referencia:
  kits/carpeta-dramaturgo/ (plantilla story-board, validate-story-board).
- NO U112 (import obra). NO U113 (widgets runtime). NO U114 completo
  (dialectos registrados) — solo dialecto mínimo documentado.
- NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- Editor/mundo A: sin nombres exclusivos delta/pozo/solve en engine.
  El gameId narrativo es juguete parametrizable (p.ej. plaza), no
  hardcode del tercer juego real.
- Pregunta en reporte: ¿pozo/delta pueden ignorar el camino narrativo
  y seguir con sketch? (sí = tabla de materializers por gameId/kind).

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/REPORTES/WP-U87-solve-coagula.md §hallazgos 1–2
- plan/REPORTES/WP-U70-editor-gamemaps.md
- plan/REPORTES/WP-U86-carpeta-dramaturgo.md
- packages/editor/editor-ui/src/world/{materials,materialize-pack,routes}.mjs
- ../Z_SDK-games-library/kits/carpeta-dramaturgo/ (schema + validate + plantilla)
- ../Z_SDK-games-library/scripts/lib/startpack-games.mjs
- ../Z_SDK-games-library/packages/startpack-sketch/ (plantilla pack + kit)

Notas del orquestador:
- Frente abierto; solo U111 en esta sesión.
- Preferir tabla/map de games + materializers (PRACTICAS §1.2).
- Dialecto mínimo = solve-inline (acts[].widgets); documentar en README
  que U114 registrará dialectos.
- Worktree zeus listo al asignar; library worktree si tocas startpacks.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
