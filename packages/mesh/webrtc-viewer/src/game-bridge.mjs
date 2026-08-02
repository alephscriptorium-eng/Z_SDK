/**
 * Game ↔ WebRTC viewer bridge (rabbit-spider-horse contact buttons).
 * Builds viewer URLs from presets-sdk ports — no hardcoded ports.
 */

import {
  resolveZeusUiPorts,
  resolveZeusHost,
  readEnvPortAlias,
  uiPortEnvChain,
  DEFAULT_ZEUS_UI_MESH
} from '@zeus/presets-sdk/env';

/**
 * Orden de precedencia del puerto del visor. **Tiene que ser el MISMO que usa
 * `serve.mjs`**, que es quien ATA: si el que anuncia y el que ata leen las dos
 * claves en orden distinto, se separan sin necesidad de ningun valor mal
 * formado. Ocurria (WP-U266 · B2), con configuracion enteramente valida:
 *
 *   ZEUS_PORT_WEBRTC_VIEWER=4001  WEBRTC_VIEWER_PORT=4002
 *     serve.mjs ataba en    4002   (WEBRTC_VIEWER_PORT primero)
 *     game-bridge anunciaba 4001   (ZEUS_PORT_WEBRTC_VIEWER primero)
 *
 * Que es el defecto entero de la ficha —lo anunciado y lo atado se separan—
 * conseguido sin un solo valor malo. Si algun dia se cambia el orden, se cambia
 * en los dos sitios o no se cambia.
 */
export const WEBRTC_VIEWER_PORT_ENV = Object.freeze(uiPortEnvChain('webrtcViewer'));

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
  // WP-U266 · B2. Antes: `Number(env.ZEUS_PORT_WEBRTC_VIEWER || env.WEBRTC_VIEWER_PORT || …)`,
  // que anunciaba tal cual lo que le dieran —cero, negativo, fuera de rango,
  // hexadecimal reinterpretado, con ceros a la izquierda, o `NaN`— y con rc=0.
  // Era la mitad «y no se anuncia» de la CA, viva.
  const port = readEnvPortAlias(WEBRTC_VIEWER_PORT_ENV, slot.port || fallback.port, env);
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
