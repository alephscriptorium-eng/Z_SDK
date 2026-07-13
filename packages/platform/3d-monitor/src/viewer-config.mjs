/**
 * Build the browser viewer-config injected into the shell.
 */

import { resolveRoomClientConfig } from '@zeus/room-client-browser';

/**
 * @param {object} [opts]
 * @param {string} [opts.sessionId]
 * @param {string} [opts.room] explicit room override (`?room=`) — always wins
 * @param {string} [opts.fallbackRoom] view-level default applied only when the
 *   environment does not pin ZEUS_SCRIPTORIUM_ROOM. Mirrors how the demos
 *   resolve their room (env override || demo default), so a view that follows
 *   a demo (e.g. gamemap → PUBLIC_ROOM) lands wherever the demo plays.
 * @returns {{ scriptoriumUrl: string, room: string, sessionId: string, token: string }}
 */
export function resolveViewerConfig(opts = {}) {
  const config = resolveRoomClientConfig(opts);
  if (opts.room) {
    config.room = opts.room;
  } else if (opts.fallbackRoom && !process.env.ZEUS_SCRIPTORIUM_ROOM) {
    config.room = opts.fallbackRoom;
  }
  return config;
}
