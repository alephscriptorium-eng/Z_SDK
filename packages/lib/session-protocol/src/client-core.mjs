/**
 * Zero-import session client core — receives an `io` factory by injection.
 * Ports reconnection/backoff from player-ui-debug; adds waitForEvent, emitWithAck, onError.
 */

const RECONNECT_BASE_MS = 500;
const RECONNECT_MAX_MS = 8000;

/**
 * @param {object} opts
 * @param {string} opts.url Session namespace URL or path (browser uses path)
 * @param {(url: string, options: object) => import('socket.io-client').Socket} opts.ioFactory
 * @param {object} [opts.ioOptions]
 * @param {(type: string, payload?: Record<string, unknown>, detail?: string) => void} [opts.pushEvent]
 */
export function createSessionClientCore({ url, ioFactory, ioOptions = {}, pushEvent }) {
  const state = {
    connected: false,
    session: null,
    catalog: null,
    debugStats: null,
    lastResolveTiming: {},
    startedAt: Date.now(),
    reconnectAttempt: 0,
    lastError: null
  };

  let socket = null;
  let reconnectTimer = null;
  const listeners = new Set();
  const errorListeners = new Set();
  const reconnectListeners = new Set();

  function notify() {
    for (const fn of listeners) fn(state);
  }

  function emitEvent(type, payload = {}, detail) {
    pushEvent?.(type, payload, detail);
    notify();
  }

  function attachHandlers(sock) {
    sock.on('connect', () => {
      state.connected = true;
      state.reconnectAttempt = 0;
      emitEvent('connect', { socketId: sock.id });
    });

    sock.on('disconnect', (reason) => {
      state.connected = false;
      emitEvent('disconnect', { reason });
      scheduleReconnect();
    });

    sock.on('connect_error', (err) => {
      state.connected = false;
      emitEvent('connect_error', { message: err.message });
      scheduleReconnect();
    });

    sock.on('session:state', (payload) => {
      state.session = payload;
      emitEvent('session:state', {
        phase: payload?.phase,
        year: payload?.playhead?.year,
        activeCaso: payload?.activeCaso
      });
    });

    sock.on('deck:resolved', (payload) => {
      const eventPayload = {
        deckId: payload.deckId,
        year: payload.year
      };
      if (payload.kind === 'firehose') {
        eventPayload.kind = 'firehose';
        eventPayload.corpus = payload.corpus;
        eventPayload.path = payload.path;
        eventPayload.selected = payload.selected?.handle ?? null;
      } else {
        eventPayload.nodoId = payload?.nodo?.nodo?.id || payload?.nodo?.id || '—';
      }
      emitEvent('deck:resolved', eventPayload);
    });

    sock.on('catalog:servers', (servers) => {
      state.catalog = servers;
      const up = Array.isArray(servers)
        ? servers.filter((s) => s.isConnected !== false && s.status !== 'disconnected').length
        : 0;
      emitEvent('catalog:servers', {
        up,
        total: servers?.length ?? 0
      });
    });

    sock.on('wikitext:cache-result', (payload) => {
      emitEvent('wikitext:cache-result', {
        ok: payload.ok === true,
        oldid: payload.oldid,
        error: payload.error
      });
    });

    sock.on('wikitext:poll-result', (payload) => {
      emitEvent('wikitext:poll-result', {
        cached: payload.cached,
        oldid: payload.oldid,
        error: payload.error
      });
    });

    sock.on('debug:stats', (payload) => {
      state.debugStats = payload;
      notify();
    });

    sock.on('debug:resolve-timing', (payload) => {
      state.lastResolveTiming[payload.deckId] = payload;
      emitEvent('debug:resolve-timing', {
        deckId: payload.deckId,
        ms: payload.ms?.toFixed?.(1) ?? payload.ms
      });
    });

    sock.on('session:error', (payload) => {
      state.lastError = payload;
      emitEvent('session:error', payload);
      for (const fn of errorListeners) fn(payload);
    });
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    state.reconnectAttempt += 1;
    for (const fn of reconnectListeners) fn(state.reconnectAttempt);
    const delay = Math.min(RECONNECT_BASE_MS * state.reconnectAttempt, RECONNECT_MAX_MS);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (socket && !socket.connected) {
        socket.connect();
      }
    }, delay);
  }

  function connect() {
    if (socket?.connected) return;
    if (socket) {
      socket.connect();
      emitEvent('reconnect', { mode: 'manual' });
      return;
    }
    socket = ioFactory(url, {
      transports: ['websocket', 'polling'],
      reconnection: false,
      ...ioOptions
    });
    attachHandlers(socket);
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    state.connected = false;
  }

  function emit(event, payload) {
    if (!socket?.connected) {
      emitEvent('emit:blocked', { event });
      return false;
    }
    socket.emit(event, payload);
    emitEvent(`emit:${event}`, {
      raw: payload ? JSON.stringify(payload) : ''
    });
    return true;
  }

  /**
   * @param {string} event
   * @param {unknown} payload
   * @param {number} [timeoutMs]
   */
  function emitWithAck(event, payload, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) {
        reject(new Error(`Not connected — cannot emit ${event}`));
        return;
      }
      const timer = setTimeout(() => {
        reject(new Error(`ACK timeout for ${event}`));
      }, timeoutMs);
      socket.emit(event, payload, (response) => {
        clearTimeout(timer);
        if (response?.code && response?.event) {
          reject(response);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * @param {string} event
   * @param {(payload: unknown) => boolean} [predicate]
   * @param {number} [timeoutMs]
   */
  function waitForEvent(event, predicate = null, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Timeout waiting for ${event}`)),
        timeoutMs
      );
      const handler = (payload) => {
        if (predicate && !predicate(payload)) return;
        clearTimeout(timer);
        socket?.off(event, handler);
        resolve(payload);
      };
      const attach = () => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }
        socket.on(event, handler);
      };
      if (socket) {
        attach();
      } else {
        const check = setInterval(() => {
          if (socket) {
            clearInterval(check);
            attach();
          }
        }, 10);
        setTimeout(() => {
          clearInterval(check);
          if (!socket) {
            clearTimeout(timer);
            reject(new Error('Socket not connected'));
          }
        }, timeoutMs);
      }
    });
  }

  return {
    getState: () => state,
    getSocket: () => socket,
    onUpdate: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    onError: (fn) => {
      errorListeners.add(fn);
      return () => errorListeners.delete(fn);
    },
    onReconnectAttempt: (fn) => {
      reconnectListeners.add(fn);
      return () => reconnectListeners.delete(fn);
    },
    connect,
    disconnect,
    reconnect: () => {
      disconnect();
      connect();
    },
    emit,
    emitWithAck,
    waitForEvent,
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

/**
 * Wait for a socket.io event on a raw socket (e2e / wire canary).
 * @param {import('socket.io-client').Socket} socket
 * @param {string} event
 * @param {(payload: unknown) => boolean} [predicate]
 * @param {number} [timeoutMs]
 */
export function waitForSocketEvent(socket, event, predicate = null, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
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
  });
}
