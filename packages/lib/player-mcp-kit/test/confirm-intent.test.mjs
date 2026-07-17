/**
 * confirmIntent: evidencia / dry-run / timeout (sin red real).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmIntent } from '../src/confirm-intent.mjs';

function makeBridge({ connected = true, states = [] } = {}) {
  let i = 0;
  const emitted = [];
  return {
    connected,
    emitted,
    emitIntent(intent, args) {
      emitted.push({ intent, args });
      return true;
    },
    lastState() {
      if (i < states.length) return states[i++];
      return states[states.length - 1] ?? null;
    }
  };
}

test('room desconectada ⇒ room_desconectada sin emitir', async () => {
  const bridge = makeBridge({ connected: false });
  const result = await confirmIntent(
    bridge,
    { confirmTimeoutMs: 500, noopMs: 50 },
    { intent: 'join', done: () => null }
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'room_desconectada');
  assert.equal(bridge.emitted.length, 0);
});

test('done truthy ⇒ ok con evidencia', async () => {
  const bridge = makeBridge({
    states: [{ ts: 1, actors: { uno: { nodeId: 'plaza' } } }]
  });
  const result = await confirmIntent(
    bridge,
    { confirmTimeoutMs: 2000, noopMs: 500, pollMs: 10 },
    {
      intent: 'join',
      args: { kind: 'player' },
      done: (state) => state.actors?.uno ?? null,
      evidence: (state, value) => ({ actor: value, ts: state.ts })
    }
  );
  assert.equal(result.ok, true);
  assert.equal(result.evidencia.actor.nodeId, 'plaza');
  assert.deepEqual(bridge.emitted, [{ intent: 'join', args: { kind: 'player' } }]);
});

test('noop + explain rechazo ⇒ reglaProbable', async () => {
  const state = { ts: 1, actors: { uno: { nodeId: 'plaza' } } };
  const bridge = makeBridge({ states: [state, state, state, state] });
  const result = await confirmIntent(
    bridge,
    { confirmTimeoutMs: 2000, noopMs: 30, pollMs: 10 },
    {
      intent: 'tap:set',
      args: { tapId: 'x', aperture: 1 },
      done: () => null,
      unchanged: () => true,
      explain: () => ({ ok: false, error: 'sin_contacto' }),
      evidence: () => ({ nota: 'dry' })
    }
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'sin_contacto');
  assert.equal(result.reglaProbable, 'sin_contacto');
  assert.deepEqual(result.evidencia, { nota: 'dry' });
});

test('timeout sin done ⇒ timeout_confirmacion', async () => {
  const bridge = makeBridge({ states: [{ ts: 1 }] });
  const result = await confirmIntent(
    bridge,
    { confirmTimeoutMs: 80, noopMs: 1000, pollMs: 20 },
    {
      intent: 'move',
      done: () => null,
      timeoutHint: 'sin eco'
    }
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'timeout_confirmacion');
  assert.equal(result.nota, 'sin eco');
});
