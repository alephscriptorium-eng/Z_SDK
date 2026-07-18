# Brief — WP-U107 · Catálogo público games-library

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U107 · Catálogo público de la games-library
Rama: wp/u107-games-catalog-pages
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u107-games-catalog-pages
Reporte: plan/REPORTES/WP-U107-games-catalog-pages.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U107-games-catalog-pages.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md ni backlog features delta.

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push del monorepo Z_SDK (worker). Orquestador mergea + push main.
- NO gh pr / gh pr create en Z_SDK.
- NO npm publish real / U55.
- NO push de credenciales / tokens / .env con secretos.
- SÍ permitido: commits + push al repo de la library
  (`alephscriptorium-eng/Z_SDK-games-library`) — el catálogo vive allí;
  documentar evidencia. Si auth falla → ⏳ honesto + checklist ops.
- Navegador: `ZEUS_OPEN_BROWSER` opt-in (=1); headless por defecto.
- Rama principal del monorepo = `main` (no `master`).

WP completo (de plan/BACKLOG.md) — A-14; D-23; dep U60–U62 ✅;
lote-ola9-b+catalog:
- Pages en `Z_SDK-games-library` con la misma técnica que el portal del
  monorepo (VitePress + workflow concurrency + `paths: ['docs/**']` +
  piel zine reutilizada/copiada):
  (1) **portada-catálogo** — un card por juego (delta, pozo, futuros)
      con descripción corta, cómo jugarlo/levantarlo y enlace a spec;
  (2) **sección releases** — por juego, start packs publicados
      (versión, acta Notario, `npm install @zeus/startpack-<game>`,
      enlace GitHub Release; si aún no hay → «⏳ sin releases» honesto);
  (3) **dominio custom** `games.z-sdk.escrivivir.co` (D-23) — mismo
      patrón U106.
- CA código:
  · un card por juego migrado; sección releases refleja estado real;
  · workflow solo dispara con cambios en `docs/**`;
  · piel zine (mono/b-n/rayas/print).
- CA remoto URL viva HTTPS = **tick usuario** (NO fingir verde):
  · DNS `CNAME · games.z-sdk → alephscriptorium-eng.github.io`;
  · Settings → Pages → Custom domain = `games.z-sdk.escrivivir.co`;
  · Enforce HTTPS tras propagar DNS.
  Checklist ops en el reporte; URL ⏳ hasta tick.
- Demolición: n/a.

Alcance orientativo:
- Destino: https://github.com/alephscriptorium-eng/Z_SDK-games-library
  (checkout sibling `../Z_SDK-games-library` o path documentado).
- Réplica técnica U103/U106: VitePress docs + workflow Pages + base `/`
  si custom domain; piel zine (copiar/adaptar desde monorepo docs theme).
- Monorepo Z_SDK: solo punteros/docs si hace falta; NO tocar portal
  z-sdk.escrivivir.co salvo referencia.
- NO configurar DNS ni Custom domain desde el worker (ops = tick usuario).
- NO U87 (otro worker; juego SOLVE). NO inventar startpacks falsos —
  ⏳ honesto si no hay releases.
- NO editar plan/BACKLOG.md.
- NO push de secretos.

Regla de los dos juegos (PRACTICAS §1.11):
- Catálogo nombra delta/pozo (y futuros) como productos de la library;
  cero dialectos de un solo juego en engine del monorepo.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-23 (+ A-14)
- plan/ARQUITECTURA.md §6
- plan/BACKLOG.md WP-U103 / WP-U106 (patrón Pages + custom domain)
- plan/REPORTES/WP-U103-docs-pages-fanzine.md
- plan/REPORTES/WP-U106-docs-custom-domain.md
- plan/REPORTES/WP-U60-games-library.md / WP-U62-release-pipeline.md
- Monorepo: docs/.vitepress/ (piel zine + resolveDocsBase) como plantilla
- Library: estado actual de docs/ (si existe) + startpacks publicados

Notas del orquestador:
- Lote **lote-ola9-b+catalog**: U107 ∥ U87 (paralelo; worktrees).
  Paths distintos (docs/catálogo vs juego) — no pisar carpetas de U87.
- Orden de merge sugerido si conflicto library: U107 primero → U87.
- **DNS ops = tick usuario** — checklist obligatoria en reporte; no
  marcar CA remoto verde sin evidencia.
- NO editar plan/BACKLOG.md.
- NO push monorepo / NO secretos.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
