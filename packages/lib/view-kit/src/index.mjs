/**
 * @zeus/view-kit — kit de vistas 3D+HTML (browser-safe).
 *
 * Servido crudo vía express.static + import-map. Sin fs/red de Node.
 * Sin nombres de juego (D-8): lo específico de un juego vive junto a sus vistas.
 *
 *   scene          → bootstrap del stage 3D sobre @zeus/ui-3d-kit
 *   hud            → helpers de texto/contadores del HUD
 *   room           → viewer-config + wiring del cliente de room
 *   channel-events → suscripción dual direct/envelope con dedupe
 *   labels         → sprites de etiqueta y glow
 *   log-panel      → log DOM
 *   stick-poses    → poses paramétricas puras (sin three, node-testable)
 *   stick-puppet   → monigote procedural
 *   actors-layer   → puppets por actor (híbrido stick/GLB) + anillo de cloak
 *   panel          → ventanitas HTML colapsables/arrastrables
 *   horse-client   → HORSE browser + rebroadcast de ofertas
 *   cloak-panel    → inventario Q de presets
 *   contact-render → menú de contacto HORSE (render puro)
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
export { createActorsLayer } from './actors-layer.mjs';
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
  createPanel,
  panelStorageKey,
  loadPanelState,
  savePanelState,
  clampToBounds
} from './panel.mjs';
