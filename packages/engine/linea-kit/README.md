# `@zeus/linea-kit`

Formatos canónicos de `plan/DATOS.md` §2 y familia force/cota §8 (D-19):
JSON Schemas, cadena de curación unificada, validador, loader de líneas, y
**herramientas de segmentación del dramaturgo** (WP-U81).

El contrato de entrada al mesh es el **validador**; las tools son cortesía.

## Exports

| subpath | runtime | contenido |
| ------- | ------- | -------- |
| `@zeus/linea-kit` | browser-safe | curación + resolve + force activation (sin fs) |
| `@zeus/linea-kit/curation` | browser-safe | enum / `normalizeCurationStatus` |
| `@zeus/linea-kit/resolve` | browser-safe | `resolveNodo`, `resolveOldid`, … |
| `@zeus/linea-kit/force-activation` | browser-safe | `explainActivate` / budget / exclusiones / cotas |
| `@zeus/linea-kit/validate` | node | Ajv + schemas en disco + `validateVolumesTree` |
| `@zeus/linea-kit/loader` | node | `loadLineaData`, `loadForcesData`, `readWikitext`, … |
| `@zeus/linea-kit/tools` | node | `crear-linea`, `segmentar`, `conectar-satelite`, `fetch`, `segmentar-force`, `crear-cotas` |
| `@zeus/linea-kit/starterkits` | node | `createLineaJuguete`, `createForceJuguete` |
| `@zeus/linea-kit/viaje` | node | path manager origin→destination (`GraphSource`, adapters linea/wiki/gamemap, cache + `fetchSnapshot` gate) |
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

## Viaje (path manager)

«Viaje» = camino origen→destino sobre un grafo (`GraphSource`), con candidatos,
poda, máquina de etapas y cache curada (`viaje-recorrido` + `CURATION_STATUSES`).
Reusa `fetchSnapshot` (gate `approve`), `applyMilestoneRules` / segmentación, y
schemas existentes para sidecars — no duplica curación.

```js
import { createLineaJuguete } from '@zeus/linea-kit/starterkits';
import { createLineaGraphSource, runViaje } from '@zeus/linea-kit/viaje';

const built = createLineaJuguete({ lineasRoot, id: 'juguete', overwrite: true });
const source = createLineaGraphSource({ nodoIds: ['N01', 'N02', 'N03'] });
await runViaje({
  id: 'demo',
  origin: 'N01',
  destination: 'N03',
  source,
  cacheDir: built.lineDir,
  segment: { everyNHops: 1 }
});
```

Adaptadores: `createWikiGraphSource` (links + wikitext offline → snapshots),
`viajeToWalkIntents` / `acceptWalks` (walk intents; room authority = consumer).

Consumo de `linea://*`: viaje no reimplementa el MCP; el mesh (`linea-system`)
resuelve nodos y el caller pasa ids a `createLineaGraphSource`.

## Force activation (WP-U92)

Módulo puro `@zeus/linea-kit/force-activation`: aplica `session_budget`,
exclusiones y boot del registry **inyectado** (cero ids concretos en código).
Delta y pozo consumen el mismo API; el corpus vive en VOLUMES / fixtures.


## Tests

```bash
npm test -w @zeus/linea-kit
```

Validación de VOLUMES vivos (read-only): pone `ZEUS_VOLUMES_ROOT` o coloca
`VOLUMES/volumes.json` alcanzable desde cwd. Si faltan DISK_01/02/03, el test
los marca skipped y valida fixtures del paquete.
