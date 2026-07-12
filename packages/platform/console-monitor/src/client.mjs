/**
 * Session client for @zeus/console-monitor — scriptorium room transport.
 */

import { createRoomSessionClient } from '@zeus/rooms';

export const PACKAGE_NAME = '@zeus/console-monitor';

/**
 * @param {Parameters<typeof createRoomSessionClient>[0]} [options]
 */
export function createSessionClient(options = {}) {
  return createRoomSessionClient({
    ...options,
    user: options.user ?? PACKAGE_NAME,
    type: options.type ?? PACKAGE_NAME
  });
}
