# `@zeus/linea-kit`

Formatos canónicos de `plan/DATOS.md` §2 y familia force/cota §8 (D-19):
JSON Schemas, cadena de curación unificada, validador y loader de líneas.

## Exports

| subpath | runtime | contenido |
| ------- | ------- | -------- |
| `@zeus/linea-kit` | browser-safe | curación + resolve puro (sin fs) |
| `@zeus/linea-kit/curation` | browser-safe | enum / `normalizeCurationStatus` |
| `@zeus/linea-kit/resolve` | browser-safe | `resolveNodo`, `resolveOldid`, … |
| `@zeus/linea-kit/validate` | node | Ajv + schemas en disco + `validateVolumesTree` |
| `@zeus/linea-kit/loader` | node | `loadLineaData`, `loadForcesData`, `readWikitext`, … |
| `@zeus/linea-kit/schemas/*` | — | JSON Schema files |

## Curación unificada

`delta_status` (líneas), carpetas firehose (`raw`/`candidate`/`labeled`/…) y
`editorialStatus` (transmedia) convergen en `CURATION_STATUSES` /
`normalizeCurationStatus` / `readCurationStatus`.

## Regla de los dos juegos

Este paquete es **engine**: no nombra juegos ni forces concretas. Los ids de
corpus viven en VOLUMES / fixtures.

## Tests

```bash
npm test -w @zeus/linea-kit
```

Validación de VOLUMES vivos (read-only): pone `ZEUS_VOLUMES_ROOT` o coloca
`VOLUMES/volumes.json` alcanzable desde cwd. Si faltan DISK_01/02/03, el test
los marca skipped y valida fixtures del paquete.
