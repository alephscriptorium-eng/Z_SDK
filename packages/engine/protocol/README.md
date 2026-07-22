# `@zeus/protocol`

Contrato único Zeus: envelope `state|intent|track|ledger` con campo `game`,
`makeIntent`, roles (`player|dj|operator`), gates genéricos, ACL direccional
(peer→recurso), Peer Card y generación AsyncAPI.

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
  authorizeAcl,
  createAclPolicy,
  assertIntentAcl,
  POWER,
  capabilityScope,
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

## ACL direccional (G-PROTO.6)

Roles globales no conceden poder lateral sobre un recurso. El juego anota
`power` + `resourceId`; el engine autoriza:

| power | default | permite |
| --- | --- | --- |
| `read` / `idempotent` | allow | siempre (acciones seguras) |
| `mutate` | **deny** | owner del recurso **o** capability `cap:mutate:…` |
| `destructive` | **deny** | **solo** capability `cap:destructive:…` (ownership no basta) |

```js
const policy = createAclPolicy({
  'health.smoke': { power: POWER.IDEMPOTENT },
  'barrio.annotate': { power: POWER.MUTATE },
  'svc.stop': { power: POWER.DESTRUCTIVE }
});
const ownership = new Map(); // resourceId → actorId

assertIntentAcl(
  { actorId: 'alice', intent: 'svc.stop', resourceId: 'go:svc:x' },
  policy
); // { ok: false, error: 'capability_required' }

authorizeAcl({
  subject: 'alice',
  resource: 'go:svc:x',
  power: POWER.DESTRUCTIVE,
  capabilities: [capabilityScope(POWER.DESTRUCTIVE, 'go:svc:x')]
}); // { ok: true, reason: 'capability' }
```

Resource id opaco (el juego elige la forma). Campos reconocidos por defecto:
`resourceId` | `targetId` | `barrioId` | `gameObjectId`. Destino canónico de
chequeos de poder direccional: este módulo (`acl.mjs`); `roles.mjs` queda
solo para intent↔rol global.

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
