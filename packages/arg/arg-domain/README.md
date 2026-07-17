# @zeus/arg-domain

delta — dominio puro del ARG. Sin three, sin red (mismo espíritu
que `@zeus/game-engine`, del que reutiliza `sampleLink`/`linkDistance`).

- `src/contract.mjs` — eventos (`arg:state|intent|track|ledger`), constantes,
  `makeIntent` (browser-safe: el arg-console lo importa crudo).
- `src/scenes/delta-v0.mjs` — el delta: nav-graph (nodos/enlaces), grifos,
  ríos, mar y topología de la cantera.
- `src/flow-engine.mjs` — la Riada: presión/apertura/burst, gotas, mar.
- `src/maze-engine.mjs` — la Cantera: cámaras/pasillos, ghost→digging→open.
- `src/reducer.mjs` — `reduceArgIntent` puro (G-ARG.4).
- `src/domain-state.mjs` — `createArgDomainState`: la verdad de la Autoridad
  (applyIntent / tick / snapshot compacto / drainOutbox).
- `src/feeds/synthetic.mjs` — feeds deterministas; los reales (volúmenes
  DISK_01/DISK_02 vía MCP) llegan con WP-14.

Contrato completo: [../spec/CONTRATO.md](../spec/CONTRATO.md). Tests:
`npm run test:arg-domain`.
