# `@zeus/feed-kit`

Interfaz común de **familias de feed** (DATOS.md §3) para que los juegos
consuman la misma API:

| familia | naturaleza | volumen | URI |
| ------- | ---------- | ------- | --- |
| `static` | snapshots con autoridad | DISK_02 | `linea://…` |
| `stream` | firehose continuo | DISK_01 | `firehose://…` |
| `gossip` | log append-only (SSB) | DISK_04 | `ssb://…` |

Cadena de curación unificada vía `@zeus/linea-kit/curation` (`curation_status`
en cada ítem).

## API

```js
import {
  resolveRuntimeFeeds,
  createSyntheticFeedBag,
  FEED_FAMILIES
} from '@zeus/feed-kit';

const bag = await resolveRuntimeFeeds({
  mode: 'auto', // auto | synthetic | real
  seed: 1,
  mcpPorts: resolveZeusMcpPorts(),
  families: [...FEED_FAMILIES],
  requireForAuto: ['stream', 'static'] // gossip opcional en probe
});

const [item] = bag.families.stream.nextItems(1);
// item.uri, item.curation_status, item.family
```

Cada feed expone `nextItems(n)` (alias `nextDroplets` para motores de flujo),
`commitLabel` (ledger-only en runtime) y, en `static`, `materialize(anchor, approval)`.

## Jetstream → DISK_01

Implementación de referencia del productor **stream**:

```bash
# fixture (sin red)
npm run volumes:sync:firehose -- --fixture

# live (opt-in red)
ZEUS_JETSTREAM_URL=wss://… npm run volumes:sync:firehose -- --max=20 --ms=15000
```

Tras escribir posts, el recuento de corpora usa
`syncVolumeCounters('firehose')` de `@zeus/volumes-ops` (cualquier tipo de
fichero + invalidación de caché de `volumes.json`).

La degradación **auto → sintético** vive en `resolveRuntimeFeeds` cuando el
probe MCP falla (e2e obligatorio).

## Browser vs node

- `./synthetic` y `./families` — seguros para dominio browser-safe.
- `./resolve`, `./mcp`, `./jetstream` — node-only (MCP / fs / WebSocket).

## Tests

`npm test -w @zeus/feed-kit`
