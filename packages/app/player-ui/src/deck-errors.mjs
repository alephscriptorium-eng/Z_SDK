/**
 * Local deck UI errors (replaced session-protocol makeError).
 */

export const ERROR_CODES = Object.freeze({
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  HANDLER_ERROR: 'HANDLER_ERROR',
  UNKNOWN_EVENT: 'UNKNOWN_EVENT',
  DECK_NOT_LOADED: 'DECK_NOT_LOADED',
  SERVER_DISCONNECTED: 'SERVER_DISCONNECTED',
  TOOL_NOT_ALLOWED: 'TOOL_NOT_ALLOWED'
});

/**
 * @param {{ event: string, code: string, message: string, details?: unknown }} params
 */
export function makeError({ event, code, message, details }) {
  const err = { event, code, message };
  if (details !== undefined) err.details = details;
  return err;
}
