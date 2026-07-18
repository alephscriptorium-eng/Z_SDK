# WP-U113 · widgets-solve-view-kit — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (frente editor / Cursor) |
| fecha | 2026-07-18 |
| rama | `wp/u113-widgets-solve-view-kit` (zeus) · `wp/u113-widgets-solve-view-kit` (library) |
| commit(s) | zeus: `920841a` · `ff70f35` · library: `5ab457a` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se añadió runtime genérico de widgets de story-board en `@zeus/view-kit`
(registro tabla `id → render`, `mountStoryWidgets`, cast-table para
`panel-elenco`) sin nombres de juego en engine. En library, la vista
`solve-coagula` monta `/view-kit`, carga fixture
`readerapp/widgets/panel-elenco.json` y renderiza el widget declarado en
act-0 (DOM `#widgets-mount`), demoliendo el listado «solo nombres» para
ese id. Specs `uichain/panel-elenco.prompt.md` apuntan al runtime.
Changeset patch de view-kit.

**¿pozo puede consumir el registry tal cual?** Sí: puede ignorarlo y
seguir con su vista 3D, o registrar/usar los mismos ids con otros datos.
Ids de widget no son conceptos de juego.

## Archivos tocados

### Zeus (`wp/u113-widgets-solve-view-kit`)

| archivo | acción |
| ------- | ------ |
| `packages/engine/view-kit/src/widgets.mjs` | creado — registry + cast-table + mount |
| `packages/engine/view-kit/src/index.mjs` | modificado — exports widgets |
| `packages/engine/view-kit/test/widgets.test.mjs` | creado — CA unit |
| `packages/engine/view-kit/README.md` | modificado — sección widgets |
| `.changeset/wp-u113-widgets-solve-view-kit.md` | creado — patch view-kit |
| `plan/REPORTES/WP-U113-widgets-solve-view-kit.md` | creado — este reporte |

### Library (`Z_SDK-games-library` / rama WP)

| archivo | acción |
| ------- | ------ |
| `packages/solve-coagula/src/materials.mjs` | modificado — carga `widgetData` |
| `packages/solve-coagula/src/view/{server,render}.mjs` | modificado — static view-kit + HTML mount |
| `packages/solve-coagula/assets/js/solve-main.mjs` | modificado — monta registry |
| `packages/solve-coagula/assets/css/solve.css` | modificado — estilos widget |
| `packages/solve-coagula/dramaturgia/readerapp/widgets/panel-elenco.json` | creado — fixture |
| `packages/solve-coagula/dramaturgia/uichain/{README,panel-elenco.prompt.md}` | modificado — runtime U113 |
| `packages/solve-coagula/{package.json,README.md}` | modificado — dep view-kit + docs |
| `packages/solve-coagula/test/widgets-view.test.mjs` | creado — CA materials/HTML |
| `package-lock.json` | modificado — dep solve→view-kit |

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Zeus — `npm test -w @zeus/view-kit`

```
# tests 36
# pass 36
# fail 0
```

### Zeus — lint / gates

```
npm run lint → 0 errors (11 warnings preexistentes)
npm run gates → gates: OK (0 offenders)
rg solve-coagula|SOLVE|REIC|SolveCoagula packages/engine/view-kit → gate clean
```

### Library — `npm test -w @zeus/solve-coagula`

```
# tests 8
# suites 3
# pass 8
# fail 0
```

(incluye suite `solve-coagula widgets (U113)` ×2)

### Smoke HTTP vista (library worktree, `ZEUS_SDK_ROOT`→zeus worktree)

```
health {"status":"ok","service":"solve-view","game":"solve-coagula","acts":8,"linea":677,"widgets":["panel-elenco"],...}
html widgets-mount true
html SolveCoagula fixture true
html import-map view-kit true
view-kit/widgets.mjs 200 bytes 6916
widgets exports cast true
```

Navegador humano: `⏳ sin verificar` (`ZEUS_OPEN_BROWSER` no set).

## Demolición

1. Vista ya no trata `panel-elenco` solo como span de nombres: act-0 marca
   `widgets runtime` y el browser monta cast-table.
2. `panel-elenco.prompt.md` / uichain README documentan runtime view-kit
   (prompt = molde generativo, no única verdad UI).

```
$ rg -n "widgets join|widgets\.join" packages/solve-coagula/src/view/render.mjs
(sin join de nombres como único render del widget con payload)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no nuevos; vista sigue
      `resolveSolveEndpoints` / presets. Fixture hrefs Wikipedia = datos
      de juego, no engine.
- [x] Cadenas if/switch → tabla: registry `id → render`.
- [x] Duplicación: reutiliza patrón montaje view-kit de pozo; no copy.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres: engine sin solve/REIC; widget id `panel-elenco` genérico.
- [x] Demolición: listado solo-nombre sustituido para el widget con
      runtime; docs uichain actualizados.
- [x] Tests de comportamiento: registry filas/badges; materials+HTML;
      smoke health+static.
- [x] Arranque real: smoke HTTP verde; browser humano no abierto.
- [x] README view-kit + solve veraces.
- [x] Diff solo alcance WP: sí (view-kit + solve vista; sin BACKLOG).

## Hallazgos fuera de alcance

1. Resto de widgets (`panel-heatmap`, `panel-timeline-dual`, …) siguen
   sin runtime — placeholder «widget sin runtime».
2. Fixture elenco ≠ participant-register vivo de linea-aleph (corpus
   grande; U87 §5 diferido).
3. Library `.deps/zeus-sdk` debe apuntar al worktree zeus del WP para
   smoke local (`ZEUS_SDK_ROOT=…`); en CI/main tras merge el symlink
   sibling basta.

## Dudas / bloqueos

Ninguno. CA cumplido. Listo revisión orquestador (no merge / no ✅
BACKLOG).

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** — 2026-07-18 · orquestador

### CA (todos OK)

1. Widget declarado en story-board se renderiza en la vista (no solo
   prompt) — library monta `#widgets-mount` + `createDefaultWidgetRegistry`
   / `mountStoryWidgets`; fixture `panel-elenco.json`; act-0 marcado
   `widgets runtime`. Re-smoke HTTP (worktree library, view-kit vía
   `.deps/zeus-sdk`): health
   `widgets:["panel-elenco"]`; html mount + import-map + fixture
   SolveCoagula; `/view-kit/widgets.mjs` 200.
2. Test/e2e o smoke con evidencia — re-ejecutado:
   `npm test -w @zeus/view-kit` → 36/36; `npm test -w @zeus/solve-coagula`
   → 8/8 (suite U113 ×2); smoke HTTP verde. Navegador humano sigue
   `⏳` (aceptable con smoke HTTP).
3. Gate two-games — `rg solve-coagula|SOLVE|REIC|SolveCoagula` en
   `packages/engine/view-kit` → limpio; `npm run gates` → OK.
   Registry genérico `id → render`; pozo puede consumirlo o ignorarlo.

### PRACTICAS / Demolición

- §1.2 tabla registry (no if-creciente).
- §1.11 engine sin nombres de juego; id `panel-elenco` = widget schema,
  no dialecto solve.
- §1.4/§6 changeset patch `@zeus/view-kit`; commits convencionales.
- Demolición: listado solo-nombre sustituido para widget con payload;
  uichain docs apuntan a runtime.
- Alcance: zeus `920841a` (+ docs reporte) · library `5ab457a`. Worker
  no tocó `plan/BACKLOG.md`.

### Merge (cuando usuario autorice)

1. library `wp/u113-widgets-solve-view-kit` → `main` (`5ab457a`)
2. zeus `wp/u113-widgets-solve-view-kit` → `main` (incl. esta revisión)
3. Orquestador: ✅ BACKLOG en `main` + `git worktree remove` (zeus + library)
4. Luego encadenar **U114** (aún ⬜; no 🔶 hasta abrir)

**Push:** no intentado. **✅ BACKLOG:** no aplicado (pendiente autorización
merge del usuario).
