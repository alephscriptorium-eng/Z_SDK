/**
 * @zeus/operator-bridge tests — state/ledger → bot-hub mapping contract.
 * Pure, no Angular/three/network. Executable spec of the bridge.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createOperatorBridge,
  projectOperatorSlice,
  makeOperatorIntent,
  CHANNELS,
  TYPES,
  HUB,
  WIRE,
  SCENE_IDS,
} from '../src/index.mjs';

test('onState announces each actor exactly once (idempotent)', () => {
  const b = createOperatorBridge();
  const state = {
    ts: 5,
    actors: {
      uno: { zone: 'terraza' },
      dos: { zone: 'rio' },
    },
  };
  const first = b.onState(state);
  assert.equal(first.length, 2);
  assert.deepEqual(first.map((m) => m.fromBot).sort(), ['dos', 'uno']);
  assert.ok(first.every((m) => m.channel === CHANNELS.SYS));
  assert.ok(first.every((m) => m.toBot === HUB && m.type === TYPES.BOT_TO_CENTER));
  assert.deepEqual(b.onState(state), []);
});

test('onLedger inspect → game message with target', () => {
  const b = createOperatorBridge();
  const [m] = b.onLedger({
    kind: 'inspect',
    actorId: 'op-1',
    ts: 9,
    detail: { targetId: 'nodo-a', label: 'look' },
  });
  assert.equal(m.channel, CHANNELS.GAME);
  assert.equal(m.fromBot, 'op-1');
  assert.match(m.content, /inspect nodo-a \(look\)/);
  assert.equal(m.timestamp, 9);
});

test('onLedger unknown kind still surfaces', () => {
  const b = createOperatorBridge();
  const [m] = b.onLedger({ kind: 'custom-fact', actorId: 'x', detail: { n: 1 } });
  assert.equal(m.channel, CHANNELS.GAME);
  assert.match(m.content, /custom-fact/);
});

test('onLedger without kind produces nothing', () => {
  const b = createOperatorBridge();
  assert.deepEqual(b.onLedger({ actorId: 'x' }), []);
});

test('projectOperatorSlice derives HUD fields from state', () => {
  const slice = projectOperatorSlice({
    sceneId: 'delta-v0',
    gamemapId: 'gm',
    ts: 1,
    actors: { a: { zone: 'mar' } },
    lines: { L1: {} },
    objetivo: { labeled: [0, 10], excavated: [0, 2] },
  });
  assert.equal(slice.sceneId, 'delta-v0');
  assert.equal(slice.actorCount, 1);
  assert.equal(slice.actors.a.zone, 'mar');
  assert.ok(slice.lines.L1);
  assert.equal(slice.barrioCount, 0);
  assert.equal(SCENE_IDS.operator, 'operator');
});

test('projectOperatorSlice tallies barrios by estado', () => {
  const slice = projectOperatorSlice({
    sceneId: 'ciudad-v0',
    barrios: {
      plaza: { id: 'plaza', estado: 'vivo' },
      zigurat: { id: 'zigurat', estado: 'latente' },
      muerto: { id: 'muerto', estado: 'muerto' },
      roto: { id: 'roto', estado: 'roto' },
    },
  });
  assert.equal(slice.barrioCount, 4);
  assert.deepEqual(slice.barrioByEstado, {
    vivo: 1,
    latente: 1,
    muerto: 1,
    roto: 1,
  });
  assert.equal(slice.barrios.plaza.estado, 'vivo');
});

test('onState projects barrios as hub bots coloured by estado', () => {
  const b = createOperatorBridge();
  const first = b.onState({
    ts: 1,
    sceneId: 'ciudad-v0',
    barrios: {
      'blockly-editor': { id: 'blockly-editor', estado: 'latente' },
      plaza: { id: 'plaza', estado: 'vivo' },
    },
  });
  assert.equal(first.length, 2);
  const byId = Object.fromEntries(first.map((m) => [m.fromBot, m]));
  assert.equal(byId.plaza.channel, CHANNELS.UI);
  assert.match(byId.plaza.content, /plaza · vivo/);
  assert.equal(byId['blockly-editor'].channel, CHANNELS.AGENT);
  assert.match(byId['blockly-editor'].content, /latente/);
  assert.deepEqual(b.onState({
    ts: 2,
    barrios: {
      'blockly-editor': { id: 'blockly-editor', estado: 'latente' },
      plaza: { id: 'plaza', estado: 'vivo' },
    },
  }), []);
  const changed = b.onState({
    ts: 3,
    barrios: {
      'blockly-editor': { id: 'blockly-editor', estado: 'vivo' },
      plaza: { id: 'plaza', estado: 'vivo' },
    },
  });
  assert.equal(changed.length, 1);
  assert.equal(changed[0].fromBot, 'blockly-editor');
  assert.equal(changed[0].channel, CHANNELS.UI);
  assert.match(changed[0].content, /latente→vivo/);
});

test('makeOperatorIntent stamps role=operator and game from caller', () => {
  const intent = makeOperatorIntent('op', 'inspect', { targetId: 'x' }, { game: 'demo' });
  assert.equal(intent.role, 'operator');
  assert.equal(intent.intent, 'inspect');
  assert.equal(intent.game, 'demo');
  assert.equal(intent.actorId, 'op');
  assert.equal(intent.targetId, 'x');
});

test('WIRE lists canonical intent + dual state/ledger', () => {
  assert.deepEqual([...WIRE.STATE], ['state', 'arg:state']);
  assert.deepEqual([...WIRE.INTENT], ['intent']);
  assert.deepEqual([...WIRE.LEDGER], ['ledger', 'arg:ledger']);
});

test('message ids are unique and stable per stream order', () => {
  const b = createOperatorBridge();
  const ids = [
    ...b.onState({ actors: { a: {} } }),
    ...b.onLedger({ kind: 'label', actorId: 'a', detail: { label: 'agora' } }),
    ...b.onLedger({ kind: 'cache', actorId: 'dj', detail: { registroId: 'r1' } }),
  ].map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('end-to-end: state + ledger produce a coherent hub stream', () => {
  const b = createOperatorBridge();
  const stream = [
    ...b.onState({ ts: 0, actors: { uno: { zone: 'terraza' }, dos: {} } }),
    ...b.onLedger({ kind: 'inspect', actorId: 'op', detail: { targetId: 42 }, ts: 10 }),
    ...b.onLedger({ kind: 'label', actorId: 'uno', detail: { label: 'agora' }, ts: 12 }),
  ];
  assert.equal(stream.length, 4);
  assert.equal(stream.filter((m) => m.channel === CHANNELS.SYS).length, 2);
  assert.equal(stream.filter((m) => m.channel === CHANNELS.GAME).length, 2);
  assert.ok(stream.every((m) => m.toBot === HUB && typeof m.id === 'string'));
});
