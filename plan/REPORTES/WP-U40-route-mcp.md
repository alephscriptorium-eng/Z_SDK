# WP-U40 · route-mcp — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok 4.5) |
| fecha | 2026-07-17 |
| rama | `wp/u40-route-mcp` |
| commit(s) | `18967ec` feat http-contract · `7136e8a` feat firehose · `bb9715e` demolición projector · docs reporte en HEAD |
| estado propuesto | listo para revisión |

## Qué se hizo

Se evaluó `@zeus/openapi-mcp-projector` y se **borró** (no se cableó): proyecta desde OpenAPI YAML intermedio con URIs `openapi://`, ignora `xMcpResource`, y tenía 0 consumidores — no aporta frente a RouteEntry como fuente de verdad.

Se implementó proyección directa en `@zeus/http-contract`: `projectRoutesToMcp`, `bindProjectedHttpReaders`, `renderRouteMcpCatalog` (GET → resource / resource-template; URI = `xMcpResource` o `rest://…` derivado).

En firehose-browser se añadió `corpora.get` (`GET /api/corpora/:corpusId`, `xMcpResource: firehose://corpus/{corpusId}`), e2e MCP que lista el template y responde, y `spec:generate:all` documenta `x-mcp-resource` en el OpenAPI.

## Archivos tocados

- `packages/lib/http-contract/src/mcp-project.mjs` — creado: proyección RouteEntry→MCP + readers HTTP
- `packages/lib/http-contract/src/index.mjs` — modificado: exports
- `packages/lib/http-contract/test/mcp-project.test.mjs` — creado: unit tests
- `packages/lib/http-contract/package.json` — modificado: descripción
- `packages/platform/firehose-browser/src/contract.mjs` — modificado: ruta `corpora.get`
- `packages/platform/firehose-browser/src/browse-routes.mjs` — modificado: handler HTTP
- `packages/platform/firehose-browser/test/route-mcp-e2e.test.mjs` — creado: e2e CA
- `packages/platform/firehose-browser/spec/openapi.yaml` — regenerado: documenta template
- `packages/lib/openapi-mcp-projector/**` — borrado
- `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, `README.md`, `plan/ARQUITECTURA.md` — limpieza demolición

## Evidencia

### Decisión borrar projector (evidencia)

- API: `projectOpenApi(spec)` sobre YAML OpenAPI → URIs `openapi://${operationId|path}` (no `xMcpResource` / `linea://` / `firehose://`).
- Consumidores: 0 imports fuera del propio paquete (deuda ARQUITECTURA §1).
- Dependencia MCP SDK listada y no usada en el código.
- http-contract ya genera OpenAPI desde RouteEntry; hop YAML→MCP duplicaba y degradaba la fuente de verdad.

### Unit — http-contract

```
npm test -w @zeus/http-contract
# tests 18
# pass 18
# fail 0
```

### E2E CA — firehose resource-template

```
npm test -w @zeus/firehose-browser
# Subtest: firehose corpora.get projects as MCP resource-template and responds
ok 2 - firehose corpora.get projects as MCP resource-template and responds
# tests 5
# pass 5
# fail 0
```

### `spec:generate:all` documenta

```
npm run spec:generate:all
→ packages/platform/firehose-browser/spec/openapi.yaml
…
grep -n "firehose://corpus" packages/platform/firehose-browser/spec/openapi.yaml
192:      x-mcp-resource: firehose://corpus/{corpusId}
```

### Gates / lint / dos juegos

```
npm run gates
gates: OK (0 offenders)

npm run lint
✖ 12 problems (0 errors, 12 warnings)  # preexistentes; cero errores nuevos

npm test -w @zeus/arg-domain
# tests 60 / pass 60

npm test -w @zeus/pozo
# tests 6 / pass 6
```

- Arranque: e2e levantó firehose-browser HTTP + MCP efímero; `listResourceTemplates` + `readResource('firehose://corpus/candidate')` OK. `ZEUS_OPEN_BROWSER` no seteado (= no abre).

## Demolición

Borrado `@zeus/openapi-mcp-projector` (paquete completo). Limpieza: script `test:openapi-mcp-projector`, matriz CI, lockfile, README (canal vivo), deuda ARQUITECTURA §1. Cero wrappers/re-exports de compat.

```
grep -rn "openapi-mcp-projector" --include='*.md' --include='*.json' --include='*.yml' --include='*.mjs' . \
  | grep -v node_modules | grep -v plan/REPORTES | grep -v plan/BACKLOG
# (sin salidas — demolición limpia fuera de historial de reportes/BACKLOG)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: e2e usa `port: 0` / `127.0.0.1` solo en test; sin puertos de producción hardcodeados
- [x] Cadenas if/switch que debieron ser tabla: no; clasificación resource vs template por presencia de `{` en URI
- [x] Duplicación con otros paquetes: se evaluó projector y se descartó; proyección vive en http-contract
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no (`rest://` como scheme engine-neutral de fallback)
- [x] Demolición completa (grep arriba): sí
- [x] Tests prueban comportamiento: unit (URI/readers) + e2e (list template + read payload)
- [x] Arranque real verificado: e2e MCP+HTTP (arriba)
- [x] README/specs del paquete siguen siendo verdad: README raíz actualizado; OpenAPI firehose regenerado
- [x] El diff contiene solo el alcance del WP: sí (no se tocó BACKLOG)

## Hallazgos fuera de alcance

- En Windows con `core.autocrlf`, `mcp-resources.md` checkout puede romper `assertSpecMatches` (LF generado vs CRLF en working tree) aunque el blob coincida: roce de tooling, no de este WP.
- `spec:generate:all` reescribe specs ajenos solo por normalización de fin de línea; se revirtieron del staging.

## Dudas / bloqueos

Ninguno. Pregunta §1.11: ¿pozo puede consumir la proyección tal cual? Sí — API engine-neutral (`RouteEntry` + opcional `xMcpResource` / `rest://`); cero nombres de juego en el kit. ¿Quedó projector huérfano? No — borrado.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
