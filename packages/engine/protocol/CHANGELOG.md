# @zeus/protocol

## 0.4.0

### Minor Changes

- 1df2fd2: Directional ACL (peer→resource): default deny for mutate/destructive; destructive requires explicit capability scope; optional authority-kit `acl` gate before applyIntent.

## 0.3.0

### Minor Changes

- bd02d70: Z_SDK #4: ssbId on federation handshake + traveling peer-card seat signature (ed25519).
- 3ebfce3: Peer-card TTL lifecycle: issuedAt + peerCardPhase/remainingMs; authority issuePeerCard stamps issuedAt without auto-escalating scopes.

## 0.2.0

### Minor Changes

- 4b09212: WP-U98: single shape source — `EVENT_META` drives AsyncAPI and runtime `isShaped(kind, data)`.
- c5f3449: WP-U99: `makeIntent` requires non-empty `game` (symmetric with `makeEnvelope`); volumes-ops role gate no longer builds a wire intent via `makeIntent`.

### Patch Changes

- GAME_STATE_DELTA helpers (`diffGameState` / `applyGameStateDelta`) + `mode` on state EVENT_META (gamechannel v0.2).
- fadb4b5: WP-U53: adopt changesets for per-package semver, changelog, and CI release
  to the private @zeus registry (replaces lockstep 0.x policy).
- 5031cec: WP-U95: shared `nodeSrcDir` in `@zeus/protocol/node-src-dir`; unify package `./node` entry files to `src/node.mjs`.
