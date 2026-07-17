/**
 * Deck-io client for @zeus/console-monitor — joins player-ui `/deck-io`.
 * Snapshot wire: contrato `state` (WP-U56). Emits inbound deck events locally.
 */

import { io } from 'socket.io-client';

export const PACKAGE_NAME = '@zeus/console-monitor';

/**
 * @param {object} [options]
 * @param {string} [options.baseUrl] player-ui origin (http://host:port)
 * @param {string} [options.deckPath] socket.io path (default `/deck-io`)
 * @param {(type: string, payload?: object, detail?: string) => void} [options.pushEvent]
 */
export function createSessionClient(options = {}) {
  const baseUrl = String(options.baseUrl || options.playerUiUrl || '').replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('createSessionClient: baseUrl (player-ui) is required');
  }
  const deckPath = options.deckPath ?? '/deck-io';
  const pushEvent = options.pushEvent ?? (() => {});

  /** @type {{
   *   connected: boolean,
   *   reconnectAttempt: number,
   *   session: object|null,
   *   catalog: unknown[]|null,
   *   debugStats: object|null,
   *   lastResolveTiming: Record<string, unknown>
   * }} */
  let state = {
    connected: false,
    reconnectAttempt: 0,
    session: null,
    catalog: null,
    debugStats: null,
    lastResolveTiming: {}
  };
  const updateListeners = new Set();

  const socket = io(baseUrl, {
    path: deckPath,
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true
  });

  function notify() {
    for (const fn of updateListeners) fn(state);
  }

  function setState(patch) {
    state = { ...state, ...patch };
    notify();
  }

  socket.on('connect', () => {
    setState({ connected: true, reconnectAttempt: 0 });
    pushEvent('connect', { socketId: socket.id });
  });

  socket.on('disconnect', (reason) => {
    setState({ connected: false });
    pushEvent('disconnect', { reason: String(reason ?? '') });
  });

  socket.on('connect_error', (err) => {
    setState({
      connected: false,
      reconnectAttempt: (state.reconnectAttempt || 0) + 1
    });
    pushEvent('connect_error', { message: err?.message ?? String(err) });
  });

  socket.on('state', (session) => {
    setState({ session: session ?? null });
    pushEvent('state', session && typeof session === 'object' ? session : {});
  });

  socket.on('deck:resolved', (payload) => {
    pushEvent('deck:resolved', payload && typeof payload === 'object' ? payload : {});
  });

  socket.on('catalog:servers', (servers) => {
    const list = Array.isArray(servers) ? servers : [];
    setState({ catalog: list });
    const up = list.filter((s) => s?.up || s?.status === 'up').length;
    pushEvent('catalog:servers', { up, total: list.length });
  });

  socket.on('debug:stats', (stats) => {
    setState({ debugStats: stats ?? null });
    pushEvent('debug:stats', stats && typeof stats === 'object' ? stats : {});
  });

  socket.on('debug:resolve-timing', (payload) => {
    const deckId = payload?.deckId;
    if (deckId) {
      setState({
        lastResolveTiming: {
          ...state.lastResolveTiming,
          [deckId]: payload
        }
      });
    }
    pushEvent('debug:resolve-timing', payload && typeof payload === 'object' ? payload : {});
  });

  socket.on('wikitext:cache-result', (payload) => {
    pushEvent('wikitext:cache-result', payload && typeof payload === 'object' ? payload : {});
  });

  socket.on('wikitext:poll-result', (payload) => {
    pushEvent('wikitext:poll-result', payload && typeof payload === 'object' ? payload : {});
  });

  socket.on('deck:error', (err) => {
    pushEvent('deck:error', err && typeof err === 'object' ? err : { message: String(err) });
  });

  const emit = (event, payload) => {
    if (!socket.connected) {
      pushEvent('emit:blocked', { event });
      return false;
    }
    socket.emit(event, payload);
    pushEvent(`emit:${event}`, { raw: payload });
    return true;
  };

  return {
    socket,
    getSocket: () => socket,
    getState: () => state,
    onUpdate: (fn) => {
      updateListeners.add(fn);
      return () => updateListeners.delete(fn);
    },
    connect: () => {
      if (!socket.connected) socket.connect();
      return Promise.resolve();
    },
    reconnect: () => {
      setState({ reconnectAttempt: (state.reconnectAttempt || 0) + 1 });
      pushEvent('reconnect', { mode: 'manual' });
      socket.disconnect();
      socket.connect();
    },
    disconnect: () => {
      socket.disconnect();
    },
    close: async () => {
      socket.close();
    },
    emit,
    setPlayhead: (year) => emit('domain:playhead:set', { year }),
    pauseTransport: () => emit('transport:pause'),
    playTransport: () => emit('transport:play'),
    toggleSync: () => emit('sync:toggle'),
    deckLoad: (payload) => emit('domain:deck:load', payload),
    registroSelect: (payload) => emit('registro:select', payload),
    micropostSelect: (payload) => emit('micropost:select', payload),
    firehoseCorpus: (payload) => emit('firehose:corpus', payload),
    wikitextCache: (payload) => emit('wikitext:cache', payload),
    wikitextPoll: (payload) => emit('wikitext:poll', payload),
    setCaso: (casoId) => emit('caso:set', { casoId })
  };
}
