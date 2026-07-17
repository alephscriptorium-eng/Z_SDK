/**
 * AsyncAPI 3.x in-memory build from the protocol contract.
 * Source of truth: EVENT_KINDS + envelope shape + roles.
 */

import { stringify as yamlStringify } from 'yaml';
import { PROTOCOL_VERSION, EVENT_KINDS, EVENTS } from '../src/contract.mjs';
import { ROLES } from '../src/roles.mjs';
import { GATES, SNAPSHOT_BUDGET_BYTES } from '../src/gates.mjs';

const ENVELOPE_PROPS = {
  v: { type: 'integer', const: PROTOCOL_VERSION },
  game: { type: 'string', minLength: 1, description: 'Game id supplied by the consumer package' },
  from: { type: 'string' },
  ts: { type: 'integer', description: 'Unix epoch milliseconds' }
};

const EVENT_META = {
  [EVENTS.INTENT]: {
    direction: 'inbound',
    summary: 'Actor requests a domain mutation; authority validates role + shape then reduces',
    payload: {
      type: 'object',
      required: ['v', 'game', 'actorId', 'intent', 'ts'],
      properties: {
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
      },
      additionalProperties: true
    }
  },
  [EVENTS.STATE]: {
    direction: 'outbound',
    summary: 'Authoritative compact snapshot (budget-checked)',
    payload: {
      type: 'object',
      required: ['v', 'game', 'ts'],
      properties: {
        ...ENVELOPE_PROPS,
        kind: { type: 'string', const: 'state' },
        tick: { type: 'integer' },
        reason: { type: 'string', enum: ['change', 'heartbeat'] }
      },
      additionalProperties: true
    }
  },
  [EVENTS.TRACK]: {
    direction: 'outbound',
    summary: 'Navigation cue for real browsers (no domain mutation)',
    payload: {
      type: 'object',
      required: ['v', 'game', 'actorId', 'ts'],
      properties: {
        ...ENVELOPE_PROPS,
        kind: { type: 'string', const: 'track' },
        actorId: { type: 'string' },
        ref: { type: 'object' },
        hint: { type: 'string' }
      },
      additionalProperties: true
    }
  },
  [EVENTS.LEDGER]: {
    direction: 'outbound',
    summary: 'Append-only crystallization / evidence entry',
    payload: {
      type: 'object',
      required: ['v', 'game', 'seq', 'ts', 'kind'],
      properties: {
        ...ENVELOPE_PROPS,
        kind: { type: 'string', const: 'ledger' },
        seq: { type: 'integer' },
        entryKind: { type: 'string', description: 'Ledger entry discriminant (game-specific)' },
        actorId: { type: 'string' },
        detail: { type: 'object' }
      },
      additionalProperties: true
    }
  }
};

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
