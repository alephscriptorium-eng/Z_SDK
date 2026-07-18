/**
 * Game ↔ WebRTC viewer bridge (rabbit-spider-horse contact buttons).
 * Builds viewer URLs from presets-sdk ports — no hardcoded ports.
 */

import { resolveZeusUiPorts, resolveZeusHost, DEFAULT_ZEUS_UI_MESH } from '@zeus/presets-sdk/env';

export const WEBRTC_REST_ACTIONS = Object.freeze([
  { id: 'webrtc-call', label: 'WebRTC · llamar' },
  { id: 'webrtc-share', label: 'WebRTC · compartir' },
  { id: 'webrtc-hangup', label: 'WebRTC · colgar' }
]);

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ host: string, port: number, baseUrl: string }}
 */
export function resolveWebRtcViewerEndpoint(env = process.env) {
  const uis = resolveZeusUiPorts();
  const fallback = DEFAULT_ZEUS_UI_MESH.webrtcViewer;
  const slot = uis.webrtcViewer || fallback;
  const host = slot.host || resolveZeusHost();
  const port = Number(
    env.ZEUS_PORT_WEBRTC_VIEWER || env.WEBRTC_VIEWER_PORT || slot.port || fallback.port
  );
  return { host, port, baseUrl: `http://${host}:${port}` };
}

/**
 * @param {object} opts
 * @param {string} opts.action — webrtc-call | webrtc-share | webrtc-hangup
 * @param {string} [opts.room]
 * @param {string} [opts.peerId]
 * @param {string} [opts.userId]
 * @param {string} [opts.mode] — room | private
 * @param {NodeJS.ProcessEnv} [opts.env]
 */
export function buildWebRtcViewerUrl(opts) {
  const { baseUrl } = resolveWebRtcViewerEndpoint(opts.env);
  const q = new URLSearchParams();
  if (opts.action) q.set('action', opts.action);
  if (opts.room) q.set('room', opts.room);
  if (opts.peerId) q.set('peer', opts.peerId);
  if (opts.userId) q.set('user', opts.userId);
  if (opts.mode) q.set('mode', opts.mode);
  const qs = q.toString();
  return qs ? `${baseUrl}/?${qs}` : `${baseUrl}/`;
}

/**
 * Rest-action table for contact menu (PRACTICAS §1.2).
 * @type {Record<string, (ctx: object) => string|void>}
 */
export const WEBRTC_REST_HANDLERS = Object.freeze({
  'webrtc-call': (ctx) =>
    buildWebRtcViewerUrl({
      action: 'webrtc-call',
      room: ctx.room,
      peerId: ctx.peerId,
      userId: ctx.userId,
      mode: ctx.mode || 'room',
      env: ctx.env
    }),
  'webrtc-share': (ctx) =>
    buildWebRtcViewerUrl({
      action: 'webrtc-share',
      room: ctx.room,
      peerId: ctx.peerId,
      userId: ctx.userId,
      mode: ctx.mode || 'room',
      env: ctx.env
    }),
  'webrtc-hangup': (ctx) =>
    buildWebRtcViewerUrl({
      action: 'webrtc-hangup',
      room: ctx.room,
      peerId: ctx.peerId,
      userId: ctx.userId,
      env: ctx.env
    })
});

/**
 * @param {string} actionId
 * @param {object} ctx
 * @returns {string|null}
 */
export function resolveWebRtcRestAction(actionId, ctx) {
  const handler = WEBRTC_REST_HANDLERS[actionId];
  return handler ? handler(ctx) : null;
}
