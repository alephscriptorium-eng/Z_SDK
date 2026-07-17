# @zeus/arg-domain

delta — dominio puro del ARG. Sin three, sin red (mismo espíritu
que `@zeus/game-engine`, del que reutiliza `sampleLink`/`linkDistance`).

- `src/contract.mjs` — capa delta sobre `@zeus/protocol`: wire `arg:*`,
  catálogo de intents con roles, `makeIntent` (browser-safe).
- `src/scenes/delta-v0.mjs` — el delta: nav-graph (nodos/enlaces), grifos,
  ríos, mar y topología de la cantera.
- `src/flow-engine.mjs` — la Riada: presión/apertura/burst, gotas, mar.
- `src/maze-engine.mjs` — la Cantera: cámaras/pasillos, ghost→digging→open.
- `src/line-board.mjs` — tablero DJ: cache → curate → milestone (rol `dj`).
- `src/reducer.mjs` — `reduceArgIntent` puro (G-ARG.4).
- `src/domain-state.mjs` — `createArgDomainState`: la verdad de la Autoridad
  (applyIntent / tick / snapshot compacto / drainOutbox).
- `src/feeds/synthetic.mjs` — feeds deterministas; los reales (volúmenes
  DISK_01/DISK_02 vía MCP) llegan con WP-14.

Contrato completo: [../spec/CONTRATO.md](../spec/CONTRATO.md). Tests:
`npm run test:arg-domain`.
