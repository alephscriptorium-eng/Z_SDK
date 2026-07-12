import test from 'node:test';
import assert from 'node:assert/strict';
import {
  reduceDomain,
  reduceSessionInbound,
  applyActorEvents,
  applyDomainOps
} from '../src/reducer.mjs';
import { createSessionDomainState } from '../src/domain-state.mjs';
import { createEmptyMapSlice } from '../src/map-slice.mjs';

test('G-DM.1 reduceDomain sit is deterministic', { timeout: 5000 }, () => {
  const map = createEmptyMapSlice();
  const intent = { actorId: 'a1', intent: 'sit', anchorId: 'ancla-a' };
  const a = reduceDomain(map, intent);
  const b = reduceDomain(map, intent);
  assert.deepEqual(a, b);
  assert.equal(a.actors.a1.zone, 'nodo-a');
  assert.equal(a.actors.a1.pose, 'sit');
  assert.equal(a.anchors['ancla-a'].occupiedBy, 'a1');
});

test('G-DM.2 invalid intent does not mutate map slice', { timeout: 5000 }, () => {
  const map = createEmptyMapSlice();
  map.actors.a1 = {
    id: 'a1',
    zone: 'nodo-b',
    pose: 'sit',
    anchorId: 'ancla-b',
    linkId: null,
    progress: null,
    linkDirection: null,
    position: { x: 24, y: 0, z: 0 }
  };
  map.anchors['ancla-b'].occupiedBy = 'a1';

  const next = reduceDomain(map, {
    actorId: 'a1',
    intent: 'sit',
    anchorId: 'ancla-a'
  });
  assert.deepEqual(next, map);
});

test('reduceDomain walk moves actor onto link', { timeout: 5000 }, () => {
  const map = createEmptyMapSlice();
  reduceDomain(map, { actorId: 'a1', intent: 'sit', anchorId: 'ancla-a' });
  const walking = reduceDomain(map, {
    actorId: 'a1',
    intent: 'walk',
    linkId: 'enlace-ab',
    direction: 'a-to-b'
  });
  assert.equal(walking.actors.a1.pose, 'walk');
  assert.equal(walking.actors.a1.linkId, 'enlace-ab');
});

test('reduceSessionInbound domain:playhead:set schedules actor + resolve', { timeout: 5000 }, () => {
  const r = reduceSessionInbound('domain:playhead:set', { year: 1998 });
  assert.deepEqual(r.actorEvents, [{ type: 'PLAYHEAD_SET', year: 1998 }]);
  assert.deepEqual(r.sideEffects, ['resolveAllDecks']);
  assert.equal(r.broadcast, true);
});

test('reduceSessionInbound game:intent produces domain op', { timeout: 5000 }, () => {
  const payload = { actorId: 'a1', intent: 'sit', anchorId: 'ancla-a' };
  const r = reduceSessionInbound('game:intent', payload);
  assert.deepEqual(r.domainOps, [{ op: 'gameIntent', payload }]);
  assert.equal(r.broadcast, true);
});

test('reduceSessionInbound selection:cast registro triggers registroSelect side effect', { timeout: 5000 }, () => {
  const r = reduceSessionInbound('selection:cast', {
    actorId: 'dj',
    kind: 'registro',
    deckId: 'B',
    targetId: 42
  });
  assert.equal(r.actorEvents[0].type, 'SELECTION_CAST');
  assert.deepEqual(r.sideEffects, ['registroSelect']);
  assert.deepEqual(r.sideEffectPayload, { deckId: 'B', oldid: 42 });
  assert.equal(r.broadcast, false);
});

test('reduceSessionInbound material:pin produces domain op', { timeout: 5000 }, () => {
  const payload = { nodeId: 'nodo-a', slot: 'overlay', serverName: 'linea-espana' };
  const r = reduceSessionInbound('material:pin', payload);
  assert.deepEqual(r.domainOps, [{ op: 'materialPin', payload }]);
  assert.equal(r.broadcast, true);
});

test('applyActorEvents + applyDomainOps mutate master state', { timeout: 5000 }, () => {
  const sent = [];
  const actor = { send: (ev) => sent.push(ev) };
  const domain = createSessionDomainState();

  const r = reduceSessionInbound('caso:set', { casoId: 'test-caso' });
  applyActorEvents(actor, r.actorEvents);
  assert.deepEqual(sent, [{ type: 'CASO_SET', casoId: 'test-caso' }]);

  const pin = reduceSessionInbound('material:pin', {
    nodeId: 'nodo-b',
    slot: 'deck-b',
    serverName: 'srv'
  });
  applyDomainOps(domain, pin.domainOps);
  assert.ok(domain.snapshot().materialPins.has('nodo-b:deck-b'));

  const game = reduceSessionInbound('game:intent', {
    actorId: 'robot-ping',
    intent: 'sit',
    anchorId: 'ancla-a'
  });
  applyDomainOps(domain, game.domainOps);
  assert.equal(domain.getMap().actors['robot-ping'].pose, 'sit');
});

test('domain tick advances walk progress', { timeout: 5000 }, () => {
  const domain = createSessionDomainState();
  domain.applyGameIntent({ actorId: 'a1', intent: 'sit', anchorId: 'ancla-a' });
  domain.applyGameIntent({
    actorId: 'a1',
    intent: 'walk',
    linkId: 'enlace-ab',
    direction: 'a-to-b'
  });
  const before = domain.getMap().actors.a1.progress;
  assert.equal(before, 0);
  domain.tick(2);
  const after = domain.getMap().actors.a1.progress;
  assert.ok(after > before);
});

test('unknown inbound event yields empty reduction', { timeout: 5000 }, () => {
  const r = reduceSessionInbound('totally:unknown', { x: 1 });
  assert.deepEqual(r.actorEvents, []);
  assert.deepEqual(r.domainOps, []);
  assert.deepEqual(r.sideEffects, []);
  assert.equal(r.broadcast, false);
});
