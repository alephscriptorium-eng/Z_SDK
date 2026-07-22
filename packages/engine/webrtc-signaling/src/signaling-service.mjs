/**
 * Abstract SignalingService (port of repo A abstract class → mjs).
 * Procedencia: plan/recursos/web-rtc-gamify-ui SignalingService @ 4b9271b.
 * Concrete transport: SocketRoomSignalingService (rooms / socket-server).
 *
 * WP-U93: offer/answer/ICE y room-join exigen peer-card válida (torno).
 * Z_SDK #4: handshake lleva `ssbId`; asiento firmado se verifica.
 */

import { EventEmitter } from 'node:events';
import { ABSTRACT_TO_WIRE, createWireMessage } from './messages.mjs';
import {
  assertSignalingPeerCard,
  isPeerCardGatedType,
  peerCardFromMessage,
  ssbIdFromMessage
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
      const check = assertSignalingPeerCard(card, {
        role: this._requiredRole ?? undefined,
        requireSsbId: this._requireSsbId,
        requireSeatSignature: this._requireSeatSignature,
        expectedSsbId: handshakeSsbId ?? undefined
      });
      if (!check.ok) {
        this.handleError(new Error(`signaling peer-card rejected: ${check.error}`));
        return;
      }
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
   * @param {SignalingMessage} message
   * @protected
   */
  _gatedOutbound(message) {
    if (!isPeerCardGatedType(message.type)) return message;
    const card = message.peerCard ?? this._peerCard;
    const check = assertSignalingPeerCard(card, {
      role: this._requiredRole ?? undefined,
      requireSsbId: this._requireSsbId,
      requireSeatSignature: this._requireSeatSignature
    });
    if (!check.ok) {
      throw new Error(`signaling peer-card required: ${check.error}`);
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
