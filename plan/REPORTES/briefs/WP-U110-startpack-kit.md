# Brief — WP-U110 · `@zeus/startpack-kit` — una sola `loadStartPack`

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: vigilante post-U87 (`loadStartPack` ×4) · PRACTICAS §1.4.
**Micro higiene post-U87** — GO usuario 2026-07-18. Tras U109 ✅.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U110 · @zeus/startpack-kit — una sola loadStartPack
Rama: wp/u110-startpack-kit
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u110-startpack-kit
Reporte: plan/REPORTES/WP-U110-startpack-kit.md

Library (alcance principal): sibling ../Z_SDK-games-library
  Rama: wp/u110-startpack-kit
  Worktree: ../Z_SDK-games-library/.worktrees/wp-u110-startpack-kit

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U110-startpack-kit.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm — este WP:
- Commits en rama WP zeus (reporte + docs puntero si aplica) + push OK.
- SÍ permitido: commits + push rama WP en Z_SDK-games-library
  (kit + cuatro startpacks viven allí).
- NO merge a main (zeus ni library) — orquestador revisa.
- NO gh pr create salvo que el usuario lo pida.
- NO publish real / U55 / NPM_TOKEN.
- NO push de credenciales / tokens / .env con secretos.
- Navegador: ZEUS_OPEN_BROWSER opt-in (=1); headless por defecto.
- Rama principal = main (no master).
- NO tocar U111–U114 ni diferidos U87 §5–6.

WP completo (de plan/BACKLOG.md) — post-U87; deps U62 ✅ · U87 ✅:
- Extraer @zeus/startpack-kit en games-library (packages/startpack-kit).
  Corte genérico (sin nombres exclusivos de un juego en el core del kit).
- Una sola implementación de loadStartPack (+ helpers comunes de
  lectura manifest/gamemap/presets/volumes/acta que el kit absorba).
- Los cuatro @zeus/startpack-{delta,pozo,sketch,solve-coagula} pasan a
  thin wrappers: config (packageName, game) + enrich específico;
  re-exportan loadStartPack vía kit.
- Scripts Notario / resolve-startpack / STARTPACK_GAMES siguen
  consumiendo los packs (API pública de cada pack estable).
- Sin renombres legacy/v2; sin segundo camino.
- CA:
  · grep: cero cuerpos duplicados de loadStartPack en
    packages/startpack-{delta,pozo,sketch,solve-coagula}/
    (la impl vive solo en startpack-kit);
  · los cuatro packs cargan vía kit; tests npm test -w de los cuatro
    packs verdes;
  · Notario dry / release de al menos un juego (preferible solve o
    sketch) verde;
  · README del kit; changeset si el kit es publicable (si la library
    no tiene changesets, documentar en reporte y dejar publishConfig
    alineado con los startpacks).
- Demolición: las N−1 copias de loadStartPack (y helpers duplicados
  que el kit absorba).

Alcance orientativo:
- Library: packages/startpack-kit (nuevo) + refactor de los cuatro
  startpack-* + tests kit + docs/startpacks.md / README library si
  mienten · dependencias workspace.
- Zeus: reporte + brief; puntero en plan/docs solo si hace falta.
- NO U111–U114. NO publish/U55/DNS. NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- El kit NO nombra conceptos exclusivos de un juego (grifo, cantera,
  mazePack ARG, etc.). Enrichs específicos viven en cada startpack-*.
- Pregunta obligatoria en reporte: ¿pozo/delta/sketch/solve pueden
  consumir el kit tal cual? (sí = API genérica + enrich).

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- ../Z_SDK-games-library/packages/startpack-*/index.mjs (×4)
- ../Z_SDK-games-library/scripts/{notario-release,resolve-startpack}.mjs
- ../Z_SDK-games-library/scripts/lib/startpack-games.mjs
- ../Z_SDK-games-library/docs/startpacks.md
- plan/RE-PLAN.md §higiene loadStartPack

Notas del orquestador:
- Solo U110. No abrir frente editor.
- Worktree zeus + library desde main fresco (post-U109).
- API de cada pack (loadStartPack / resolveStartPackRoot) se mantiene
  para consumidores (e2e, Notario, resolveInstalledStartPack).
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
