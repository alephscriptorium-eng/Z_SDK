/**
 * @zeus/game-engine — browser-safe entry point.
 *
 * Pure gamemap logic (no three, no network, no node builtins) plus the runtime
 * form of the canonical scenes. Served RAW to the browser via
 * express.static + import maps, and consumed in node by @zeus/ui-3d-kit and its
 * tests. This package is the SINGLE SOURCE OF TRUTH for the map engine and
 * scenes — replaces the old vendor-sync from gea-sdk (block-11 GA-B).
 *
 * Node-only path helpers live in the separate entry `@zeus/game-engine/node`
 * (src/paths.node.mjs) — do not re-export them here.
 */

// engine — pure logic (no three)
export { createMapEngine, sampleLink, linkDistance } from './map-engine.mjs';

// scenes — runtime form of gamethings/escenas/*.yaml
export { vaivenDosNodos } from './scenes/vaiven-dos-nodos.mjs';
