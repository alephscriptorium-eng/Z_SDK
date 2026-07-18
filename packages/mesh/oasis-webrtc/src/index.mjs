/**
 * @zeus/oasis-webrtc — adaptación del módulo /webrtc de simple-ssb-webrtc (repo B).
 *
 * Demuele el flujo copy-paste (textarea offer/answer). Señalización vía
 * SsbPrivateSignalingService + endpoint HTTP sobre sbot (o bus in-memory).
 * El fork original en plan/recursos/simple-ssb-webrtc queda intacto.
 *
 * Procedencia: plan/recursos/simple-ssb-webrtc @ 7d5c757 (oasis-pr) — adaptado,
 * no copy-paste silencioso (PRACTICAS §1.4). Candidato upstream: docs/UPSTREAM_PR.md
 */

export { SSB_WEBRTC_SIGNAL_TYPE } from '@zeus/webrtc-signaling';
export { createOasisWebrtcApp, resolveOasisWebrtcListen } from './http-api.mjs';
export { renderWebrtcPage } from './view.mjs';
