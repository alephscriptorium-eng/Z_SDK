/**
 * Zone subscription — pure filter + 2nd-client interest (gamechannel).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createMapEngine,
  vaivenDosNodos,
  normalizeZoneInterest,
  interestCoversAll,
  buildZoneIndexFromCatalog,
  filterSnapshotByZones,
  createZoneStateHandler,
  ZONE_INTEREST_ALL,
} from '../src/index.mjs';

test('normalizeZoneInterest: empty / * means all', () => {
  assert.equal(normalizeZoneInterest(null), null);
  assert.equal(normalizeZoneInterest(ZONE_INTEREST_ALL), null);
  assert.equal(normalizeZoneInterest([]), null);
  assert.equal(normalizeZoneInterest(['*']), null);
  assert.ok(interestCoversAll(normalizeZoneInterest('editores')) === false);
  assert.deepEqual([...normalizeZoneInterest(['a', 'b'])].sort(), ['a', 'b']);
});

test('filterSnapshotByZones keeps only actors in interest zones', () => {
  const engine = createMapEngine(structuredClone(vaivenDosNodos));
  engine.registerActor('r1', {
    zone: 'nodo-a',
    pose: 'idle',
    position: { x: 0, y: 0, z: 0 },
  });
  engine.registerActor('r2', {
    zone: 'nodo-b',
    pose: 'idle',
    position: { x: 1, y: 0, z: 0 },
  });
  const snap = engine.getSnapshot();
  const filtered = filterSnapshotByZones(snap, ['nodo-a']);
  assert.equal(filtered.zoneFilter.mode, 'include');
  assert.ok(filtered.actors.r1);
  assert.equal(filtered.actors.r2, undefined);
  assert.equal(Object.keys(filtered.actors).length, 1);
});

test('unfiltered interest preserves full snapshot mode=all', () => {
  const snap = {
    tick: 1,
    actors: { a: { zone: 'z1' }, b: { zone: 'z2' } },
  };
  const out = filterSnapshotByZones(snap, '*');
  assert.equal(out.zoneFilter.mode, 'all');
  assert.equal(Object.keys(out.actors).length, 2);
});

test('buildZoneIndexFromCatalog maps barrios → zone + node', () => {
  const { zoneByBarrio, zoneByNode } = buildZoneIndexFromCatalog([
    { id: 'editores', nodeId: 'editores', barrios: ['b1', 'b2'] },
    { id: 'zigurat', nodeId: 'zigurat', barrios: ['b3'] },
  ]);
  assert.equal(zoneByBarrio.b1, 'editores');
  assert.equal(zoneByBarrio.b3, 'zigurat');
  assert.equal(zoneByNode.editores, 'editores');
});

test('createZoneStateHandler: 2nd client interest excludes foreign zones', () => {
  const catalog = buildZoneIndexFromCatalog([
    { id: 'editores', nodeId: 'editores', barrios: ['barrio-e'] },
    { id: 'zigurat', nodeId: 'zigurat', barrios: ['barrio-z'] },
  ]);
  const raw = {
    reason: 'change',
    actors: {
      peerA: { nodeId: 'editores', barrioId: 'barrio-e' },
      peerB: { nodeId: 'zigurat', barrioId: 'barrio-z' },
    },
    barrios: {
      'barrio-e': { id: 'barrio-e', parent: 'editores', estado: 'latente' },
      'barrio-z': { id: 'barrio-z', parent: 'zigurat', estado: 'latente' },
    },
  };

  /** Client 1 — firehose */
  const seenAll = [];
  const hAll = createZoneStateHandler('*', (f) => seenAll.push(f));
  hAll(raw);

  /** Client 2 — zone interest only */
  const seenZone = [];
  const hZone = createZoneStateHandler(
    ['editores'],
    (f) => seenZone.push(f),
    catalog
  );
  hZone(raw);

  assert.equal(Object.keys(seenAll[0].actors).length, 2);
  assert.equal(Object.keys(seenZone[0].actors).length, 1);
  assert.ok(seenZone[0].actors.peerA);
  assert.equal(seenZone[0].actors.peerB, undefined);
  assert.ok(seenZone[0].barrios['barrio-e']);
  assert.equal(seenZone[0].barrios['barrio-z'], undefined);
});
