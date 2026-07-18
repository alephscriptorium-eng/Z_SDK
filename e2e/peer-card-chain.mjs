/**
 * WP-U93 e2e — cadena completa emite-y-exige:
 * autoridad emite peer-card al join → signaling exige card → DataChannel.
 * También verifica rechazo de card caducada / sin rol.
 */

import { createScriptoriumServer } from '@zeus/socket-server';
import { resolveIceServers } from '@zeus/presets-sdk/env';
import { createClient, connectAndJoin } from '@zeus/rooms';
import { startAuthority, issuePeerCard } from '@zeus/authority-kit';
import {
  SocketRoomSignalingService,
  assertSignalingPeerCard,
  negotiateDataChannel,
  loadRtcPeerConnection
} from '@zeus/webrtc-signaling';
import { makePeerCard, roleScope } from '@zeus/protocol';
import { safeClose } from './helpers.mjs';

const E2E_TIMEOUT_MS = 55_000;
const SCRIPTORIUM_PORT = 13093;
const ROOM = 'PEER_CARD_CHAIN_E2E';
const RUNTIME_BASE = `http://localhost:${SCRIPTORIUM_PORT}`;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function createDomain() {
  return {
    applyIntent() {
      return { ok: true, error: null };
    },
    tick() {},
    snapshot(reason) {
      return { reason, actors: {} };
    },
    drainOutbox() {
      return { ledger: [], tracks: [] };
    }
  };
}

async function main() {
  const deadline = setTimeout(() => {
    console.error(`e2e:peer-card-chain HARD TIMEOUT after ${E2E_TIMEOUT_MS}ms`);
    process.exit(1);
  }, E2E_TIMEOUT_MS);
  deadline.unref?.();

  let scriptorium = null;
  /** @type {{ stop: Function }|null} */
  let auth = null;
  /** @type {SocketRoomSignalingService[]} */
  const signals = [];
  /** @type {RTCPeerConnection[]} */
  const pcs = [];

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
    // --- CA unitario embebido: caducada / sin rol ---
    const expired = makePeerCard({
      roomId: ROOM,
      endpoint: RUNTIME_BASE,
      token: 'x',
      scopes: [roleScope('player')],
      expiresAt: Date.now() - 1
    });
    assert(
      assertSignalingPeerCard(expired).ok === false,
      'CA: expired card must be rejected'
    );
    const noRole = makePeerCard({
      roomId: ROOM,
      endpoint: RUNTIME_BASE,
      token: 'y',
      scopes: ['presence:join'],
      expiresAt: Date.now() + 60_000
    });
    assert(
      assertSignalingPeerCard(noRole).ok === false,
      'CA: card without role must be rejected'
    );
    console.log('Gate rejects expired / no-role cards');

    console.log('Starting socket-server (programmatic)...');
    scriptorium = await createScriptoriumServer({
      port: SCRIPTORIUM_PORT,
      host: 'localhost',
      bridge: 'local'
    });

    const issued = [];
    auth = await startAuthority({
      user: 'auth-u93',
      room: ROOM,
      game: 'peer-card-chain',
      tickMs: 60_000,
      installSignalHandlers: false,
      exitOnSignal: null,
      peerCardEndpoint: RUNTIME_BASE,
      domain: createDomain(),
      log: () => {},
      warn: console.warn.bind(console),
      onPeerCard: (card) => issued.push(card),
      createClient: (user, overrides = {}) =>
        createClient(user, { url: RUNTIME_BASE, room: ROOM, ...overrides }),
      connectAndJoin: (client, user, options = {}) =>
        connectAndJoin(client, user, { room: ROOM, ...options })
    });

    // Emit via authority join over the real room (production path)
    const joiner = createClient('joiner-u93', { url: RUNTIME_BASE, room: ROOM });
    await connectAndJoin(joiner, 'joiner-u93', {
      room: ROOM,
      type: 'PeerCardJoiner',
      features: []
    });
    joiner.room(
      'intent',
      { actorId: 'alice', intent: 'join', role: 'player', displayName: 'Alice' },
      ROOM
    );
    joiner.room(
      'intent',
      { actorId: 'bob', intent: 'join', role: 'player', displayName: 'Bob' },
      ROOM
    );

    const deadlineJoin = Date.now() + 5_000;
    while (issued.length < 2 && Date.now() < deadlineJoin) {
      await new Promise((r) => setTimeout(r, 50));
    }
    try {
      joiner.io.close();
    } catch {
      /* best effort */
    }

    assert(issued.length === 2, `expected 2 issued cards, got ${issued.length}`);
    const cardAlice = auth.peerCards.get('alice');
    const cardBob = auth.peerCards.get('bob');
    assert(cardAlice && cardBob, 'authority peerCards map must hold join cards');
    assert(
      assertSignalingPeerCard(cardAlice).ok === true,
      'issued alice card must pass gate'
    );

    // Outbound without card must throw (exige)
    const bare = new SocketRoomSignalingService({ url: RUNTIME_BASE, room: ROOM });
    signals.push(bare);
    await bare.connect('bare', { url: RUNTIME_BASE, room: ROOM });
    let rejected = false;
    try {
      await bare.sendOffer('bob', { type: 'offer', sdp: 'x' });
    } catch (err) {
      rejected = /peer-card/.test(String(err?.message ?? err));
    }
    assert(rejected, 'CA: sendOffer without card must reject');
    await bare.disconnect();

    const iceServers = resolveIceServers(process.env, { warn: () => {} });
    assert(iceServers.length === 0, 'CA: iceServers empty (no Google)');

    const RTCPeerConnection = await loadRtcPeerConnection();
    const alice = new SocketRoomSignalingService({ url: RUNTIME_BASE, room: ROOM });
    const bob = new SocketRoomSignalingService({ url: RUNTIME_BASE, room: ROOM });
    signals.push(alice, bob);

    await alice.connect('alice', { url: RUNTIME_BASE, room: ROOM });
    await bob.connect('bob', { url: RUNTIME_BASE, room: ROOM });
    await alice.joinRoom(ROOM, cardAlice);
    await bob.joinRoom(ROOM, cardBob);
    await new Promise((r) => setTimeout(r, 200));

    console.log('Negotiating DataChannel with authority-issued peer-cards...');
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
    aSide.channel.send('ping-u93');
    const msg = await got;
    assert(msg === 'ping-u93', `expected ping-u93, got ${msg}`);

    // factory still available standalone
    const factoryCard = issuePeerCard({
      roomId: ROOM,
      endpoint: RUNTIME_BASE,
      role: 'dj',
      sessionId: 'factory'
    });
    assert(assertSignalingPeerCard(factoryCard).ok === true);

    console.log(
      'e2e:peer-card-chain OK — authority emit + signaling require + DataChannel'
    );
  } catch (err) {
    console.error('e2e:peer-card-chain FAILED');
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
    if (auth) {
      try {
        await auth.stop(null);
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
