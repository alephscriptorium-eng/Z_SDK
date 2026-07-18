/**
 * @zeus/ui-3d-kit — browser-safe entry point.
 *
 * Served RAW to the browser via express.static + import maps: `three` and
 * `three/addons/*` imports in the modules below are resolved by the page's
 * import map, NOT by node. Nothing here imports node builtins.
 *
 * Node-only path helpers live in the separate entry `@zeus/ui-3d-kit/node`
 * (src/node.mjs) — do not re-export them here.
 */

// core
export { createSceneManager } from './core/scene-manager.mjs';
export { createAnimationController } from './core/animation-controller.mjs';
export { createTrajectoryManager } from './core/trajectory-manager.mjs';

// puppet
export { loadPuppet } from './puppet/puppet.mjs';
export {
  DEFAULT_CLIP_MAPS,
  POSE_TO_BASE,
  resolveClipMap,
  resolveBaseClip,
  resolveAdditiveClip,
} from './puppet/clip-map.mjs';

// stage
export { createNodeMesh } from './stage/node-mesh.mjs';
export {
  createLinkCorridor,
  createLinkCorridorBetween,
  sampleLinkPath,
} from './stage/link-corridor.mjs';
export { createAnchorMarker, loadAnchorModel } from './stage/anchor-marker.mjs';

// engine — re-exported from @zeus/game-engine (single source of truth, pure
// logic — no three). walk-driver is this kit's own thin layer on top.
export { createMapEngine, sampleLink, linkDistance, vaivenDosNodos } from '@zeus/game-engine';
export { createWalkDriver, resolveWalk } from './engine/walk-driver.mjs';

// adapter (pure — no three)
export { createMapSceneAdapter } from './adapter/map-scene-adapter.mjs';
