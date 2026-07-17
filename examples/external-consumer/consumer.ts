/**
 * Typed Bun/TS consumer — same smoke as consumer.mjs using @zeus/protocol .d.ts.
 */

import {
  makeIntent,
  createIntentCatalog,
  validateIntent,
  EVENTS,
  type IntentPayload
} from '@zeus/protocol';
import { createClient, connectAndJoin, emitRoomEvent } from '@zeus/rooms';

const GAME = process.env.ZEUS_SMOKE_GAME || 'smoke-game';
const USER = process.env.ZEUS_SCRIPTORIUM_USER || 'external-anon';
const ROOM = process.env.ZEUS_SCRIPTORIUM_ROOM || 'EXTERNAL_SMOKE';

const catalog = createIntentCatalog({
  ping: { roles: ['player'] }
});

const intent: IntentPayload = makeIntent(
  USER,
  'ping',
  { note: 'external-consumer-smoke-ts' },
  { game: GAME, role: 'player' }
);

const validated = validateIntent(intent, catalog);
if (!validated.ok) {
  console.error('INTENT_INVALID', validated.error);
  process.exit(1);
}

const client = createClient(USER, { room: ROOM });
const joined = await connectAndJoin(client, USER, {
  room: ROOM,
  type: 'ExternalAnon',
  features: ['zeus-external-smoke'],
  connectTimeoutMs: 15_000
});

emitRoomEvent(client, EVENTS.INTENT, intent, ROOM);

console.log(
  JSON.stringify({
    ok: true,
    runtime: 'bun',
    room: joined.room,
    socketId: joined.socketId,
    intent: intent.intent,
    game: intent.game,
    event: EVENTS.INTENT,
    typed: true
  })
);

client.io.disconnect();
process.exit(0);
