# `@zeus/embajador-kit`

Minimal **emit + consume** API for a peer credential (peercard) that plugs the
entrant into **`startpack-ciudad-v0.1.0`** as the default base.

No crypto here: signature is a typed stub until the federation-privacy surface
lands. Room-authority issue helpers stay in `@zeus/authority-kit`; this kit
wires the **TTL lifecycle** fields from `@zeus/protocol` (`issuedAt`,
`expiresAt` / `ttlMs`, `peerCardPhase`, `peerCardRemainingMs`).

Automatic federation **levels / power escalation** are out of scope here.

## API

| fn | role |
| --- | --- |
| `emitirCredencial` / `emitPeerCredential` | build CredencialEmbajador v1 (peerCard + startpack); stamps `issuedAt`; accepts `ttlMs` |
| `consumirCredencial` / `consumePeerCredential` | validate shape/freshness; expose `phase` + `remainingMs`; fill default startpack |
| `peerCardPhase` / `peerCardRemainingMs` | re-exported TTL cycle helpers |
| `attachSignatureStub` / `verifySignatureStub` | typed stub — never claims verified crypto |
| `DEFAULT_STARTPACK` | `{ id, version, ref: 'startpack-ciudad-v0.1.0', packageName }` |

## Contract

Frozen in `src/tipos.mjs` (`isCredencialEmbajadorShaped`). Canonical home for
this shape (do not re-declare in loose engine files).

## Frontera

Imports only `@zeus/protocol` (makePeerCard / freshness / TTL cycle / roles).
No game packs, no signaling, no authority-kit dependency.

## Test

```bash
npm test -w @zeus/embajador-kit
```
