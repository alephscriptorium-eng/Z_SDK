/**
 * Session debug page — room client + MCP monitor via ui-kit components.
 */

import { createBrowserRoomClient } from '/assets/room-client/room-client.browser.mjs';
import { readInjectedRoomConfig } from '/assets/room-client/dev-room-config.mjs';
import { mountSessionConsole } from '/assets/js/session-console.js';

const phaseBadge = document.getElementById('session-phase-badge');
const playheadMeta = document.getElementById('session-playhead-meta');
const syncMeta = document.getElementById('session-sync-meta');
const explorerHost = document.getElementById('session-explorer');
const consoleHost = document.getElementById('session-console-host');
const monitorHost = document.getElementById('mcp-monitor-host');

const room = createBrowserRoomClient(readInjectedRoomConfig('room-config'));
const socket = room.getSocket();

/** Minimal client facade for session-console (emit / waitForEvent / onError). */
const client = {
  getSocket: () => socket,
  connect: () => room.connect(),
  disconnect: () => room.disconnect(),
  emit: (event, payload) => {
    room.emit(event, payload);
    return true;
  },
  waitForEvent: (event, predicate = null, timeoutMs = 8000) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Timeout waiting for ${event}`)),
        timeoutMs
      );
      const handler = (payload) => {
        if (predicate && !predicate(payload)) return;
        clearTimeout(timer);
        socket.off(event, handler);
        resolve(payload);
      };
      socket.on(event, handler);
    }),
  onError: (fn) => {
    const handler = (err) => fn(err);
    socket.on('deck:error', handler);
    return () => socket.off('deck:error', handler);
  }
};

let sessionState = null;
let explorer = null;
let monitor = null;

const ROOT_TABS = [
  { label: 'session', path: 'session' },
  { label: 'decks.A', path: 'decks.A' },
  { label: 'decks.B', path: 'decks.B' },
  { label: 'playhead', path: 'playhead' }
];

function pathFromHash() {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return null;
  const m = hash.match(/^path=(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function syncHash(path) {
  const next = '#path=' + encodeURIComponent(path || 'session');
  if (window.location.hash !== next) {
    history.replaceState(null, '', next);
  }
}

function eventToPath(event) {
  const type = event.type;
  const p = event.payload || {};
  if (type === 'deck:resolved' && p.deckId) {
    return 'decks.' + p.deckId + '.resolved';
  }
  if (type === 'state') return 'session';
  if (type === 'debug:resolve-timing' && p.deckId) {
    return 'decks.' + p.deckId;
  }
  return null;
}

function updateHeader(state) {
  if (!state) return;
  const session = state.session ?? state;
  const phase = typeof session.phase === 'string' ? session.phase : JSON.stringify(session.phase);
  if (phaseBadge) {
    phaseBadge.textContent = phase;
    phaseBadge.dataset.state = phase;
  }
  const playhead = session.playhead ?? state.playhead;
  if (playheadMeta && playhead) {
    const play = playhead.playing ? 'PLAY' : 'PAUSE';
    playheadMeta.textContent = 'año ' + playhead.year + ' · ' + play;
  }
  if (syncMeta) {
    const sync = session.sync ?? state.sync;
    syncMeta.textContent = sync ? 'sync ON' : 'sync OFF';
  }
}

async function fetchSnapshot() {
  const res = await fetch('/api/debug/snapshot', { signal: AbortSignal.timeout(1200) });
  return res.json();
}

function mountExplorer() {
  if (!explorerHost || !window.ZeusObjectExplorer) return;
  const initialPath = pathFromHash() || 'session';
  explorer = window.ZeusObjectExplorer.mount(explorerHost, {
    getData: function () { return sessionState; },
    path: initialPath,
    rootLabel: 'session',
    rootTabs: ROOT_TABS,
    onPathChange: syncHash
  });
}

function mountMonitor() {
  if (!monitorHost || !window.ZeusMcpMonitor) return;
  monitor = window.ZeusMcpMonitor.mount(monitorHost, {
    title: 'Monitor MCP',
    fetchSnapshot: fetchSnapshot,
    pollIntervalMs: 3500,
    onEventClick: function (ev) {
      const jumpPath = eventToPath(ev);
      if (jumpPath && explorer) explorer.setPath(jumpPath);
    }
  });
}

function onSessionState(state) {
  sessionState = state;
  updateHeader(state);
  if (explorer) explorer.refresh();
}

room.onState(onSessionState);

client.onError((err) => {
  console.warn('deck/room error', err);
  if (phaseBadge) {
    phaseBadge.textContent = 'error';
    phaseBadge.dataset.state = 'degraded';
  }
});

client.connect().catch((err) => console.warn('room connect failed:', err));

room.onRoomEvent('debug:stats', function (payload) {
  if (monitor) monitor.setDebugStats(payload);
});

room.onRoomEvent('debug:resolve-timing', function () {
  if (explorer) explorer.refresh();
  if (monitor) monitor.refresh();
});

window.addEventListener('hashchange', function () {
  const p = pathFromHash();
  if (p && explorer) explorer.setPath(p);
});

mountExplorer();
mountMonitor();
if (consoleHost) mountSessionConsole(consoleHost, { client });
