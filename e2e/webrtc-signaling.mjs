/**
 * WP-U88 e2e — two headless peers negotiate a DataChannel via room signaling
 * without Google STUN (host candidates / empty iceServers from resolveIceServers).
 */

import { createScriptoriumServer } from '@zeus/socket-server';
import { resolveIceServers } from '@zeus/presets-sdk/env';
import {
  SocketRoomSignalingService,
  negotiateDataChannel,
  loadRtcPeerConnection
} from '@zeus/webrtc-signaling';
import { safeClose } from './helpers.mjs';

const E2E_TIMEOUT_MS = 45_000;
const SCRIPTORIUM_PORT = 13088;
const ROOM = 'WEBRTC_SIGNALING_E2E';
const RUNTIME_BASE = `http://localhost:${SCRIPTORIUM_PORT}`;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const deadline = setTimeout(() => {
    console.error(`e2e:webrtc-signaling HARD TIMEOUT after ${E2E_TIMEOUT_MS}ms`);
    process.exit(1);
  }, E2E_TIMEOUT_MS);
  deadline.unref?.();

  let scriptorium = null;
  /** @type {SocketRoomSignalingService[]} */
  const signals = [];
  /** @type {RTCPeerConnection[]} */
  const pcs = [];

  // Ensure no Google / no leftover TURN from developer .env for this CA
  const prev = {
    stun: process.env.ZEUS_WEBRTC_STUN,
    turn: process.env.ZEUS_WEBRTC_TURN,
    turnUrl: process.env.ZEUS_WEBRTC_TURN_URL,
    allow: process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN,
    scriptoriumUrl: process.env.ZEUS_SCRIPTORIUM_URL
  };
  delete process.env.ZEUS_WEBRTC_STUN;
  delete process.env.ZEUS_WEBRTC_TURN;
  delete process.env.ZEUS_WEBRTC_TURN_URL;
  delete process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN;
  process.env.ZEUS_SCRIPTORIUM_URL = RUNTIME_BASE;

  try {
    const iceServers = resolveIceServers(process.env, { warn: () => {} });
    assert(iceServers.length === 0, 'CA: iceServers must be empty (no Google)');
    const iceBlob = JSON.stringify(iceServers);
    assert(!/google/i.test(iceBlob), 'CA: iceServers must not mention google');

    console.log('Starting socket-server (programmatic)...');
    scriptorium = await createScriptoriumServer({
      port: SCRIPTORIUM_PORT,
      host: 'localhost',
      bridge: 'local'
    });

    const RTCPeerConnection = await loadRtcPeerConnection();

    const alice = new SocketRoomSignalingService({
      url: RUNTIME_BASE,
      room: ROOM
    });
    const bob = new SocketRoomSignalingService({
      url: RUNTIME_BASE,
      room: ROOM
    });
    signals.push(alice, bob);

    await alice.connect('alice', { url: RUNTIME_BASE, room: ROOM });
    await bob.connect('bob', { url: RUNTIME_BASE, room: ROOM });
    await alice.joinRoom(ROOM, 'Alice');
    await bob.joinRoom(ROOM, 'Bob');

    // Brief settle so both are subscribed before offer
    await new Promise((r) => setTimeout(r, 200));

    console.log('Negotiating DataChannel (trickle ICE, no Google)...');
    // Answerer registers signaling handlers before the offerer creates the offer.
    const bobP = negotiateDataChannel({
      signaling: bob,
      remotePeerId: 'alice',
      polite: true,
      iceServers,
      RTCPeerConnection,
      timeoutMs: 25_000
    });
    await new Promise((r) => setTimeout(r, 150));
    const aliceP = negotiateDataChannel({
      signaling: alice,
      remotePeerId: 'bob',
      polite: false,
      iceServers,
      RTCPeerConnection,
      timeoutMs: 25_000
    });
    const [bSide, aSide] = await Promise.all([bobP, aliceP]);
    pcs.push(aSide.pc, bSide.pc);

    assert(aSide.channel.readyState === 'open', 'alice DataChannel not open');
    assert(bSide.channel.readyState === 'open', 'bob DataChannel not open');

    const got = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('pong timeout')), 8_000);
      bSide.channel.addEventListener('message', (ev) => {
        clearTimeout(t);
        resolve(String(ev.data));
      });
    });
    aSide.channel.send('ping-u88');
    const msg = await got;
    assert(msg === 'ping-u88', `expected ping-u88, got ${msg}`);

    console.log('e2e:webrtc-signaling OK — DataChannel open, ping delivered, no Google ICE');
  } catch (err) {
    console.error('e2e:webrtc-signaling FAILED');
    console.error(err);
    process.exitCode = 1;
  } finally {
    clearTimeout(deadline);
    for (const pc of pcs) {
      try {
        pc.close();
      } catch {
        /* best effort */
      }
    }
    for (const s of signals) {
      try {
        await s.disconnect();
      } catch {
        /* best effort */
      }
    }
    await safeClose(scriptorium);

    if (prev.stun == null) delete process.env.ZEUS_WEBRTC_STUN;
    else process.env.ZEUS_WEBRTC_STUN = prev.stun;
    if (prev.turn == null) delete process.env.ZEUS_WEBRTC_TURN;
    else process.env.ZEUS_WEBRTC_TURN = prev.turn;
    if (prev.turnUrl == null) delete process.env.ZEUS_WEBRTC_TURN_URL;
    else process.env.ZEUS_WEBRTC_TURN_URL = prev.turnUrl;
    if (prev.allow == null) delete process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN;
    else process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN = prev.allow;
    if (prev.scriptoriumUrl == null) delete process.env.ZEUS_SCRIPTORIUM_URL;
    else process.env.ZEUS_SCRIPTORIUM_URL = prev.scriptoriumUrl;

    process.exit(process.exitCode ?? 0);
  }
}

main();
