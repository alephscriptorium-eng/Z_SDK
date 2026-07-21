/**
 * Contract: resolveIntentionalStop / readActuatorIntentionalStop (no spawn).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveIntentionalStop,
  readActuatorIntentionalStop
} from '../src/intent-signal.mjs';

test('resolveIntentionalStop ORs actuator and context', () => {
  assert.equal(resolveIntentionalStop({}), false);
  assert.equal(resolveIntentionalStop({ contextIntentional: true }), true);
  assert.equal(resolveIntentionalStop({ actuatorIntentional: true }), true);
  assert.equal(
    resolveIntentionalStop({
      actuatorIntentional: false,
      contextIntentional: true
    }),
    true
  );
  assert.equal(
    resolveIntentionalStop({
      actuatorIntentional: false,
      contextIntentional: false
    }),
    false
  );
});

test('readActuatorIntentionalStop delegates to actuator read API', () => {
  const marks = new Set(['a']);
  const actuator = {
    isIntentionalStop: (id) => marks.has(id)
  };
  assert.equal(readActuatorIntentionalStop(actuator, 'a'), true);
  assert.equal(readActuatorIntentionalStop(actuator, 'b'), false);
  assert.equal(readActuatorIntentionalStop(null, 'a'), undefined);
  assert.equal(readActuatorIntentionalStop({}, 'a'), undefined);
});
