/**
 * Build the browser viewer-config injected into the shell:
 *   { scriptoriumUrl, room, sessionId, token }
 *
 * Copied per-app (player-3d-ui / player-debug-3d-ui) on purpose — no shared lib.
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
