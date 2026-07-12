import { LINEA_PAYLOADS } from './linea.mjs';
import { FIREHOSE_PAYLOADS } from './firehose.mjs';
import { SOLAR_PAYLOADS } from './solar.mjs';
import { SERVER_CARD_PAYLOADS } from './server-card.mjs';

/** @type {Map<string, import('zod').ZodTypeAny>} */
export const RESOURCE_PAYLOADS = new Map([
  ...LINEA_PAYLOADS,
  ...FIREHOSE_PAYLOADS,
  ...SOLAR_PAYLOADS,
  ...SERVER_CARD_PAYLOADS
]);

export { LINEA_PAYLOADS, FIREHOSE_PAYLOADS, SOLAR_PAYLOADS, SERVER_CARD_PAYLOADS };
export { ResourceDescriptor, McpResourceError, LoosePayload } from './descriptor.mjs';
export * from './linea.mjs';
export * from './firehose.mjs';
export * from './solar.mjs';
export * from './server-card.mjs';

/**
 * Validate a resource payload against its registered schema.
 * @param {string} uriOrTemplate
 * @param {unknown} payload
 */
export function validateResourcePayload(uriOrTemplate, payload) {
  const schema = RESOURCE_PAYLOADS.get(uriOrTemplate);
  if (!schema) return { ok: true, skipped: true };
  return schema.safeParse(payload);
}
