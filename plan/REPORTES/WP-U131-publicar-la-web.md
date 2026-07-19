# WP-U131 · publicar-la-web — reporte

| dato | valor |
| ---- | ----- |
| agente | worker · Cursor Grok |
| fecha | 2026-07-19 |
| rama zeus | `wp/u131-publicar-la-web` |
| rama library | `wp/u131-publicar-la-web` |
| commit(s) | _(hashes tras commit)_ |
| estado propuesto | listo para revisión |

## Qué se hizo

Se documentó el ciclo VitePress → Actions `docs.yml` → GitHub Pages (dominio
custom + HTTPS) y el catálogo de la library alimentado por GitHub Releases,
sin inventar pasos fuera de los workflows reales.

En zeus: página nueva `docs/guide/publicar-la-web.md` + entrada en sidebar
Guía. En library: página corta `docs/publicar-la-web.md` + entrada en sidebar
Catálogo. Estilo post-U120: cero refs WP-U## / D-## en las páginas. No se
tocó CI ni CAPA ni `release-startpack`.

## Archivos tocados

### zeus-sdk

- `docs/guide/publicar-la-web.md` — creado: doctrina operativa del portal
- `docs/.vitepress/config.mjs` — modificado: sidebar «Publicar la web»
- `plan/REPORTES/WP-U131-publicar-la-web.md` — creado: este reporte

### Z_SDK-games-library

- `docs/publicar-la-web.md` — creado: puntero corto + ciclo library
- `docs/.vitepress/config.mjs` — modificado: sidebar «Publicar la web»

## Evidencia

### Spot-check `docs.yml` (zeus) vs página

Claims de la guía vs `.github/workflows/docs.yml`:

| Claim en la página | Workflow |
| ------------------ | -------- |
| push `main` / `wp/**` + `paths: docs/**` | sí (L7–13) |
| `pull_request` solo build | sí (L14–16) |
| `workflow_dispatch` | sí (L17) |
| `npm ci` + `npm run docs:build` | sí (L33–37) |
| artefacto `docs/.vitepress/dist` | sí (L42) |
| deploy solo `main` ∧ ¬PR | sí (L39, L46) |
| environment `github-pages` | sí (L53) |

Library `docs.yml`: mismos triggers; install = `npm install` (registry
`@zeus`); mismo deploy condicional — documentado en el puntero library.

### Comandos

```
# zeus — docs:dev (smoke, puerto 3240)
> zeus-sdk@0.1.0 docs:dev
> node scripts/docs-dev.mjs --port 3240
DOCS_DEV_STARTED_OK

# library — docs:dev (smoke, puerto 3239)
> z-sdk-games-library@0.0.0 docs:dev
> vitepress dev docs --port 3239
DOCS_DEV_STARTED_OK

# library — docs:build (tras limpiar cache vitepress)
> z-sdk-games-library@0.0.0 docs:build
> vitepress build docs
✓ building client + server bundles...
✓ rendering pages...
build complete in 34.69s.
BUILD_EXIT:0
# dist: docs/.vitepress/dist/publicar-la-web.html → LIB_PAGE_OK

# zeus — npx vitepress build docs desde path largo del worktree
# → FAIL preexistente Windows (resolvePageImports / appChunk|pageChunk
#   undefined). Reproduce SIN nuestra página.
# Mitigación verificación: junction C:\u131docs → worktree
  vitepress v1.6.4
✓ building client + server bundles...
✓ rendering pages...
build complete in 31.23s.
SHORT_BUILD:0
docs/.vitepress/dist/guide/publicar-la-web.html
PAGE presentes: publicar-la-web.html → ZEUS_PAGE_OK

# zeus — main checkout (sin nuestros cambios): docs:build vitepress OK
MAIN_BUILD:0 (control: el fallo es path/worktree Windows, no el contenido)
```

`npm run docs:build` completo en zeus (specs + redoc + asyncapi + vitepress):
la fase de specs/redoc/asyncapi corrió verde en el worktree; el fallo quedó
solo en el paso VitePress por path largo del worktree. En CI (ubuntu) el
mismo workflow no usa ese path. Página presente en `dist` tras build vía
junction.

### Refs WP/D en páginas nuevas

```
rg -n "WP-U|D-[0-9]" docs/guide/publicar-la-web.md → NO_WP_D_REFS (zeus)
rg -n "WP-U|D-[0-9]" docs/publicar-la-web.md → NO_WP_D_REFS (library)
```

## Demolición

N/A (docs nuevas).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: docs citan dominios y puerto
      ejemplo 3230 (excepción PRACTICAS §1.1 para docs). Sin rooms.
- [x] Cadenas if/switch que debieron ser tabla: N/A (markdown)
- [x] Duplicación con otros paquetes: N/A; puntero library deliberadamente
      corto y enlaza la doctrina zeus
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no (sin legacy/v2/old)
- [x] Demolición completa: N/A
- [x] Tests prueban comportamiento: N/A (WP docs); CA = build + spot-check
- [x] Arranque real: `docs:dev` smoke en ambos; `docs:build` library verde;
      zeus vitepress verde vía junction (worktree path largo falla en Windows)
- [x] README/specs: no tocados a propósito
- [x] El diff contiene solo el alcance del WP: sí (docs + sidebar + reporte)

## Hallazgos fuera de alcance

1. **VitePress `resolvePageImports` falla en worktrees Windows con path
   largo** (`.worktrees/wp-u131-…`). Reproduce sin cambios de este WP. Build
   OK en checkout `main` y vía junction corto. Candidato a nota ops / gate
   local, no bloquea CI ubuntu.
2. **Library no ignora `docs/.vitepress/cache/`** en `.gitignore` (zeus sí).
   Apareció untracked tras el build; no se commitó.
3. Primer `docs:build` library falló con el mismo error hasta
   `rm -rf docs/.vitepress/cache` — cache corrupta/stale en Windows.

## Dudas / bloqueos

Ninguno que bloquee revisión. Ops DNS/Custom domain/Enforce HTTPS siguen
siendo tick usuario (ya documentados como ops, no CA de código).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
