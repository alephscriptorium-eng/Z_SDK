/**
 * Constantes de kind / versión del contrato (browser-safe).
 * Separadas para que EVENT_META e isShaped no ciclen con contract.mjs.
 */

export const PROTOCOL_VERSION = 1;

/** Kinds canónicos del contrato (campo `event` / channel message). */
export const EVENT_KINDS = Object.freeze(['state', 'intent', 'track', 'ledger']);

export const EVENTS = Object.freeze({
  STATE: 'state',
  INTENT: 'intent',
  TRACK: 'track',
  LEDGER: 'ledger'
});
