# @zeus/feed-kit

## 0.3.1

### Patch Changes

- 54a886b: `@zeus/feed-kit` publica tipos: los SEIS subpaths de `exports` resuelven su
  condición `types` y las declaraciones viajan en el tarball.

  El paquete llevaba `0.3.0` con CERO ficheros `.d.ts`. Ahora hay declaraciones
  bajo `types/` para raíz, `./families`, `./synthetic`, `./resolve`, `./mcp` y
  `./jetstream`. Donde el runtime no congela shape (handles MCP reales, posts
  jetstream abiertos) el tipo usa `unknown` / objetos abiertos, no `any`.
  Diff de runtime cero.

## 0.3.0

### Minor Changes

- 783827f: WP-U85: unified feed families (static/stream/gossip) + jetstream→DISK_01 sync;
  game-agnostic resolve with auto→synthetic degradation.

### Patch Changes

- bbd599d: WP-U97: jetstream corpus recount via `@zeus/volumes-ops` `syncVolumeCounters`
  (any file type + cache invalidation); drop local `countJsonFiles` patching.
- Updated dependencies [d363de4]
- Updated dependencies [e884493]
- Updated dependencies [9560c30]
- Updated dependencies [c59a9ad]
- Updated dependencies [cc46241]
- Updated dependencies [d4d618e]
- Updated dependencies [b491a04]
- Updated dependencies [9e47b27]
- Updated dependencies [d143022]
- Updated dependencies [6131403]
- Updated dependencies [be26ab3]
- Updated dependencies [c5f3449]
  - @zeus/presets-sdk@0.1.1
  - @zeus/linea-kit@0.2.0
  - @zeus/volumes-ops@0.2.0
  - @zeus/firehose-core@0.1.1
