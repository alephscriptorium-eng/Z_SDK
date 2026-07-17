/**
 * @zeus/arg-console view kit — lado navegador (barrel).
 *
 * Copias autocontenidas del kit del 3d-monitor:
 *   scene          → bootstrap del stage 3D sobre @zeus/ui-3d-kit
 *   hud            → helpers de texto/contadores del HUD
 *   room           → viewer-config + wiring del cliente de room
 *   channel-events → suscripción dual direct/envelope con dedupe (G-ARG.2)
 *   labels         → sprites de etiqueta y glow
 *   log-panel      → log DOM (ledger del Notario)
 *
 * Piezas nuevas de delta:
 *   stick-poses    → poses paramétricas puras (sin three, node-testable)
 *   stick-puppet   → monigote procedural duck-type de loadPuppet (WP-07)
 *   delta-stage    → escena estática del delta desde deltaV0
 *   river-droplets → gotas instanciadas con dead reckoning
 *   actors-layer   → puppets por actor (híbrido stick/GLB) + anillo de cloak
 *   intent-client  → arg:intent bien formados hacia la room
 *   panel          → ventanitas HTML colapsables/arrastrables (WP-24)
 *   inspector      → raycast de símbolos 3D → panel HTML de lectura (WP-25)
 *   horse-client   → HORSE browser + rebroadcast de ofertas (WP-11/WP-12)
 *   cloak-panel    → inventario Q de presets (WP-12)
 */

export { createViewerScene } from './scene.mjs';
export { setText, createCounters } from './hud.mjs';
export { readViewerConfig, connectRoom } from './room.mjs';
export { onChannelEvent } from './channel-events.mjs';
export { createLabelSprite, createGlowSprite } from './labels.mjs';
export { createLogPanel } from './log-panel.mjs';
export {
  basePose,
  additivePose,
  blendPose,
  zeroPose,
  emoteWeight,
  STICK_POSES,
  STICK_EMOTES,
  EMOTE_DURATION_SEC
} from './stick-poses.mjs';
export { createStickPuppet, colorForActorId } from './stick-puppet.mjs';
export { createDeltaStage } from './delta-stage.mjs';
export { createRiverDroplets } from './river-droplets.mjs';
export { createSeaDroplets } from './sea-droplets.mjs';
export { createActorsLayer } from './actors-layer.mjs';
export { createIntentClient } from './intent-client.mjs';
export { createHorseClient, resolvePresetOfferBrowser } from './horse-client.mjs';
export {
  renderContactMenu,
  bindContactMenu,
  formatContactLive,
  setContactLive
} from './contact-render.mjs';
export {
  renderCloakInventory,
  bindCloakInventory,
  fetchPresetSummaries
} from './cloak-panel.mjs';
export {
  renderSeaActionPanel,
  bindSeaActionPanel
} from './sea-action-panel.mjs';
export {
  createPanel,
  panelStorageKey,
  loadPanelState,
  savePanelState,
  clampToBounds
} from './panel.mjs';
export { createInspector } from './inspector.mjs';
export {
  renderInspector,
  inspectorTitle,
  renderDropletLine,
  dropletDeepLink,
  isSyntheticUri
} from './inspector-render.mjs';
