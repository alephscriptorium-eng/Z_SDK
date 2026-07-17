/**
 * Integration test stack: scriptorium + player-ui DJ (joins ARG_DELTA).
 */

import { createScriptoriumServer } from '@zeus/socket-server';

/**
 * @param {typeof import('../src/server.mjs').createPlayerServer} createPlayerServer
 * @param {object} [options]
 */
export async function startPlayerDjStack(createPlayerServer, options = {}) {
  const scriptoriumPort = options.scriptoriumPort ?? 0;
  const playerPort = options.playerPort ?? 0;
  const room = options.room ?? process.env.ZEUS_ARG_ROOM ?? 'ARG_DELTA';

  const scriptorium = await createScriptoriumServer({
    port: scriptoriumPort,
    host: 'localhost',
    bridge: 'local'
  });

  const scriptoriumUrl = `http://localhost:${scriptorium.port}`;
  process.env.ZEUS_SCRIPTORIUM_URL = scriptoriumUrl;
  process.env.ZEUS_ARG_ROOM = room;

  const player = await createPlayerServer({
    port: playerPort,
    host: 'localhost',
    sessionId: options.sessionId ?? 'default',
    room,
    discoveryExclusive: false,
    discoveryTimeoutMs: options.discoveryTimeoutMs ?? 2000
  });

  return {
    scriptorium,
    player,
    scriptoriumUrl,
    room,
    async close() {
      await player.close();
      await scriptorium.close();
      delete process.env.ZEUS_SCRIPTORIUM_URL;
      delete process.env.ZEUS_ARG_ROOM;
    }
  };
}

/** @deprecated alias — suite recortada al rol dj */
export const startPlayerRoomStack = startPlayerDjStack;
