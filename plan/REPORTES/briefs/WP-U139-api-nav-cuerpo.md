# Brief — WP-U139 · Links `/api/` en cuerpo md 404ean (SPA)

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: **D-30** · GO **usuario** (ADDENDA 2026-07-19c). Seguimiento
U138 ✅ (nav OK). **No reabrir U138.** Hallazgo vigilante + pase
custodio; **GO ≠ vigilante**. Repo: **zeus-sdk**.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U139 · Cuerpo md → enlaces /api/ externos al router SPA
Rama: wp/u139-api-nav-cuerpo
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u139-api-nav-cuerpo
Reporte: plan/REPORTES/WP-U139-api-nav-cuerpo.md

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero — §8 C8 (navegación real, no curl).
Reporte desde plan/REPORTES/PLANTILLA.md.
Commits convencionales. NO merge a main. NO ✅ BACKLOG.

Fuente (leer; NO copiar a plan/):
C:\Users\aleph\SCRIPT_SDK\ADDENDA\ENTREGA-2026-07-19c-bug-api-nav-cuerpo.md

Problema:
- U138 puso target=_blank en los 6 items del NAV → OK.
- Mismos .html enlazados desde CUERPO markdown SIN target → router SPA
  intercepta → 404 al clic (confirmado en contracts/openapi tabla).
- Superficies ADDENDA (3):
  - docs/contracts/openapi.md (tabla 5 OpenAPI .html)
  - docs/contracts/asyncapi.md (/api/protocol/)
  - docs/editor/index.md (/api/editor-ui.html)
- CA CLASE (residual U138 + vigilante): también mesh/index.md y
  engine/protocol.md — grep control en TODO docs/**:
  cero href="/api/" (o md → /api/) sin target.

Fix (mismo trato que nav U138):
- Sustituir [texto](/api/…) por HTML inline:
  <a href="/api/…html" target="_blank" rel="noreferrer">texto</a>
  (o mecanismo VitePress equivalente). Cubrir TODAS las superficies
  que fallen el grep de clase.

CA verificables:
1. Grep control: docs/** — 0 href="/api/" sin target (nav+cuerpo).
2. Navegación real (Playwright/clic) en links /api/ del cuerpo de las
   páginas tocadas → cero 404.
3. npm run docs:build verde.
4. git diff acotado a los .md de cuerpo (+ reporte; PRACTICAS solo si
   amplías nota C8 cuerpo/clase).

Demolición: links md que tratan assets estáticos /api/*.html como
rutas VitePress in-app.

Evidencia CI: tras push, gh run list --branch wp/u139-api-nav-cuerpo
→ run_id/conclusion (Docs toca docs/**). Protocolo Actions U135.

Empieza: worktree, PRACTICAS, fix, verifica CA (grep + clic real),
reporta, push rama. NO merge.
```
