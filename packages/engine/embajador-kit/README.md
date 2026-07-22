# `@zeus/embajador-kit`

Minimal **emit + consume** API for a peer credential (peercard) that plugs the
entrant into **`startpack-ciudad-v0.1.0`** as the default base.

No crypto here: signature is a typed stub until the federation-privacy surface
lands. Room-authority TTL / issue helpers stay in `@zeus/authority-kit`.

## API

| fn | role |
| --- | --- |
| `emitirCredencial` / `emitPeerCredential` | build CredencialEmbajador v1 (peerCard + startpack) |
| `consumirCredencial` / `consumePeerCredential` | validate shape/freshness; fill default startpack |
| `attachSignatureStub` / `verifySignatureStub` | typed stub — never claims verified crypto |
| `DEFAULT_STARTPACK` | `{ id, version, ref: 'startpack-ciudad-v0.1.0', packageName }` |

## Contract

Frozen in `src/tipos.mjs` (`isCredencialEmbajadorShaped`). Canonical home for
this shape (do not re-declare in loose engine files).

## Frontera

Imports only `@zeus/protocol` (makePeerCard / freshness / roles). No game packs,
no signaling, no authority-kit.

## Test

```bash
npm test -w @zeus/embajador-kit
```
