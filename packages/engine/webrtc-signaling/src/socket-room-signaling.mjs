/**
 * SignalingService over @zeus/rooms + socket-server ROOM_MESSAGE relay.
 *
 * Wire events (repo A Aleph contract): webrtc-offer | webrtc-answer |
 * webrtc-ice-candidate | join-room | leave-room.
 * Listeners bind to the unwrapped event names the relay emits (not a stripped
 * prefix — avoids the A quirk that emitted `offer` while listening on
 * `webrtc-offer`).
 *
 * WP-U93: join / offer / answer / ICE exigen peer-card (identidad ad-hoc
 * peerId/displayName demolida del handshake).
 */

import {
  createClient,
  connectAndJoin,
  emitRoomEvent,
  onRoomEvent,
  config as roomsConfig
} from '@zeus/rooms';
import { isSsbId } from '@zeus/protocol';
import { SIGNALING_WIRE_EVENTS, WIRE_TO_ABSTRACT, createWireMessage } from './messages.mjs';
import { SignalingService, abstractMessageToWire } from './signaling-service.mjs';
import { peerCardFromMessage, ssbIdFromMessage } from './peer-card-gate.mjs';

/**
 * @typedef {object} SocketRoomSignalingOptions
 * @property {string} [url] — scriptorium base (overrides ZEUS_SCRIPTORIUM_URL)
 * @property {string} [namespace]
 * @property {string} [secret]
 * @property {string} [room] — default room before joinRoom
 * @property {number} [connectTimeoutMs]
 * @property {import('@alephscript/mcp-core-sdk/client').SocketClient} [client] — inject for tests
 * @property {string} [requiredRole] — rol concreto exigido por el torno
 * @property {boolean} [requireSsbId] — exigir ssbId en card (federación)
 * @property {boolean} [requireSeatSignature] — exigir firma de asiento
 */

export class SocketRoomSignalingService extends SignalingService {
  /** @param {SocketRoomSignalingOptions} [options] */
  constructor(options = {}) {
    super();
    this._options = options;
    /** @type {import('@alephscript/mcp-core-sdk/client').SocketClient|null} */
    this._client = options.client ?? null;
    /** @type {Array<() => void>} */
    this._unsubs = [];
    /** @type {boolean} */
    this._ownsClient = !options.client;
    if (options.requiredRole) this._requiredRole = options.requiredRole;
    if (options.requireSsbId) this._requireSsbId = true;
    if (options.requireSeatSignature) this._requireSeatSignature = true;
  }

  getClient() {
    return this._client;
  }

  /**
   * @param {string} userId
   * @param {SocketRoomSignalingOptions} [config]
   */
  async connect(userId, config = {}) {
    this.userId = userId;
    const opts = { ...this._options, ...config };
    if (opts.requiredRole) this._requiredRole = opts.requiredRole;
    if (opts.requireSsbId != null) this._requireSsbId = opts.requireSsbId;
    if (opts.requireSeatSignature != null) {
      this._requireSeatSignature = opts.requireSeatSignature;
    }

    if (!this._client) {
      this._client = createClient(userId, {
        ...(opts.url ? { url: opts.url } : {}),
        ...(opts.namespace ? { namespace: opts.namespace } : {}),
        ...(opts.secret ? { secret: opts.secret } : {}),
        ...(opts.room ? { room: opts.room } : {})
      });
      this._ownsClient = true;
    }

    const room = opts.room ?? this.roomId ?? roomsConfig.room;
    await connectAndJoin(this._client, userId, {
      room,
      type: 'ZeusWebRtcSignaling',
      features: ['webrtc-signaling', 'trickle-ice'],
      connectTimeoutMs: opts.connectTimeoutMs
    });

    this._bindWireListeners();
    this.handleConnectionChange(true);
  }

  async disconnect() {
    this._unbindWireListeners();
    if (this._client?.io) {
      this._client.io.disconnect();
    }
    if (this._ownsClient) this._client = null;
    this._peerCard = null;
    this.handleConnectionChange(false);
  }

  /**
   * Join (or switch) signaling room presenting peer-card (WP-U93).
   * @param {string} roomId
   * @param {object} peerCard — issued by authority (`issuePeerCard` / join)
   */
  async joinRoom(roomId, peerCard) {
    if (!this._client || !this._connected) {
      throw new Error('Not connected to signaling transport');
    }
    this.setPeerCard(peerCard);
    this.roomId = roomId;
    this._client.io.emit('CLIENT_SUSCRIBE', { room: roomId });
    const ssbId = isSsbId(peerCard?.ssbId) ? peerCard.ssbId : undefined;
    const payload = createWireMessage({
      type: 'join-room',
      from: this.userId,
      room: roomId,
      data: { peerCard, roomId, ...(ssbId ? { ssbId } : {}) },
      extra: { peerCard, ...(ssbId ? { ssbId } : {}) }
    });
    emitRoomEvent(this._client, 'join-room', payload, roomId);
  }

  async leaveRoom() {
    if (!this._client || !this.roomId) return;
    const roomId = this.roomId;
    const payload = createWireMessage({
      type: 'leave-room',
      from: this.userId,
      room: roomId,
      data: { roomId, sessionId: this._peerCard?.sessionId ?? this.userId }
    });
    emitRoomEvent(this._client, 'leave-room', payload, roomId);
    this.roomId = '';
  }

  /** @param {import('./signaling-service.mjs').SignalingMessage} message */
  async sendMessage(message) {
    if (!this._client || !this._connected) {
      throw new Error('Not connected to signaling transport');
    }
    const gated = this._gatedOutbound({
      ...message,
      roomId: message.roomId || this.roomId || roomsConfig.room
    });
    const room = gated.roomId;
    const { wireType, payload } = abstractMessageToWire(gated);
    emitRoomEvent(this._client, wireType, payload, room);
  }

  _bindWireListeners() {
    this._unbindWireListeners();
    if (!this._client) return;
    for (const event of SIGNALING_WIRE_EVENTS) {
      const unsub = onRoomEvent(this._client, event, (payload) => {
        this._onWirePayload(event, payload);
      });
      this._unsubs.push(unsub);
    }
  }

  _unbindWireListeners() {
    for (const unsub of this._unsubs) {
      try {
        unsub();
      } catch {
        /* best effort */
      }
    }
    this._unsubs = [];
  }

  /**
   * @param {string} wireType
   * @param {object} payload
   */
  _onWirePayload(wireType, payload) {
    if (!payload || typeof payload !== 'object') return;
    const from = payload.from;
    if (from && from === this.userId) return;

    const to = payload.to;
    if (to && to !== this.userId) return;

    const abstractType = WIRE_TO_ABSTRACT[wireType] || wireType;
    const peerCard = peerCardFromMessage(payload);
    const ssbId = ssbIdFromMessage(payload);

    /** @type {import('./signaling-service.mjs').SignalingMessage} */
    const message = {
      type: abstractType,
      from: from || '',
      to,
      roomId: payload.room || payload.roomId || this.roomId,
      timestamp: payload.timestamp ?? Date.now(),
      messageId: payload.messageId || createWireMessage({ type: wireType, from: from || 'unknown' }).messageId,
      data: payload.data,
      ...(peerCard != null ? { peerCard } : {}),
      ...(ssbId ? { ssbId } : {})
    };

    if (abstractType === 'offer') message.offer = payload.data ?? payload.offer;
    if (abstractType === 'answer') message.answer = payload.data ?? payload.answer;
    if (abstractType === 'ice-candidate') {
      message.candidate = payload.data ?? payload.candidate;
    }

    this.handleMessage(message);
  }
}
