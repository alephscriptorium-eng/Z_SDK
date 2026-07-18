/**
 * WebRTCEngine — mesh peers (rooms + private 2-peer), media + DataChannel.
 *
 * Procedencia (WP-U89 / D-17): adapted from
 * `plan/recursos/web-rtc-gamify-ui` WebRTCEngine @ 4b9271b
 * (`projects/webrtc-ui-lib/src/lib/integration/webrtc-engine.service.ts`).
 *
 * Demolición vs A:
 * - Signaling via `@zeus/webrtc-signaling` (full wire names — not quirk A strip)
 * - iceServers ONLY from caller / `resolveIceServers` — no Google STUN defaults
 * - DataChannel carries chat + bulk cache; never game `state`/`ledger`/`track`
 */

import { loadRtcPeerConnection } from '@zeus/webrtc-signaling/peer-session';

/** Minimal isomorphic emitter (browser + Node; avoids node:events in browser). */
class Emitter {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._handlers = new Map();
  }
  /** @param {string} event @param {Function} fn */
  on(event, fn) {
    if (!this._handlers.has(event)) this._handlers.set(event, new Set());
    this._handlers.get(event).add(fn);
    return this;
  }
  /** @param {string} event @param {Function} fn */
  off(event, fn) {
    this._handlers.get(event)?.delete(fn);
    return this;
  }
  /** @param {string} event @param {...unknown} args */
  emit(event, ...args) {
    for (const fn of this._handlers.get(event) ?? []) {
      try {
        fn(...args);
      } catch {
        /* isolate listener errors */
      }
    }
    return this;
  }
  removeAllListeners() {
    this._handlers.clear();
  }
}

/**
 * @typedef {object} WebRTCPeer
 * @property {string} id
 * @property {RTCPeerConnection} connection
 * @property {RTCDataChannel} [dataChannel]
 * @property {MediaStream} [localStream]
 * @property {MediaStream} [remoteStream]
 * @property {boolean} isInitiator
 * @property {string} connectionState
 * @property {number} lastActivity
 */

/**
 * @typedef {object} WebRTCEngineConfig
 * @property {import('@zeus/webrtc-signaling').SignalingService} signaling
 * @property {RTCIceServer[]} [iceServers]
 * @property {RTCDataChannelInit} [dataChannelOptions]
 * @property {number} [maxConnections]
 * @property {boolean} [autoAcceptConnections]
 * @property {typeof RTCPeerConnection} [RTCPeerConnection]
 * @property {(c: MediaStreamConstraints) => Promise<MediaStream>} [getUserMedia]
 * @property {boolean} [debug]
 */

const DEFAULT_DC = Object.freeze({ ordered: true, maxRetransmits: 3 });

export class WebRTCEngine extends Emitter {
  /** @param {WebRTCEngineConfig} config */
  constructor(config) {
    super();
    if (!config?.signaling) {
      throw new Error('WebRTCEngine requires signaling (SocketRoomSignalingService)');
    }
    this.signaling = config.signaling;
    /** @type {RTCIceServer[]} */
    this.iceServers = Array.isArray(config.iceServers) ? config.iceServers : [];
    this.dataChannelOptions = { ...DEFAULT_DC, ...(config.dataChannelOptions || {}) };
    this.maxConnections = config.maxConnections ?? 10;
    this.autoAcceptConnections = config.autoAcceptConnections !== false;
    this.debug = Boolean(config.debug);
    /** @type {typeof RTCPeerConnection|null} */
    this._RTCPeerConnection = config.RTCPeerConnection ?? null;
    this._getUserMedia =
      config.getUserMedia ??
      (typeof globalThis.navigator?.mediaDevices?.getUserMedia === 'function'
        ? (c) => globalThis.navigator.mediaDevices.getUserMedia(c)
        : null);

    /** @type {Map<string, WebRTCPeer>} */
    this.peers = new Map();
    /** @type {string|null} */
    this.roomId = null;
    /** @type {MediaStream|null} */
    this.localStream = null;
    /** @type {((msg: object) => void)|null} */
    this._onSignalingMessage = null;
    this._destroyed = false;
  }

  /** @param {Partial<WebRTCEngineConfig>} [overrides] */
  async initialize(overrides = {}) {
    if (overrides.iceServers) this.iceServers = overrides.iceServers;
    if (overrides.maxConnections != null) this.maxConnections = overrides.maxConnections;
    if (overrides.RTCPeerConnection) this._RTCPeerConnection = overrides.RTCPeerConnection;
    if (!this._RTCPeerConnection) {
      this._RTCPeerConnection = await loadRtcPeerConnection();
    }
    this._bindSignaling();
    this.emit('ready', { iceServers: this.iceServers });
  }

  _bindSignaling() {
    if (this._onSignalingMessage) return;
    this._onSignalingMessage = (message) => {
      void this._handleSignalingMessage(message);
    };
    this.signaling.on('message', this._onSignalingMessage);
  }

  _unbindSignaling() {
    if (this._onSignalingMessage) {
      this.signaling.off('message', this._onSignalingMessage);
      this._onSignalingMessage = null;
    }
  }

  /**
   * Join signaling room (mesh). Game room for state stays separate (D-17).
   * @param {string} roomId
   * @param {string} [displayName]
   */
  async joinRoom(roomId, displayName) {
    await this.signaling.joinRoom(roomId, displayName);
    this.roomId = roomId;
    this.emit('room-joined', { roomId });
  }

  leaveRoom() {
    for (const peerId of [...this.peers.keys()]) {
      this.disconnectPeer(peerId);
    }
    void this.signaling.leaveRoom?.();
    const left = this.roomId;
    this.roomId = null;
    this.emit('room-left', { roomId: left });
  }

  /**
   * @param {MediaStreamConstraints} [constraints]
   * @returns {Promise<MediaStream>}
   */
  async getUserMedia(constraints = { video: true, audio: true }) {
    if (!this._getUserMedia) {
      throw new Error('getUserMedia unavailable in this runtime');
    }
    this.localStream = await this._getUserMedia(constraints);
    this.emit('local-stream', { stream: this.localStream });
    return this.localStream;
  }

  /**
   * @param {string} peerId
   * @param {{ useDataChannel?: boolean, useVideo?: boolean, useAudio?: boolean }} [options]
   */
  async connectToPeer(peerId, options = {}) {
    if (this.peers.has(peerId)) {
      throw new Error(`Already connected to peer: ${peerId}`);
    }
    if (this.peers.size >= this.maxConnections) {
      throw new Error(`Maximum connections reached: ${this.maxConnections}`);
    }

    const useVideo = Boolean(options.useVideo);
    const useAudio = Boolean(options.useAudio);
    const useDataChannel = options.useDataChannel !== false;

    const peer = this._createPeer(peerId, true);
    if (useVideo || useAudio) {
      const stream =
        this.localStream ??
        (await this.getUserMedia({ video: useVideo, audio: useAudio }));
      for (const track of stream.getTracks()) {
        peer.connection.addTrack(track, stream);
      }
      peer.localStream = stream;
    }

    if (useDataChannel) {
      peer.dataChannel = peer.connection.createDataChannel(
        'zeus-main',
        this.dataChannelOptions
      );
      this._setupDataChannel(peer.dataChannel, peerId);
    }

    const offer = await peer.connection.createOffer();
    await peer.connection.setLocalDescription(offer);
    await this.signaling.sendOffer(peerId, peer.connection.localDescription);

    this.peers.set(peerId, peer);
    this.emit('peer-connecting', { peerId, peer });
    return peer;
  }

  /** Hang up all peers (game button «colgar»). */
  hangup() {
    for (const peerId of [...this.peers.keys()]) {
      this.disconnectPeer(peerId);
    }
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) track.stop();
      this.localStream = null;
    }
    this.emit('hangup', {});
  }

  /** @param {string} peerId */
  disconnectPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    try {
      peer.dataChannel?.close();
    } catch {
      /* ignore */
    }
    try {
      peer.connection.close();
    } catch {
      /* ignore */
    }
    this.peers.delete(peerId);
    this.emit('peer-disconnected', { peerId });
  }

  /**
   * @param {string} peerId
   * @param {unknown} data
   */
  sendDataToPeer(peerId, data) {
    const peer = this.peers.get(peerId);
    if (!peer?.dataChannel || peer.dataChannel.readyState !== 'open') {
      throw new Error(`DataChannel not open for peer ${peerId}`);
    }
    let envelope;
    if (typeof data === 'string') {
      envelope = data;
    } else if (data && typeof data === 'object' && typeof data.type === 'string') {
      // Protocol messages (chat / bulk-cache / …) — send as-is
      envelope = JSON.stringify(data);
    } else {
      envelope = JSON.stringify({ type: 'user-data', data, timestamp: Date.now() });
    }
    peer.dataChannel.send(envelope);
  }

  /** @param {unknown} data */
  broadcastData(data) {
    for (const peerId of this.peers.keys()) {
      try {
        this.sendDataToPeer(peerId, data);
      } catch {
        /* skip closed channels */
      }
    }
  }

  /**
   * Chat over DataChannel (media plane — not game state).
   * @param {string} text
   * @param {string} [toPeerId]
   */
  sendChat(text, toPeerId) {
    const payload = {
      type: 'chat',
      text: String(text),
      from: this.signaling.getUserId?.() ?? this.signaling.userId,
      timestamp: Date.now()
    };
    if (toPeerId) this.sendDataToPeer(toPeerId, payload);
    else this.broadcastData(payload);
    this.emit('chat-sent', payload);
  }

  /**
   * Bulk cache object (D-14 materialization). Receiver must validate vs U80.
   * @param {object} object
   * @param {string} [schemaId]
   * @param {string} [toPeerId]
   */
  sendCacheObject(object, schemaId = 'cache-sidecar-meta', toPeerId) {
    const payload = {
      type: 'bulk-cache',
      schemaId,
      object,
      timestamp: Date.now()
    };
    if (toPeerId) this.sendDataToPeer(toPeerId, payload);
    else this.broadcastData(payload);
    this.emit('cache-sent', payload);
  }

  getPeers() {
    return new Map(this.peers);
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.hangup();
    this._unbindSignaling();
    this.removeAllListeners();
  }

  /** @param {string} peerId @param {boolean} isInitiator */
  _createPeer(peerId, isInitiator) {
    const RTCPeerConnectionCtor = this._RTCPeerConnection;
    if (!RTCPeerConnectionCtor) {
      throw new Error('WebRTCEngine not initialized (missing RTCPeerConnection)');
    }
    const connection = new RTCPeerConnectionCtor({ iceServers: this.iceServers });
    /** @type {WebRTCPeer} */
    const peer = {
      id: peerId,
      connection,
      isInitiator,
      connectionState: connection.connectionState || 'new',
      lastActivity: Date.now()
    };

    connection.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      void this.signaling.sendIceCandidate(
        peerId,
        ev.candidate.toJSON?.() ?? ev.candidate
      );
    };

    connection.onconnectionstatechange = () => {
      peer.connectionState = connection.connectionState;
      peer.lastActivity = Date.now();
      if (connection.connectionState === 'connected') {
        this.emit('peer-connected', { peerId, peer });
      } else if (
        connection.connectionState === 'failed' ||
        connection.connectionState === 'closed' ||
        connection.connectionState === 'disconnected'
      ) {
        this.emit('connection-state', { peerId, state: connection.connectionState });
      }
    };

    connection.ontrack = (ev) => {
      const stream = ev.streams?.[0] ?? null;
      if (stream) {
        peer.remoteStream = stream;
        this.emit('stream-received', { peerId, stream });
      }
    };

    connection.ondatachannel = (ev) => {
      peer.dataChannel = ev.channel;
      this._setupDataChannel(ev.channel, peerId);
    };

    return peer;
  }

  /** @param {RTCDataChannel} channel @param {string} peerId */
  _setupDataChannel(channel, peerId) {
    channel.onopen = () => {
      this.emit('datachannel-open', { peerId });
    };
    channel.onmessage = (ev) => {
      this._handleDataMessage(peerId, ev.data);
    };
    channel.onclose = () => {
      this.emit('datachannel-close', { peerId });
    };
  }

  /** @param {string} peerId @param {string|ArrayBuffer} raw */
  _handleDataMessage(peerId, raw) {
    let parsed = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { type: 'raw', data: raw };
      }
    }
    const msg = /** @type {object} */ (parsed);
    this.emit('data-received', { peerId, data: msg });

    if (msg?.type === 'chat') {
      this.emit('chat', { peerId, ...msg });
    } else if (msg?.type === 'bulk-cache') {
      this.emit('bulk-cache', {
        peerId,
        schemaId: msg.schemaId || 'cache-sidecar-meta',
        object: msg.object,
        timestamp: msg.timestamp
      });
    }
  }

  /** @param {object} message — abstract SignalingService message */
  async _handleSignalingMessage(message) {
    if (!message || message.from === this.signaling.userId) return;
    if (message.to && message.to !== this.signaling.userId) return;

    try {
      if (message.type === 'offer' && message.offer) {
        await this._handleRemoteOffer(message.from, message.offer);
      } else if (message.type === 'answer' && message.answer) {
        await this._handleRemoteAnswer(message.from, message.answer);
      } else if (message.type === 'ice-candidate' && message.candidate) {
        await this._handleRemoteIce(message.from, message.candidate);
      } else if (message.type === 'room-join' || message.type === 'peer-connected') {
        this.emit('peer-announced', { peerId: message.from, message });
      }
    } catch (err) {
      this.emit('signaling-error', {
        peerId: message.from,
        error: err instanceof Error ? err : new Error(String(err))
      });
    }
  }

  /** @param {string} peerId @param {RTCSessionDescriptionInit} offer */
  async _handleRemoteOffer(peerId, offer) {
    let peer = this.peers.get(peerId);
    if (!peer) {
      if (!this.autoAcceptConnections) return;
      if (this.peers.size >= this.maxConnections) return;
      peer = this._createPeer(peerId, false);
      if (this.localStream) {
        for (const track of this.localStream.getTracks()) {
          peer.connection.addTrack(track, this.localStream);
        }
        peer.localStream = this.localStream;
      }
      this.peers.set(peerId, peer);
    }
    await peer.connection.setRemoteDescription(offer);
    const answer = await peer.connection.createAnswer();
    await peer.connection.setLocalDescription(answer);
    await this.signaling.sendAnswer(peerId, peer.connection.localDescription);
  }

  /** @param {string} peerId @param {RTCSessionDescriptionInit} answer */
  async _handleRemoteAnswer(peerId, answer) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    await peer.connection.setRemoteDescription(answer);
  }

  /** @param {string} peerId @param {RTCIceCandidateInit} candidate */
  async _handleRemoteIce(peerId, candidate) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    await peer.connection.addIceCandidate(candidate);
  }
}
