/**
 * Dev-only room client defaults when the host page omits injected JSON config.
 * Mirrors @zeus/presets-sdk DEFAULT_ZEUS_UI_MESH scriptorium slot (localhost dev).
 * Room defaults to the game room (ARG_DELTA), not scriptorium.<session>.
 * See SEC-A in docs/reference/decisions.md — not for production.
 */
export const DEV_ROOM_CLIENT_CONFIG = {
  scriptoriumUrl: 'http://localhost:3017/runtime',
  room: 'ARG_DELTA',
  sessionId: 'default',
  token: 'dev-secret' // mirrors @zeus/rooms DEFAULT_SCRIPTORIUM_SECRET (SEC-A)
};

/**
 * @param {string} elementId
 * @returns {typeof DEV_ROOM_CLIENT_CONFIG}
 */
export function readInjectedRoomConfig(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return { ...DEV_ROOM_CLIENT_CONFIG };
  try {
    return JSON.parse(el.textContent);
  } catch {
    return { ...DEV_ROOM_CLIENT_CONFIG };
  }
}
