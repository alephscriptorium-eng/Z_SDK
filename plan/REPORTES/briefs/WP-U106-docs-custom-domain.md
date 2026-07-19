# Brief — WP-U106 · Dominio custom Pages (`z-sdk.escrivivir.co`)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U106 · Dominio custom Pages (`z-sdk.escrivivir.co`)
Rama: wp/u106-docs-custom-domain
Worktree: .worktrees/wp-u106-docs-custom-domain
Reporte: plan/REPORTES/WP-U106-docs-custom-domain.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U106-docs-custom-domain.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push (worker). Orquestador hará merge a main + push después.
- NO gh pr / gh pr create.
- NO npm publish real.
- NO tocar Settings de GitHub Pages ni DNS del dominio (ops usuario).
- Navegador: `ZEUS_OPEN_BROWSER` opt-in (=1); headless por defecto.

WP completo (de plan/BACKLOG.md) — D-22 frente (5); dep U103 ✅ U104 ✅:
- Las docs pasan de
  `https://alephscriptorium-eng.github.io/Z_SDK/` a
  `https://z-sdk.escrivivir.co/` (hostname con guion medio).
- Lado repo (código = CA de swarm):
  (1) VitePress: `base` de `/Z_SDK/` → `/` en
      `docs/.vitepress/config.mjs` (`resolveDocsBase()` / Actions);
      verificar links absolutos API HTML.
  (2) En el reporte: documentar registro DNS para el usuario:
      `CNAME` · host `z-sdk` · valor `alephscriptorium-eng.github.io`.
- Ops usuario = **tick** (NO CA código solo; checklist en reporte):
  · DNS CNAME como arriba;
  · Settings → Pages → Custom domain = `z-sdk.escrivivir.co`;
  · tras propagar DNS, Enforce HTTPS.
  GitHub mantiene CNAME del artefacto de deploy.
- CA:
  · código: build docs con base `/` verde; nav + API HTML intactos;
  · URL viva `https://z-sdk.escrivivir.co/` 200 + HTTPS = ⏳ hasta tick
    usuario (documentar checklist; no fingir verde remoto).
- Demolición: `base: /Z_SDK/` hardwired para Pages (path de proyecto
  deja de aplicar con custom domain).

Alcance orientativo:
- `docs/.vitepress/config.mjs` (`resolveDocsBase`), links absolutos
  en docs si apuntan a `/Z_SDK/…`.
- NO tocar `.github/workflows/docs.yml` path-filters (U104 ya ✅) salvo
  evidencia de rotura por base.
- NO configurar DNS ni Custom domain desde el worker.
- NO editar plan/BACKLOG.md.
- NO push.

Regla de los dos juegos (PRACTICAS §1.11):
- n/a (docs portal; no código de juego).

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- docs/.vitepress/config.mjs (`resolveDocsBase`)
- plan/DECISIONES.md D-22 frente (5) + addendum hostname
- plan/BACKLOG.md WP-U103 (baseline Pages) + WP-U106
- plan/REPORTES/WP-U103-docs-pages-fanzine.md (si existe)

Notas del orquestador:
- Lote D-22 post-U104: **U60 ∥ U105 ∥ U106** (paralelo; worktrees).
- Rama principal = `main`.
- U104 ya filtró `docs.yml` — este WP solo base `/` + doc ops.
- Tick usuario DNS + Custom domain HTTPS = fuera de código; el reporte
  deja checklist claro.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
