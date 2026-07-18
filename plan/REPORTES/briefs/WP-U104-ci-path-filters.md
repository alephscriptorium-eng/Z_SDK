# Brief — WP-U104 · Economía de builds (paths CI)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U104 · Economía de builds (paths CI)
Rama: wp/u104-ci-path-filters
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u104-ci-path-filters
Reporte: plan/REPORTES/WP-U104-ci-path-filters.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U104-ci-path-filters.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push (worker). Orquestador hará merge a main + push después.
- NO gh pr / gh pr create.
- NO npm publish real.
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — D-22 frente (1); remate post-docs:
- `concurrency` + `cancel-in-progress` ya ✅ en ci.yml / release.yml /
  docs.yml. Falta la mitad que más ahorra: filtros de paths.
- Cambios exactos:
  · `.github/workflows/ci.yml` — bajo `on.push` (y PR si aplica):
    `paths-ignore: ['plan/**', '**.md']` para que bookkeeping del plan
    no dispare la matriz ~31 jobs.
  · `.github/workflows/release.yml` — no en cada push a main:
    `paths: ['.changeset/**', 'packages/**']` (o equivalente que solo
    dispare al mergear PR de versión changesets). Conservar condición
    de secrets / quality si ya existe.
  · `.github/workflows/docs.yml` — `paths: ['docs/**']` + conservar
    `workflow_dispatch` para publicar a mano.
- CA (literal):
  · un commit que solo toque `plan/*.md` dispara **cero** jobs de esos
    tres workflows;
  · un cambio en `packages/**` sigue disparando CI completo;
  · docs solo construye cuando cambia `docs/**` (o `workflow_dispatch`).
- Demolición: triggers anchos que hacen correr CI/release/docs en
  pushes de solo plan/markdown.

Alcance orientativo:
- Solo los tres YAML de `.github/workflows/`.
- NO tocar código de paquetes, tests, docs de contenido, changesets.
- NO tocar plan/BACKLOG.md.
- NO push.
- Evidencia: mostrar el YAML resultante + razonamiento / simulación de
  qué paths disparan qué; si no se puede verificar en Actions remoto,
  documentar ⏳ honesto + checklist de verificación post-merge.

Regla de los dos juegos (PRACTICAS §1.11):
- n/a (solo workflows).

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- .github/workflows/ci.yml
- .github/workflows/release.yml
- .github/workflows/docs.yml
- plan/DECISIONES.md D-22
- plan/BACKLOG.md remate 2026-07-18b + entrada WP-U104

Notas del orquestador:
- Lote inmediato post-docs: **solo U104**. Tras merge → lote U60 ∥ U105.
- Rama principal del repo = `main` (no master).
- Cuidado: `paths-ignore` en `pull_request` — alinear con push para que
  PRs solo-plan tampoco gasten matriz; no romper PRs que toquen código.
- `**.md` en paths-ignore: verificar sintaxis GitHub Actions (glob);
  si el glob no cubre bien, preferir lista explícita documentada.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
