# Brief — WP-U138 · Menú «API HTML» 404ea (SPA vs assets)

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: **D-29** · GO **usuario** (ADDENDA 2026-07-19b). Hallazgo
reproducible (usuario + vigilante); **GO ≠ vigilante**.
Repo: **zeus-sdk**. Library: verificar sin `/api/` en nav → N/A código.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U138 · Nav API HTML → enlaces externos al router SPA
Rama: wp/u138-api-nav-spa
Worktree: .worktrees/wp-u138-api-nav-spa
Reporte: plan/REPORTES/WP-U138-api-nav-spa.md

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero — §8 C8 obligatorio (ampliar según CA).
Reporte desde plan/REPORTES/PLANTILLA.md.
Commits convencionales. NO merge a main. NO ✅ BACKLOG.

Fuente (leer; NO copiar a plan/):
nota externa recibida (temp-review, 2026-07-19) (`ENTREGA-2026-07-19b-bug-api-nav.md`)

Problema:
- Clic en menú «API HTML» (6 items: protocol/, editor-ui.html,
  player-ui.html, cache-browser.html, firehose-browser.html,
  mcp-http.html) → 404 cliente.
- curl a esas rutas → 200 (assets en docs/public/api/*.html existen).
- Causa: cleanUrls: true + router SPA intercepta; busca página VitePress
  inexistente. NO desactivar cleanUrls global.

Fix (idiomático VitePress):
- Tratar los 6 items como enlaces EXTERNOS al router — p.ej.
  target: '_blank' (+ rel: 'noopener noreferrer') en
  docs/.vitepress/config.mjs nav «API HTML».
- Ampliar PRACTICAS §8 C8: enlace de nav a asset estático se verifica
  NAVEGÁNDOLO (clic/SPA), no solo con curl — «canal de verificación =
  canal de uso».
- Library: confirmar que no enlaza /api/ → no tocar.

CA verificables:
1. Navegación real (browser / e2e headless / check manual anotado) de
   los 6 items → cada uno abre su documento, cero 404.
2. npm run docs:build verde (zeus).
3. git diff acotado a config.mjs + PRACTICAS.md (+ reporte).
4. Library: rg nav/api → 0 cambios si no aplica.

Demolición: nav que trata Redoc/OpenAPI estáticos como páginas VitePress.

Evidencia CI: tras push, gh run list --branch wp/u138-api-nav-spa
→ run_id/conclusion (Docs toca docs/**).

Empieza: worktree, PRACTICAS, fix, verifica CA (navegación real),
reporta, push rama. NO merge.
```
