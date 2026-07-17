# `@zeus/linea-kit`

Formatos canónicos de `plan/DATOS.md` §2 y familia force/cota §8 (D-19):
JSON Schemas, cadena de curación unificada, validador, loader de líneas, y
**herramientas de segmentación del dramaturgo** (WP-U81).

El contrato de entrada al mesh es el **validador**; las tools son cortesía.

## Exports

| subpath | runtime | contenido |
| ------- | ------- | -------- |
| `@zeus/linea-kit` | browser-safe | curación + resolve puro (sin fs) |
| `@zeus/linea-kit/curation` | browser-safe | enum / `normalizeCurationStatus` |
| `@zeus/linea-kit/resolve` | browser-safe | `resolveNodo`, `resolveOldid`, … |
| `@zeus/linea-kit/validate` | node | Ajv + schemas en disco + `validateVolumesTree` |
| `@zeus/linea-kit/loader` | node | `loadLineaData`, `loadForcesData`, `readWikitext`, … |
| `@zeus/linea-kit/tools` | node | `crear-linea`, `segmentar`, `conectar-satelite`, `fetch`, `segmentar-force`, `crear-cotas` |
| `@zeus/linea-kit/starterkits` | node | `createLineaJuguete`, `createForceJuguete` |
| `@zeus/linea-kit/schemas/*` | — | JSON Schema files |

CLI: `zeus-linea-kit <comando>` (ver `bin/linea-kit.mjs`).

## Tools (WP-U81)

| tool | rol |
| ---- | --- |
| `crearLinea` | scaffolding tronco (placeholders → `nodos.yaml` + metas + manifest) |
| `segmentar` | historial → manifest satélite con milestones por reglas |
| `conectarSatelite` | config MCP + remotes wiki/ATProto/SSB |
| `fetchSnapshot` | materializar wikitext con gate `approve` |
| `segmentarForce` | contextos → escenas prompt/think/output; trace fuera |
| `crearCotas` | autoría cotas `sima\|cima` (lower/upper) |

## Starterkits / tutoriales

- [docs/tutorial-linea-30min.md](docs/tutorial-linea-30min.md) — tronco 3 nodos + satélite 10 registros
- [docs/tutorial-force-30min.md](docs/tutorial-force-30min.md) — force juguete + cotas

```bash
npx zeus-linea-kit starterkit-linea --lineas-root /tmp/lineas --id juguete --overwrite
npx zeus-linea-kit starterkit-force --forces-root /tmp/forces --overwrite
```

## Curación unificada

`delta_status` (líneas), carpetas firehose (`raw`/`candidate`/`labeled`/…) y
`editorialStatus` (transmedia) convergen en `CURATION_STATUSES` /
`normalizeCurationStatus` / `readCurationStatus`.

## Regla de los dos juegos

Este paquete es **engine**: no nombra juegos ni forces concretas. Los ids de
corpus viven en VOLUMES / fixtures / salida del dramaturgo.

## Tests

```bash
npm test -w @zeus/linea-kit
```

Validación de VOLUMES vivos (read-only): pone `ZEUS_VOLUMES_ROOT` o coloca
`VOLUMES/volumes.json` alcanzable desde cwd. Si faltan DISK_01/02/03, el test
los marca skipped y valida fixtures del paquete.
