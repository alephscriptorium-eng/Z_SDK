/**
 * Suscriptor server-side de arg:track para navegadores reales (WP-13).
 * Se une a la room como cache-browser#<actor> / firehose-browser#<actor>.
 */

import { createClient, connectAndJoin } from '@zeus/rooms';
import { resolveTrackRef, EVENTS, DEFAULT_ARG_ROOM } from '@zeus/arg-domain';

/**
 * @param {object} opts
 * @param {string} opts.actor
 * @param {string} opts.browserHint 'cache-browser' | 'firehose-browser'
 * @param {string} [opts.room]
 * @param {import('@zeus/rooms').createClient extends Function ? ReturnType<import('@zeus/rooms').createClient> : never} [opts.client]
 */
export function createArgTrackSubscriber(opts) {
  const actor = opts.actor;
  const browserHint = opts.browserHint;
  const room = opts.room || process.env.ZEUS_ARG_ROOM || DEFAULT_ARG_ROOM;
  const user = `${browserHint}#${actor}`;
  const client = opts.client ?? createClient(user, { room });

  /** @type {{ ts?: number, ref?: object, resolved?: object }} */
  let lastFocus = {};

  function handleTrack(track) {
    if (!track || track.actorId !== actor || track.hint !== browserHint) return;
    const resolved = resolveTrackRef(track.ref);
    if (!resolved) return;
    lastFocus = { ts: Date.now(), ref: track.ref, resolved };
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
    getFocus: () => ({ ...lastFocus }),
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
    res.json(focus.ts ? focus : {});
  });
}
