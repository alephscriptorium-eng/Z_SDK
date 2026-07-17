/**
 * Minimal anonymous consumer — join room + emit typed intent (WP-U54).
 * Copied into a clean temp dir and run with Node / Bun against live scriptorium.
 */

import {
  makeIntent,
  createIntentCatalog,
  validateIntent,
  EVENTS
} from '@zeus/protocol';
import { createClient, connectAndJoin, emitRoomEvent } from '@zeus/rooms';

const GAME = process.env.ZEUS_SMOKE_GAME || 'smoke-game';
const USER = process.env.ZEUS_SCRIPTORIUM_USER || 'external-anon';
const ROOM = process.env.ZEUS_SCRIPTORIUM_ROOM || 'EXTERNAL_SMOKE';

const catalog = createIntentCatalog({
  ping: { roles: ['player'] }
});

const intent = makeIntent(
  USER,
  'ping',
  { note: 'external-consumer-smoke' },
  { game: GAME, role: 'player' }
);

const validated = validateIntent(intent, catalog);
if (!validated.ok) {
  console.error('INTENT_INVALID', validated.error);
  process.exit(1);
}

if (typeof intent.actorId !== 'string' || intent.intent !== 'ping') {
  console.error('INTENT_SHAPE_FAIL');
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
    runtime: typeof Bun !== 'undefined' ? 'bun' : 'node',
    room: joined.room,
    socketId: joined.socketId,
    intent: intent.intent,
    game: intent.game,
    event: EVENTS.INTENT
  })
);

client.io.disconnect();
process.exit(0);
