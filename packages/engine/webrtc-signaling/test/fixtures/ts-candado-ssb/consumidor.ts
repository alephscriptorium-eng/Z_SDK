/**
 * WP-U251 · defecto (6) — el candado del carril SSB tiene que verse desde
 * TypeScript, que es la capa donde un consumidor se enteraría EN BUILD.
 *
 * Este fichero es el sensor: `tsc --noEmit` sobre él debe salir en 0.
 *  - Antes del arreglo fallaba con `TS2578 Unused '@ts-expect-error'`
 *    (`setAdmission('anonymous')` en el carril SSB typecheckeaba) y con
 *    `TS2353` por `requireSsbId` / `requireSeatSignature`, que no existían
 *    en `SsbPrivateSignalingOptions` aunque el runtime sí las lee.
 *  - El carril de socket NO se toca: ahí `anonymous` es legal y tiene que
 *    seguir typecheckeando (si no, el arreglo habría cerrado de más).
 *
 * `types: []` a propósito: TS 4.9 (el del repo) no parsea `@types/node` 26,
 * y `skipLibCheck` ya silencia los `node:*` sin resolver dentro del `.d.ts`.
 */
import {
  SocketRoomSignalingService,
  SsbPrivateSignalingService,
  SIGNALING_ADMISSION,
  type SignalingAdmission,
  type PeerCard
} from '@zeus/webrtc-signaling';

/** El carril de socket admite los DOS modos — la frontera no se movió. */
export function carrilSocket(): SignalingAdmission {
  const svc = new SocketRoomSignalingService({
    admission: SIGNALING_ADMISSION.anonymous,
    requireSsbId: true,
    requireSeatSignature: false
  });
  svc.setAdmission('anonymous');
  svc.setAdmission('peer-card');
  return svc.getAdmission();
}

/** El carril SSB: `anonymous` no es un modo, y el tipo lo dice. */
export function carrilSsb(card: PeerCard): 'peer-card' {
  const svc = new SsbPrivateSignalingService({
    allowTrickle: false,
    requireSsbId: true,
    requireSeatSignature: false,
    admission: 'peer-card'
  });

  svc.setAdmission('peer-card');
  // @ts-expect-error — el carril SSB no admite antesala anónima (lanza en runtime)
  svc.setAdmission('anonymous');
  // @ts-expect-error — tampoco por opciones
  const porOpciones = new SsbPrivateSignalingService({ admission: 'anonymous' });
  void porOpciones;

  // Las exigencias del torno también son declarables en `setPeerCard`.
  svc.setPeerCard(card, { requireSsbId: true, requireSeatSignature: false });

  return svc.getAdmission();
}
