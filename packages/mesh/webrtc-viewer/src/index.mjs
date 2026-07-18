/**
 * @zeus/webrtc-viewer — Visor WebRTC del mesh (WP-U89 / D-17).
 *
 * Hermano de operator-ui: Angular lib + host (projects/) + serve.mjs.
 * Motor adaptado de web-rtc-gamify-ui WebRTCEngine @ 4b9271b.
 */
export { WebRTCEngine } from './core/webrtc-engine.mjs';
export {
  validateCacheObject,
  buildBulkCacheEnvelope,
  receiveAndValidateCache,
  BULK_CACHE_TYPE,
  DEFAULT_CACHE_SCHEMA
} from './bulk/cache-transfer.mjs';
export {
  WEBRTC_REST_ACTIONS,
  WEBRTC_REST_HANDLERS,
  resolveWebRtcViewerEndpoint,
  buildWebRtcViewerUrl,
  resolveWebRtcRestAction
} from './game-bridge.mjs';
export { BrowserSocketSignalingService } from './browser/browser-signaling.mjs';
export { bootWebRtcViewer } from './browser/viewer-app.mjs';
