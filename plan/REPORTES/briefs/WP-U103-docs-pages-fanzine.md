# Brief — WP-U103 · Docs públicas: Pages + piel zine

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U103 · Docs públicas: Pages + piel zine
Rama: wp/u103-docs-pages-fanzine
Worktree: .worktrees/wp-u103-docs-pages-fanzine
Reporte: plan/REPORTES/WP-U103-docs-pages-fanzine.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en main).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U103-docs-pages-fanzine.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push (worker). Orquestador hará merge a main + push después.
- NO gh pr / gh pr create.
- NO npm publish real.
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.
- NO activar GitHub Pages en Settings (ops del custodio; tick usuario).

WP completo (de plan/BACKLOG.md) — A-12; cierre natural de U41 ✅:
- Portal VitePress U41 existe (`docs/` + `.vitepress/config.mjs`) y
  `npm run docs:build` ya era CA de U41. Falta publish + identidad.
- Tres piezas:
  (1) workflow `.github/workflows/docs.yml` — build VitePress + deploy
      GitHub Pages (fuente «GitHub Actions»).
  (2) piel zine — `docs/.vitepress/theme/custom.css` (tokens: mono
      Courier/sistema, b/n puro, grises mínimos, rayas diagonales
      `repeating-linear-gradient`, hover negativo, `@media print`).
      Aditiva: NO sustituir VitePress ni reestructurar U41.
  (3) portada zine — `docs/index.md` como cover: título grande,
      manifiesto 3-4 líneas (SDK, contrato único, dos juegos), tres
      puertas Guía / Contratos / Juegos.
- CA código: `docs:build` verde en CI; `docs.yml` presente/verde; API
  HTML (AsyncAPI+OpenAPI) desde nav; contraste AA; piel no rompe
  búsqueda ni nav VitePress.
- Ops usuario (NO CA código): Settings → Pages → GitHub Actions.
  URL viva = verificación final tras el tick del custodio.
- Demolición: n/a (U41 entero; piel aditiva).

Alcance orientativo:
- Solo docs portal + workflow Pages + theme CSS + index cover.
- NO tocar tests herméticos / U102 / CI matriz de workspaces.
- NO tocar plan/BACKLOG.md.
- NO push hasta merge (worker no push).
- NO activar Pages tú (UI Settings = custodio).

Regla de los dos juegos (PRACTICAS §1.11):
- Manifiesto/portada puede nombrar delta y pozo como prueba de que el
  engine sirve a ambos (ya en portal U41). Cero dialectos de un solo
  juego en engine.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- docs/.vitepress/config.mjs (nav API HTML ya cableado)
- docs/index.md (home actual; reescribir como cover zine)
- package.json scripts `docs:build` / `docs:dev`
- .github/workflows/ci.yml y release.yml (patrón; NO hay docs.yml aún)
- plan/BACKLOG.md cola hallazgos ola 4 (U41 ✅ → U103)

Notas del orquestador:
- Origen: addenda A-12. Paralelizable con U102 (paths distintos;
  U102 = tests 4 WS; U103 = docs + docs.yml). NO interrumpir U102.
- Rama principal del repo = `main` (no master).
- Preguntas CA: ¿`npm run docs:build` verde? ¿`docs.yml` en tree?
  ¿piel vía custom.css sin romper search/nav? ¿portada con 3 puertas?
  Evidencia literal. URL Pages viva = post tick usuario Settings.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
