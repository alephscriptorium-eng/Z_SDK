# WP-U86 · carpeta-dramaturgo — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (lote-ola9-a / Cursor) |
| fecha | 2026-07-18 |
| rama | `wp/u86-carpeta-dramaturgo` (zeus) · `wp/u86-carpeta-dramaturgo` (library) |
| commit(s) | library: `a28b9ad`; zeus: `385d97f` (reporte+punteros; tip rama con docs hash) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se destiló la **CARPETA DRAMATURGO** en `Z_SDK-games-library/kits/carpeta-dramaturgo/`:
constitución parametrizable (título/tema + REIC), cuatro capas de cadenas con
README-plantilla, `story-board.json` + schema actos→widgets (dialectos SOLVE y
ALEPH), plantillas `uichain/panel-*.prompt.md`, `AYUDA.md`, marcas EPISTEM,
hot files, y `STUBS.md` (desacople de `disfraz-rude-bot` y browsers de caché).
Se instanció el juguete CA `instances/toy-plaza/` solo dentro del kit. En el
monorepo Z_SDK: punteros en README + `docs/games/index.md` y este reporte.
Originales en `scriptorium-network-games/` intactos.

## Archivos tocados

### Library `Z_SDK-games-library` (push OK)

| archivo | acción |
| ------- | ------ |
| `kits/carpeta-dramaturgo/**` | creado — plantilla, schema, scripts, fixtures, toy-plaza |
| `package.json` | modificado — `test:carpeta-dramaturgo`, `instantiate:carpeta-dramaturgo` |
| `README.md` | modificado — puntero al kit |

### Monorepo Z_SDK (`wp/u86-carpeta-dramaturgo`)

| archivo | acción |
| ------- | ------ |
| `README.md` | modificado — puntero CARPETA DRAMATURGO |
| `docs/games/index.md` | modificado — sección kit WP-U86 |
| `plan/REPORTES/WP-U86-carpeta-dramaturgo.md` | creado — este reporte |

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Instanciar juguete (solo bajo `instances/`)

```
✅ instancia creada: .../kits/carpeta-dramaturgo/instances/toy-plaza
   título=Plaza de juguete
   (solo archivos bajo instances/toy-plaza/ — nada fuera del kit)
```

### Validación schema — fixtures reales + plantilla + toy

```
--- fixtures (story-boards reales) ---
✅ .../fixtures/solve-coagula-story-board.json
   dialect=solve-inline  act-0→[panel-elenco]; … act-7→[panel-elenco,panel-timeline-dual]
✅ .../fixtures/aleph-et-omega-story-board.json
   dialect=aleph-blocks  act-0→[tablero-aleph,panel-tronco-px]; … act-3→[tablero-mcp-topology]
--- plantilla / toy ---
✅ .../plantilla/readerapp/story-board.json
   dialect=solve-inline  act-0→[panel-seed,panel-reic]
✅ .../instances/toy-plaza/readerapp/story-board.json
   dialect=solve-inline  act-0→[panel-seed,panel-reic]
🟢 test:carpeta-dramaturgo OK
```

(`npm run test:carpeta-dramaturgo` en library · exit 0)

### Lint monorepo

```
npm run lint  →  ✖ 11 problems (0 errors, 11 warnings)  · exit 0
```

### Push

- Library: `git push -u origin wp/u86-carpeta-dramaturgo` → OK (`a28b9ad`)
- Z_SDK monorepo: **no intentado** (política swarm)

### Originales intactos

`scriptorium-network-games/{ALEPH_ET_OMEGA,SOLVE_ET_COAGULA}` — no modificados
(fixtures = copias bajo `kits/.../fixtures/`).

## Demolición

n/a (plantilla destilada; originales intactos).

```
(no aplica — sin símbolos demolidos)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: sin puertos en código del kit;
      fixtures ALEPH conservan `tablero_url` histórico `localhost:3013` (dato
      de origen, no runtime del kit). Docs citan paths relativos.
- [x] Cadenas if/switch que debieron ser tabla: validador usa ramas dialecto
      (solve vs aleph) — dos formas, no cadena creciente.
- [x] Duplicación con otros paquetes: schema library-first; no hay paquete
      engine paralelo. Busqué ajv/story-board en monorepo: no existía.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: `carpeta-dramaturgo`,
      `toy-plaza` (juguete CA); sin v2/old/legacy.
- [x] Demolición completa: n/a.
- [x] Tests prueban comportamiento: validan actos→widgets en boards reales
      y en instancia; no solo «no explota».
- [x] Arranque real verificado: instantiate + validate ejecutados; no hay
      servidor UI que levantar (kit de archivos).
- [x] README/specs del paquete siguen siendo verdad: README kit + library +
      docs/games actualizados.
- [x] El diff contiene solo el alcance del WP: sí (kit + punteros + reporte).

## Hallazgos fuera de alcance

- Los dos story-boards reales usan **dialectos distintos** (SOLVE: widgets en
  `acts[]`; ALEPH: `acts` + `blocks[].uichain.widgets`). El schema los unifica
  vía `oneOf`; U70/U87 podrían normalizar a un solo dialecto al editar.
- Widgets ALEPH (`tablero-aleph`, …) y SOLVE (`panel-elenco`, …) no comparten
  vocabulario — esperado; la plantilla nueva usa `panel-seed` / `panel-reic`.
- Skills `disfraz-rude-bot` / browsers siguen solo en `network-engine`; el stub
  no las reimplementa (a propósito). Un WP futuro podría portar un subset a
  mesh/editor si U87 lo exige.
- Fixture JSON en kit es snapshot: si los originales evolucionan, hace falta
  re-copia (higiene).

## Dudas / bloqueos

Ninguno. CA cumplido en library; monorepo solo punteros.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
