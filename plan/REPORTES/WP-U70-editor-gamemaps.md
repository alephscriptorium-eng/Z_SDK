# WP-U70 · editor-gamemaps — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (lote-ola9-a / Cursor) |
| fecha | 2026-07-18 |
| rama | `wp/u70-editor-gamemaps` (zeus) · `wp/u70-editor-gamemaps` (library worktree) |
| commit(s) | _(ver git log en entrega)_ |
| estado propuesto | listo para revisión |
| push monorepo | **no intentado** (política worker) |
| push library | _(documentar en evidencia)_ |

## Qué se hizo

Se evolucionó `@zeus/editor-ui` de CRUD de presets a editor del mundo A:
borrador con escena (`vaiven-dos-nodos`), labelset, línea juguete
(`createLineaJuguete`), casos (`playbook-kit`) y cloaks opcionales (presets).
El botón/API `Release` materializa `@zeus/startpack-sketch` en la
games-library y dispara el Notario de WP-U62 (`scripts/notario-release.mjs`).
En la library se añadió el startpack `sketch` a la tabla `STARTPACK_GAMES`.
Se demoleron las vistas CRUD `/presets` (home + preset library) y assets
asociados; `/presets` redirige a `/`; el explorador MCP vive en `/cloaks`.

## Archivos tocados

### Zeus (`wp/u70-editor-gamemaps`)

| archivo | acción |
| ------- | ------ |
| `packages/editor/editor-ui/src/world/*` | creado — materials, draft, materialize, notario, routes |
| `packages/editor/editor-ui/src/views/world_view.mjs` | creado — UI mundo A |
| `packages/editor/editor-ui/assets/js/world-editor.js` + CSS | creado |
| `packages/editor/editor-ui/src/server.mjs` | modificado — world + /cloaks; demuele /presets |
| `packages/editor/editor-ui/src/{config,contract}.mjs` + `config.json` | modificado |
| `packages/editor/editor-ui/spec/openapi.yaml` | regenerado |
| `packages/editor/editor-ui/test/*` | modificado/creado — CA release tarball |
| `packages/editor/editor-ui/README.md` | creado |
| `packages/editor/editor-ui/src/views/{home,preset}_view.mjs` | **borrado** |
| `assets/js/preset-library.js`, `assets/styles/preset-view.css` | **borrado** |
| `packages/engine/app-shell/.../create-app-config.mjs` | defaults nav World/Cloaks |
| `.changeset/wp-u70-editor-world.md` | changeset app-shell patch |

### Library (`Z_SDK-games-library-u70` / rama `wp/u70-editor-gamemaps`)

| archivo | acción |
| ------- | ------ |
| `packages/startpack-sketch/**` | creado — pack mínimo sketch |
| `scripts/lib/startpack-games.mjs` | fila `sketch` en tabla |
| `package.json` / `docs/startpacks.md` | test:startpack + docs |

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### editor-ui tests

```
# tests 8
# pass 8
# fail 0
```

Incluye `editor world release produces installable tarball` → Notario +
`zeus-startpack-sketch-*.tgz`.

### gates / lint (zeus worktree)

```
gates: OK (0 offenders)
npm run lint → 0 errors (11 warnings preexistentes)
```

### Library — unit startpack-sketch + Notario

```
# tests 1
# pass 1
# fail 0

tarball: .../Z_SDK-games-library-u70/.release-startpack/zeus-startpack-sketch-0.1.0.tgz
✅ Notario done
game=sketch package=@zeus/startpack-sketch version=0.1.0
```

### CA instalable (npm install tarball)

```
npm install ./zeus-startpack-sketch-0.1.0.tgz → OK
loadStartPack → OK sketch sketch-demo labelset scene=vaiven-dos-nodos casos=C-01
```

### Arranque UI

```
⏳ sin verificar visualmente en navegador (ZEUS_OPEN_BROWSER no usado).
Smoke GET / matchea World Editor / Release; GET /cloaks 200 en tests.
```

### Push

- Zeus rama: **no intentado** (política)
- Library: ver §entrega al commit (intentado solo si auth OK)

### ¿pozo puede consumir esto tal cual?

El editor/pack `sketch` es juguete del mundo A, no sustituye startpacks
delta/pozo. El pipeline Notario es el mismo (tabla `STARTPACK_GAMES`); pozo
sigue con `--game pozo`. El editor no nombra delta/pozo en código de
materiales (solo `sketch` / `juguete` / escena engine).

## Demolición

Vistas CRUD sustituidas:

- `src/views/preset_view.mjs` — borrado
- `src/views/home_view.mjs` — borrado (landing presets)
- `assets/js/preset-library.js` — borrado
- `assets/styles/preset-view.css` — borrado
- `GET /presets` → 301 `/`

```
rg preset_view|home_view|preset-library\.js|preset-view\.css packages/editor/editor-ui
# solo menciones documentales (world_view comentario) + toggle settings id preset-library
```

API `/api/presets` se conserva: cloaks = presets (seleccionables en el world editor).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas hardcodeados: no; puertos vía env/app-shell;
  library vía `ZEUS_GAMES_LIBRARY_ROOT` o sibling discovery.
- [x] if/switch → tabla: `SCENE_CATALOG` / `LINE_CATALOG` / `STARTPACK_GAMES`.
- [x] Duplicación: reusa game-engine escena, linea-kit starterkit, playbook-kit,
  Notario U62 (no reimplementado).
- [x] console.log depuración / TODO: no añadidos de depuración.
- [x] Nombres de transición: no `legacy`/`v2`/`old`.
- [x] Demolición vistas CRUD: sí (grep arriba); API presets retenida a propósito.
- [x] Tests de comportamiento: draft→pack; release→tarball; loadStartPack.
- [x] Arranque real: smoke HTTP; Notario real; ⏳ UI visual browser.
- [x] README/openapi regenerados.
- [x] Diff = alcance U70 (+ app-shell defaults + changeset).

## Hallazgos fuera de alcance

- `settings_view` aún expone toggle HTML `preset-library` (feature flag UI);
  no bloquea CA; candidato higiene.
- APP_DEFAULTS de otros UIs en app-shell intactos; solo bloque `editor`.
- Library worktree separado `Z_SDK-games-library-u70` porque el checkout
  principal estaba en `wp/u86-carpeta-dramaturgo` (paralelo lote-ola9-a).
- Labelset/cloaks aún no son tipos engine: viven en seeds del pack.

## Dudas / bloqueos

Ninguno que bloquee CA. U87 / U86 no tocados.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
