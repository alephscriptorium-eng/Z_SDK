# `@zeus/protocol`

Contrato único Zeus: envelope `state|intent|track|ledger` con campo `game`,
`makeIntent`, roles (`player|dj|operator`), gates genéricos, Peer Card y
generación AsyncAPI.

Browser-safe. **No nombra juegos** (D-8): el id de juego lo aporta el
consumidor en el envelope.

## Uso

```js
import {
  makeIntent,
  createIntentCatalog,
  validateIntent,
  makePeerCard,
  roleScope,
  EVENTS,
  GATES
} from '@zeus/protocol';

const catalog = createIntentCatalog({
  join: { roles: ['player'] },
  curate: { roles: ['dj'] }
});

const intent = makeIntent('uno', 'join', { kind: 'player' }, { game: 'my-game' });
validateIntent(intent, catalog); // { ok: true, role: 'player' }

validateIntent(
  makeIntent('uno', 'curate', {}, { game: 'my-game', role: 'player' }),
  catalog
); // { ok: false, error: 'rol_no_autorizado' }
```

## Specs

- Contrato: [`spec/CONTRATO.md`](spec/CONTRATO.md)
- AsyncAPI: `npm run spec:generate` → `spec/asyncapi.yaml`
- HTML portal: `npm run spec:asyncapi:html` (raíz) → `docs/public/api/protocol/`

## Tests

`npm test -w @zeus/protocol`
