/**
 * @zeus/embajador-kit — API mínima emitir + consumir credencial de peer.
 * Destino canónico del contrato embajador (eje II). Sin crypto propia.
 */

export {
  CREDENCIAL_VERSION,
  DEFAULT_STARTPACK,
  isStartpackRefShaped,
  isCredencialEmbajadorShaped,
  resolveStartpack
} from './tipos.mjs';

export {
  emitirCredencial,
  emitPeerCredential,
  DEFAULT_CREDENCIAL_TTL_MS
} from './emitir.mjs';
export { consumirCredencial, consumePeerCredential } from './consumir.mjs';
export {
  FIRMA_STUB_PENDIENTE,
  attachSignatureStub,
  verifySignatureStub
} from './firma-stub.mjs';

/** Re-export ciclo TTL (consumidor mínimo del modelo protocol). */
export {
  PEER_CARD_PHASE,
  peerCardPhase,
  peerCardRemainingMs,
  isPeerCardFresh
} from '@zeus/protocol';
