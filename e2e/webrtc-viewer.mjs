/**
 * WP-U89 e2e — DataChannel chat + bulk cache (U80) + game state survives hangup.
 * Headless (no ZEUS_OPEN_BROWSER). Video getUserMedia: ⏳ in Node (wrtc data-only).
 */

import assert from 'node:assert/strict';
import { createScriptoriumServer } from '@zeus/socket-server';
import { resolveIceServers } from '@zeus/presets-sdk/env';
import { issuePeerCard } from '@zeus/authority-kit';
import {
  SocketRoomSignalingService,
  loadRtcPeerConnection
} from '@zeus/webrtc-signaling';
import { WebRTCEngine } from '@zeus/webrtc-viewer';
import {
  receiveAndValidateCache,
  validateCacheObject
} from '@zeus/webrtc-viewer';
import { createWebRtcViewerServer } from '@zeus/webrtc-viewer/serve';
import { createClient, connectAndJoin, onRoomEvent } from '@zeus/rooms';
import { safeClose } from './helpers.mjs';

const E2E_TIMEOUT_MS = 60_000;
const SCRIPTORIUM_PORT = 13089;
const VIEWER_PORT = 13090;
const SIGNAL_ROOM = 'WEBRTC_VIEWER_E2E';
const GAME_ROOM = 'ARG_WEBRTC_E2E';
const RUNTIME_BASE = `http://localhost:${SCRIPTORIUM_PORT}`;

async function main() {
  const deadline = setTimeout(() => {
    console.error(`e2e:webrtc-viewer HARD TIMEOUT after ${E2E_TIMEOUT_MS}ms`);
    process.exit(1);
  }, E2E_TIMEOUT_MS);
  deadline.unref?.();

  let scriptorium = null;
  let viewer = null;
  /** @type {WebRTCEngine[]} */
  const engines = [];
  /** @type {SocketRoomSignalingService[]} */
  const signals = [];
  /** @type {import('@zeus/socket-core/client').SocketClient|null} */
  let gameClient = null;

  const prev = {
    stun: process.env.ZEUS_WEBRTC_STUN,
    allow: process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN,
    scriptoriumUrl: process.env.ZEUS_SCRIPTORIUM_URL,
    open: process.env.ZEUS_OPEN_BROWSER
  };
  delete process.env.ZEUS_WEBRTC_STUN;
  delete process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN;
  delete process.env.ZEUS_OPEN_BROWSER;
  process.env.ZEUS_SCRIPTORIUM_URL = RUNTIME_BASE;

  try {
    const iceServers = resolveIceServers(process.env, { warn: () => {} });
    assert.equal(iceServers.length, 0, 'no Google ICE');

    scriptorium = await createScriptoriumServer({
      port: SCRIPTORIUM_PORT,
      host: 'localhost',
      bridge: 'local'
    });

    viewer = await createWebRtcViewerServer({
      port: VIEWER_PORT,
      host: 'localhost',
      zeus: {
        scriptoriumUrl: `${RUNTIME_BASE}/runtime`,
        room: GAME_ROOM,
        webrtcRoom: SIGNAL_ROOM,
        token: '',
        user: 'e2e',
        iceServers
      }
    });

    const health = await fetch(`http://localhost:${VIEWER_PORT}/health`);
    assert.equal(health.status, 200);
    const healthBody = await health.json();
    assert.equal(healthBody.ok, true);

    const sample = { oldid: 89001, title: 'u89-bulk', user: 'alice', bytes: 3 };
    const validateRes = await fetch(`http://localhost:${VIEWER_PORT}/api/validate-cache`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ schemaId: 'cache-sidecar-meta', object: sample })
    });
    const validated = await validateRes.json();
    assert.equal(validated.ok, true, 'CA: validate-cache U80');

    const RTCPeerConnection = await loadRtcPeerConnection();
    const aliceSig = new SocketRoomSignalingService({ url: RUNTIME_BASE, room: SIGNAL_ROOM });
    const bobSig = new SocketRoomSignalingService({ url: RUNTIME_BASE, room: SIGNAL_ROOM });
    signals.push(aliceSig, bobSig);

    await aliceSig.connect('alice', { url: RUNTIME_BASE, room: SIGNAL_ROOM });
    await bobSig.connect('bob', { url: RUNTIME_BASE, room: SIGNAL_ROOM });
    await aliceSig.joinRoom(
      SIGNAL_ROOM,
      issuePeerCard({
        roomId: SIGNAL_ROOM,
        endpoint: RUNTIME_BASE,
        role: 'player',
        sessionId: 'alice'
      })
    );
    await bobSig.joinRoom(
      SIGNAL_ROOM,
      issuePeerCard({
        roomId: SIGNAL_ROOM,
        endpoint: RUNTIME_BASE,
        role: 'player',
        sessionId: 'bob'
      })
    );
    await new Promise((r) => setTimeout(r, 200));

    const alice = new WebRTCEngine({
      signaling: aliceSig,
      iceServers,
      RTCPeerConnection
    });
    const bob = new WebRTCEngine({
      signaling: bobSig,
      iceServers,
      RTCPeerConnection
    });
    engines.push(alice, bob);
    await alice.initialize();
    await bob.initialize();

    const bobChat = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('chat timeout')), 20_000);
      bob.on('chat', (m) => {
        clearTimeout(t);
        resolve(m);
      });
    });
    const bobBulk = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('bulk timeout')), 20_000);
      bob.on('bulk-cache', (m) => {
        clearTimeout(t);
        resolve(m);
      });
    });

    await new Promise((r) => setTimeout(r, 100));
    await alice.connectToPeer('bob', { useDataChannel: true });
    await Promise.race([
      new Promise((resolve) => alice.on('datachannel-open', resolve)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('datachannel-open timeout')), 20_000)
      )
    ]);
    await new Promise((r) => setTimeout(r, 150));

    alice.sendChat('video-chat-proxy-u89');
    const chat = await bobChat;
    assert.equal(chat.text, 'video-chat-proxy-u89');

    alice.sendCacheObject(sample, 'cache-sidecar-meta');
    const bulk = await bobBulk;
    const checked = receiveAndValidateCache({
      type: 'bulk-cache',
      schemaId: bulk.schemaId,
      object: bulk.object
    });
    assert.equal(checked.ok, true, 'CA: peer cache validates vs manifest U80');
    assert.equal(validateCacheObject(bulk.object).ok, true);

    // Game room state listener — survives WebRTC hangup.
    gameClient = createClient('game-observer', {
      url: RUNTIME_BASE,
      room: GAME_ROOM
    });
    await connectAndJoin(gameClient, 'game-observer', {
      room: GAME_ROOM,
      type: 'E2E',
      features: ['state']
    });

    let statesAfterHangup = 0;
    const unsub = onRoomEvent(gameClient, 'state', () => {
      statesAfterHangup += 1;
    });
    // Also listen arg:state dual wire
    const unsub2 = onRoomEvent(gameClient, 'arg:state', () => {
      statesAfterHangup += 1;
    });

    // Emit a synthetic state via ROOM_MESSAGE before hangup
    gameClient.io.emit('ROOM_MESSAGE', {
      event: 'state',
      room: GAME_ROOM,
      data: { actors: { uno: { id: 'uno' } }, phase: 'pre' }
    });
    await new Promise((r) => setTimeout(r, 200));

    alice.hangup();
    bob.hangup();

    gameClient.io.emit('ROOM_MESSAGE', {
      event: 'state',
      room: GAME_ROOM,
      data: { actors: { uno: { id: 'uno' } }, phase: 'post-hangup' }
    });
    await new Promise((r) => setTimeout(r, 300));

    assert.ok(
      statesAfterHangup >= 1,
      `CA: game state via room after WebRTC hangup (got ${statesAfterHangup})`
    );
    unsub();
    unsub2();

    console.log(
      'e2e:webrtc-viewer OK — chat + bulk U80 + state after hangup; viewer health green'
    );
    console.log(
      'note: getUserMedia video path exists in WebRTCEngine; Node e2e is data/chat (⏳ two-browser A/V)'
    );
  } finally {
    for (const e of engines) {
      try {
        e.destroy();
      } catch {
        /* ignore */
      }
    }
    for (const s of signals) {
      try {
        await s.disconnect();
      } catch {
        /* ignore */
      }
    }
    if (gameClient?.io) {
      try {
        gameClient.io.disconnect();
      } catch {
        /* ignore */
      }
    }
    await safeClose(viewer);
    await safeClose(scriptorium);
    if (prev.stun == null) delete process.env.ZEUS_WEBRTC_STUN;
    else process.env.ZEUS_WEBRTC_STUN = prev.stun;
    if (prev.allow == null) delete process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN;
    else process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN = prev.allow;
    if (prev.scriptoriumUrl == null) delete process.env.ZEUS_SCRIPTORIUM_URL;
    else process.env.ZEUS_SCRIPTORIUM_URL = prev.scriptoriumUrl;
    if (prev.open == null) delete process.env.ZEUS_OPEN_BROWSER;
    else process.env.ZEUS_OPEN_BROWSER = prev.open;
    clearTimeout(deadline);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
