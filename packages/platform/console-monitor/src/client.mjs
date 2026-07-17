/**
 * Room client for @zeus/console-monitor — joins game/scriptorium room as viewer.
 * Session-master API demolished (WP-U31); emits channel events via @zeus/rooms.
 */

import { createClient, connectAndJoin, emitRoomEvent, loadScriptoriumConfig } from '@zeus/rooms';

export const PACKAGE_NAME = '@zeus/console-monitor';

/**
 * @param {object} [options]
 */
export function createSessionClient(options = {}) {
  const cfg = loadScriptoriumConfig();
  const room = options.room ?? cfg.room;
  const user = options.user ?? PACKAGE_NAME;
  const client = createClient(user, { room, url: options.scriptoriumUrl ?? cfg.url });
  let joined = false;

  async function ensureJoined() {
    if (joined) return;
    await connectAndJoin(client, user, {
      room,
      type: options.type ?? PACKAGE_NAME,
      features: options.features ?? ['console-monitor']
    });
    joined = true;
  }

  const emit = (event, payload) => {
    if (!client.io?.connected) return false;
    emitRoomEvent(client, event, payload, room);
    return true;
  };

  return {
    client,
    room,
    getSocket: () => client.io,
    connect: ensureJoined,
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
    setCaso: (casoId) => emit('caso:set', { casoId }),
    close: async () => {
      client.io?.close();
    }
  };
}
