/**
 * Build the browser viewer-config injected into the shell.
 */

import { resolveRoomClientConfig } from '@zeus/room-client-browser';

/**
 * @param {object} [opts]
 * @param {string} [opts.sessionId]
 * @param {string} [opts.room] explicit room override (`?room=`) — always wins
 * @param {string} [opts.fallbackRoom] view-level default applied only when neither
 *   `?room=` nor ZEUS_SCRIPTORIUM_ROOM pins one. Mirrors how the demos resolve
 *   their room, so a view that follows a demo (e.g. gamemap → PUBLIC_ROOM) lands
 *   wherever the demo plays unless env/?room= override.
 * @returns {{ scriptoriumUrl: string, room: string, sessionId: string, token: string }}
 */
export function resolveViewerConfig(opts = {}) {
  const config = resolveRoomClientConfig(opts);
  // Precedence: ?room= → ZEUS_SCRIPTORIUM_ROOM → view fallback → room-client default
  if (opts.room) {
    config.room = opts.room;
  } else if (process.env.ZEUS_SCRIPTORIUM_ROOM) {
    config.room = process.env.ZEUS_SCRIPTORIUM_ROOM;
  } else if (opts.fallbackRoom) {
    config.room = opts.fallbackRoom;
  }
  return config;
}
