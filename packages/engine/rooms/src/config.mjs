/** ZEUS_SCRIPTORIUM_* env configuration (LS.1 / LS.5). */

/** Localhost dev auth token — single source of truth (SEC-A). */
export const DEFAULT_SCRIPTORIUM_SECRET = 'dev-secret';

/**
 * Resolve scriptorium auth secret from env.
 * Fails closed in production when ZEUS_SCRIPTORIUM_SECRET is unset.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveScriptoriumSecret(env = process.env) {
  const secret = env.ZEUS_SCRIPTORIUM_SECRET;
  if (secret) return secret;
  if (env.NODE_ENV === 'production') {
    throw new Error('ZEUS_SCRIPTORIUM_SECRET is required when NODE_ENV=production');
  }
  return DEFAULT_SCRIPTORIUM_SECRET;
}

export function loadScriptoriumConfig(env = process.env) {
  return {
    url: env.ZEUS_SCRIPTORIUM_URL || 'http://localhost:3017',
    namespace: '/runtime',
    room: env.ZEUS_SCRIPTORIUM_ROOM || 'PUBLIC_ROOM',
    user: env.ZEUS_SCRIPTORIUM_USER || 'zeus-client',
    secret: resolveScriptoriumSecret(env),
    bridge: env.ZEUS_SCRIPTORIUM_BRIDGE || 'local',
    bridgeUrl: env.ZEUS_SCRIPTORIUM_BRIDGE_URL || env.ZEUS_SCRIPTORIUM_URL || 'http://localhost:3017'
  };
}

export const config = loadScriptoriumConfig();

/**
 * Resolve the scriptorium room for a player session (E6 / visor 3D Fase 0).
 * ZEUS_SCRIPTORIUM_ROOM overrides; otherwise `scriptorium.<sessionId>`.
 * @param {string} [sessionId]
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string}
 */
export function resolveSessionRoom(sessionId = 'default', env = process.env) {
  return env.ZEUS_SCRIPTORIUM_ROOM || `scriptorium.${sessionId}`;
}
