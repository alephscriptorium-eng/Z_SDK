# WP-U115 · schema-story-board-ajv — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm / Cursor) |
| fecha | 2026-07-18 |
| rama | `wp/u115-schema-story-board-ajv` (zeus) · `wp/u115-schema-story-board-ajv` (library) |
| commit(s) | library: `7050664` · zeus: `18627aa` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se cableó `validate-story-board.mjs` del kit carpeta-dramaturgo a
`schema/story-board.schema.json` vía **AJV** (draft 2020-12), patrón
alineado a `linea-kit`. El schema es fuente de verdad: fixtures
SOLVE/ALEPH, plantilla y juguete pasan; un board sintético inválido
(`BAD_Widget`) se rechaza con ruta + pattern explicable. Se demolió el
comentario/camino «touch schema so CA can cite it exists» y las reglas
a mano `validateSolve` / `validateAleph` que el schema ya cubría.
Queda un post-check semántico (`blocks[].act` → act id conocido) que
JSON Schema no expresa. Dep `ajv` explícita en library. README kit
veraz. **No** se tocó `editor-ui` / U114.

**¿Un tercer dialecto se valida sin reescribir reglas a mano?** Sí:
añadir `$defs` + entrada en `oneOf` del schema; el script recompila el
schema y no lleva validadores por dialecto a mano (solo el post-check
de refs de act si aplica al nuevo dialecto).

## Archivos tocados

### Library (`Z_SDK-games-library` / rama WP)

| archivo | acción |
| ------- | ------ |
| `kits/carpeta-dramaturgo/scripts/validate-story-board.mjs` | modificado — AJV + demolición a mano |
| `kits/carpeta-dramaturgo/test/run.mjs` | modificado — CA board inválido |
| `kits/carpeta-dramaturgo/README.md` | modificado — schema = contrato AJV |
| `package.json` | modificado — dep `ajv` |
| `package-lock.json` | modificado — lock `ajv` |

### Zeus (`Z_SDK` / rama WP)

| archivo | acción |
| ------- | ------ |
| `plan/REPORTES/WP-U115-schema-story-board-ajv.md` | creado — este reporte |

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### CA `npm run test:carpeta-dramaturgo` (library worktree)

```
--- schema AJV (board sintético inválido) ---
✅ synthetic invalid board rejected
   - /acts/0/widgets/0: must match pattern "^[a-z][a-z0-9-]*$" (^[a-z][a-z0-9-]*$)
--- fixtures (story-boards reales) ---
✅ .../fixtures/solve-coagula-story-board.json
   dialect=solve-inline  act-0→[panel-elenco]; ...
✅ .../fixtures/aleph-et-omega-story-board.json
   dialect=aleph-blocks  act-0→[tablero-aleph,panel-tronco-px]; ...
--- plantilla / toy ---
✅ .../plantilla/readerapp/story-board.json
✅ .../instances/toy-plaza/readerapp/story-board.json
--- instantiate --from (obra mini hermética) ---
✅ instancia .../from-solve-mini
✅ validate from-solve-mini
--- instantiate --from SOLVE_ET_COAGULA (live sibling) ---
✅ ... cleaned from-solve-live
🟢 test:carpeta-dramaturgo OK
```

### lint / gates monorepo zeus

```
⏳ sin verificar — WP no toca packages/ de zeus (solo reporte plan/)
```

## Demolición

- Comentario `// touch schema so CA can cite it exists` — eliminado.
- Funciones a mano `validateSolve` / `validateAleph` / patrones
  widget/act duplicados del schema — eliminados.
- `existsSync(SCHEMA_PATH)` permanece solo para error de carga real
  (schema missing/unreadable), no como CA decorativo.

```
$ rg -n "touch schema so CA|validateSolve|validateAleph" kits/carpeta-dramaturgo/
(no matches for touch schema / validateSolve / validateAleph)

$ rg -n "existsSync\\(SCHEMA_PATH\\)" kits/carpeta-dramaturgo/
kits/carpeta-dramaturgo/scripts/validate-story-board.mjs:51:  if (!existsSync(SCHEMA_PATH)) {
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no (paths relativos al kit)
- [x] Cadenas if/switch que debieron ser tabla: dialecto preferido =
  detección por forma (`blocks[]` → aleph); oneOf del schema es la
  tabla de dialectos
- [x] Duplicación: reutiliza AJV como linea-kit; no importa validate de
  linea-kit (schemas distintos). Dep `ajv` explícita en library
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres de transición (v2/old/new): no
- [x] Demolición completa (grep arriba): sí; post-check semántico
  documentado (no cubierto por schema)
- [x] Tests prueban comportamiento: inválido → rechazo con pattern;
  fixtures verdes
- [x] Arranque real: CLI validate + test kit ejecutados
- [x] README kit veraz: schema = contrato AJV
- [x] Diff solo alcance U115: sí (no editor-ui)

## Hallazgos fuera de alcance

- oneOf de AJV produce ruido si se formatean errores del raíz; se mitiga
  re-validando el dialecto preferido para mensajes. Mejorable con
  `discriminator` en schema futuro — no abierto aquí.
- Residual STOP_SERVICES / U93 / diferidos U87 §5–6 — sin GO; no tocados.

## Dudas / bloqueos

Ninguno. Listo para revisión orquestador (merge library + zeus reporte).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
