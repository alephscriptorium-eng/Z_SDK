# `@zeus/volumes-ops`

Capa de operación files-first sobre `volumes.json` / DISKs (WP-U82, DATOS.md §4):

- **Medición** — archivos y bytes por volumen, corpus o línea (`linePath`).
- **Vaciado con roles** — `operator` = purga dura con asiento en ledger;
  `player`/`dj` = rechazo en purga dura (`rol_no_autorizado`); intent
  `empty_playable` registra asiento sin borrar disco (trama en U83).
- **REST + MCP** desde una definición RouteEntry (patrón WP-U40): GET measure
  → resource; POST empty queda en HTTP.

Nada toca disco sin pasar por `assertIntentRole` + ledger (purga) o sin
asiento (playable).

## Uso

```js
import {
  measureVolume,
  emptyVolume,
  createVolumesOpsServer,
  VOLUMES_OPS_ROUTES
} from '@zeus/volumes-ops';
import {
  projectRoutesToMcp,
  bindProjectedHttpReaders
} from '@zeus/http-contract';

// Medir (read-only)
const m = measureVolume('sandbox');

// Vaciar (operator)
const r = emptyVolume({
  volumeId: 'sandbox',
  corpusId: 'raw',
  role: 'operator',
  actorId: 'ops-1'
});

// HTTP + MCP
const http = await createVolumesOpsServer({ port: 0 });
const projected = projectRoutesToMcp(VOLUMES_OPS_ROUTES);
const { registry, templateRegistry } = bindProjectedHttpReaders(projected, {
  baseUrl: http.url
});
```

## Contadores (U199 · manifiesto sellado)

`volumes.json` es MANIFIESTO: identidad/topología, read-only para el
runtime, sellado por sha256 de sus bytes exactos (`manifest.mjs`). Medir
JAMÁS lo modifica. Tras un vaciado (o `POST …/sync-counters`), la medición
viva se registra en `volumes.state.json` (`state.mjs`): `files`/`bytes`
por volumen y corpus + `measuredAt` + `manifest.sha256` contra el que se
midió. El estado es mutable/regenerable, no versionado y nunca entra en el
hash del manifiesto. Regla D-45: si se puede regenerar midiendo, es
estado, no manifiesto. Volumen sin entrada en el manifiesto (o root sin
manifiesto) → la operación aborta, no se inventa nada.

## Ledger

JSONL append-only: `{volumesRoot}/.ops-ledger.jsonl` (configurable).

## Tests

```bash
npm test -w @zeus/volumes-ops
```

Usan `mkdtemp` + `ZEUS_VOLUMES_ROOT` — nunca purgan DISK vivos.

Post WP-U62 el monorepo solo trae fixtures en `VOLUMES/DISK_02|03`; datos
de ronda vienen de `@zeus/startpack-*` (games-library) o de un
`ZEUS_VOLUMES_ROOT` externo.

## Regla de los dos juegos

Engine: cero nombres de juego. Roles genéricos `operator` / `player` / `dj`.
