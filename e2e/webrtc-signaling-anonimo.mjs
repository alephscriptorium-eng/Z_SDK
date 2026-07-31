/**
 * WP-U197 e2e — signaling anónimo WebRTC, de facto.
 *
 * Dos peers SIN card negocian offer → answer → ICE contra un
 * socket-server REAL en loopback y abren un DataChannel real. Después se
 * prueba lo que más importa: que haber completado el handshake anónimo
 * NO concede permiso sobre nada que antes estuviera protegido.
 *
 * No importa `e2e/helpers.mjs` a propósito: este guion no debe exigir
 * ZEUS_VOLUMES_ROOT ni ningún otro estado previo para correr.
 */

import { createScriptoriumServer } from '@zeus/socket-server';
import { resolveIceServers } from '@zeus/presets-sdk/env';
import { issuePeerCard } from '@zeus/authority-kit';
import {
  SocketRoomSignalingService,
  SIGNALING_ADMISSION,
  assertSignalingPeerCard,
  negotiateDataChannel,
  loadRtcPeerConnection
} from '@zeus/webrtc-signaling';
import { assertLanBlobTransferAllowed } from '@zeus/blob-sync-harness';

const E2E_TIMEOUT_MS = 60_000;
const SCRIPTORIUM_PORT = 13097;
const ROOM = 'WEBRTC_ANON_E2E';
const RUNTIME_BASE = `http://localhost:${SCRIPTORIUM_PORT}`;

// STUN/TURN de prueba: valores ARBITRARIOS inyectados por entorno para
// demostrar que el código no conoce ningún servidor — sólo lee el env.
const ENV_STUN = 'stun:127.0.0.1:3478';
const ENV_TURN = 'turn:127.0.0.1:3478';
const ENV_TURN_USER = 'u197';
const ENV_TURN_PASS = 'secreto-de-entorno';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function safeClose(handle) {
  if (!handle?.close) return;
  try {
    await handle.close();
  } catch (err) {
    if (err?.code !== 'ERR_SERVER_NOT_RUNNING') throw err;
  }
}

function step(n, text) {
  console.log(`  [paso ${n}] ${text}`);
}

async function main() {
  const deadline = setTimeout(() => {
    console.error(`e2e:webrtc-signaling-anonimo HARD TIMEOUT after ${E2E_TIMEOUT_MS}ms`);
    process.exit(1);
  }, E2E_TIMEOUT_MS);
  deadline.unref?.();

  let scriptorium = null;
  /** @type {SocketRoomSignalingService[]} */
  const signals = [];
  /** @type {RTCPeerConnection[]} */
  const pcs = [];

  const prev = {
    stun: process.env.ZEUS_WEBRTC_STUN,
    turn: process.env.ZEUS_WEBRTC_TURN,
    turnUrl: process.env.ZEUS_WEBRTC_TURN_URL,
    turnUser: process.env.ZEUS_WEBRTC_TURN_USER,
    turnPass: process.env.ZEUS_WEBRTC_TURN_PASS,
    allow: process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN,
    scriptoriumUrl: process.env.ZEUS_SCRIPTORIUM_URL
  };

  try {
    // ── CA4 · STUN/TURN por entorno, sin literales en el código ────────
    console.log('== CA4 · ICE por entorno ==');
    delete process.env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN;
    process.env.ZEUS_WEBRTC_STUN = ENV_STUN;
    process.env.ZEUS_WEBRTC_TURN_URL = ENV_TURN;
    process.env.ZEUS_WEBRTC_TURN_USER = ENV_TURN_USER;
    process.env.ZEUS_WEBRTC_TURN_PASS = ENV_TURN_PASS;
    process.env.ZEUS_SCRIPTORIUM_URL = RUNTIME_BASE;

    const iceServers = resolveIceServers(process.env, { warn: () => {} });
    console.log(`  resolveIceServers(env) = ${JSON.stringify(iceServers)}`);
    assert(iceServers.length === 2, 'CA4: env con STUN+TURN debe dar 2 entradas');
    assert(iceServers[0].urls === ENV_STUN, 'CA4: STUN sale tal cual del env');
    assert(iceServers[1].urls === ENV_TURN, 'CA4: TURN sale tal cual del env');
    assert(iceServers[1].username === ENV_TURN_USER, 'CA4: usuario TURN del env');
    assert(iceServers[1].credential === ENV_TURN_PASS, 'CA4: credencial TURN del env');
    assert(!/google/i.test(JSON.stringify(iceServers)), 'CA4: ni rastro de Google');

    // Sin env: lista vacía. Nada cae por defecto desde el código.
    delete process.env.ZEUS_WEBRTC_STUN;
    delete process.env.ZEUS_WEBRTC_TURN_URL;
    delete process.env.ZEUS_WEBRTC_TURN_USER;
    delete process.env.ZEUS_WEBRTC_TURN_PASS;
    const empty = resolveIceServers(process.env, { warn: () => {} });
    console.log(`  resolveIceServers(sin env) = ${JSON.stringify(empty)}`);
    assert(empty.length === 0, 'CA4: sin env no hay servidor implícito alguno');

    // La negociación de abajo usa exactamente lo que dijo el entorno.
    process.env.ZEUS_WEBRTC_STUN = ENV_STUN;
    const iceForRun = resolveIceServers(process.env, { warn: () => {} });
    assert(iceForRun.length === 1 && iceForRun[0].urls === ENV_STUN, 'CA4: ICE de la corrida');

    console.log('\n== Servidor de señalización real (loopback) ==');
    scriptorium = await createScriptoriumServer({
      port: SCRIPTORIUM_PORT,
      host: 'localhost',
      bridge: 'local'
    });
    console.log(`  socket-server arriba en ${RUNTIME_BASE}`);

    const RTCPeerConnection = await loadRtcPeerConnection();

    // ── CA1/CA2 · handshake completo entre 2 anónimos ──────────────────
    console.log('\n== CA1/CA2 · handshake entre 2 peers ANÓNIMOS ==');
    const anonOpts = {
      url: RUNTIME_BASE,
      room: ROOM,
      admission: SIGNALING_ADMISSION.anonymous
    };
    const alice = new SocketRoomSignalingService(anonOpts);
    const bob = new SocketRoomSignalingService(anonOpts);
    signals.push(alice, bob);

    // Traza de los tres pasos, leída del cable real
    /** @type {Record<string, number>} */
    const trace = { offer: 0, answer: 0, 'ice-candidate': 0 };
    /** @type {string[]} */
    const traceLog = [];
    const errors = [];
    for (const [name, svc] of [['alice', alice], ['bob', bob]]) {
      svc.on('message', (m) => {
        if (!(m.type in trace)) return;
        trace[m.type] += 1;
        if (trace[m.type] <= 1) {
          traceLog.push(
            `${name} ← ${m.type} de ${m.from} · anonymous=${m.anonymous === true} · ` +
              `peerCard=${'peerCard' in m ? 'PRESENTE' : 'AUSENTE'} · ` +
              `ssbId=${'ssbId' in m ? 'PRESENTE' : 'AUSENTE'}`
          );
        }
      });
      svc.on('error', (e) => errors.push(`${name}: ${e.message}`));
    }

    // NINGÚN paso presenta card: ni connect, ni joinRoom, ni offer/answer/ICE
    await alice.connect('alice');
    await bob.connect('bob');
    await alice.joinRoom(ROOM);
    await bob.joinRoom(ROOM);
    step(0, `join anónimo · alice.isAnonymous()=${alice.isAnonymous()} · rol=${alice.getSessionRole()}`);
    assert(alice.isAnonymous() && bob.isAnonymous(), 'CA2: ambos peers son anónimos');
    assert(alice.getPeerCard() === null && bob.getPeerCard() === null, 'CA2: cero cards');

    await new Promise((r) => setTimeout(r, 250));

    console.log('  negociando DataChannel real (trickle ICE, ICE del entorno)...');
    const bobP = negotiateDataChannel({
      signaling: bob,
      remotePeerId: 'alice',
      polite: true,
      iceServers: iceForRun,
      RTCPeerConnection,
      timeoutMs: 30_000
    });
    await new Promise((r) => setTimeout(r, 200));
    const aliceP = negotiateDataChannel({
      signaling: alice,
      remotePeerId: 'bob',
      polite: false,
      iceServers: iceForRun,
      RTCPeerConnection,
      timeoutMs: 30_000
    });
    const [bSide, aSide] = await Promise.all([bobP, aliceP]);
    pcs.push(aSide.pc, bSide.pc);

    assert(errors.length === 0, `CA2: el handshake anónimo no debe errar: ${errors.join(' | ')}`);
    for (const line of traceLog) step('*', line);
    step(1, `offer  entregadas: ${trace.offer}`);
    step(2, `answer entregadas: ${trace.answer}`);
    step(3, `ICE    entregados: ${trace['ice-candidate']}`);
    assert(trace.offer >= 1, 'CA1: falta la offer');
    assert(trace.answer >= 1, 'CA1: falta la answer');
    assert(trace['ice-candidate'] >= 1, 'CA1: falta al menos un candidato ICE');

    assert(aSide.channel.readyState === 'open', 'CA1: DataChannel de alice cerrado');
    assert(bSide.channel.readyState === 'open', 'CA1: DataChannel de bob cerrado');

    const got = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('pong timeout')), 10_000);
      bSide.channel.addEventListener('message', (ev) => {
        clearTimeout(t);
        resolve(String(ev.data));
      });
    });
    aSide.channel.send('ping-u197-anon');
    const msg = await got;
    assert(msg === 'ping-u197-anon', `esperaba ping-u197-anon, llegó ${msg}`);
    step(4, `DataChannel ABIERTO entre dos anónimos y dato entregado: "${msg}"`);

    // ── CA3 · el anónimo NO sale con permisos (el caso que más importa) ─
    console.log('\n== CA3 · admisión ≠ permiso ==');
    const roleAfter = alice.getSessionRole();
    console.log(`  alice.getSessionRole() tras el handshake = ${JSON.stringify(roleAfter)}`);
    assert(roleAfter === null, 'CA3: el handshake anónimo NO puede conceder rol');
    assert(alice.getPeerCard() === null, 'CA3: no apareció card por el camino');

    // El carril LAN de blobs viaja por ESTE MISMO DataChannel y sigue cerrado.
    const lan = assertLanBlobTransferAllowed(alice.getPeerCard());
    console.log(`  assertLanBlobTransferAllowed(anónimo) = ${JSON.stringify(lan)}`);
    assert(lan.ok === false, 'CA3: el carril LAN de blobs NO se abre al anónimo');

    const lanForced = assertLanBlobTransferAllowed(null, { admission: 'anonymous' });
    assert(
      lanForced.ok === false,
      'CA3: el portero de terceros ignora el modo de antesala (no hay contagio)'
    );

    const torno = assertSignalingPeerCard(alice.getPeerCard());
    console.log(`  assertSignalingPeerCard(anónimo) = ${JSON.stringify(torno)}`);
    assert(torno.ok === false, 'CA3: el torno U186 no se movió');

    // Un par con antesala ESTRICTA no admite al anónimo.
    const strict = new SocketRoomSignalingService({ url: RUNTIME_BASE, room: ROOM });
    signals.push(strict);
    const strictErrors = [];
    const strictSeen = [];
    strict.on('error', (e) => strictErrors.push(e.message));
    strict.on('message', (m) => strictSeen.push(m.type));
    await strict.connect('strict');
    const strictCard = issuePeerCard({
      roomId: ROOM,
      endpoint: RUNTIME_BASE,
      role: 'player',
      sessionId: 'strict',
      displayName: 'Strict'
    });
    await strict.joinRoom(ROOM, strictCard);
    await new Promise((r) => setTimeout(r, 250));
    await alice.sendOffer('strict', { type: 'offer', sdp: 'v=0 anon' });
    await new Promise((r) => setTimeout(r, 400));
    const gatedSeen = strictSeen.filter((t) => t === 'offer' || t === 'room-join');
    console.log(`  par estricto: gated entregados=${gatedSeen.length} · rechazos=${strictErrors.length}`);
    console.log(`  motivo: ${strictErrors[0] ?? '(ninguno)'}`);
    assert(gatedSeen.length === 0, 'CA3: la antesala estricta no admite al anónimo');
    assert(strictErrors.length >= 1, 'CA3: el rechazo deja rastro con motivo');

    // Card presentada e inválida: rechaza también en modo anónimo.
    const expired = issuePeerCard({
      roomId: ROOM,
      endpoint: RUNTIME_BASE,
      role: 'player',
      sessionId: 'mallory',
      displayName: 'Mallory',
      ttlMs: 1
    });
    await new Promise((r) => setTimeout(r, 30));
    const mallory = new SocketRoomSignalingService(anonOpts);
    signals.push(mallory);
    let rejected = null;
    try {
      await mallory.connect('mallory', { peerCard: expired });
    } catch (err) {
      rejected = err.message;
    }
    console.log(`  card caducada PRESENTADA en modo anónimo → ${rejected}`);
    assert(rejected != null, 'CA3: card inválida presentada debe rechazar, no degradar');
    assert(
      mallory.isConnected() === false,
      'CA3: sin sesión anónima encubierta tras card inválida'
    );

    console.log(
      '\ne2e:webrtc-signaling-anonimo OK — handshake anónimo completo (offer/answer/ICE + DataChannel), ' +
        'cero cards, cero permisos concedidos, ICE del entorno'
    );
  } catch (err) {
    console.error('e2e:webrtc-signaling-anonimo FAILED');
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

    for (const [key, envName] of [
      ['stun', 'ZEUS_WEBRTC_STUN'],
      ['turn', 'ZEUS_WEBRTC_TURN'],
      ['turnUrl', 'ZEUS_WEBRTC_TURN_URL'],
      ['turnUser', 'ZEUS_WEBRTC_TURN_USER'],
      ['turnPass', 'ZEUS_WEBRTC_TURN_PASS'],
      ['allow', 'ZEUS_WEBRTC_ALLOW_GOOGLE_STUN'],
      ['scriptoriumUrl', 'ZEUS_SCRIPTORIUM_URL']
    ]) {
      if (prev[key] == null) delete process.env[envName];
      else process.env[envName] = prev[key];
    }

    process.exit(process.exitCode ?? 0);
  }
}

main();
