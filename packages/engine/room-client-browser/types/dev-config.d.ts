/** Types for `@zeus/room-client-browser/dev-config` (WP-U157). */

export const DEV_ROOM_CLIENT_CONFIG: {
  scriptoriumUrl: string;
  room: string;
  sessionId: string;
  token: string;
  user?: string;
  type?: string;
  features?: string[];
};

export function readInjectedRoomConfig(
  elementId: string
): typeof DEV_ROOM_CLIENT_CONFIG;
