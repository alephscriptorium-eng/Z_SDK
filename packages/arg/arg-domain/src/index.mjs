/**
 * @zeus/arg-domain — CAUDAL, dominio puro del ARG del delta.
 * Sin three, sin red. Ver packages/arg/spec/CONTRATO.md.
 */

export * from './contract.mjs';
export { deltaV0, buildCanteraTopology, buildNavGraph, chamberId, corridorId } from './scenes/delta-v0.mjs';
export { createFlowEngine, LABEL_WINDOW } from './flow-engine.mjs';
export { createMazeEngine } from './maze-engine.mjs';
export { reduceArgIntent } from './reducer.mjs';
export { createArgDomainState, DEFAULT_GAMEMAP } from './domain-state.mjs';
export {
  resolveFeeds,
  createSyntheticFirehoseFeed,
  createSyntheticMazeSource,
  createRng
} from './feeds/synthetic.mjs';
export { resolveTrackRef, buildTrackBrowserUrl } from './track.mjs';
export { CLOAK_MODS, cloakModFor, cloakModsFor, effectiveLinkSpeed } from './cloak-mods.mjs';
