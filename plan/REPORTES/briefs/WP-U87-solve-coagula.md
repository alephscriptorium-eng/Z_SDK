# Brief — WP-U87 · SOLVE ET COAGULA, el tercer juego

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U87 · SOLVE ET COAGULA, el tercer juego
Rama: wp/u87-solve-coagula
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u87-solve-coagula
Reporte: plan/REPORTES/WP-U87-solve-coagula.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U87-solve-coagula.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push del monorepo Z_SDK (worker). Orquestador mergea + push main.
- NO gh pr / gh pr create en Z_SDK.
- NO publish real de `engine/*` ni U55 (gated `NPM_TOKEN` engine).
- NO push de credenciales / tokens / .env con secretos (ni a Z_SDK ni a
  Z_SDK-games-library).
- SÍ permitido: commits + push al repo de la library
  (`alephscriptorium-eng/Z_SDK-games-library`) — el juego vive allí;
  documentar evidencia. Si auth falla → ⏳ honesto + checklist ops.
- Navegador: `ZEUS_OPEN_BROWSER` opt-in (=1); headless por defecto.
- Rama principal del monorepo = `main` (no `master`).

WP completo (de plan/BACKLOG.md) — Ola 9; dep U70 ✅ + U86 ✅;
lote-ola9-b+catalog:
- Prueba de fuego del mundo A: recrear SOLVE_ET_COAGULA **con el editor
  (U70) y los dos kits (U86 CARPETA DRAMATURGO + linea/startpack)**.
- Corpus natural: linea-aleph ES el historial de SolveCoagula en Wikipedia.
- Entra al mesh como juego de la games-library con CASOS.md + acta.
- Lo que no se pueda hacer sin tocar engine/editor → §hallazgos =
  backlog de mejoras del mundo A (mismo patrón WP-U23).
- CA:
  · el juego corre en el mesh desde release de la games-library;
  · acta de validación en verde;
  · informe «qué faltó al editor/kits».
- Demolición: n/a. delta+pozo siguen siendo el mínimo de la regla de
  los dos juegos (U87 NO sustituye ese mínimo).

Alcance orientativo:
- Destino principal: `Z_SDK-games-library` (sibling
  `../Z_SDK-games-library` o path documentado).
- Consumir U70 (editor/gamemap/release) + U86 (carpeta dramaturgo) +
  U62 (startpack/acta). NO reinventar pipeline.
- Fuente de referencia (solo lectura): scriptorium-network-games /
  SOLVE_ET_COAGULA (+ corpus linea-aleph si aplica).
- Monorepo Z_SDK: solo lo imprescindible (docs/punteros/e2e mesh si
  hace falta). Si hay que tocar engine/editor → NO parchear de pasada:
  listar en §hallazgos → WPs futuros.
- NO U107 (otro worker; catálogo Pages). NO U55. NO U74.
- NO editar plan/BACKLOG.md.
- NO push de secretos.
- NO modificar los originales en scriptorium-network-games.

Regla de los dos juegos (PRACTICAS §1.11):
- delta+pozo = mínimo gate engine. U87 es el 3.er juego de producto /
  prueba del mundo A; NO endurece el gate a tres juegos.
- Engine/editor genéricos: cero hardcode de solve-coagula en kits.
  El juego nombra su identidad en la library, no en engine.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DATOS.md §6 (kit experiencia / SOLVE)
- plan/ARQUITECTURA.md §6 (games-library / start packs)
- plan/DECISIONES.md D-8, D-10 (tercer juego; library)
- plan/BACKLOG.md Ola 9 + remate lote-ola9-b+catalog
- plan/REPORTES/WP-U70-editor-gamemaps.md
- plan/REPORTES/WP-U86-carpeta-dramaturgo.md
- plan/REPORTES/WP-U62-release-pipeline.md
- plan/REPORTES/WP-U23-pozo.md (patrón «qué faltó al engine»)
- Fuentes: scriptorium-network-games/SOLVE_ET_COAGULA

Notas del orquestador:
- Lote **lote-ola9-b+catalog**: U87 ∥ U107 (paralelo; worktrees).
  Paths distintos (juego vs docs Pages library) — no pisar.
- Orden de merge sugerido si hay conflicto library: U107 primero
  (docs/catálogo) → U87 (juego), salvo que el diff diga lo contrario.
- Worktree zeus listo; library sibling esperado.
- NO editar plan/BACKLOG.md.
- NO push monorepo / NO secretos.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
