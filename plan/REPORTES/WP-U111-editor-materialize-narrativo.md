# WP-U111 · editor-materialize-narrativo — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (frente editor / Cursor) |
| fecha | 2026-07-18 |
| rama | `wp/u111-editor-materialize-narrativo` (zeus) · `wp/u111-editor-materialize-narrativo` (library) |
| commit(s) | _(hashes al push)_ |
| estado propuesto | listo para revisión |

## Qué se hizo

Se demoleró el hard-gate `gameId === 'sketch'` en `validateDraft` /
`materializeStartPack`. El catálogo del editor pasa a tabla
`GAME_CATALOG` (`sketch` = toy preset; `plaza` = narrative). El camino
narrativo exige story-board dialecto mínimo `solve-inline` (actos /
widgets; carpeta U86) y materializa `@zeus/startpack-plaza` con
story-board, uichain stubs (panel-seed / panel-reic), agentchain stub,
línea juguete y casos. En library: nuevo startpack + fila
`STARTPACK_GAMES` + docs. Sketch sigue como plantilla, no como techo.

## Archivos tocados

### Zeus (`wp/u111-editor-materialize-narrativo`)

| archivo | acción |
| ------- | ------ |
| `packages/editor/editor-ui/src/world/materials.mjs` | modificado — GAME_CATALOG + plaza + storyBoard |
| `packages/editor/editor-ui/src/world/story-board-min.mjs` | creado — validate solve-inline mínimo |
| `packages/editor/editor-ui/src/world/materialize-pack.mjs` | modificado — MATERIALIZERS toy/narrative |
| `packages/editor/editor-ui/src/views/world_view.mjs` | modificado — campo story-board |
| `packages/editor/editor-ui/assets/js/world-editor.js` | modificado — sync narrativo |
| `packages/editor/editor-ui/test/world-draft.test.mjs` | modificado — CA plaza + demolición gate |
| `packages/editor/editor-ui/test/routes.mjs` | modificado — release plaza tarball |
| `packages/editor/editor-ui/README.md` | modificado — catálogo veraz |
| `packages/editor/editor-ui/spec/openapi.yaml` | regenerado |
| `plan/REPORTES/WP-U111-editor-materialize-narrativo.md` | creado — este reporte |

### Library (`Z_SDK-games-library` / rama homónima)

| archivo | acción |
| ------- | ------ |
| `packages/startpack-plaza/**` | creado — pack narrativo + test |
| `scripts/lib/startpack-games.mjs` | modificado — fila `plaza` |
| `scripts/resolve-startpack.mjs` | modificado — env `ZEUS_STARTPACK_PLAZA` |
| `package.json` / `package-lock.json` | modificado — test:startpack + lock |
| `docs/startpacks.md` | modificado — fila plaza |

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### editor-ui tests

```
# tests 13
# pass 13
# fail 0
```

Incluye `materializeStartPack plaza writes story-board (gameId !== sketch)`
y `editor world release plaza produces installable tarball`.

### gates / lint (zeus worktree)

```
gates: OK (0 offenders)
npm run lint → ✖ 11 problems (0 errors, 11 warnings) · exit 0
```

### Library — unit startpack-plaza + Notario

```
# tests 1
# pass 1
# fail 0

tarball: .../zeus-startpack-plaza-0.1.0.tgz
✅ Notario done
game=plaza package=@zeus/startpack-plaza version=0.1.0
```

### Arranque UI

```
⏳ sin verificar visualmente en navegador (ZEUS_OPEN_BROWSER no usado).
Smoke GET / + materials plaza en tests de rutas.
```

## Demolición

Hard-gate `gameId must be "sketch"` / `draft.gameId !== DEFAULT_GAME_ID`
como único camino — eliminado. Grep:

```
rg -n 'gameId must be "sketch"' packages/editor → (cero hits)
```

Sketch permanece en `GAME_CATALOG` como preset `kind: 'toy'`.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no; library vía
      `ZEUS_GAMES_LIBRARY_ROOT` / sibling resolve.
- [x] Cadenas if/switch → tabla: `GAME_CATALOG` + `MATERIALIZERS` por kind.
- [x] Duplicación: dialecto mínimo en editor (no copia el validador
      library entero); U114 unificará registro. Reutiliza startpack-kit.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres de transición: no (plaza, solve-inline documentado).
- [x] Demolición completa: grep hard-gate sketch cero.
- [x] Tests comportamiento: validate plaza; materialize story-board;
      release tarball plaza ≠ sketch.
- [x] Arranque real: Notario plaza OK; UI visual ⏳.
- [x] README/specs: README editor + openapi regenerado; docs library.
- [x] Diff solo alcance WP: sí (sin BACKLOG; sketch restaurado tras
      side-effect de tests).

### Regla de los dos juegos

¿pozo/delta pueden ignorar el camino narrativo y seguir con sketch?
**Sí** — materializers por `kind`; sketch = toy; plaza = narrative
juguete (no nombres exclusivos de solve-producto en engine).

## Hallazgos fuera de alcance

- U114: registro multi-dialecto (aleph-blocks) aún rechazado a propósito
  en `story-board-min`.
- U112: instantiate `--from` obra no tocado.
- `resolve-startpack` gameEnvKey sigue siendo tabla manual (añadida
  plaza); candidata a genérica `ZEUS_STARTPACK_<GAME>` si crece.

## Dudas / bloqueos

Ninguno. Listo para revisión orquestador.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
