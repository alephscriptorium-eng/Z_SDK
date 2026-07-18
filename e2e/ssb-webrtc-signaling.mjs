/**
 * WP-U90 e2e — two SSB identities negotiate a DataChannel via private
 * webrtc-signal DMs mediated by an in-process pub bus (no copy-paste, no
 * dedicated signaling websocket, no Google STUN).
 */

import { resolveIceServers } from '@zeus/presets-sdk/env';
import { issuePeerCard } from '@zeus/authority-kit';
import {
  createInMemorySsbPrivateBus,
  SsbPrivateSignalingService,
  negotiateDataChannelComplete,
  loadRtcPeerConnection
} from '@zeus/webrtc-signaling';

const E2E_TIMEOUT_MS = 60_000;
const ALICE = '@alice.ed25519';
const BOB = '@bob.ed25519';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const deadline = setTimeout(() => {
    console.error(`e2e:ssb-webrtc-signaling HARD TIMEOUT after ${E2E_TIMEOUT_MS}ms`);
    process.exit(1);
  }, E2E_TIMEOUT_MS);
  deadline.unref?.();

  /** @type {import('@zeus/webrtc-signaling').SsbPrivateSignalingService[]} */
  const signals = [];
  /** @type {RTCPeerConnection[]} */
  const pcs = [];

  const prev = {
    stun: process.env.ZEUS_WEBRTC_STUN,
    turn: process.env.ZEUS_WEBRTC_TURN,
    turnUrl: process.env.ZEUS_WEBRTC_TURN_URL,
    allow: process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN
  };
  delete process.env.ZEUS_WEBRTC_STUN;
  delete process.env.ZEUS_WEBRTC_TURN;
  delete process.env.ZEUS_WEBRTC_TURN_URL;
  delete process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN;

  try {
    const iceServers = resolveIceServers(process.env, { warn: () => {} });
    assert(iceServers.length === 0, 'CA: iceServers must be empty (no Google)');
    assert(!/google/i.test(JSON.stringify(iceServers)), 'CA: no google in ICE');

    const bus = createInMemorySsbPrivateBus();
    const alice = new SsbPrivateSignalingService({
      transport: bus.createTransport(ALICE)
    });
    const bob = new SsbPrivateSignalingService({
      transport: bus.createTransport(BOB)
    });
    signals.push(alice, bob);

    await alice.connect(ALICE);
    await bob.connect(BOB);
    await alice.joinRoom(
      'oasis-private',
      issuePeerCard({
        roomId: 'oasis-private',
        endpoint: 'ssb:oasis',
        role: 'player',
        sessionId: ALICE
      })
    );
    await bob.joinRoom(
      'oasis-private',
      issuePeerCard({
        roomId: 'oasis-private',
        endpoint: 'ssb:oasis',
        role: 'player',
        sessionId: BOB
      })
    );

    const RTCPeerConnection = await loadRtcPeerConnection();

    console.log('Negotiating DataChannel via SSB private webrtc-signal (complete SDP, no trickle)...');

    const bobP = negotiateDataChannelComplete({
      signaling: bob,
      remotePeerId: ALICE,
      polite: true,
      iceServers,
      RTCPeerConnection,
      timeoutMs: 40_000
    });
    await new Promise((r) => setTimeout(r, 100));
    const aliceP = negotiateDataChannelComplete({
      signaling: alice,
      remotePeerId: BOB,
      polite: false,
      iceServers,
      RTCPeerConnection,
      timeoutMs: 40_000
    });

    const [aliceSession, bobSession] = await Promise.all([aliceP, bobP]);
    pcs.push(aliceSession.pc, bobSession.pc);

    assert(aliceSession.channel.readyState === 'open', 'alice DataChannel open');
    assert(bobSession.channel.readyState === 'open', 'bob DataChannel open');

    const ping = await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('ping timeout')), 5_000);
      bobSession.channel.addEventListener('message', (ev) => {
        clearTimeout(t);
        resolve(String(ev.data));
      });
      aliceSession.channel.send('ping-ssb-u90');
    });
    assert(ping === 'ping-ssb-u90', `unexpected ping payload: ${ping}`);

    console.log(
      'e2e:ssb-webrtc-signaling OK — DataChannel open via pub-mediated SSB DMs, ping delivered, no copy-paste, no Google ICE'
    );
  } finally {
    for (const s of signals) {
      try {
        await s.disconnect();
      } catch {
        /* ignore */
      }
    }
    for (const pc of pcs) {
      try {
        pc.close();
      } catch {
        /* ignore */
      }
    }
    if (prev.stun !== undefined) process.env.ZEUS_WEBRTC_STUN = prev.stun;
    else delete process.env.ZEUS_WEBRTC_STUN;
    if (prev.turn !== undefined) process.env.ZEUS_WEBRTC_TURN = prev.turn;
    else delete process.env.ZEUS_WEBRTC_TURN;
    if (prev.turnUrl !== undefined) process.env.ZEUS_WEBRTC_TURN_URL = prev.turnUrl;
    else delete process.env.ZEUS_WEBRTC_TURN_URL;
    if (prev.allow !== undefined) process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN = prev.allow;
    else delete process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN;
    clearTimeout(deadline);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
