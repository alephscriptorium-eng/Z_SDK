# Contrato único — `@zeus/protocol`

Envelope canónico del runtime de juego:

| Evento | Semántica |
| ------ | --------- |
| `state` | Snapshot a Hz de la autoridad |
| `intent` | Petición de mutación de un actor |
| `track` | Pista de navegación (observación) |
| `ledger` | Hecho registrado |

El namespace por juego va en el envelope (`game: "…"`); el wire del kit
sigue siendo `state|intent|track|ledger`. Roles: `player` | `dj` |
`operator` en el catálogo de intents. Gates G-PROTO.1–5: una autoridad por
room; vistas solo proyectan y emiten intents; dominio browser-safe;
reducers con tabla de handlers; presupuesto de snapshot.

```js
import { makeIntent, createIntentCatalog, validateIntent } from '@zeus/protocol';

const catalog = createIntentCatalog({
  join: { roles: ['player'] },
  curate: { roles: ['dj'] }
});

validateIntent(
  makeIntent('uno', 'join', { kind: 'player' }, { game: 'my-game' }),
  catalog
);
```

## Specs

- Markdown: `packages/engine/protocol/spec/CONTRATO.md`
- AsyncAPI generado: `npm run spec:generate` → `packages/engine/protocol/spec/asyncapi.yaml`
- HTML en el portal: [AsyncAPI](/contracts/asyncapi) · [render HTML](/api/protocol/)

README del paquete: `packages/engine/protocol/README.md`.

Tipos TypeScript (`.d.ts`) generados desde el contrato:
`npm run types:generate -w @zeus/protocol` → `types/index.d.ts` (van en el tarball).
Handshake de rooms para consumidores externos: [guía](/guide/external-handshake).
