# Brief — WP-U86 · CARPETA DRAMATURGO (kit de experiencia)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U86 · CARPETA DRAMATURGO (kit de experiencia)
Rama: wp/u86-carpeta-dramaturgo
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u86-carpeta-dramaturgo
Reporte: plan/REPORTES/WP-U86-carpeta-dramaturgo.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U86-carpeta-dramaturgo.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push del monorepo Z_SDK (worker). Orquestador mergea + push main.
- NO gh pr / gh pr create en Z_SDK.
- NO publish real de `engine/*` ni U55 (gated `NPM_TOKEN` engine).
- NO push de credenciales / tokens / .env con secretos (ni a Z_SDK ni a
  Z_SDK-games-library).
- SÍ permitido (y esperado): commits + push al repo de la library
  (`alephscriptorium-eng/Z_SDK-games-library`) — la carpeta vive allí;
  documentar evidencia. Si auth falla → ⏳ honesto + checklist ops.
- Navegador: `ZEUS_OPEN_BROWSER` opt-in (=1); headless por defecto.
- Rama principal del monorepo = `main` (no `master`).

WP completo (de plan/BACKLOG.md) — Ola 9; dep Ola 6–8 ✅; lote-ola9-a:
- En la games-library: plantilla destilada de ALEPH_ET_OMEGA y
  SOLVE_ET_COAGULA (DATOS.md §6):
  · constitución parametrizable (título/tema + 4 ejes REIC);
  · cadenas de 4 capas con README-plantilla;
  · `story-board.json` (schema actos→widgets);
  · plantillas `uichain/panel-*.prompt.md`;
  · `AYUDA.md`, marcas epistémicas y hot files.
- Stubs/desacople documentado de skills externas de network-engine
  (disfraz-rude-bot y browsers de caché) que hoy ambos juegos asumen.
- CA:
  · desde la carpeta, un dramaturgo (humano o agente) instancia un
    juego narrativo nuevo de juguete sin editar nada fuera de su
    carpeta;
  · el schema del story-board valida los dos story-boards reales
    existentes (ALEPH_ET_OMEGA + SOLVE_ET_COAGULA).
- Demolición: n/a (plantilla destilada; originales intactos en
  scriptorium-network-games).

Alcance orientativo:
- Destino: https://github.com/alephscriptorium-eng/Z_SDK-games-library
  (checkout sibling `../Z_SDK-games-library` o path documentado).
- Fuente a destilar (solo lectura):
  `SCRIPTORIUM_V0/scriptorium-network-games/{ALEPH_ET_OMEGA,SOLVE_ET_COAGULA}`.
- Schema story-board: puede vivir en library y/o paquete engine si la
  validación lo exige; documentar. Preferir library-first.
- Monorepo Z_SDK: solo lo imprescindible (docs/punteros/schema compartido
  si hace falta); NO evolucionar editor-ui (eso es U70).
- NO U87. NO U70 (otro worker). NO U55.
- NO editar plan/BACKLOG.md.
- NO push de secretos.
- NO modificar los juegos originales en scriptorium-network-games.

Regla de los dos juegos (PRACTICAS §1.11):
- La plantilla es genérica (mundo A); no hardcodea nombres de delta/pozo
  en engine. El juego juguete de CA es instancia de la carpeta, no un
  tercer juego de producto (eso es U87).

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DATOS.md §6 (kit de experiencia / CARPETA DRAMATURGO)
- plan/ARQUITECTURA.md §6 (games-library)
- plan/DECISIONES.md D-10, D-11
- plan/BACKLOG.md Ola 9 + remate lote-ola9-a
- plan/REPORTES/WP-U61-migrate-games.md / WP-U62-release-pipeline.md
- Fuentes: scriptorium-network-games/{ALEPH_ET_OMEGA,SOLVE_ET_COAGULA}
  (esp. uichain/README.md, story-board.json, constitución/index.md)

Notas del orquestador:
- Lote **lote-ola9-a** en paralelo con U70. Orden de merge sugerido si
  hay conflicto: U86 primero → U70.
- U87 NO asignar hasta U70 ✅ + U86 ✅.
- Trabajo cruza: commits en worktree Z_SDK (reporte + schema/docs si
  aplica) + cambios en clone library. Evidencia de instancia juguete +
  validación de los dos story-boards reales.
- NO editar plan/BACKLOG.md.
- NO push monorepo / NO secretos.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
