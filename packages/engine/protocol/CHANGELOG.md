# @zeus/protocol

## 0.2.0

### Minor Changes

- 4b09212: WP-U98: single shape source — `EVENT_META` drives AsyncAPI and runtime `isShaped(kind, data)`.
- c5f3449: WP-U99: `makeIntent` requires non-empty `game` (symmetric with `makeEnvelope`); volumes-ops role gate no longer builds a wire intent via `makeIntent`.

### Patch Changes

- fadb4b5: WP-U53: adopt changesets for per-package semver, changelog, and CI release
  to the private @zeus registry (replaces lockstep 0.x policy).
- 5031cec: WP-U95: shared `nodeSrcDir` in `@zeus/protocol/node-src-dir`; unify package `./node` entry files to `src/node.mjs`.
