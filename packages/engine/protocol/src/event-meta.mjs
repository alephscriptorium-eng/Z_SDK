/**
 * Forma AsyncAPI / wire de los 4 kinds — fuente única (WP-U98).
 * `build.mjs` genera el YAML; `isShaped` valida en runtime desde aquí.
 * Browser-safe. Sin nombres de juego.
 */

import { PROTOCOL_VERSION, EVENTS } from './kinds.mjs';
import { ROLES } from './roles.mjs';

const ENVELOPE_PROPS = {
  v: { type: 'integer', const: PROTOCOL_VERSION },
  game: { type: 'string', minLength: 1, description: 'Game id supplied by the consumer package' },
  from: { type: 'string' },
  ts: { type: 'integer', description: 'Unix epoch milliseconds' }
};

/**
 * Metadatos por kind: dirección, summary y payload JSON-Schema-like.
 * Misma tabla que consume AsyncAPI (`spec/build.mjs`).
 */
export const EVENT_META = Object.freeze({
  [EVENTS.INTENT]: Object.freeze({
    direction: 'inbound',
    summary: 'Actor requests a domain mutation; authority validates role + shape then reduces',
    payload: Object.freeze({
      type: 'object',
      required: Object.freeze(['v', 'game', 'actorId', 'intent', 'ts']),
      properties: Object.freeze({
        ...ENVELOPE_PROPS,
        kind: { type: 'string', const: 'intent' },
        actorId: { type: 'string', minLength: 1 },
        intent: { type: 'string', minLength: 1 },
        role: { type: 'string', enum: [...ROLES], default: 'player' },
        peerCard: {
          type: 'object',
          description: 'Optional Peer Card credential (roomId/endpoint/token/scopes/expiresAt)',
          properties: {
            roomId: { type: 'string' },
            endpoint: { type: 'string' },
            token: { type: 'string' },
            scopes: { type: 'array', items: { type: 'string' } },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        }
      }),
      additionalProperties: true
    })
  }),
  [EVENTS.STATE]: Object.freeze({
    direction: 'outbound',
    summary: 'Authoritative compact snapshot (budget-checked)',
    payload: Object.freeze({
      type: 'object',
      required: Object.freeze(['v', 'game', 'ts']),
      properties: Object.freeze({
        ...ENVELOPE_PROPS,
        kind: { type: 'string', const: 'state' },
        tick: { type: 'integer' },
        reason: { type: 'string', enum: ['change', 'heartbeat'] }
      }),
      additionalProperties: true
    })
  }),
  [EVENTS.TRACK]: Object.freeze({
    direction: 'outbound',
    summary: 'Navigation cue for real browsers (no domain mutation)',
    payload: Object.freeze({
      type: 'object',
      required: Object.freeze(['v', 'game', 'actorId', 'ts']),
      properties: Object.freeze({
        ...ENVELOPE_PROPS,
        kind: { type: 'string', const: 'track' },
        actorId: { type: 'string' },
        ref: { type: 'object' },
        hint: { type: 'string' }
      }),
      additionalProperties: true
    })
  }),
  [EVENTS.LEDGER]: Object.freeze({
    direction: 'outbound',
    summary: 'Append-only crystallization / evidence entry',
    payload: Object.freeze({
      type: 'object',
      required: Object.freeze(['v', 'game', 'seq', 'ts', 'kind']),
      properties: Object.freeze({
        ...ENVELOPE_PROPS,
        kind: { type: 'string', const: 'ledger' },
        seq: { type: 'integer' },
        entryKind: { type: 'string', description: 'Ledger entry discriminant (game-specific)' },
        actorId: { type: 'string' },
        detail: { type: 'object' }
      }),
      additionalProperties: true
    })
  })
});

/**
 * Comprueba un valor contra un fragmento de schema JSON-like de EVENT_META.
 * @param {unknown} value
 * @param {object} schema
 * @returns {boolean}
 */
function matchesSchema(value, schema) {
  if (!schema || typeof schema !== 'object') return true;

  if (schema.type === 'string') {
    if (typeof value !== 'string') return false;
    if (schema.minLength != null && value.length < schema.minLength) return false;
    if (schema.const != null && value !== schema.const) return false;
    if (schema.enum != null && !schema.enum.includes(value)) return false;
    return true;
  }

  if (schema.type === 'integer') {
    if (!Number.isInteger(value)) return false;
    if (schema.const != null && value !== schema.const) return false;
    return true;
  }

  if (schema.type === 'object') {
    return value != null && typeof value === 'object' && !Array.isArray(value);
  }

  if (schema.type === 'array') {
    return Array.isArray(value);
  }

  return true;
}

/**
 * Valida la forma wire de un evento según EVENT_META (campos required + tipos).
 * Distinto de `isIntentShaped`: aquel es mínimo de transporte + catálogo;
 * este es el envelope AsyncAPI completo por kind.
 *
 * @param {string} kind — uno de EVENT_KINDS
 * @param {unknown} data — payload / envelope
 * @returns {boolean}
 */
export function isShaped(kind, data) {
  const meta = EVENT_META[kind];
  if (!meta) return false;
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return false;

  const { required = [], properties = {} } = meta.payload;
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) return false;
    const fieldSchema = properties[key];
    if (fieldSchema && !matchesSchema(data[key], fieldSchema)) return false;
  }
  return true;
}
