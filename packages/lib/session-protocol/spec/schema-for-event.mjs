import { z } from 'zod';
import { EVENTS } from '../src/protocol.mjs';
import { INBOUND_SCHEMAS } from '../src/schemas/inbound.mjs';
import { OUTBOUND_SCHEMAS } from '../src/schemas/outbound.mjs';

/**
 * JSON Schema for a session protocol event (from zod).
 * @param {string} event
 */
export function schemaForEvent(event) {
  const meta = EVENTS[event];
  const schema = meta?.direction === 'inbound'
    ? INBOUND_SCHEMAS.get(event)
    : OUTBOUND_SCHEMAS.get(event);
  if (!schema) return { type: 'object' };
  return z.toJSONSchema(schema);
}
