# WP-U112 · carpeta-instantiate-from-obra — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (frente editor / Cursor) |
| fecha | 2026-07-18 |
| rama | `wp/u112-carpeta-instantiate-from-obra` (zeus) · `wp/u112-carpeta-instantiate-from-obra` (library) |
| commit(s) | zeus: `fd30c9e` · library: `5c48c7d` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se amplió `instantiate.mjs` de la CARPETA DRAMATURGO con `--from <obra>`:
tabla de fuentes (`plantilla` sin flag · `obra` con slug documentado o path).
El camino plantilla vacía se mantiene; el de obra hace overlay de
`blockchain` / `agentchain` / `uichain` / `readerapp` sobre la plantilla base,
normaliza el story-board a `readerapp/story-board.json` y escribe `ORIGIN.md`.
Slugs: `SOLVE_ET_COAGULA`, `ALEPH_ET_OMEGA` (+ aliases). Tests herméticos con
`fixtures/obra-solve-mini/` + smoke live SOLVE (limpia instancia). Originales
en `scriptorium-network-games/` intactos (solo dirty preexistente ajeno).
Docs kit/library/zeus actualizados.

## Archivos tocados

### Library (`Z_SDK-games-library` / rama WP)

| archivo | acción |
| ------- | ------ |
| `kits/carpeta-dramaturgo/scripts/instantiate.mjs` | modificado — `--from`, tabla fuentes, overlay |
| `kits/carpeta-dramaturgo/test/run.mjs` | modificado — CA `--from` mini + live SOLVE |
| `kits/carpeta-dramaturgo/fixtures/obra-solve-mini/**` | creado — obra hermética |
| `kits/carpeta-dramaturgo/fixtures/README.md` | modificado — documenta mini-obra |
| `kits/carpeta-dramaturgo/instances/from-solve-mini/**` | creado — instancia CA U112 |
| `kits/carpeta-dramaturgo/instances/README.md` | modificado — filas from-* |
| `kits/carpeta-dramaturgo/README.md` | modificado — tabla fuentes + `--from` |
| `README.md` | modificado — ejemplo `--from` |
| `docs/games/futuros.md` | modificado — ejemplo `--from` |

### Zeus (`wp/u112-carpeta-instantiate-from-obra`)

| archivo | acción |
| ------- | ------ |
| `README.md` | modificado — puntero U112 `--from` |
| `plan/REPORTES/WP-U112-carpeta-instantiate-from-obra.md` | creado — este reporte |

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### `npm run test:carpeta-dramaturgo` (library worktree)

```
--- fixtures (story-boards reales) ---
✅ .../fixtures/solve-coagula-story-board.json
   dialect=solve-inline  act-0→[panel-elenco]; … act-7→[panel-elenco,panel-timeline-dual]
✅ .../fixtures/aleph-et-omega-story-board.json
   dialect=aleph-blocks  act-0→[tablero-aleph,panel-tronco-px]; … act-3→[tablero-mcp-topology]
--- plantilla / toy ---
✅ .../plantilla/readerapp/story-board.json
✅ .../instances/toy-plaza/readerapp/story-board.json
--- instantiate --from (obra mini hermética) ---
✅ instancia creada: .../instances/from-solve-mini
   fuente=obra:.../fixtures/obra-solve-mini
✅ .../from-solve-mini/readerapp/story-board.json
   dialect=solve-inline  act-0→[panel-elenco]; … act-7→[…]
--- instantiate --from SOLVE_ET_COAGULA (live sibling) ---
✅ instancia creada: .../instances/from-solve-live
   fuente=obra:SOLVE_ET_COAGULA
✅ .../from-solve-live/readerapp/story-board.json
   dialect=solve-inline  …
   cleaned from-solve-live (live overlay; not kept in tree)
🟢 test:carpeta-dramaturgo OK
```

### Smoke ALEPH + originales intactos

```
✅ instancia creada: .../from-aleph-smoke  fuente=obra:ALEPH_ET_OMEGA
✅ .../story-board.json  dialect=aleph-blocks  …

# git status --porcelain en scriptorium-network-games (tras overlay):
 M ALEPH_ET_OMEGA/PLAYER-UI-MCP.md
# (dirty preexistente; SOLVE_* y dramaturgia ALEPH sin cambios del WP)
```

### Lint / gates zeus

```
⏳ sin verificar en este WP (solo README + reporte en monorepo; lógica en library)
```

## Demolición

El camino «solo plantilla vacía» **no se borró**: queda como fuente
`plantilla` en la tabla. No hay segundo script paralelo. Demolición =
dejar de ser la única vía (documentado + tabla `resolveSource`).

```
# grep: instantiate sigue siendo un solo entrypoint
# kits/carpeta-dramaturgo/scripts/instantiate.mjs  (único)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: sin puertos; resolución de
      network-games por walk-up + env `ZEUS_NETWORK_GAMES` (no drive letters).
- [x] Cadenas if/switch → tabla: `KNOWN_OBRAS` / `OBRA_ALIASES` /
      `DRAMATURGY_DIRS` / `resolveSource` (plantilla|obra).
- [x] Duplicación: un solo `instantiate`; overlay reutiliza cpSync; validate
      existente U86.
- [x] console.log / código comentado / TODO: logs de CLI únicamente.
- [x] Nombres de transición: no (`from-solve-mini`, sin v2/legacy).
- [x] Demolición: ambas vías documentadas; sin script duplicado.
- [x] Tests comportamiento: board con actos de SOLVE tras `--from`; validate
      schema; live SOLVE + limpia.
- [x] Arranque: instantiate + validate ejecutados (no hay servidor UI).
- [x] README kit/library/zeus alineados con `--from`.
- [x] Diff solo U112 (kit + docs + reporte).

### Regla dos juegos (§1.11)

¿Una obra nueva con la misma forma de carpetas puede usarse vía `--from path`
sin tocar el kit? **Sí** — el path arbitrario no exige entrada en
`KNOWN_OBRAS`; los slugs SOLVE/ALEPH son conveniencia documentada, no
conceptos de engine.

## Hallazgos fuera de alcance

- `scriptorium-network-games` tenía dirty preexistente
  `ALEPH_ET_OMEGA/PLAYER-UI-MCP.md` (no tocado por este WP).
- U115 (schema AJV real) sigue pendiente; validate sigue a mano +
  `existsSync(SCHEMA_PATH)`.
- Instancia live completa de SOLVE es ~cientos de KB; el test la borra a
  propósito (no conviene versionarla).

## Dudas / bloqueos

Ninguno. Listo para revisión orquestador (no merge).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
