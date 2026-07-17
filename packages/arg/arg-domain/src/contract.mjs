/**
 * delta — capa de juego sobre @zeus/protocol.
 * Eventos wire `arg:*` (compat), catálogo de intents con roles, constantes
 * de room/tick. Lo genérico vive en @zeus/protocol (no duplicar).
 *
 * Browser-safe: sin imports de Node.
 */

import {
  PROTOCOL_VERSION,
  makeIntent as protocolMakeIntent,
  isIntentShaped as protocolIsIntentShaped,
  validateIntent as protocolValidateIntent,
  createIntentCatalog,
  assertIntentRole,
  ROLES,
  GATES,
  SNAPSHOT_BUDGET_BYTES
} from '@zeus/protocol';

export const ARG_PROTOCOL_VERSION = PROTOCOL_VERSION;

/** Id de juego en el envelope (campo `game`). */
export const GAME_ID = 'delta';

/**
 * Nombres wire históricos de delta (`arg:*`).
 * El contrato canónico usa `state|intent|track|ledger` + `game` en envelope.
 * La autoridad (U11) publica dual canónico + `arg:*`; las vistas siguen en
 * `arg:*` hasta su migración.
 */
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

/**
 * Catálogo delta: intents de jugador + manipulador de líneas (rol `dj`).
 * Operator llega en olas posteriores; el gate de rol ya está en @zeus/protocol.
 */
export const INTENT_DEFS = {
  join: { roles: ['player'] },
  move: { roles: ['player'] },
  swim: { roles: ['player'] },
  ride: { roles: ['player'] },
  dismount: { roles: ['player'] },
  'tap:set': { roles: ['player'] },
  'label:cast': { roles: ['player'] },
  excavate: { roles: ['player'] },
  'contact:request': { roles: ['player'] },
  'contact:close': { roles: ['player'] },
  'cloak:equip': { roles: ['player'] },
  emote: { roles: ['player'] },
  salvage: { roles: ['player'] },
  'track:cast': { roles: ['player'] },
  /** Manipulador de líneas (WP-U30): crecer el volumen desde el tablero DJ. */
  cache: { roles: ['dj'] },
  curate: { roles: ['dj'] },
  milestone: { roles: ['dj'] }
};

export const INTENT_CATALOG = createIntentCatalog(INTENT_DEFS);
export const INTENTS = Object.freeze([...INTENT_CATALOG.keys()]);

export const POSES = ['idle', 'walk', 'ride', 'swim', 'sit', 'menu'];
export const EMOTES = ['wave', 'nod', 'shake', 'thumbsUp'];
export const ZONES = ['terraza', 'cima', 'rio', 'mar', 'cantera'];

export { ROLES, GATES, SNAPSHOT_BUDGET_BYTES, assertIntentRole };

/** Hint de navegador real para arg:track según el tipo de recurso. */
export function trackHintFor(refKind) {
  return refKind === 'micropost' || refKind === 'corpus'
    ? 'firehose-browser'
    : 'cache-browser';
}

/**
 * Construye un arg:intent bien formado (misma firma pública que antes).
 * Añade `game: 'delta'` en el envelope sin romper callers existentes.
 */
export function makeIntent(actorId, intent, args = {}, from = actorId) {
  return protocolMakeIntent(actorId, intent, args, {
    from,
    game: GAME_ID
  });
}

/** Forma mínima válida de un arg:intent (transport-level, no de negocio). */
export function isIntentShaped(payload) {
  return protocolIsIntentShaped(payload, INTENT_CATALOG);
}

/** Forma + rol (default player). */
export function validateIntent(payload) {
  return protocolValidateIntent(payload, INTENT_CATALOG);
}
