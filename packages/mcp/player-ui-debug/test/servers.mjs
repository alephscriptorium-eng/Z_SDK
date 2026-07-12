/**
 * Unit tests for server catalog display helpers.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { isServerConnected, sortServersForDisplay } from '../src/servers.mjs';

test('isServerConnected accepts status and isConnected fields', () => {
  assert.equal(isServerConnected({ status: 'connected' }), true);
  assert.equal(isServerConnected({ isConnected: true }), true);
  assert.equal(isServerConnected({ status: 'disconnected' }), false);
  assert.equal(isServerConnected({ isConnected: false }), false);
});

test('sortServersForDisplay puts connected servers first', () => {
  const sorted = sortServersForDisplay([
    { id: 'moon', status: 'disconnected' },
    { id: 'earth', status: 'connected' },
    { id: 'sun', status: 'connected' }
  ]);
  assert.deepEqual(sorted.map((s) => s.id), ['earth', 'sun', 'moon']);
});
