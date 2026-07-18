/**
 * SignalingService over SSB private messages (WP-U90).
 *
 * Sister of SocketRoomSignalingService: same abstract API, transport is
 * ssb-box DMs (`type: 'webrtc-signal'`) mediated by the OASIS pub — not a
 * dedicated signaling websocket.
 *
 * Default: offer+answer only (no trickle ICE) — gossip latency cannot carry
 * per-candidate messages reliably. Set `allowTrickle: true` only for labs.
 */

import { createMessageId } from './messages.mjs';
import { SignalingService } from './signaling-service.mjs';
import { SSB_WEBRTC_SIGNAL_TYPE } from './ssb-private-transport.mjs';
import { peerCardFromMessage } from './peer-card-gate.mjs';

/**
 * Abstract signaling type → SSB content.signal field.
 * Table (PRACTICAS §1.2), not if/else chains.
 */
export const ABSTRACT_TO_SSB_SIGNAL = Object.freeze({
  offer: 'offer',
  answer: 'answer',
  'ice-candidate': 'ice-candidate',
  'room-join': 'room-join',
  'room-leave': 'room-leave',
  'peer-connected': 'peer-connected',
  'peer-disconnected': 'peer-disconnected'
});

export const SSB_SIGNAL_TO_ABSTRACT = Object.freeze(
  Object.fromEntries(Object.entries(ABSTRACT_TO_SSB_SIGNAL).map(([k, v]) => [v, k]))
);

/**
 * @typedef {object} SsbPrivateSignalingOptions
 * @property {import('./ssb-private-transport.mjs').SsbPrivateTransport} [transport]
 * @property {boolean} [allowTrickle=false] — when false, sendIceCandidate is a no-op
 */

export class SsbPrivateSignalingService extends SignalingService {
  /** @param {SsbPrivateSignalingOptions} [options] */
  constructor(options = {}) {
    super();
    this._options = options;
    /** @type {import('./ssb-private-transport.mjs').SsbPrivateTransport|null} */
    this._transport = options.transport ?? null;
    /** @type {(() => void)|null} */
    this._unsub = null;
    this._allowTrickle = options.allowTrickle === true;
  }

  getTransport() {
    return this._transport;
  }

  /**
   * @param {string} userId — local feedId (must match transport.whoami when set)
   * @param {SsbPrivateSignalingOptions} [config]
   */
  async connect(userId, config = {}) {
    const opts = { ...this._options, ...config };
    this._transport = opts.transport ?? this._transport;
    if (!this._transport) {
      throw new Error(
        'SsbPrivateSignalingService.connect requires a SsbPrivateTransport (inject createSbotPrivateTransport or createInMemorySsbPrivateBus)'
      );
    }

    const who = this._transport.whoami();
    if (who && userId && who !== userId) {
      throw new Error(
        `SsbPrivateSignalingService: userId ${userId} does not match transport whoami ${who}`
      );
    }
    this.userId = userId || who;
    this._allowTrickle = opts.allowTrickle === true;

    this._unbind();
    this._unsub = this._transport.subscribePrivate((msg) => this._onPrivateMsg(msg));
    this.handleConnectionChange(true);
  }

  async disconnect() {
    this._unbind();
    this.roomId = '';
    this.handleConnectionChange(false);
  }

  /**
   * Bookmark logical room and present peer-card (WP-U93).
   * Room id is a logical label — the pub does not host a socket room.
   * @param {string} roomId
   * @param {object} peerCard
   */
  async joinRoom(roomId, peerCard) {
    if (!this._connected || !this._transport) {
      throw new Error('Not connected to SSB private signaling transport');
    }
    this.setPeerCard(peerCard);
    this.roomId = roomId;
  }

  async leaveRoom() {
    this.roomId = '';
  }

  /**
   * Trickle ICE is disabled by default (gossip). Override to send only when
   * `allowTrickle: true`.
   * @param {string} targetPeerId
   * @param {RTCIceCandidateInit} candidate
   */
  async sendIceCandidate(targetPeerId, candidate) {
    if (!this._allowTrickle) return;
    return super.sendIceCandidate(targetPeerId, candidate);
  }

  /** @param {import('./signaling-service.mjs').SignalingMessage} message */
  async sendMessage(message) {
    if (!this._connected || !this._transport) {
      throw new Error('Not connected to SSB private signaling transport');
    }
    const gated = this._gatedOutbound(message);
    const to = gated.to;
    if (!to) {
      throw new Error('SSB private signaling requires message.to (peer feedId)');
    }

    const signal = ABSTRACT_TO_SSB_SIGNAL[gated.type];
    if (!signal) {
      throw new Error(`Unknown signaling message type for SSB: ${gated.type}`);
    }

    const content = {
      type: SSB_WEBRTC_SIGNAL_TYPE,
      signal,
      from: gated.from || this.userId,
      to,
      roomId: gated.roomId || this.roomId || undefined,
      timestamp: gated.timestamp ?? Date.now(),
      messageId: gated.messageId || createMessageId(this.userId),
      recps: [to]
    };

    if (gated.offer != null) content.offer = gated.offer;
    if (gated.answer != null) content.answer = gated.answer;
    if (gated.candidate != null) content.candidate = gated.candidate;
    if (gated.data != null) content.data = gated.data;
    if (gated.peerCard != null) content.peerCard = gated.peerCard;

    await this._transport.publishPrivate(content, [to]);
  }

  _unbind() {
    if (this._unsub) {
      try {
        this._unsub();
      } catch {
        /* best effort */
      }
      this._unsub = null;
    }
  }

  /**
   * @param {import('./ssb-private-transport.mjs').SsbPrivateMessage} msg
   */
  _onPrivateMsg(msg) {
    const content = msg?.value?.content;
    if (!content || content.type !== SSB_WEBRTC_SIGNAL_TYPE) return;

    const from = content.from || msg.value.author || '';
    if (from && from === this.userId) return;

    const to = content.to;
    if (to && to !== this.userId) return;

    if (!this._allowTrickle && content.signal === 'ice-candidate') return;

    const abstractType = SSB_SIGNAL_TO_ABSTRACT[content.signal] || content.signal;
    const peerCard = peerCardFromMessage(content);
    /** @type {import('./signaling-service.mjs').SignalingMessage} */
    const message = {
      type: abstractType,
      from,
      to,
      roomId: content.roomId || this.roomId,
      timestamp: content.timestamp ?? msg.value.timestamp ?? Date.now(),
      messageId: content.messageId || createMessageId(from || 'peer'),
      data: content.data,
      ...(peerCard != null ? { peerCard } : {})
    };

    if (abstractType === 'offer') message.offer = content.offer ?? content.data;
    if (abstractType === 'answer') message.answer = content.answer ?? content.data;
    if (abstractType === 'ice-candidate') {
      message.candidate = content.candidate ?? content.data;
    }

    this.handleMessage(message);
  }
}
