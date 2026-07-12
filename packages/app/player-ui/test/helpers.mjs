/**
 * Integration test stack: scriptorium + player-ui room master.
 * Avoids hang when createPlayerServer runs without a live /runtime backend.
 */

import { createScriptoriumServer } from '@zeus/socket-server';

/**
 * @param {import('../src/server.mjs').createPlayerServer} createPlayerServer
 * @param {object} [options]
 * @param {number} [options.scriptoriumPort]
 * @param {number} [options.playerPort]
 * @param {string} [options.sessionId]
 */
export async function startPlayerRoomStack(createPlayerServer, options = {}) {
  const scriptoriumPort = options.scriptoriumPort ?? 0;
  const playerPort = options.playerPort ?? 0;
  const sessionId = options.sessionId ?? 'default';

  process.env.ZEUS_SESSION_TRANSPORT = 'room';

  const scriptorium = await createScriptoriumServer({
    port: scriptoriumPort,
    host: 'localhost',
    bridge: 'local'
  });

  const scriptoriumUrl = `http://localhost:${scriptorium.port}`;
  process.env.ZEUS_SCRIPTORIUM_URL = scriptoriumUrl;

  const player = await createPlayerServer({
    port: playerPort,
    host: 'localhost',
    sessionId,
    discoveryExclusive: false,
    discoveryTimeoutMs: options.discoveryTimeoutMs ?? 2000
  });

  return {
    scriptorium,
    player,
    scriptoriumUrl,
    room: `scriptorium.${sessionId}`,
    async close() {
      await player.close();
      await scriptorium.close();
      delete process.env.ZEUS_SCRIPTORIUM_URL;
    }
  };
}
