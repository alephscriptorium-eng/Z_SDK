/**
 * Unit: WebRTCEngine chat + hangup (no Google ICE; uses wrtc when available).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EventEmitter } from 'node:events';
import { WebRTCEngine } from '../src/core/webrtc-engine.mjs';
import { loadRtcPeerConnection } from '@zeus/webrtc-signaling/peer-session';

class FakeSignaling extends EventEmitter {
  constructor(userId) {
    super();
    this.userId = userId;
    this.roomId = '';
    /** @type {FakeSignaling|null} */
    this.peer = null;
  }
  getUserId() {
    return this.userId;
  }
  async connect() {}
  async joinRoom(roomId) {
    this.roomId = roomId;
  }
  async leaveRoom() {
    this.roomId = '';
  }
  async sendOffer(to, offer) {
    this.peer?.emit('message', {
      type: 'offer',
      from: this.userId,
      to,
      offer,
      roomId: this.roomId,
      timestamp: Date.now(),
      messageId: 't'
    });
  }
  async sendAnswer(to, answer) {
    this.peer?.emit('message', {
      type: 'answer',
      from: this.userId,
      to,
      answer,
      roomId: this.roomId,
      timestamp: Date.now(),
      messageId: 't'
    });
  }
  async sendIceCandidate(to, candidate) {
    this.peer?.emit('message', {
      type: 'ice-candidate',
      from: this.userId,
      to,
      candidate,
      roomId: this.roomId,
      timestamp: Date.now(),
      messageId: 't'
    });
  }
}

test('WebRTCEngine DataChannel chat between two peers', async () => {
  const RTCPeerConnection = await loadRtcPeerConnection();
  const aliceSig = new FakeSignaling('alice');
  const bobSig = new FakeSignaling('bob');
  aliceSig.peer = bobSig;
  bobSig.peer = aliceSig;

  const alice = new WebRTCEngine({
    signaling: aliceSig,
    iceServers: [],
    RTCPeerConnection
  });
  const bob = new WebRTCEngine({
    signaling: bobSig,
    iceServers: [],
    RTCPeerConnection
  });
  await alice.initialize();
  await bob.initialize();
  await alice.joinRoom('T');
  await bob.joinRoom('T');

  const bobChat = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('chat timeout')), 15_000);
    bob.on('chat', (msg) => {
      clearTimeout(t);
      resolve(msg);
    });
  });

  // Bob must be listening before alice offers
  await new Promise((r) => setTimeout(r, 50));
  await alice.connectToPeer('bob', { useDataChannel: true, useVideo: false, useAudio: false });

  // Wait for datachannel open
  await Promise.race([
    new Promise((resolve) => alice.on('datachannel-open', resolve)),
    new Promise((_, reject) => setTimeout(() => reject(new Error('dc open timeout')), 15_000))
  ]);
  await new Promise((r) => setTimeout(r, 100));

  alice.sendChat('hola-u89');
  const got = await bobChat;
  assert.equal(got.text, 'hola-u89');

  alice.hangup();
  bob.hangup();
  alice.destroy();
  bob.destroy();
});
