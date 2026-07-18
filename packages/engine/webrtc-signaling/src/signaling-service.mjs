/**
 * Abstract SignalingService (port of repo A abstract class → mjs).
 * Procedencia: plan/recursos/web-rtc-gamify-ui SignalingService @ 4b9271b.
 * Concrete transport: SocketRoomSignalingService (rooms / socket-server).
 */

import { EventEmitter } from 'node:events';
import { ABSTRACT_TO_WIRE, createWireMessage } from './messages.mjs';

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
  }

  /** @param {string} userId @param {unknown} [config] */
  // eslint-disable-next-line no-unused-vars
  async connect(userId, config) {
    throw new Error('SignalingService.connect must be implemented');
  }

  async disconnect() {
    throw new Error('SignalingService.disconnect must be implemented');
  }

  /** @param {string} roomId @param {string} [displayName] */
  // eslint-disable-next-line no-unused-vars
  async joinRoom(roomId, displayName) {
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
    await this.sendMessage({
      type: 'offer',
      from: this.userId,
      to: targetPeerId,
      roomId: this.roomId,
      timestamp: Date.now(),
      messageId: createWireMessage({ type: 'webrtc-offer', from: this.userId }).messageId,
      offer
    });
  }

  /**
   * @param {string} targetPeerId
   * @param {RTCSessionDescriptionInit} answer
   */
  async sendAnswer(targetPeerId, answer) {
    await this.sendMessage({
      type: 'answer',
      from: this.userId,
      to: targetPeerId,
      roomId: this.roomId,
      timestamp: Date.now(),
      messageId: createWireMessage({ type: 'webrtc-answer', from: this.userId }).messageId,
      answer
    });
  }

  /**
   * Trickle ICE: send each candidate as it arrives (no waitForIceComplete).
   * @param {string} targetPeerId
   * @param {RTCIceCandidateInit} candidate
   */
  async sendIceCandidate(targetPeerId, candidate) {
    await this.sendMessage({
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
    });
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
  return {
    wireType,
    payload: createWireMessage({
      type: wireType,
      from: message.from,
      to: message.to,
      room: message.roomId,
      data,
      extra: message.displayName != null ? { displayName: message.displayName } : {}
    })
  };
}
