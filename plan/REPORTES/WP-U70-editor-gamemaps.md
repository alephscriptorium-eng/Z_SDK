# WP-U70 · editor-gamemaps — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (lote-ola9-a / Cursor) |
| fecha | 2026-07-18 |
| rama | `wp/u70-editor-gamemaps` (zeus) · `wp/u70-editor-gamemaps` (library worktree) |
| commit(s) | zeus: `0386b37`..`9424986` · library: `b4a8fb6` (pushed) |
| estado propuesto | listo para revisión |
| push monorepo | **no intentado** (política worker) |
| push library | OK `origin/wp/u70-editor-gamemaps` |

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
- Library: `git push -u origin HEAD` → OK (`b4a8fb6` → `origin/wp/u70-editor-gamemaps`)

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

**Aceptado ✅** (orquestador / 2026-07-18) — **sin** ✅ en `plan/BACKLOG.md`
aún (pendiente merge; ritual de esta pasada: NO merge / NO push / NO ✅
BACKLOG).

### Qué se verificó

- **Diff zeus** `main...wp/u70-editor-gamemaps` (tip `5e99b03`): editor-ui
  mundo A (`src/world/*`, `world_view`, assets), demole CRUD presets
  (`home_view`/`preset_view`/`preset-library.js`/`preset-view.css`),
  app-shell defaults nav, changeset, reporte. Sin `plan/BACKLOG.md`.
  Alcance OK (+ app-shell patch justificado).
- **Diff library** `main...wp/u70-editor-gamemaps` (`b4a8fb6`):
  `@zeus/startpack-sketch` + fila `sketch` en `STARTPACK_GAMES` + docs/npm
  script. Alcance OK.
- **CA re-ejecutado** (worktree zeus): `npm test` en
  `packages/editor/editor-ui` → `# tests 8` / `# pass 8` / `# fail 0`,
  incl. `editor world release produces installable tarball` (Notario →
  `zeus-startpack-sketch-*.tgz`).
- **Demolición:** archivos CRUD borrados; `rg preset_view|home_view|preset-library\.js|preset-view\.css`
  en editor-ui → 0 hits. `GET /presets` → 301 `/`. API `/api/presets`
  retenida a propósito (cloaks).
- **PRACTICAS:** Notario U62 reutilizado (spawn, no reinvent); catálogos
  tabla; juguete `sketch`/`juguete` (cero delta/pozo en materiales);
  commits convencionales; worker no tocó BACKLOG.
- **Sync pre-merge:** library rama va **1 commit detrás** de `main`
  (`a28b9ad` U86). Zeus rama va detrás de `main` (U86 + U108 y merges).
  Sync `main` en ambos lados antes de merge.

### Orden de merge sugerido

1. **Library:** sync `main` (U86) → `wp/u70-editor-gamemaps` → merge a
   `main` library (`b4a8fb6` + sync).
2. **Zeus:** sync `main` → `wp/u70-editor-gamemaps` → merge a `main`
   zeus.
3. Tras merges: ✅ BACKLOG U70; habilitar asignación U87; `git worktree
   remove` del worktree U70.

### Notas no bloqueantes

- `mcp-editor.js` aún redirige post-save a `/presets` (301 → `/`);
  higiene residual (hallazgo worker + settings toggle `preset-library`).
- UI visual en navegador: ⏳ (smoke HTTP + tests cubren Release).
