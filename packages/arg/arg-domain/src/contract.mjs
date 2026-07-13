/**
 * CAUDAL — contrato de dominio (v1). Nombres de eventos, constantes de
 * transporte y guards de intents. Ver packages/arg/spec/CONTRATO.md.
 *
 * Browser-safe: sin imports de Node.
 */

export const ARG_PROTOCOL_VERSION = 1;

export const EVENTS = {
  STATE: 'arg:state',
  INTENT: 'arg:intent',
  TRACK: 'arg:track',
  LEDGER: 'arg:ledger'
};

export const DEFAULT_ARG_ROOM = 'ARG_DELTA';
export const AUTHORITY_USER = 'arg-authority';

/** Ritmo de la autoridad (mismo patrón que demo:game). */
export const ARG_TICK_MS = 100;
export const ARG_HEARTBEAT_MS = 1000;

export const INTENTS = [
  'join',
  'move',
  'swim',
  'ride',
  'dismount',
  'tap:set',
  'label:cast',
  'excavate',
  'contact:request',
  'contact:close',
  'cloak:equip',
  'emote'
];

export const POSES = ['idle', 'walk', 'ride', 'swim', 'sit', 'menu'];
export const EMOTES = ['wave', 'nod', 'shake', 'thumbsUp'];
export const ZONES = ['terraza', 'cima', 'rio', 'mar', 'cantera'];

/** Hint de navegador real para arg:track según el tipo de recurso. */
export function trackHintFor(refKind) {
  return refKind === 'micropost' || refKind === 'corpus'
    ? 'firehose-browser'
    : 'cache-browser';
}

/**
 * Construye un arg:intent bien formado (el reducer revalida siempre).
 */
export function makeIntent(actorId, intent, args = {}, from = actorId) {
  return {
    v: ARG_PROTOCOL_VERSION,
    from,
    ts: Date.now(),
    actorId,
    intent,
    ...args
  };
}

/** Forma mínima válida de un arg:intent (transport-level, no de negocio). */
export function isIntentShaped(payload) {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      typeof payload.actorId === 'string' &&
      payload.actorId &&
      INTENTS.includes(payload.intent)
  );
}
