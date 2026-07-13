/**
 * @zeus/3d-monitor view kit — browser side (barrel).
 *
 * Reusable elements every view combines with its own business logic:
 *   scene       → 3D stage bootstrap over @zeus/ui-3d-kit
 *   hud         → HUD text/counter helpers
 *   room        → viewer-config + room client wiring
 *   channels    → event → channel/role classification (pure)
 *   ring-layout → circular placement (pure)
 *   markers     → role/actor meshes, hub, black hole
 *   log-panel   → DOM event log
 */

export { createViewerScene } from './scene.mjs';
export { setText, createCounters } from './hud.mjs';
export { readViewerConfig, connectRoom } from './room.mjs';
export {
  EVENT_CHANNEL,
  channelFor,
  emitterOf,
  ROLE_STYLES,
  KNOWN_ROLES,
  classifyRole,
  roleStyle
} from './channels.mjs';
export { createRingLayout } from './ring-layout.mjs';
export { createMarker, createHub, createBlackHole, colorForIndex } from './markers.mjs';
export { createLogPanel } from './log-panel.mjs';
export { createLabelSprite, createGlowSprite } from './labels.mjs';
export { createPipeNetwork } from './pipes.mjs';
export { onChannelEvent } from './channel-events.mjs';
