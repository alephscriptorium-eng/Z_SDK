# Brief — WP-U105 · Publish prep `engine/*`

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U105 · Publish prep `engine/*`
Rama: wp/u105-publish-prep
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u105-publish-prep
Reporte: plan/REPORTES/WP-U105-publish-prep.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U105-publish-prep.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura) — OBLIGATORIA en este WP:
- NO git push del monorepo (worker). Orquestador mergea + push.
- NO gh pr / gh pr create (salvo que el CA pida árbol/PR de versión
  changesets: entonces crear la rama de versión local; PR remoto = ⏳
  ops/orquestador si no hay push worker).
- NO npm publish real (ni registry propio ni npmjs).
- NO configurar / subir tokens `NPM_TOKEN` ni credenciales de registry.
- Solo prep: `npm run release:dry` verde; changeset(s) + versión
  lockstep 0.x lista; documentar ⏳ publish real (ops).
- Navegador: `ZEUS_OPEN_BROWSER` opt-in (=1); headless por defecto.

WP completo (de plan/BACKLOG.md) — D-22 frente (2); post U104 ✅:
- Dejar el release listo sin publish real.
- `npm run release:dry` verde sobre `main` actual (en el worktree).
- Changeset(s) + árbol/PR de versión lockstep 0.x preparada
  (`changeset` / `version-packages` según PRACTICAS + U53).
- Juegos **NO** se publican (ola 6 / games-library).
- Publish real al registry D-7 = **gated ops**
  (`npm.scriptorium.escrivivir.co` + secret `NPM_TOKEN`) — no es CA
  del swarm; cuando pase → desbloquea **U55**.
- CA:
  · `release:dry` verde;
  · árbol/PR de versión changesets listo para merge;
  · reporte documenta ⏳ publish real (ops).
- Demolición: n/a (prep; no dos caminos de release).

Alcance orientativo:
- Scripts: `release:dry`, `release:changeset-dry`, changesets en
  `.changeset/`, `packages/engine/*/package.json`.
- Cola residual: `release:changeset-dry` / linea-kit `exports ./schemas/*`
  si bloquean dry — arreglar solo lo necesario para CA.
- NO U55 (demoler `file:`). NO publish real.
- NO editar plan/BACKLOG.md.
- NO push.

Regla de los dos juegos (PRACTICAS §1.11):
- No introducir nombres de juego en paquetes engine al tocar
  package.json / README; `gates` verde si se toca código.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md §5 (monorepo publicable)
- plan/DECISIONES.md D-7 (registry), D-22 frente (2)
- plan/BACKLOG.md WP-U50 (baseline publishConfig) + U53 + U105
- package.json scripts `release:dry`, `changeset`, `version-packages`
- scripts/release-dry.mjs, scripts/release-changeset-dry.mjs
- .changeset/

Notas del orquestador:
- Lote D-22 post-U104: **U60 ∥ U105 ∥ U106** (paralelo; worktrees).
- Rama principal = `main`.
- U55 sigue pausado hasta publish real ops — no lo abras.
- Si `release:dry` ya verde y solo faltan changesets de versión,
  documentar estado + entregar el changeset; no reinventar pipeline.
- NO editar plan/BACKLOG.md.
- NO push / NO publish real.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
