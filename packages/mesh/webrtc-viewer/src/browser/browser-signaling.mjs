/**
 * Browser SignalingService over room-client-browser + ROOM_MESSAGE.
 *
 * Same wire contract as SocketRoomSignalingService (U88): full names
 * `webrtc-offer|answer|ice-candidate|join-room|…` — not quirk A strip.
 *
 * WP-U93: torno peer-card (misma regla que @zeus/webrtc-signaling).
 *
 * Procedencia: adapts repo A SignalingService abstract API to Zeus rooms
 * without importing node-only `@zeus/rooms`.
 */

import { createBrowserRoomClient } from '@zeus/room-client-browser';
import {
  assertSignalingPeerCard,
  assertSignalingAdmission,
  isPeerCardGatedType,
  peerCardFromMessage,
  SIGNALING_ADMISSION
} from '@zeus/webrtc-signaling/peer-card-gate';

const WIRE_EVENTS = Object.freeze([
  'webrtc-offer',
  'webrtc-answer',
  'webrtc-ice-candidate',
  'join-room',
  'leave-room',
  'peer-connected',
  'peer-disconnected'
]);

const ABSTRACT_TO_WIRE = Object.freeze({
  offer: 'webrtc-offer',
  answer: 'webrtc-answer',
  'ice-candidate': 'webrtc-ice-candidate',
  'room-join': 'join-room',
  'room-leave': 'leave-room',
  'peer-connected': 'peer-connected',
  'peer-disconnected': 'peer-disconnected'
});

const WIRE_TO_ABSTRACT = Object.freeze(
  Object.fromEntries(Object.entries(ABSTRACT_TO_WIRE).map(([a, w]) => [w, a]))
);

function messageId() {
  return `sig_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Tiny isomorphic emitter */
class Emitter {
  constructor() {
    this._handlers = new Map();
  }
  on(event, fn) {
    if (!this._handlers.has(event)) this._handlers.set(event, new Set());
    this._handlers.get(event).add(fn);
    return this;
  }
  off(event, fn) {
    this._handlers.get(event)?.delete(fn);
    return this;
  }
  emit(event, ...args) {
    for (const fn of this._handlers.get(event) ?? []) fn(...args);
    return this;
  }
}

/**
 * @typedef {object} BrowserSignalingConfig
 * @property {string} scriptoriumUrl
 * @property {string} [token]
 * @property {string} [room]
 * @property {string} [admission] — WP-U197: `peer-card` (por defecto,
 *   statu quo U93/U186) | `anonymous` (offer/answer/ICE sin card,
 *   `role:null`). Decisión local de despliegue, no negociable por cable.
 */

export class BrowserSocketSignalingService extends Emitter {
  /** @param {BrowserSignalingConfig} [config] */
  constructor(config = {}) {
    super();
    this._config = config;
    this.userId = '';
    this.roomId = config.room || '';
    this._connected = false;
    /** @type {object|null} */
    this._peerCard = null;
    /** @type {ReturnType<typeof createBrowserRoomClient>|null} */
    this._client = null;
    /** @type {Array<() => void>} */
    this._unsubs = [];
    /** @type {string} — WP-U197: admisión de antesala; por defecto la de U93 */
    this._admission =
      config.admission === SIGNALING_ADMISSION.anonymous
        ? SIGNALING_ADMISSION.anonymous
        : SIGNALING_ADMISSION.peerCard;
  }

  isConnected() {
    return this._connected;
  }

  /** @returns {string} */
  getAdmission() {
    return this._admission;
  }

  /** WP-U197 — anónimo = sin card adoptada; nunca implica permiso. */
  isAnonymous() {
    return this._peerCard == null;
  }

  getUserId() {
    return this.userId;
  }

  getRoomId() {
    return this.roomId;
  }

  getPeerCard() {
    return this._peerCard;
  }

  /**
   * @param {object} peerCard
   */
  setPeerCard(peerCard) {
    const check = assertSignalingPeerCard(peerCard);
    if (!check.ok) {
      throw new Error(`BrowserSocketSignalingService.setPeerCard: ${check.error}`);
    }
    this._peerCard = peerCard;
  }

  /**
   * @param {string} userId
   * @param {BrowserSignalingConfig} [config]
   */
  async connect(userId, config = {}) {
    this.userId = userId;
    const cfg = { ...this._config, ...config };
    this._client = createBrowserRoomClient({
      scriptoriumUrl: cfg.scriptoriumUrl,
      token: cfg.token || '',
      room: cfg.room || this.roomId || 'WEBRTC',
      user: userId,
      type: 'ZeusWebRtcViewer',
      features: ['webrtc-signaling', 'trickle-ice', 'webrtc-viewer']
    });
    await this._client.connect();
    this._bindWireListeners();
    this._connected = true;
    this.emit('connection', true);
  }

  async disconnect() {
    for (const u of this._unsubs) {
      try {
        u();
      } catch {
        /* ignore */
      }
    }
    this._unsubs = [];
    this._client?.disconnect();
    this._client = null;
    this._peerCard = null;
    this._connected = false;
    this.emit('connection', false);
  }

  /** @param {string} roomId @param {object} [peerCard] */
  async joinRoom(roomId, peerCard) {
    if (!this._client || !this._connected) {
      throw new Error('Not connected to signaling transport');
    }
    const admitted = assertSignalingAdmission(peerCard, {
      admission: this._admission
    });
    if (!admitted.ok) {
      throw new Error(`BrowserSocketSignalingService.setPeerCard: ${admitted.error}`);
    }
    if (!admitted.anonymous) this.setPeerCard(peerCard);
    this.roomId = roomId;
    this._client.getSocket().emit('CLIENT_SUSCRIBE', { room: roomId });
    const payload = {
      type: 'join-room',
      from: this.userId,
      room: roomId,
      data: { ...(admitted.anonymous ? {} : { peerCard }), roomId },
      timestamp: Date.now(),
      messageId: messageId(),
      // Sin `anonymous: true` en el cable: la AUSENCIA de card es la
      // señal; una autodeclaración no verificable sería otro claim.
      ...(admitted.anonymous ? {} : { peerCard })
    };
    this._client.emit('join-room', payload);
  }

  async leaveRoom() {
    if (!this._client || !this.roomId) return;
    const roomId = this.roomId;
    this._client.emit('leave-room', {
      type: 'leave-room',
      from: this.userId,
      room: roomId,
      data: { roomId, sessionId: this._peerCard?.sessionId ?? this.userId },
      timestamp: Date.now(),
      messageId: messageId()
    });
    this.roomId = '';
  }

  /** @param {object} message — abstract types (offer|answer|…) */
  async sendMessage(message) {
    if (!this._client || !this._connected) {
      throw new Error('Not connected to signaling transport');
    }
    const gated = { ...message };
    if (isPeerCardGatedType(gated.type)) {
      const card = gated.peerCard ?? this._peerCard;
      const check = assertSignalingAdmission(card, { admission: this._admission });
      if (!check.ok) {
        throw new Error(`signaling peer-card required: ${check.error}`);
      }
      if (check.anonymous) delete gated.peerCard;
      else gated.peerCard = card;
    }
    const wireType = ABSTRACT_TO_WIRE[gated.type] || gated.type;
    const room = gated.roomId || this.roomId;
    const data =
      gated.offer ?? gated.answer ?? gated.candidate ?? gated.data ?? null;
    const payload = {
      type: wireType,
      from: gated.from || this.userId,
      to: gated.to,
      room,
      data,
      timestamp: gated.timestamp ?? Date.now(),
      messageId: gated.messageId || messageId(),
      offer: gated.offer,
      answer: gated.answer,
      candidate: gated.candidate,
      ...(gated.peerCard != null ? { peerCard: gated.peerCard } : {})
    };
    this._client.emit(wireType, payload);
  }

  async sendOffer(targetPeerId, offer) {
    await this.sendMessage({
      type: 'offer',
      from: this.userId,
      to: targetPeerId,
      roomId: this.roomId,
      offer
    });
  }

  async sendAnswer(targetPeerId, answer) {
    await this.sendMessage({
      type: 'answer',
      from: this.userId,
      to: targetPeerId,
      roomId: this.roomId,
      answer
    });
  }

  async sendIceCandidate(targetPeerId, candidate) {
    await this.sendMessage({
      type: 'ice-candidate',
      from: this.userId,
      to: targetPeerId,
      roomId: this.roomId,
      candidate
    });
  }

  _bindWireListeners() {
    if (!this._client) return;
    for (const event of WIRE_EVENTS) {
      const unsub = this._client.onRoomEvent(event, (payload) => {
        this._onWirePayload(event, payload);
      });
      this._unsubs.push(unsub);
    }
  }

  _onWirePayload(wireType, payload) {
    if (!payload || typeof payload !== 'object') return;
    const from = payload.from;
    if (from && from === this.userId) return;
    const to = payload.to;
    if (to && to !== this.userId) return;

    const abstractType = WIRE_TO_ABSTRACT[wireType] || wireType;
    const peerCard = peerCardFromMessage(payload);
    const message = {
      type: abstractType,
      from: from || '',
      to,
      roomId: payload.room || payload.roomId || this.roomId,
      timestamp: payload.timestamp ?? Date.now(),
      messageId: payload.messageId || messageId(),
      data: payload.data,
      ...(peerCard != null ? { peerCard } : {})
    };
    if (abstractType === 'offer') message.offer = payload.data ?? payload.offer;
    if (abstractType === 'answer') message.answer = payload.data ?? payload.answer;
    if (abstractType === 'ice-candidate') {
      message.candidate = payload.data ?? payload.candidate;
    }

    if (isPeerCardGatedType(abstractType)) {
      const check = assertSignalingAdmission(peerCardFromMessage(message), {
        admission: this._admission,
        claimedSsbId: payload.ssbId ?? payload.data?.ssbId ?? undefined,
        claimedFrom: message.from
      });
      if (!check.ok) {
        this.emit('error', new Error(`signaling peer-card rejected: ${check.error}`));
        return;
      }
      if (check.anonymous) {
        delete message.peerCard;
        message.anonymous = true;
      }
    }

    this.emit('message', message);
    this.emit(abstractType, message);
  }
}
