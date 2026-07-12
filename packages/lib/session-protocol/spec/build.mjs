/**
 * In-memory AsyncAPI build for spec sync tests and generate.mjs.
 */

import { stringify as yamlStringify } from 'yaml';
import { EVENTS, SESSION_NAMESPACE, PROTOCOL_VERSION } from '../src/protocol.mjs';
import { schemaForEvent } from './schema-for-event.mjs';

export function buildAsyncApiSpec() {
  const messages = {};
  for (const [event, meta] of Object.entries(EVENTS)) {
    messages[event.replace(/:/g, '_')] = {
      name: event,
      title: event,
      summary: meta.description,
      payload: schemaForEvent(event),
      ...(meta.deprecated ? { deprecated: true } : {})
    };
  }

  const operations = {};
  for (const [event, meta] of Object.entries(EVENTS)) {
    const msgKey = event.replace(/:/g, '_');
    const opId = meta.direction === 'inbound' ? `receive_${msgKey}` : `send_${msgKey}`;
    operations[opId] = {
      action: meta.direction === 'inbound' ? 'receive' : 'send',
      channel: { $ref: '#/channels/session' },
      messages: [{ $ref: `#/channels/session/messages/${msgKey}` }],
      ...(meta.replyEvent
        ? {
            reply: {
              channel: { $ref: '#/channels/session' },
              messages: [{ $ref: `#/channels/session/messages/${meta.replyEvent.replace(/:/g, '_')}` }]
            }
          }
        : {})
    };
  }

  const doc = {
    asyncapi: '3.1.0',
    info: {
      title: 'Zeus Session Protocol',
      version: PROTOCOL_VERSION,
      description: 'Socket.IO /session namespace for @zeus/player-ui collaborative deck sessions.'
    },
    defaultContentType: 'application/json',
    channels: {
      session: {
        address: SESSION_NAMESPACE,
        description: 'Player session namespace — global collaborative deck state',
        messages: Object.fromEntries(
          Object.keys(messages).map((k) => [k, { $ref: `#/components/messages/${k}` }])
        )
      }
    },
    operations,
    components: { messages }
  };

  return yamlStringify(doc, { lineWidth: 0 });
}
