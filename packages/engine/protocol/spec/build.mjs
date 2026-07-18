/**
 * AsyncAPI 3.x in-memory build from the protocol contract.
 * Source of truth: EVENT_META (src/event-meta.mjs) + envelope shape + roles.
 */

import { stringify as yamlStringify } from 'yaml';
import { PROTOCOL_VERSION, EVENT_KINDS, EVENT_META } from '../src/contract.mjs';
import { ROLES } from '../src/roles.mjs';
import { GATES, SNAPSHOT_BUDGET_BYTES } from '../src/gates.mjs';

export function buildAsyncApiSpec() {
  const messages = {};
  const operations = {};

  for (const kind of EVENT_KINDS) {
    const meta = EVENT_META[kind];
    const msgKey = kind;
    messages[msgKey] = {
      name: kind,
      title: kind,
      summary: meta.summary,
      payload: meta.payload
    };
    const opId = meta.direction === 'inbound' ? `receive_${msgKey}` : `send_${msgKey}`;
    operations[opId] = {
      action: meta.direction === 'inbound' ? 'receive' : 'send',
      channel: { $ref: '#/channels/room' },
      messages: [{ $ref: `#/channels/room/messages/${msgKey}` }]
    };
  }

  const doc = {
    asyncapi: '3.1.0',
    info: {
      title: 'Zeus Protocol',
      version: String(PROTOCOL_VERSION),
      description: [
        'Contrato único Zeus: state | intent | track | ledger.',
        'El campo `game` en el envelope discrimina el juego; el engine no nombra juegos.',
        `Roles de intent: ${ROLES.join(', ')}. Credencial de rol: Peer Card (scopes role:*).`,
        `Gates: ${Object.values(GATES).join(', ')}. Snapshot budget default: ${SNAPSHOT_BUDGET_BYTES} bytes.`
      ].join(' ')
    },
    defaultContentType: 'application/json',
    channels: {
      room: {
        address: 'room/{roomId}',
        description:
          'Socket.IO room channel (ROOM_MESSAGE). Wire event name = kind (state|intent|track|ledger).',
        parameters: {
          roomId: {
            description: 'Room id resolved via @zeus/rooms / ZEUS_SCRIPTORIUM_URL'
          }
        },
        messages: Object.fromEntries(
          EVENT_KINDS.map((k) => [k, { $ref: `#/components/messages/${k}` }])
        )
      }
    },
    operations,
    components: { messages }
  };

  return yamlStringify(doc, { lineWidth: 0 });
}
