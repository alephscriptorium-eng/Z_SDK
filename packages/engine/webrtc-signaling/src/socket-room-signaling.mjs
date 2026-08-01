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
import {
  assertSignalingAdmission,
  peerCardFromMessage,
  ssbIdFromMessage
} from './peer-card-gate.mjs';

/**
 * @typedef {object} SocketRoomSignalingOptions
 * @property {string} [url] — scriptorium base (overrides ZEUS_SCRIPTORIUM_URL)
 * @property {string} [namespace]
 * @property {string} [secret]
 * @property {string} [room] — default room before joinRoom
 * @property {number} [connectTimeoutMs]
 * @property {import('@zeus/socket-core/client').SocketClient} [client] — inject for tests
 * @property {string} [requiredRole] — rol concreto exigido por el torno
 * @property {boolean} [requireSsbId] — exigir ssbId en card (federación)
 * @property {boolean} [requireSeatSignature] — exigir firma de asiento
 * @property {object} [peerCard] — card OPCIONAL en el connect (WP-U186):
 *   ausente = sesión anónima `role:null`; presentada = se valida ANTES de
 *   abrir el cable — inválida RECHAZA el connect (jamás degrada a anónimo);
 *   válida se reenvía en CLIENT_REGISTER (carril identidad de puerta)
 * @property {string} [admission] — modo de antesala (WP-U197):
 *   `peer-card` (por defecto, statu quo U186) | `anonymous` (offer /
 *   answer / ICE / room-join sin card, con `role:null`)
 */

export class SocketRoomSignalingService extends SignalingService {
  /** @param {SocketRoomSignalingOptions} [options] */
  constructor(options = {}) {
    super();
    this._options = options;
    /** @type {import('@zeus/socket-core/client').SocketClient|null} */
    this._client = options.client ?? null;
    /** @type {Array<() => void>} */
    this._unsubs = [];
    /** @type {boolean} */
    this._ownsClient = !options.client;
    if (options.requiredRole) this._requiredRole = options.requiredRole;
    // Ya eran truthiness (correcto); se dejan tal cual por simetría con D1.
    if (options.requireSsbId) this._requireSsbId = true;
    if (options.requireSeatSignature) this._requireSeatSignature = true;
    if (options.admission) this.setAdmission(options.admission);
  }

  getClient() {
    return this._client;
  }

  /**
   * Transporte base (WP-U186: transporte ≠ permiso).
   * Sin `peerCard` conecta igual: sesión anónima `role:null`. Con
   * `peerCard` se valida AQUÍ, antes de abrir el cable — card inválida
   * lanza (rechazo total, sin sesión), nunca se degrada a anónimo.
   * @param {string} userId
   * @param {SocketRoomSignalingOptions} [config]
   */
  async connect(userId, config = {}) {
    this.userId = userId;
    const opts = { ...this._options, ...config };
    if (opts.requiredRole) this._requiredRole = opts.requiredRole;
    // D1: normalizar al guardar (ver `peer-card-gate.mjs` demandsCard).
    if (opts.requireSsbId != null) this._requireSsbId = Boolean(opts.requireSsbId);
    if (opts.requireSeatSignature != null) {
      this._requireSeatSignature = Boolean(opts.requireSeatSignature);
    }
    if (opts.admission) this.setAdmission(opts.admission);
    if (opts.peerCard != null) {
      // Card presentada ⇒ valida o rechaza; lanzar aquí deja el cable
      // sin abrir (no hay sesión anónima encubierta tras card inválida).
      this.setPeerCard(opts.peerCard);
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
      connectTimeoutMs: opts.connectTimeoutMs,
      // Card válida viaja en CLIENT_REGISTER (opcional en el transporte)
      ...(this._peerCard != null ? { peerCard: this._peerCard } : {})
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
   * Antesala WebRTC = capacidad opt-in: el torno SE QUEDA (WP-U186).
   * El transporte base ya quedó establecido en `connect()` sin exigir
   * card; aquí la card se valida ANTES de suscribir/anunciar — inválida
   * lanza y el cable de transporte sigue intacto.
   *
   * WP-U197: con `admission: 'anonymous'` la card es OPCIONAL — omitirla
   * entra a la antesala como anónimo (`role:null`, anuncio sin card ni
   * ssbId). Presentarla y que sea inválida sigue RECHAZANDO: el modo
   * anónimo no es una red de seguridad para cards falsas.
   * @param {string} roomId
   * @param {object} [peerCard] — issued by authority (`issuePeerCard` / join)
   */
  async joinRoom(roomId, peerCard) {
    if (!this._client || !this._connected) {
      throw new Error('Not connected to signaling transport');
    }
    const admitted = assertSignalingAdmission(peerCard, {
      admission: this._admission,
      role: this._requiredRole ?? undefined,
      requireSsbId: this._requireSsbId,
      requireSeatSignature: this._requireSeatSignature
    });
    if (!admitted.ok) {
      throw new Error(`SignalingService.setPeerCard: ${admitted.error}`);
    }
    if (!admitted.anonymous) this.setPeerCard(peerCard);
    this.roomId = roomId;
    this._client.io.emit('CLIENT_SUSCRIBE', { room: roomId });
    const ssbId =
      !admitted.anonymous && isSsbId(peerCard?.ssbId) ? peerCard.ssbId : undefined;
    const card = admitted.anonymous ? undefined : peerCard;
    const payload = createWireMessage({
      type: 'join-room',
      from: this.userId,
      room: roomId,
      data: {
        ...(card !== undefined ? { peerCard: card } : {}),
        roomId,
        ...(ssbId ? { ssbId } : {})
      },
      // Nada de `anonymous: true` en el cable: una autodeclaración no
      // verificable es un claim más. La AUSENCIA de card es la señal, y
      // el receptor la juzga con su propio modo (nunca con el del emisor).
      extra: {
        ...(card !== undefined ? { peerCard: card } : {}),
        ...(ssbId ? { ssbId } : {})
      }
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
