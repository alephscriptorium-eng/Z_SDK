# WP-U103 · docs-pages-fanzine — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok 4.5) |
| fecha | 2026-07-18 |
| rama | `wp/u103-docs-pages-fanzine` |
| commit(s) | `a6a6a75` feat(docs) · _(este reporte)_ |
| estado propuesto | listo para revisión |
| push | no intentado |

## Qué se hizo

Se añadió el workflow `.github/workflows/docs.yml` (build VitePress en
`main`/`wp/**`/PR; upload+deploy Pages solo en `main`). Se creó la piel zine
aditiva (`docs/.vitepress/theme/{index.js,custom.css}`) con tokens A-12
(Courier/mono, b/n, rayas `repeating-linear-gradient`, hover negativo,
`@media print`). Se reescribió `docs/index.md` como portada con manifiesto
y tres puertas Guía / Contratos / Juegos. `config.mjs` resuelve `base`
`/Z_SDK/` en GitHub Actions (y override `ZEUS_DOCS_BASE=Z_SDK` sin slash
inicial; evita la reescritura MSYS de `/Z_SDK/`). Estructura U41 intacta.

**Ops Pages:** el custodio confirmó (2026-07-18) que Settings → Pages →
fuente GitHub Actions ya está activo. Tras merge a `main`, el job `deploy`
debería publicar en
`https://alephscriptorium-eng.github.io/Z_SDK/`. URL viva =
verificación post-merge (este worker no push).

## Archivos tocados

- creado `.github/workflows/docs.yml` — build + deploy GitHub Pages
- creado `docs/.vitepress/theme/index.js` — extiende theme default + CSS
- creado `docs/.vitepress/theme/custom.css` — piel zine A-12
- modificado `docs/.vitepress/config.mjs` — `resolveDocsBase()` para Pages
- modificado `docs/index.md` — portada zine (manifiesto + 3 puertas)
- creado `plan/REPORTES/WP-U103-docs-pages-fanzine.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### CA — `npm run docs:build` verde

Local (`base=/`, sin `GITHUB_ACTIONS`):

```
  vitepress v1.6.4
✓ building client + server bundles...
✓ rendering pages...
build complete in 16.82s.
exit_code: 0
href="/guide/getting-started"
doors true
search true
```

Simulando CI (`GITHUB_ACTIONS=true` → `base=/Z_SDK/`):

```
build complete in 15.10s.
exit_code: 0
href sample href="/Z_SDK/guide/getting-started"
doors [ true, true, true ]
search true
API_OK  # dist/api/protocol/index.html + dist/api/editor-ui.html
```

### CA — `docs.yml` presente

```
test -f .github/workflows/docs.yml && echo docs.yml_present
docs.yml_present
```

Workflow: build siempre; `upload-pages-artifact` + `deploy-pages` solo si
`github.ref == refs/heads/main` y no es PR.

### CA — API HTML desde nav

Nav U41 intacta (`API HTML` → AsyncAPI + OpenAPI). Dist post-build:

```
docs/.vitepress/dist/api/protocol/index.html  # asyncapi
docs/.vitepress/dist/api/editor-ui.html       # openapi redoc
```

### CA — piel no rompe search/nav; contraste AA (b/n)

- Search local presente en HTML (`local-search` / DocSearch button).
- Nav Inicio / Guía / Contratos / Playbook / API HTML sin cambios de
  estructura; solo CSS aditivo.
- Tokens en CSS compilado: `Courier New`, `#000000`/`#ffffff`,
  `repeating-linear-gradient`, hover negativo, `@media print`.
- Contraste AA: tinta negra sobre papel blanco (y inverso en `.dark`).

### CA — portada tres puertas

`docs/index.md` actions + features: Guía → `/guide/getting-started`,
Contratos → `/contracts/asyncapi`, Juegos → `/games/`.

### Ops Pages (ya no bloquea)

Tick Settings → Pages → GitHub Actions: **hecho** (orquestador/usuario,
2026-07-18). URL viva post-merge:

⏳ sin verificar — requiere merge a `main` + run verde de `docs.yml`
deploy. Worker no push.

### Lint / gates

⏳ sin verificar (WP docs/theme/workflow; CA no los exige; no se tocó
código de paquetes publicables).

## Demolición

n/a (U41 se conserva entero; piel aditiva). No hubo símbolo/paquete que
borrar.

```
# sin demolición — grep N/A
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: `base` `/Z_SDK/` es path de
  Pages del repo (no puerto/room). Sin URLs de room en código nuevo.
- [x] Cadenas if/switch → tabla: N/A (CSS/markdown/yaml).
- [x] Duplicación: theme override estándar VitePress; no se reinventó el
  portal U41.
- [x] console.log / código comentado / TODO: no.
- [x] Nombres de transición (v2/old/new): no.
- [x] Demolición: n/a.
- [x] Tests: N/A (docs); CA = `docs:build` + presencia workflow.
- [ ] Arranque `docs:dev` en navegador: ⏳ sin verificar (`ZEUS_OPEN_BROWSER`
  no seteado).
- [x] README/specs: no se commitó ruido de `spec:generate` del build
  (igual que U41).
- [x] Diff solo alcance WP: sí (workflow + theme + index + config base;
  sin BACKLOG).

## Hallazgos fuera de alcance

1. En Git Bash/Windows, `ZEUS_DOCS_BASE=/Z_SDK/` se reescribe a
   `C:/Program Files/Git/Z_SDK/` (MSYS). Mitigado en `resolveDocsBase()`
   + uso de `GITHUB_ACTIONS` en CI. Candidato a nota en PRACTICAS/docs
   si otros scripts pasan paths POSIX por env en Windows.
2. `docs:build` regenera specs OpenAPI/AsyncAPI (CRLF/ruido) fuera del
   alcance del commit — ya observado en U41.
3. URL Pages viva no verificable hasta merge a `main` (worker sin push).

## Dudas / bloqueos

Ninguno que bloquee el WP. Tras merge: confirmar run Actions `Docs` verde
y abrir `https://alephscriptorium-eng.github.io/Z_SDK/`.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
