import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deckLoadSchema,
  playheadSetSchema,
  registroSelectSchema,
  wikitextCacheSchema,
  casoSetSchema,
  selectionCastSchema,
  gameIntentSchema,
  materialPinSchema,
  materialUnpinSchema,
  nodeOntologySetSchema
} from '../src/schemas/inbound.mjs';
import { sessionErrorSchema } from '../src/schemas/outbound.mjs';

test('inbound schemas accept representative payloads', () => {
  assert.equal(deckLoadSchema.safeParse({
    deckId: 'A',
    serverName: 'linea-espana',
    presetId: 'p1'
  }).success, true);

  assert.equal(playheadSetSchema.safeParse({ year: '2010' }).success, true);
  assert.deepEqual(playheadSetSchema.parse({ year: '2010' }), { year: 2010 });

  assert.equal(registroSelectSchema.safeParse({
    deckId: 'B',
    oldid: '12345',
    registro_id: 'extra'
  }).success, true);

  assert.equal(wikitextCacheSchema.safeParse({ oldid: 99 }).success, true);
  assert.equal(casoSetSchema.safeParse({ casoId: 'aeo-p24-linea' }).success, true);
});

test('inbound schemas reject invalid payloads', () => {
  assert.equal(deckLoadSchema.safeParse({ deckId: 'X', serverName: 'x' }).success, false);
  assert.equal(playheadSetSchema.safeParse({}).success, false);
  assert.equal(casoSetSchema.safeParse({ casoId: '' }).success, false);
});

test('selectionCastSchema accepts a valid registro cast and applies defaults', () => {
  const parsed = selectionCastSchema.parse({ actorId: 'dj-1', targetId: 12345 });
  assert.equal(parsed.actorId, 'dj-1');
  assert.equal(parsed.kind, 'registro');
  assert.equal(parsed.deckId, 'B');
  assert.equal(parsed.targetId, 12345);

  // Optional label + passthrough meta are preserved.
  const full = selectionCastSchema.parse({
    actorId: 'dj-2',
    kind: 'registro',
    deckId: 'B',
    targetId: '67890',
    label: 'Registro X',
    meta: { source: 'ui', extra: 1 }
  });
  assert.equal(full.label, 'Registro X');
  assert.deepEqual(full.meta, { source: 'ui', extra: 1 });
});

test('selectionCastSchema requires actorId', () => {
  assert.equal(selectionCastSchema.safeParse({ targetId: 1 }).success, false);
  assert.equal(selectionCastSchema.safeParse({ actorId: '', targetId: 1 }).success, false);
});

test('selectionCastSchema accepts targetId as number or numeric string', () => {
  assert.equal(selectionCastSchema.safeParse({ actorId: 'a', targetId: 42 }).success, true);
  assert.equal(selectionCastSchema.safeParse({ actorId: 'a', targetId: '42' }).success, true);
  // registro kind without a targetId is rejected.
  assert.equal(selectionCastSchema.safeParse({ actorId: 'a', kind: 'registro' }).success, false);
  // non-registro kinds do not require a targetId.
  assert.equal(selectionCastSchema.safeParse({ actorId: 'a', kind: 'note' }).success, true);
});

test('session:error outbound schema', () => {
  assert.equal(sessionErrorSchema.safeParse({
    event: 'domain:deck:load',
    code: 'INVALID_PAYLOAD',
    message: 'bad'
  }).success, true);
});

test('domain event schemas (L-session M0)', () => {
  assert.equal(gameIntentSchema.safeParse({
    actorId: 'a1',
    intent: 'sit',
    anchorId: 'ancla-a'
  }).success, true);

  assert.equal(materialPinSchema.safeParse({
    nodeId: 'nodo-a',
    slot: 'deck-a',
    serverName: 'linea-espana'
  }).success, true);

  assert.equal(materialUnpinSchema.safeParse({
    nodeId: 'nodo-a',
    slot: 'deck-a'
  }).success, true);

  assert.equal(nodeOntologySetSchema.safeParse({
    nodeId: 'nodo-b',
    patch: { registro: { oldid: 42, label: 'X' } }
  }).success, true);

  const withNode = selectionCastSchema.parse({
    actorId: 'dj',
    targetId: 1,
    nodeId: 'nodo-b'
  });
  assert.equal(withNode.nodeId, 'nodo-b');
});
