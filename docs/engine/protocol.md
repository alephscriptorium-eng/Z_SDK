# Contrato único — `@zeus/protocol`

Envelope canónico del runtime de juego:

| Evento | Semántica |
| ------ | --------- |
| `state` | Snapshot a Hz de la autoridad |
| `intent` | Petición de mutación de un actor |
| `track` | Pista de navegación (no muta) |
| `ledger` | Hecho registrado |

El namespace por juego va en el envelope (`game: "…"`), no multiplicando
nombres de evento. Roles: `player` | `dj` | `operator` en el catálogo de
intents. Gates G-PROTO.1–5: una autoridad por room; vistas solo proyectan y
emiten intents; dominio browser-safe; reducers con tabla de handlers;
presupuesto de snapshot.

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

- Markdown: `packages/lib/protocol/spec/CONTRATO.md`
- AsyncAPI generado: `npm run spec:generate` → `packages/lib/protocol/spec/asyncapi.yaml`
- HTML en el portal: [AsyncAPI](/contracts/asyncapi) · [render HTML](/api/protocol/)

README del paquete: `packages/lib/protocol/README.md`.
