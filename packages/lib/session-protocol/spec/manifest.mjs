import { stringify as yamlStringify } from 'yaml';
import { EVENTS, SESSION_NAMESPACE, PROTOCOL_VERSION } from '../src/protocol.mjs';
import { schemaForEvent } from './schema-for-event.mjs';

/**
 * Runtime session manifest — inbound/outbound events with JSON schemas.
 */
export function buildSessionManifest() {
  const inbound = [];
  const outbound = [];

  for (const [name, meta] of Object.entries(EVENTS)) {
    const entry = {
      name,
      direction: meta.direction,
      delivery: meta.delivery,
      description: meta.description,
      schema: schemaForEvent(name),
      ...(meta.replyEvent ? { replyEvent: meta.replyEvent } : {}),
      ...(meta.ack ? { ack: true } : {}),
      ...(meta.deprecated ? { deprecated: true } : {}),
      ...(meta.debugOnly ? { debugOnly: true } : {})
    };
    if (meta.direction === 'inbound') inbound.push(entry);
    else outbound.push(entry);
  }

  return yamlStringify({
    version: PROTOCOL_VERSION,
    namespace: SESSION_NAMESPACE,
    inbound,
    outbound
  }, { lineWidth: 0 });
}
