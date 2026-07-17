/**
 * Helpers de vista del 3d-monitor (tráfico de room / roles demo:bots).
 * Lo genérico (escena, HUD, room, labels, log, onChannelEvent) vive en
 * @zeus/view-kit — aquí solo lo específico del monitor.
 */

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
export { createPipeNetwork } from './pipes.mjs';
