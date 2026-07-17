/**
 * Suscriptor server-side de arg:track para navegadores reales (WP-13 + WP-26).
 * Se une a la room como cache-browser#<actor> / firehose-browser#<actor>.
 *
 * WP-26 (deep-links honestos): antes de ofrecer un focus navegable se
 * comprueba con fs si el recurso resuelto existe de verdad. Si no existe, el
 * focus queda con `state: 'ghost'` (la página muestra un aviso suave en vez
 * de morir con ENOENT); un ref sintético (`firehose://synthetic/...`) queda
 * `state: 'synthetic'` — nunca navegable.
 */

import { createClient, connectAndJoin } from '@zeus/rooms';
import { resolveTrackRef, EVENTS, DEFAULT_ARG_ROOM } from '@zeus/arg-domain';

/** Un ref es sintético si su uri vive en firehose://synthetic/... */
export function isSyntheticTrackUri(uri) {
  return /^firehose:\/\/synthetic\//.test(String(uri ?? ''));
}

/**
 * @param {object} opts
 * @param {string} opts.actor
 * @param {string} opts.browserHint 'cache-browser' | 'firehose-browser'
 * @param {string} [opts.room]
 * @param {(resolved: object, ref: object) => Promise<boolean>} [opts.checkExists]
 *   comprobación de existencia en disco del recurso resuelto (WP-26); si no
 *   se pasa, el estado queda 'ok' (comportamiento WP-13)
 * @param {ReturnType<typeof createClient>} [opts.client]
 */
export function createArgTrackSubscriber(opts) {
  const actor = opts.actor;
  const browserHint = opts.browserHint;
  const room = opts.room || process.env.ZEUS_ARG_ROOM || DEFAULT_ARG_ROOM;
  const user = `${browserHint}#${actor}`;
  const client = opts.client ?? createClient(user, { room });
  const checkExists = typeof opts.checkExists === 'function' ? opts.checkExists : null;

  /** @type {{ ts?: number, ref?: object, resolved?: object, state?: string }} */
  let lastFocus = {};
  let focusSeq = 0;

  async function computeState(ref, resolved) {
    if (isSyntheticTrackUri(ref?.uri)) return 'synthetic';
    if (!checkExists) return 'ok';
    try {
      return (await checkExists(resolved, ref)) ? 'ok' : 'ghost';
    } catch {
      // cualquier error de fs se degrada a ghost: NUNCA un ENOENT crudo
      return 'ghost';
    }
  }

  function handleTrack(track) {
    if (!track || track.actorId !== actor || track.hint !== browserHint) return;
    const resolved = resolveTrackRef(track.ref);
    if (!resolved) return;
    const seq = ++focusSeq;
    computeState(track.ref, resolved).then((state) => {
      if (seq !== focusSeq) return; // llegó un focus más nuevo mientras comprobábamos
      lastFocus = { ts: Date.now(), ref: track.ref, resolved, state };
    });
  }

  function bindListeners() {
    client.io.on(EVENTS.TRACK, handleTrack);
    client.io.on('ROOM_MESSAGE', (raw) => {
      const envelopes = Array.isArray(raw) ? raw : [raw];
      for (const envelope of envelopes) {
        if (!envelope || envelope.event !== EVENTS.TRACK) continue;
        handleTrack(envelope.data ?? envelope);
      }
    });
  }

  return {
    client,
    user,
    room,
    actor,
    getFocus: () => ({ ...lastFocus }),
    isConnected: () => Boolean(client.io?.connected),
    async start() {
      bindListeners();
      await connectAndJoin(client, user, {
        type: 'ArgTrackBrowser',
        features: ['arg-track', browserHint],
        room
      });
    },
    stop() {
      client.io.close();
    }
  };
}

/**
 * @param {import('express').Express} app
 * @param {ReturnType<typeof createArgTrackSubscriber>|null} subscriber
 */
export function mountTrackFocusRoute(app, subscriber) {
  app.get('/api/track/focus', (_req, res) => {
    if (!subscriber) {
      res.json({});
      return;
    }
    const focus = subscriber.getFocus();
    const connected = subscriber.isConnected();
    res.json(focus.ts ? { ...focus, connected } : { connected });
  });
}
