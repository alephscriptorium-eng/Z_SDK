# Brief — WP-U113 · Widgets SOLVE con runtime en view-kit

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: U87 §4 · frente editor GO · U112 ✅.
**Solo U113** — no U114/U115; no diferidos U87 §5–6.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U113 · Widgets SOLVE con runtime en view-kit
Rama: wp/u113-widgets-solve-view-kit
Worktree: .worktrees/wp-u113-widgets-solve-view-kit
Reporte: plan/REPORTES/WP-U113-widgets-solve-view-kit.md

Library (consumo vista solve): sibling ../Z_SDK-games-library
  Rama: wp/u113-widgets-solve-view-kit
  Worktree: ../Z_SDK-games-library/.worktrees/wp-u113-widgets-solve-view-kit

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U113-widgets-solve-view-kit.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm — este WP:
- Commits en rama WP zeus + push OK (listo revisión).
- SÍ permitido: commits + push rama WP en Z_SDK-games-library
  (vista solve-coagula consume el kit).
- NO merge a main (zeus ni library) — orquestador revisa.
- NO gh pr create salvo que el usuario lo pida.
- NO publish real / U55 / NPM_TOKEN.
- NO push de credenciales / tokens / .env con secretos.
- Navegador: ZEUS_OPEN_BROWSER opt-in (=1); headless por defecto.
- Rama principal = main (no master).
- NO tocar U114–U115 ni diferidos U87 §5–6.
- NO editar plan/BACKLOG.md.

WP completo (de plan/BACKLOG.md) — post-U87; deps U20 ✅ · U87 ✅:
- `panel-elenco`, `panel-heatmap`, etc. viven como uichain/*.prompt.md;
  view-kit no los renderiza. Vista U87 = lista de actos + meta.
- Runtime mínimo en @zeus/view-kit: registro genérico de widgets por
  id/schema (tabla/map, PRACTICAS §1.2) + al menos un widget real
  (elegir panel-elenco como primer caso).
- Vista solve monta view-kit (import-map / static como pozo) y renderiza
  el widget declarado en story-board (no solo el nombre en texto).
- CA:
  · un widget declarado en story-board SOLVE se renderiza en la vista
    (DOM real, no solo prompt / span de nombres);
  · test view-kit + smoke/e2e o health+HTML evidencia en solve;
  · gate two-games: engine sin conceptos exclusivos solve (ids de
    widget OK; sin «SOLVE»/REIC/nombres de juego en engine).
- Demolición: stub «solo prompt» / listado de nombres del widget
  elegido cuando el runtime lo sustituye; actualizar uichain del
  widget elegido para apuntar al runtime (no dejar dos verdades).

Alcance orientativo:
- Zeus: packages/engine/view-kit/ (registry + widget + tests + README
  + changeset patch — paquete publicable).
- Library: packages/solve-coagula/ (server/render/main + fixture
  datos del widget + test/smoke + dep @zeus/view-kit).
- NO U114 (dialectos editor). NO U115 (schema AJV).
- NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- view-kit: registro por widget id; datos inyectados por el juego.
  ¿pozo/delta pueden ignorar el registry y seguir igual? Sí.
  ¿un segundo juego puede registrar el mismo id con otros datos? Sí.
- Pregunta en reporte: ¿pozo puede consumir el registry tal cual?

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/REPORTES/WP-U87-solve-coagula.md §hallazgo 4
- plan/REPORTES/WP-U20-view-kit.md
- packages/engine/view-kit/{src,README,test}/
- ../Z_SDK-games-library/packages/solve-coagula/src/view/{server,render}.mjs
- ../Z_SDK-games-library/packages/solve-coagula/assets/js/solve-main.mjs
- ../Z_SDK-games-library/packages/solve-coagula/dramaturgia/uichain/panel-elenco.prompt.md
- ../Z_SDK-games-library/packages/pozo/src/view/ (patrón montaje view-kit)

Notas del orquestador:
- Solo U113. Worktree zeus + library desde main fresco (post-U112).
- Preferir panel-elenco (act-0 del story-board) como primer widget.
- Fixture hermética de filas (no depender de linea-aleph 48MB).
- Library .deps apunta a zeus-sdk; tras cambios en view-kit, link/npm
  en worktree library si hace falta.
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
