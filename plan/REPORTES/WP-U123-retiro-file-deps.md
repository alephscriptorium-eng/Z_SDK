# WP-U123 · retiro-file-deps — reporte

| dato | valor |
| ---- | ----- |
| agente | orquestador→worker (chat GO U55+U123) |
| fecha | 2026-07-18 |
| rama | `wp/u123-retiro-file-deps` (zeus + library) |
| commit(s) | _(library + reporte zeus)_ |
| estado propuesto | listo para revisión |

## Qué se hizo

Se retiró el puente `file:`/`.deps` de **Z_SDK-games-library** como camino
de `npm install`. Los juegos resuelven `@zeus/*` desde el registry D-7.
Se eliminó `preinstall` que forzaba `ensure-zeus-sdk`. **Criterio `.deps`:**
**fallback DEV documentado** — `setup:zeus-sdk` / `ZEUS_SDK_ROOT` /
sibling siguen para demos/e2e que spawnean mesh no publicado; no son
deps npm. Se quitó `@zeus/webrtc-viewer` del package.json de arg-console
(no está en registry; se sirve vía `monorepoRoot`). Se añadió
`@zeus/story-board-schema@0.2.0` en raíz para carpeta-dramaturgo.
Bug latente `defaultDataDir` en arg-console → `resolveDataDir()`.

## Archivos tocados (library)

| archivo | acción |
| ------- | ------ |
| `package.json` | modificado — sin file:; + story-board-schema; sin preinstall |
| `package-lock.json` | regenerado — registry |
| `packages/delta/arg-console/package.json` | sin webrtc-viewer |
| `packages/delta/arg-console/src/{config,server}.mjs` | resolveDataDir |
| `scripts/ensure-zeus-sdk.mjs`, `zeus-sdk-root.cjs`, `build-zeus-overrides.mjs` | prosa fallback DEV + candidatos worktree |
| `README.md`, `docs/index.md`, `docs/games/delta.md` | registry + fallback |
| `.github/workflows/{ci,docs,release-startpack}.yml` | install registry primero |

## Evidencia

### Install limpio sin `file:`

```
rm -rf node_modules package-lock.json && npm install
added 433 packages … exit 0
rg '"file:' package.json packages/**/package.json → NO_FILE_DEPS_OK
rg '"file:' package-lock.json → NO_FILE (tras regen)
```

### `npm test` (library worktree)

```
arg-domain 72 pass · arg-feeds 4 · arg-console 32 · arg-player-mcp 22
pozo 9 · solve-coagula 8 · startpack* · carpeta-dramaturgo OK
EXIT:0
```

### Fallback `.deps`

Documentado en README / docs: default = registry; demos/e2e =
`resolveZeusSdkRoot()` (sibling / ZEUS_SDK_ROOT / setup opcional).

## Demolición

- Deps `file:.deps/zeus-sdk/...` en package.json raíz — demolidas.
- `preinstall` → `ensure-zeus-sdk` — demolido.
- Prosa «modo provisional file:» en docs — sustituida.

```
rg '"file:' package.json
# (no matches)
```

## Auto-revisión (PRACTICAS.md §3)

- [x] Puertos hardcodeados: no tocados.
- [x] if/switch: n/a.
- [x] Duplicación: no.
- [x] console.log/TODO: no.
- [x] Nombres transición: no (`fallback DEV` en docs, no en código).
- [x] Demolición file: install: sí.
- [x] Tests verdes: sí (EXIT 0).
- [x] Arranque: install+test; demos e2e mesh ⏳ dependen de sibling
  (documentado).
- [x] README/docs actualizados.
- [x] Diff = U123 (+ fix defaultDataDir necesario para CA test).

## Hallazgos fuera de alcance

1. Mesh no publicado: demos siguen necesitando monorepo (fallback).
2. Publish mesh completo → residual post-U55/U123.
3. `build:zeus-overrides.mjs` queda como herramienta DEV (no camino default).

## Dudas / bloqueos

Ninguno.

---

## Revisión del orquestador

_(pendiente)_
