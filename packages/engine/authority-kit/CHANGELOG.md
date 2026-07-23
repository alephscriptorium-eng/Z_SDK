# @zeus/authority-kit

## 0.4.2

### Patch Changes

- 6262f1d: WP-U157: add root/subpath `"types"` conditions and publish `.d.ts` for the grafo-cercano lote.
- Updated dependencies [76e183b]
- Updated dependencies [21796ba]
  - @zeus/protocol@0.4.1
  - @zeus/rooms@0.1.2

## 0.4.1

### Patch Changes

- Updated dependencies [05d70fd]
  - @zeus/rooms@0.1.1

## 0.4.0

### Minor Changes

- 1df2fd2: Directional ACL (peer→resource): default deny for mutate/destructive; destructive requires explicit capability scope; optional authority-kit `acl` gate before applyIntent.

### Patch Changes

- Updated dependencies [1df2fd2]
  - @zeus/protocol@0.4.0

## 0.3.0

### Minor Changes

- 3ebfce3: Peer-card TTL lifecycle: issuedAt + peerCardPhase/remainingMs; authority issuePeerCard stamps issuedAt without auto-escalating scopes.

### Patch Changes

- Updated dependencies [bd02d70]
- Updated dependencies [3ebfce3]
  - @zeus/protocol@0.3.0

## 0.2.0

### Minor Changes

- c09b7ed: WP-U93: authority issues peer-card on join; webrtc-signaling requires a fresh card with role before offer/answer/ICE (D-20 torno).

### Patch Changes

- `stateDelta` opt-in: full on boot/heartbeat, `GAME_STATE_DELTA` patches between; `resolveStateDeltaSnapshotOpts` + optional `events.DELTA`.
- Updated dependencies [fadb4b5]
- Updated dependencies [5031cec]
- Updated dependencies [4b09212]
- Updated dependencies [c5f3449]
  - @zeus/protocol@0.2.0
