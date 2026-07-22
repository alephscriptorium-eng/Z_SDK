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

export { emitirCredencial, emitPeerCredential } from './emitir.mjs';
export { consumirCredencial, consumePeerCredential } from './consumir.mjs';
export {
  FIRMA_STUB_PENDIENTE,
  attachSignatureStub,
  verifySignatureStub
} from './firma-stub.mjs';
