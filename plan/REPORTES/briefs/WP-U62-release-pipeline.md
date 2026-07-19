# Brief — WP-U62 · Pipeline de releases de datos

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U62 · Pipeline de releases de datos
Rama: wp/u62-release-pipeline
Worktree: .worktrees/wp-u62-release-pipeline
Reporte: plan/REPORTES/WP-U62-release-pipeline.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U62-release-pipeline.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push del monorepo Z_SDK (worker). Orquestador mergea + push main.
- NO gh pr / gh pr create en Z_SDK.
- NO publish real de `engine/*` ni U55 (gated `NPM_TOKEN` engine).
- NO push de credenciales / tokens / .env con secretos (ni a Z_SDK ni a
  Z_SDK-games-library).
- SÍ permitido: commits + push al repo de la library
  (`alephscriptorium-eng/Z_SDK-games-library`) si `gh`/git auth OK;
  documentar evidencia. Si auth falla → ⏳ honesto + checklist ops.
- Start packs `@zeus/startpack-*`: pipeline + tarball + GitHub Release
  espejo son CA. Publish al registry propio: si hay token/ops para
  startpacks, evidencia `npm install @zeus/startpack-delta`; si no,
  ⏳ honesto + pack local + Release asset + mesh arrancando desde ese
  artefacto (mismo espíritu U61 `file:` documentado).
- Navegador: `ZEUS_OPEN_BROWSER` opt-in (=1); headless por defecto.
- Rama principal del monorepo = `main` (no `master`).

WP completo (de plan/BACKLOG.md) — Ola 6; dep U61 ✅; lote-ola6-c:
- Destino library:
  https://github.com/alephscriptorium-eng/Z_SDK-games-library
  (juegos ya migrados post-U61).
- Pipeline de releases de datos: el Notario (ARG WP-20/23) escribe
  start packs contra la library.
- Cada release = paquete `@zeus/startpack-<game>` (registry propio como
  canal primario) + GitHub Release espejo (tarball + acta).
- `VOLUMES/` sale del monorepo Z_SDK; quedan solo datos sintéticos de
  test (fixtures).
- CA:
  · una ronda real produce release instalable
    (`npm install @zeus/startpack-delta` o ⏳ + evidencia equivalente);
  · Release en GitHub (library) con tarball + acta;
  · el mesh arranca una ronda nueva desde ese start pack.
- Demolición: `VOLUMES/` del monorepo (DISKs vivos fuera; fixtures de
  test conservados donde el mesh/CI los necesite).

Alcance orientativo:
- Library: pipeline release (workflow/script), paquetes startpack,
  acta, GitHub Release, docs de consumo.
- Monorepo: retirar/mover `VOLUMES/` vivos; dejar fixtures sintéticos;
  scripts/README/`ZEUS_VOLUMES_ROOT` alineados; mesh consume start pack.
- Cruza dos repos (zeus worktree + checkout library). Evidencia en
  ambos lados.
- NO U55. NO publish real de `engine/*`. NO U70/U86/U87 (ola 9).
- NO editar plan/BACKLOG.md.
- NO push de secretos.

Regla de los dos juegos (PRACTICAS §1.11):
- Pipeline parametrizado por juego (`startpack-<game>`); al menos
  evidencia con delta; pozo no queda como camino especial hardcodeado
  en el kit de release (mismo patrón o documentar simetría pendiente).

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md §6 (start packs / VOLUMES fuera de git)
- plan/DATOS.md (VOLUMES, Notario files-first)
- plan/DECISIONES.md D-7, D-10, D-11
- plan/BACKLOG.md Ola 6 + remate lote-ola6-c
- plan/REPORTES/WP-U61-migrate-games.md (estado post-migración)
- VOLUMES/ (origen a demoler / mover fuera del monorepo)
- Library: juegos delta/pozo ya en Z_SDK-games-library

Notas del orquestador:
- Lote **lote-ola6-c** (solo U62). Cierra ola 6 → desbloquea ola 9.
- Publish `engine/*` / U55 siguen gated — fuera de alcance.
- Worktree zeus listo; library: trabajar en clone sibling
  `../Z_SDK-games-library` (o path documentado) + push library OK.
- NO editar plan/BACKLOG.md.
- NO push monorepo / NO secretos.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
