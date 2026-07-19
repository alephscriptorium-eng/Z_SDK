# Brief — WP-U70 · Editor de gamemaps y releases

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U70 · Editor de gamemaps y releases
Rama: wp/u70-editor-gamemaps
Worktree: .worktrees/wp-u70-editor-gamemaps
Reporte: plan/REPORTES/WP-U70-editor-gamemaps.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U70-editor-gamemaps.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push del monorepo Z_SDK (worker). Orquestador mergea + push main.
- NO gh pr / gh pr create en Z_SDK.
- NO publish real de `engine/*` ni U55 (gated `NPM_TOKEN` engine).
- NO push de credenciales / tokens / .env con secretos (ni a Z_SDK ni a
  Z_SDK-games-library).
- SÍ permitido: commits + push al repo de la library
  (`alephscriptorium-eng/Z_SDK-games-library`) si el release dispara
  pipeline allí y `gh`/git auth OK; documentar evidencia. Si auth falla
  → ⏳ honesto + checklist ops.
- Navegador: `ZEUS_OPEN_BROWSER` opt-in (=1); headless por defecto.
- Rama principal del monorepo = `main` (no `master`).

WP completo (de plan/BACKLOG.md) — Ola 9; dep Ola 6–8 ✅; lote-ola9-a:
- editor-ui evoluciona de CRUD de presets a editor del mundo A:
  gamemaps, labelsets, cloaks, casos, y las líneas del dramaturgo
  (U80/U81) como materia prima seleccionable.
- Botón «release» = start pack + versiones + acta (dispara el pipeline
  de WP-U62).
- CA:
  · desde el editor se define un juego mínimo (escena, labelset, línea,
    casos) y se produce un release instalable.
- Demolición: las vistas CRUD que el editor nuevo sustituya.

Alcance orientativo:
- Hogar principal: `packages/editor/editor-ui/` (+ kits engine que el
  editor consuma: linea-kit U80/U81, game-engine/gamemap si aplica).
- Consumir pipeline U62 (startpack + acta); no reinventar release.
- Juego mínimo de prueba puede vivir en library o fixtures del editor;
  documentar path. NO asumir U86 cerrado (paralelo) — no depender de
  CARPETA DRAMATURGO; U87 es el que integra ambos.
- NO U87. NO U55. NO U86 (otro worker; no pisar su carpeta plantilla).
- NO editar plan/BACKLOG.md.
- NO push de secretos.

Regla de los dos juegos (PRACTICAS §1.11):
- El editor es mundo A genérico: cero nombres/conceptos exclusivos de
  un juego en código engine/editor. El juego mínimo de CA es juguete
  parametrizado, no hardcode delta/pozo.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md §1–2 (editor/ mundo A), §6 (start packs)
- plan/DATOS.md §6 (kits del dramaturgo; líneas = materia prima)
- plan/DECISIONES.md D-7, D-10
- plan/BACKLOG.md Ola 9 + remate lote-ola9-a
- plan/REPORTES/WP-U62-release-pipeline.md (pipeline a disparar)
- packages/editor/editor-ui/ (CRUD actual a evolucionar)
- engine: linea-kit / game-engine según inventario del worker

Notas del orquestador:
- Lote **lote-ola9-a** en paralelo con U86. Orden de merge sugerido si
  hay conflicto: U86 primero (library plantilla) → U70 (editor), salvo
  que el diff diga lo contrario.
- U87 NO asignar hasta U70 ✅ + U86 ✅.
- Worktree zeus listo; library sibling `../Z_SDK-games-library` si el
  release toca startpacks allí.
- NO editar plan/BACKLOG.md.
- NO push monorepo / NO secretos.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
