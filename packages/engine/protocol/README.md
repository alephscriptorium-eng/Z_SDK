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
  isShaped,
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
isShaped('intent', intent); // true — forma wire desde EVENT_META

validateIntent(
  makeIntent('uno', 'curate', {}, { game: 'my-game', role: 'player' }),
  catalog
); // { ok: false, error: 'rol_no_autorizado' }
```

## Node

Path helpers for Express `express.static` + import maps (no browser):

```js
import { nodeSrcDir } from '@zeus/protocol/node-src-dir';
import { srcDir } from '@zeus/protocol/node';

// Shared one-liner — pass import.meta.url from the calling module:
const here = nodeSrcDir(import.meta.url);
```

`nodeSrcDir` is the single implementation used by package `./node` entries
(`@zeus/game-engine/node`, `@zeus/view-kit/node`, …).

## Specs

- Contrato: [`spec/CONTRATO.md`](spec/CONTRATO.md)
- AsyncAPI: `npm run spec:generate` → `spec/asyncapi.yaml`
- Tipos TS: `npm run types:generate` → `types/index.d.ts` (misma fuente que AsyncAPI)
- HTML portal: `npm run spec:asyncapi:html` (raíz) → `docs/public/api/protocol/`

## Tests

`npm test -w @zeus/protocol`
