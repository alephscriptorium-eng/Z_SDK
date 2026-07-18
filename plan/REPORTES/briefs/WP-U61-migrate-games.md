# Brief — WP-U61 · Migración de los juegos

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U61 · Migración de los juegos
Rama: wp/u61-migrate-games
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u61-migrate-games
Reporte: plan/REPORTES/WP-U61-migrate-games.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U61-migrate-games.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push del monorepo Z_SDK (worker). Orquestador mergea + push main.
- NO gh pr / gh pr create en Z_SDK.
- NO npm publish real (ni registry propio ni npmjs). U55 gated NPM_TOKEN
  — fuera de alcance; no pedirlo ni configurarlo.
- NO push de credenciales / tokens / .env con secretos (ni a Z_SDK ni a
  Z_SDK-games-library).
- SÍ permitido: commits + push al repo de la library
  (`alephscriptorium-eng/Z_SDK-games-library`) si `gh`/git auth OK;
  documentar evidencia. Si auth falla → ⏳ honesto + checklist ops.
- Navegador: `ZEUS_OPEN_BROWSER` opt-in (=1); headless por defecto.
- Rama principal del monorepo = `main` (no `master`).

WP completo (de plan/BACKLOG.md) — Ola 6; dep U60 ✅ + U51 ✅; lote-ola6-b:
- Destino library:
  https://github.com/alephscriptorium-eng/Z_SDK-games-library
  (ya existe post-U60; scaffold smoke presente).
- Mover `packages/games/delta` y `packages/games/pozo` del monorepo
  Z_SDK a la games-library (código, specs, demos, e2e de juego).
- Consumir `@zeus/*` del registry propio
  (`npm.scriptorium.escrivivir.co`, D-7). Si publish real aún ⏳
  (U105 prep ✅ pero token gated): `file:` temporal hacia el monorepo
  **documentado** en README/reporte (ruta, por qué, cómo retirar tras
  publish) — no dejar dos caminos sin explicar.
- Monorepo Z_SDK queda con engine/mesh/editor/examples (+ scripts raíz
  adaptados); workspaces/scripts/e2e raíz ya no asumen `packages/games/`.
- CA:
  · demos de ambos juegos verdes desde la library contra un mesh
    levantado del monorepo;
  · e2e de la matriz adaptados (evidencia literal en reporte).
- Demolición: `packages/games/` en el monorepo (cero árbol vivo;
  greps/scripts/docs sin referencias rotas a path viejo).

Alcance orientativo:
- Library: layout de juegos, package.json/workspaces, `.npmrc` scopes,
  CI library, demos/e2e delta+pozo.
- Monorepo: retirar `packages/games/`, actualizar workspaces, scripts
  raíz (`demo:*`, `test:arg`, e2e matriz), README/docs que apunten al
  path viejo, gates si hace falta.
- NO U62 (start packs / VOLUMES fuera). NO U55. NO publish real.
- NO editar plan/BACKLOG.md.
- NO push de secretos.

Regla de los dos juegos (PRACTICAS §1.11):
- delta Y pozo migran juntos; engine en monorepo no gana nombres de
  juego; demos/e2e de ambos verdes desde la library.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md §6 (Z_SDK-games-library)
- plan/DECISIONES.md D-7, D-10, D-11
- plan/BACKLOG.md Ola 6 + remate lote-ola6-b
- plan/REPORTES/WP-U60-games-library.md (estado scaffold library)
- packages/games/{delta,pozo}/ (origen a migrar)
- .npmrc monorepo (scopes de referencia)

Notas del orquestador:
- Lote **lote-ola6-b** (solo U61). U62 no asignar hasta U61 ✅.
- Publish real ⏳ ops — preferir registry; `file:` temporal OK si
  documentado (retiro = post-publish / U55 no es este WP).
- Trabajo cruza dos repos: commits en worktree Z_SDK + cambios en
  clone/checkout de la library. Evidencia de demos e2e en ambos lados.
- NO editar plan/BACKLOG.md.
- NO push monorepo / NO publish / NO secretos.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
