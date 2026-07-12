/**
 * Build the browser viewer-config injected into the shell.
 */

import { resolveRoomClientConfig } from '@zeus/room-client-browser';

/**
 * @param {object} [opts]
 * @param {string} [opts.sessionId]
 * @returns {{ scriptoriumUrl: string, room: string, sessionId: string, token: string }}
 */
export function resolveViewerConfig(opts = {}) {
  return resolveRoomClientConfig(opts);
}
