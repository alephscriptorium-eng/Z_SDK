/**
 * Intentional-stop signal composition (read hook for actuators).
 *
 * Actuator (mcp-launcher) writes on stop / clears on launch.
 * Leaf context also tracks `intentionalStop` for PARADA_SOLICITADA.
 * Full cascade/zones policy that prefers actuator in guards = later WP.
 *
 * @param {{
 *   actuatorIntentional?: boolean,
 *   contextIntentional?: boolean
 * }} [signals]
 * @returns {boolean}
 */
export function resolveIntentionalStop(signals = {}) {
  return Boolean(signals.actuatorIntentional) || Boolean(signals.contextIntentional);
}

/**
 * Thin adapter: call an actuator `isIntentionalStop(catalogId)` if present.
 * @param {{ isIntentionalStop?: (id: string) => boolean } | null | undefined} actuator
 * @param {string} catalogId
 * @returns {boolean | undefined} undefined when actuator has no read API
 */
export function readActuatorIntentionalStop(actuator, catalogId) {
  if (!actuator || typeof actuator.isIntentionalStop !== 'function') {
    return undefined;
  }
  return Boolean(actuator.isIntentionalStop(catalogId));
}
