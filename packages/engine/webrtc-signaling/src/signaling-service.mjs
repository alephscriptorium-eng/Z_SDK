/**
 * Abstract SignalingService (port of repo A abstract class → mjs).
 * Procedencia: plan/recursos/web-rtc-gamify-ui SignalingService @ 4b9271b.
 * Concrete transport: SocketRoomSignalingService (rooms / socket-server).
 *
 * WP-U93: offer/answer/ICE y room-join exigen peer-card válida (torno).
 * Z_SDK #4: handshake lleva `ssbId`; asiento firmado se verifica.
 *
 * WP-U186 (transporte ≠ permiso): el torno gobierna SOLO la antesala
 * WebRTC (capacidad opt-in). El transporte base admite sesión anónima
 * `role:null` (sin card); una card presentada se valida — inválida =
 * RECHAZO, jamás degrada a anónimo; el rol se consulta EN LA ACCIÓN
 * (`getSessionRole()` / torno por mensaje gated). Frontera:
 * plan/REPORTES/U186-paso0-frontera-room-join.md.
 *
 * WP-U197 (signaling anónimo): la antesala tiene modo de ADMISIÓN
 * declarado — `peer-card` (por defecto, statu quo) o `anonymous`. En
 * anónimo, offer/answer/ICE/room-join viajan SIN card y la sesión sigue
 * siendo `role:null`: admisión ≠ permiso. Un mensaje anónimo no puede
 * cargar claim de identidad (`ssbId`/`from` con forma de feed) y una card
 * presentada se valida igual — inválida RECHAZA también en modo anónimo.
 */

import { EventEmitter } from 'node:events';
import { ABSTRACT_TO_WIRE, createWireMessage } from './messages.mjs';
import {
  assertSignalingPeerCard,
  assertSignalingAdmission,
  isPeerCardGatedType,
  isPeerCardPresented,
  peerCardFromMessage,
  ssbIdFromMessage,
  SIGNALING_ADMISSION
} from './peer-card-gate.mjs';
import { isSsbId } from '@zeus/protocol';

/**
 * @typedef {object} SignalingMessage
 * @property {string} type — abstract type (offer|answer|ice-candidate|…)
 * @property {string} from
 * @property {string} [to]
 * @property {string} [roomId]
 * @property {number} timestamp
 * @property {string} messageId
 * @property {unknown} [offer]
 * @property {unknown} [answer]
 * @property {unknown} [candidate]
 * @property {unknown} [data]
 * @property {object} [peerCard]
 * @property {string} [ssbId] — feed id en el handshake federado
 * @property {boolean} [anonymous] — admitido sin card (WP-U197): sin
 *   peerCard, sin ssbId y sin rol. Marca informativa, NO credencial.
 */

export class SignalingService extends EventEmitter {
  constructor() {
    super();
    /** @type {string} */
    this.userId = '';
    /** @type {string} */
    this.roomId = '';
    /** @type {boolean} */
    this._connected = false;
    /** @type {object|null} — peer-card emitida por la autoridad (WP-U93) */
    this._peerCard = null;
    /** @type {string|null} — rol exigido en el torno (opcional) */
    this._requiredRole = null;
    /** @type {boolean} — exigir ssbId en card (carril SSB / federación) */
    this._requireSsbId = false;
    /** @type {boolean} — exigir firma de asiento (tarjeta viajera) */
    this._requireSeatSignature = false;
    /**
     * @type {string} — modo de admisión de la antesala (WP-U197).
     * Por defecto `peer-card`: NO se retira ningún torno. `anonymous` es
     * decisión local de despliegue, nunca negociable por el cable.
     */
    this._admission = SIGNALING_ADMISSION.peerCard;
  }

  /**
   * Fija el modo de admisión de la antesala (WP-U197).
   * @param {string} mode — `peer-card` | `anonymous`
   */
  setAdmission(mode) {
    if (
      mode !== SIGNALING_ADMISSION.peerCard &&
      mode !== SIGNALING_ADMISSION.anonymous
    ) {
      throw new Error(
        `SignalingService.setAdmission: unknown admission mode ${String(mode)}`
      );
    }
    this._admission = mode;
  }

  /** @returns {string} */
  getAdmission() {
    return this._admission;
  }

  /**
   * ¿La sesión es anónima? (WP-U197) — anónima = sin card adoptada.
   * Nunca implica permiso: `getSessionRole()` sigue devolviendo `null`.
   * @returns {boolean}
   */
  isAnonymous() {
    return !isPeerCardPresented(this._peerCard);
  }

  /** @returns {{ admission: string, anonymous: boolean, role: string|null }} */
  describeAdmission(now) {
    return {
      admission: this._admission,
      anonymous: this.isAnonymous(),
      role: this.getSessionRole(now)
    };
  }

  /**
   * Fija el peer-card local (p. ej. tras emisión de autoridad).
   * @param {object} peerCard
   * @param {{ role?: string, now?: number, requireSsbId?: boolean, requireSeatSignature?: boolean }} [opts]
   */
  setPeerCard(peerCard, opts = {}) {
    if (opts.requireSsbId != null) this._requireSsbId = opts.requireSsbId;
    if (opts.requireSeatSignature != null) {
      this._requireSeatSignature = opts.requireSeatSignature;
    }
    const check = assertSignalingPeerCard(peerCard, {
      role: opts.role ?? this._requiredRole ?? undefined,
      now: opts.now,
      requireSsbId: this._requireSsbId,
      requireSeatSignature: this._requireSeatSignature
    });
    if (!check.ok) {
      throw new Error(`SignalingService.setPeerCard: ${check.error}`);
    }
    this._peerCard = peerCard;
    if (opts.role) this._requiredRole = opts.role;
  }

  getPeerCard() {
    return this._peerCard;
  }

  /**
   * Rol de la sesión, consultado EN EL MOMENTO (WP-U186).
   * Sin card = sesión anónima ⇒ `null`. Con card, se re-valida aquí
   * (frescura incluida): si la card ya no acredita, devuelve `null` —
   * y toda acción gated queda igualmente denegada por el torno.
   * @param {number} [now]
   * @returns {string|null}
   */
  getSessionRole(now) {
    if (this._peerCard == null) return null;
    const check = assertSignalingPeerCard(this._peerCard, {
      role: this._requiredRole ?? undefined,
      now,
      requireSsbId: this._requireSsbId,
      requireSeatSignature: this._requireSeatSignature
    });
    return check.ok ? check.role : null;
  }

  /** @returns {string|null} */
  getSsbId() {
    const id = this._peerCard?.ssbId;
    return isSsbId(id) ? id : null;
  }

  /** @param {string} userId @param {unknown} [config] */
  // eslint-disable-next-line no-unused-vars
  async connect(userId, config) {
    throw new Error('SignalingService.connect must be implemented');
  }

  async disconnect() {
    throw new Error('SignalingService.disconnect must be implemented');
  }

  /**
   * Join signaling room presenting an authority-issued peer-card.
   * @param {string} roomId
   * @param {object} peerCard
   */
  // eslint-disable-next-line no-unused-vars
  async joinRoom(roomId, peerCard) {
    throw new Error('SignalingService.joinRoom must be implemented');
  }

  async leaveRoom() {
    throw new Error('SignalingService.leaveRoom must be implemented');
  }

  /** @param {SignalingMessage} message */
  // eslint-disable-next-line no-unused-vars
  async sendMessage(message) {
    throw new Error('SignalingService.sendMessage must be implemented');
  }

  /**
   * @param {string} targetPeerId
   * @param {RTCSessionDescriptionInit} offer
   */
  async sendOffer(targetPeerId, offer) {
    await this.sendMessage(this._gatedOutbound({
      type: 'offer',
      from: this.userId,
      to: targetPeerId,
      roomId: this.roomId,
      timestamp: Date.now(),
      messageId: createWireMessage({ type: 'webrtc-offer', from: this.userId }).messageId,
      offer
    }));
  }

  /**
   * @param {string} targetPeerId
   * @param {RTCSessionDescriptionInit} answer
   */
  async sendAnswer(targetPeerId, answer) {
    await this.sendMessage(this._gatedOutbound({
      type: 'answer',
      from: this.userId,
      to: targetPeerId,
      roomId: this.roomId,
      timestamp: Date.now(),
      messageId: createWireMessage({ type: 'webrtc-answer', from: this.userId }).messageId,
      answer
    }));
  }

  /**
   * Trickle ICE: send each candidate as it arrives (no waitForIceComplete).
   * @param {string} targetPeerId
   * @param {RTCIceCandidateInit} candidate
   */
  async sendIceCandidate(targetPeerId, candidate) {
    await this.sendMessage(this._gatedOutbound({
      type: 'ice-candidate',
      from: this.userId,
      to: targetPeerId,
      roomId: this.roomId,
      timestamp: Date.now(),
      messageId: createWireMessage({
        type: 'webrtc-ice-candidate',
        from: this.userId
      }).messageId,
      candidate
    }));
  }

  isConnected() {
    return this._connected;
  }

  getUserId() {
    return this.userId;
  }

  getRoomId() {
    return this.roomId;
  }

  /**
   * @param {SignalingMessage} message
   * @protected
   */
  handleMessage(message) {
    if (isPeerCardGatedType(message?.type)) {
      let card = peerCardFromMessage(message) ?? message?.peerCard;
      const handshakeSsbId = ssbIdFromMessage(message);
      // Amarrar ssbId del handshake a la card si aún no lo trae (wire previo)
      if (
        card &&
        typeof card === 'object' &&
        !isSsbId(card.ssbId) &&
        isSsbId(handshakeSsbId)
      ) {
        card = { ...card, ssbId: handshakeSsbId };
      }
      const check = assertSignalingAdmission(card, {
        admission: this._admission,
        role: this._requiredRole ?? undefined,
        requireSsbId: this._requireSsbId,
        requireSeatSignature: this._requireSeatSignature,
        expectedSsbId: handshakeSsbId ?? undefined,
        claimedSsbId: handshakeSsbId ?? undefined,
        claimedFrom: message?.from
      });
      if (!check.ok) {
        this.handleError(new Error(`signaling peer-card rejected: ${check.error}`));
        return;
      }
      if (check.anonymous) {
        // WP-U197 · anónimo es anónimo: el mensaje entra SIN card y SIN
        // ssbId. No hay identidad que un consumidor pueda confundir con
        // credencial; el rol de la sesión sigue siendo null.
        delete message.peerCard;
        delete message.ssbId;
        message.anonymous = true;
      } else {
        // SSB: from del wire debe amarrar al ssbId de la card cuando ambos existen
        if (isSsbId(card?.ssbId) && isSsbId(message.from) && card.ssbId !== message.from) {
          this.handleError(
            new Error('signaling peer-card rejected: ssbId does not match message.from')
          );
          return;
        }
        message.peerCard = card;
        if (isSsbId(card?.ssbId)) message.ssbId = card.ssbId;
        else if (handshakeSsbId) message.ssbId = handshakeSsbId;
      }
    }
    this.emit('message', message);
    if (message?.type) this.emit(message.type, message);
  }

  /**
   * @param {boolean} connected
   * @protected
   */
  handleConnectionChange(connected) {
    this._connected = connected;
    this.emit('connection', connected);
  }

  /**
   * @param {Error} error
   * @protected
   */
  handleError(error) {
    this.emit('error', error);
  }

  /**
   * Adjunta y valida el peer-card local en mensajes gated.
   * Propaga `ssbId` al handshake cuando la card lo trae.
   * En admisión anónima (WP-U197) sale SIN card y SIN `ssbId`: lo que no
   * se acredita, no viaja.
   * @param {SignalingMessage} message
   * @protected
   */
  _gatedOutbound(message) {
    if (!isPeerCardGatedType(message.type)) return message;
    const card = message.peerCard ?? this._peerCard;
    const check = assertSignalingAdmission(card, {
      admission: this._admission,
      role: this._requiredRole ?? undefined,
      requireSsbId: this._requireSsbId,
      requireSeatSignature: this._requireSeatSignature,
      claimedSsbId: message.ssbId ?? undefined,
      claimedFrom: message.from
    });
    if (!check.ok) {
      throw new Error(`signaling peer-card required: ${check.error}`);
    }
    if (check.anonymous) {
      /** @type {SignalingMessage} */
      const anon = { ...message, anonymous: true };
      delete anon.peerCard;
      delete anon.ssbId;
      return anon;
    }
    /** @type {SignalingMessage} */
    const out = { ...message, peerCard: card };
    if (isSsbId(card?.ssbId)) out.ssbId = card.ssbId;
    return out;
  }
}

/**
 * @param {SignalingMessage} message
 * @returns {{ wireType: string, payload: object }}
 */
export function abstractMessageToWire(message) {
  const wireType = ABSTRACT_TO_WIRE[message.type];
  if (!wireType) {
    throw new Error(`Unknown signaling message type: ${message.type}`);
  }
  const data =
    message.offer ??
    message.answer ??
    message.candidate ??
    message.data ??
    null;
  /** @type {Record<string, unknown>} */
  const extra = {};
  if (message.peerCard != null) extra.peerCard = message.peerCard;
  if (isSsbId(message.ssbId)) extra.ssbId = message.ssbId;
  else if (isSsbId(message.peerCard?.ssbId)) extra.ssbId = message.peerCard.ssbId;
  return {
    wireType,
    payload: createWireMessage({
      type: wireType,
      from: message.from,
      to: message.to,
      room: message.roomId,
      data,
      extra
    })
  };
}
