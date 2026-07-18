/**
 * Browser-safe game button helpers (no process.env / presets-sdk).
 * Server injects `webrtcViewerUrl` into #viewer-config.
 */

export const WEBRTC_REST_ACTIONS = Object.freeze([
  { id: 'webrtc-call', label: 'WebRTC · llamar' },
  { id: 'webrtc-share', label: 'WebRTC · compartir' },
  { id: 'webrtc-hangup', label: 'WebRTC · colgar' }
]);

/**
 * @param {string} baseUrl — e.g. http://localhost:3023 from viewer-config
 * @param {object} opts
 * @param {string} opts.action
 * @param {string} [opts.room]
 * @param {string} [opts.peerId]
 * @param {string} [opts.userId]
 * @param {string} [opts.mode]
 */
export function buildWebRtcViewerUrlFromBase(baseUrl, opts) {
  if (!baseUrl) return null;
  const root = String(baseUrl).replace(/\/$/, '');
  const q = new URLSearchParams();
  if (opts.action) q.set('action', opts.action);
  if (opts.room) q.set('room', opts.room);
  if (opts.peerId) q.set('peer', opts.peerId);
  if (opts.userId) q.set('user', opts.userId);
  if (opts.mode) q.set('mode', opts.mode);
  const qs = q.toString();
  return qs ? `${root}/?${qs}` : `${root}/`;
}

/**
 * @param {string} actionId
 * @param {{ webrtcViewerUrl?: string, room?: string, peerId?: string, userId?: string, mode?: string }} ctx
 */
export function resolveWebRtcRestActionBrowser(actionId, ctx) {
  if (!WEBRTC_REST_ACTIONS.some((a) => a.id === actionId)) return null;
  return buildWebRtcViewerUrlFromBase(ctx.webrtcViewerUrl, {
    action: actionId,
    room: ctx.room,
    peerId: ctx.peerId,
    userId: ctx.userId,
    mode: ctx.mode || 'room'
  });
}
