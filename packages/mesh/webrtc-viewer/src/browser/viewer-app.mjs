/**
 * Browser viewer shell — peer-list / media-controls / chat.
 *
 * Procedencia UI (WP-U89): adapted from web-rtc-gamify-ui @ 4b9271b
 * components peer-list, media-controls, chat — not a dead copy; wired to
 * Zeus WebRTCEngine + BrowserSocketSignalingService (U88 full wire names).
 */

import { WebRTCEngine } from '../core/webrtc-engine.mjs';
import { BrowserSocketSignalingService } from './browser-signaling.mjs';
import { createBrowserRoomClient } from '@zeus/room-client-browser';
import { makePeerCard, roleScope } from '@zeus/protocol';

function $(sel, root = document) {
  return root.querySelector(sel);
}

function readZeus() {
  const z = globalThis.__ZEUS__ || {};
  const params = new URLSearchParams(location.search);
  return {
    scriptoriumUrl: z.scriptoriumUrl || '',
    token: z.token || '',
    room: params.get('room') || z.webrtcRoom || z.room || 'WEBRTC_MESH',
    gameRoom: z.room || 'ARG_DELTA',
    user: params.get('user') || z.user || `webrtc-${Math.random().toString(36).slice(2, 7)}`,
    peer: params.get('peer') || '',
    action: params.get('action') || '',
    mode: params.get('mode') || 'room',
    iceServers: Array.isArray(z.iceServers) ? z.iceServers : []
  };
}

function renderShell(root) {
  root.innerHTML = `
    <header class="wrtc-header">
      <h1>Zeus WebRTC</h1>
      <p class="wrtc-sub">salas · privados · chat · bulk cache — no es verdad de estado</p>
      <div class="wrtc-status" id="wrtc-status">idle</div>
    </header>
    <section class="wrtc-media" id="wrtc-media-controls" data-provenance="media-controls@4b9271b">
      <video id="local-video" autoplay playsinline muted></video>
      <video id="remote-video" autoplay playsinline></video>
      <div class="wrtc-media-btns">
        <button type="button" id="btn-call" class="wrtc-btn">llamar</button>
        <button type="button" id="btn-share" class="wrtc-btn">compartir A/V</button>
        <button type="button" id="btn-hangup" class="wrtc-btn">colgar</button>
      </div>
    </section>
    <section class="wrtc-peers" id="wrtc-peer-list" data-provenance="peer-list@4b9271b">
      <h2>Peers</h2>
      <ul id="peer-list"></ul>
      <label>Peer id <input id="peer-id" placeholder="bob" /></label>
    </section>
    <section class="wrtc-chat" id="wrtc-chat" data-provenance="chat@4b9271b">
      <h2>Chat</h2>
      <div id="chat-log" class="chat-log"></div>
      <form id="chat-form">
        <input id="chat-input" autocomplete="off" placeholder="mensaje…" />
        <button type="submit">enviar</button>
      </form>
    </section>
    <section class="wrtc-bulk" id="wrtc-bulk">
      <h2>Bulk cache</h2>
      <pre id="bulk-log" class="bulk-log">—</pre>
      <button type="button" id="btn-send-cache" class="wrtc-btn">enviar objeto cache</button>
    </section>
    <section class="wrtc-game-state" id="wrtc-game-state">
      <h2>Estado juego (room — independiente de WebRTC)</h2>
      <pre id="game-state-log">esperando state…</pre>
    </section>
  `;
}

/**
 * @param {HTMLElement} root
 */
export async function bootWebRtcViewer(root) {
  const cfg = readZeus();
  renderShell(root);
  const setStatus = (t) => {
    const el = $('#wrtc-status');
    if (el) el.textContent = t;
  };

  const signaling = new BrowserSocketSignalingService({
    scriptoriumUrl: cfg.scriptoriumUrl,
    token: cfg.token,
    room: cfg.room
  });

  const engine = new WebRTCEngine({
    signaling,
    iceServers: cfg.iceServers,
    maxConnections: cfg.mode === 'private' ? 2 : 10,
    debug: false
  });

  await engine.initialize();
  await signaling.connect(cfg.user, {
    scriptoriumUrl: cfg.scriptoriumUrl,
    token: cfg.token,
    room: cfg.room
  });
  const peerCard = makePeerCard({
    roomId: cfg.room,
    endpoint: cfg.scriptoriumUrl || 'browser',
    token: `viewer-${cfg.user}-${Date.now()}`,
    scopes: [roleScope('player'), 'presence:join', 'webrtc:signal'],
    expiresAt: Date.now() + 60 * 60 * 1000,
    sessionId: cfg.user,
    displayName: cfg.user
  });
  await engine.joinRoom(cfg.room, peerCard);
  setStatus(`signaling · ${cfg.user} @ ${cfg.room}`);

  // Game room client — authority state survives WebRTC hangup (D-17).
  const gameRoom = createBrowserRoomClient({
    scriptoriumUrl: cfg.scriptoriumUrl,
    token: cfg.token,
    room: cfg.gameRoom,
    user: `game-${cfg.user}`,
    type: 'ZeusWebRtcGameState',
    features: ['viewer', 'state']
  });
  await gameRoom.connect();
  let lastStateAt = 0;
  gameRoom.onState((snap) => {
    lastStateAt = Date.now();
    const el = $('#game-state-log');
    if (el) {
      el.textContent = JSON.stringify(
        {
          at: new Date(lastStateAt).toISOString(),
          room: cfg.gameRoom,
          actors: snap?.actors ? Object.keys(snap.actors) : [],
          note: 'vía room — no DataChannel'
        },
        null,
        2
      );
    }
  });

  const peerInput = /** @type {HTMLInputElement} */ ($('#peer-id'));
  if (cfg.peer) peerInput.value = cfg.peer;

  function refreshPeers() {
    const ul = $('#peer-list');
    if (!ul) return;
    ul.innerHTML = '';
    for (const [id, peer] of engine.getPeers()) {
      const li = document.createElement('li');
      li.textContent = `${id} · ${peer.connectionState}`;
      ul.appendChild(li);
    }
  }

  engine.on('peer-connected', refreshPeers);
  engine.on('peer-disconnected', refreshPeers);
  engine.on('connection-state', refreshPeers);
  engine.on('stream-received', ({ stream }) => {
    const v = /** @type {HTMLVideoElement} */ ($('#remote-video'));
    if (v) v.srcObject = stream;
  });
  engine.on('local-stream', ({ stream }) => {
    const v = /** @type {HTMLVideoElement} */ ($('#local-video'));
    if (v) v.srcObject = stream;
  });
  engine.on('chat', ({ peerId, text, from }) => {
    const log = $('#chat-log');
    if (!log) return;
    const line = document.createElement('div');
    line.textContent = `${from || peerId}: ${text}`;
    log.appendChild(line);
  });
  engine.on('bulk-cache', async ({ object, schemaId, peerId }) => {
    const log = $('#bulk-log');
    try {
      const res = await fetch('/api/validate-cache', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ schemaId, object })
      });
      const result = await res.json();
      if (log) {
        log.textContent = JSON.stringify(
          { from: peerId, validated: result, object },
          null,
          2
        );
      }
      if (result.ok) setStatus(`bulk cache OK · ${schemaId}`);
      else setStatus(`bulk cache REJECT · ${schemaId}`);
    } catch (err) {
      if (log) log.textContent = String(err);
    }
  });

  async function call(withMedia) {
    const peerId = peerInput.value.trim();
    if (!peerId) {
      setStatus('indica peer id');
      return;
    }
    if (withMedia) {
      await engine.getUserMedia({ video: true, audio: true });
    }
    await engine.connectToPeer(peerId, {
      useVideo: withMedia,
      useAudio: withMedia,
      useDataChannel: true
    });
    setStatus(withMedia ? `llamada A/V → ${peerId}` : `data → ${peerId}`);
    refreshPeers();
  }

  $('#btn-call')?.addEventListener('click', () => void call(true));
  $('#btn-share')?.addEventListener('click', () => void call(true));
  $('#btn-hangup')?.addEventListener('click', () => {
    engine.hangup();
    setStatus('colgado · game room sigue viva');
    refreshPeers();
  });

  $('#chat-form')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const input = /** @type {HTMLInputElement} */ ($('#chat-input'));
    const text = input.value.trim();
    if (!text) return;
    engine.sendChat(text);
    const log = $('#chat-log');
    if (log) {
      const line = document.createElement('div');
      line.textContent = `yo: ${text}`;
      log.appendChild(line);
    }
    input.value = '';
  });

  $('#btn-send-cache')?.addEventListener('click', () => {
    const sample = {
      oldid: 89001,
      title: 'webrtc-bulk-demo',
      timestamp: new Date().toISOString(),
      user: cfg.user,
      bytes: 42,
      fetched_at: new Date().toISOString()
    };
    engine.sendCacheObject(sample, 'cache-sidecar-meta');
    setStatus('bulk cache enviado');
  });

  // Auto-action from game buttons (HORSE / contact restActions).
  if (cfg.action === 'webrtc-call' || cfg.action === 'webrtc-share') {
    if (cfg.peer) void call(true);
    else setStatus(`listo para ${cfg.action} — indica peer`);
  } else if (cfg.action === 'webrtc-hangup') {
    engine.hangup();
    setStatus('colgado (acción juego)');
  }

  return { engine, signaling, gameRoom, getLastStateAt: () => lastStateAt };
}

if (typeof document !== 'undefined') {
  const mount = document.getElementById('app');
  if (mount) void bootWebRtcViewer(mount);
}
