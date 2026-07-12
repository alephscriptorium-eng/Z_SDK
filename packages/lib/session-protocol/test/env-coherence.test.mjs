import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ZEUS_UI_MESH } from '@zeus/presets-sdk';

test('env mesh exposes scriptorium runtime slot', () => {
  assert.equal(DEFAULT_ZEUS_UI_MESH.scriptorium.path, '/runtime');
  assert.equal(DEFAULT_ZEUS_UI_MESH.scriptorium.port, 3017);
  assert.equal(DEFAULT_ZEUS_UI_MESH.session, undefined);
});

test('env mesh exposes operator-ui slot', () => {
  assert.equal(DEFAULT_ZEUS_UI_MESH.operator.port, 3020);
  assert.equal(DEFAULT_ZEUS_UI_MESH.operator.label, 'Operador');
});
