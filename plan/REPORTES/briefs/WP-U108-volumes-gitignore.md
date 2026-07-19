# Brief — WP-U108 · Candado VOLUMES / gitignore fixtures

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

Origen: addenda A-15 (`nota externa recibida (temp-review, 2026-07-19)` (`A-15-gitignore-volumes-desprotegido.md`)).
**Prioridad ALTA / urgente** (repo público + datos reales trackeables).

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U108 · Candado VOLUMES / gitignore fixtures
Rama: wp/u108-volumes-gitignore
Worktree: .worktrees/wp-u108-volumes-gitignore
Reporte: plan/REPORTES/WP-U108-volumes-gitignore.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U108-volumes-gitignore.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push del monorepo Z_SDK (worker). Orquestador mergea + push main.
- NO gh pr / gh pr create en Z_SDK.
- NO publish real / U55 / NPM_TOKEN.
- NO push de credenciales / tokens / .env con secretos.
- Navegador: n/a (micro gitignore).
- Rama principal del monorepo = `main` (no `master`).
- NO tocar worktrees/ramas U70 ni U86 (lote-ola9-a en vuelo).

WP completo (de plan/BACKLOG.md + A-15 §WP) — residual post-U62; dep U62 ✅:
- El `.gitignore` des-ignora `!VOLUMES/DISK_02/**` y `!VOLUMES/DISK_03/**`
  **enteros**. En checkout local hay ~20 MB de datos de caso REALES
  (p.ej. `DISK_02/LINEAS/espana/…`, `DISK_03/FORCES/forces/force-a..g`)
  sin trackear pero **trackeables**: un `git add VOLUMES/` los publicaría.
  El reporte U62 los daba por «gitignorados» — falso.
- Acotar la whitelist a subpaths exactos de fixture (ajustar a
  `git ls-files VOLUMES/` real). Lista orientativa A-15:
  · `!VOLUMES/DISK_02/LINEAS/demo/**`
  · `!VOLUMES/DISK_02/LINEAS/registry.yaml`
  · `!VOLUMES/DISK_03/FORCES/forces/force-sample/**`
  · `!VOLUMES/DISK_03/FORCES/cotas/sima/**` (si está trackeado)
  · `!VOLUMES/DISK_03/FORCES/registry.json`
  · conservar `!VOLUMES/README.md` y `!VOLUMES/volumes.json`
- Corregir docs/frase del reporte U62 (u otras docs) que digan que los
  datos vivos están gitignorados — honestidad.
- CA:
  · `git check-ignore -v` sobre rutas vivas (espana, force-a..g, etc.)
    → IGNORADO;
  · `git add VOLUMES/ --dry-run` no añade nada fuera de fixtures ya
    trackeados;
  · `git ls-files VOLUMES/` sin cambios (fixtures siguen trackeados);
  · tests que usan fixtures siguen verdes;
  · status limpio respecto a datos vivos (no aparecen como untracked
    «añadibles» sin ignore).
- Demolición: las dos wildcards anchas `!VOLUMES/DISK_02/**` y
  `!VOLUMES/DISK_03/**` (y equivalentes que blanqueen el disco entero).

Alcance orientativo:
- Micro: `.gitignore` (+ docs/reporte U62 / VOLUMES/README si mienten).
- Verificar lista real: `git ls-files VOLUMES/` — no adivinar; incluir
  todo fixture trackeado (incl. cotas/sima si aplica).
- NO tocar pipeline startpack, Notario, games-library, editor, dramaturgia.
- NO U70 / U86 / U107 / U55.
- NO editar plan/BACKLOG.md.
- NO `git add VOLUMES/` de datos reales en el propio fix (ironía).
- Evidencia literal: check-ignore, dry-run, ls-files, status, tests.

Regla de los dos juegos (PRACTICAS §1.11):
- n/a (solo gitignore + docs honestas).

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- .gitignore (bloque VOLUMES)
- `git ls-files VOLUMES/`
- plan/REPORTES/WP-U62-release-pipeline.md (frase a corregir si miente)
- VOLUMES/README.md
- Addenda A-15 (origen)

Notas del orquestador:
- **Urgente** — exposición de datos de caso en repo público. Paralelizable
  con lote-ola9-a; NO solapa zonas U70/U86.
- U107 (A-14) sigue ⬜ — no re-hacer / no tocar.
- Worktree listo en `.worktrees/wp-u108-volumes-gitignore`.
- NO editar plan/BACKLOG.md.
- NO push monorepo.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
