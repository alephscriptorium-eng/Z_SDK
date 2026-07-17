/**
 * Route coverage for @zeus/player-ui — aleph API + DJ intent endpoint.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
import { fetchAndValidate, setupSmokeVolumesEnv } from '@zeus/test-utils';
import { PLAYER_ROUTES } from '../src/contract.mjs';
import { startPlayerDjStack } from './helpers.mjs';

setupSmokeVolumesEnv(import.meta.url);

const { createPlayerServer } = await import('../src/server.mjs');

test('player aleph and dj routes', async (t) => {
  const stack = await startPlayerDjStack(createPlayerServer, { playerPort: 0 });

  t.after(async () => {
    await stack.close();
  });

  const base = `http://localhost:${stack.player.port}`;
  const { body: viewBody, res: viewLinks } = await fetchAndValidate(
    base,
    PLAYER_ROUTES,
    'aleph.view-links',
    { path: '/api/aleph/view-links?deckId=B' }
  );
  assert.equal(viewLinks.status, 200);
  assert.ok('linea' in viewBody);
  assert.ok(Array.isArray(viewBody.items));

  const { body: presetsBody, res: presets } = await fetchAndValidate(
    base,
    PLAYER_ROUTES,
    'presets.list'
  );
  assert.equal(presets.status, 200);
  assert.ok(Array.isArray(presetsBody));

  const proj = await fetch(`${base}/api/dj/projection`);
  assert.equal(proj.status, 200);
  const projBody = await proj.json();
  assert.equal(projBody.room, stack.room);

  const djRes = await fetch(`${base}/api/dj/cache`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ lineId: 'linea-aleph', registroId: 'P03' })
  });
  assert.equal(djRes.status, 200);
  const djBody = await djRes.json();
  assert.equal(djBody.ok, true);
  assert.equal(djBody.payload.intent, 'cache');
  assert.equal(djBody.payload.role, 'dj');

  const socket = io(base, {
    path: '/deck-io',
    transports: ['websocket'],
    reconnection: false,
    timeout: 5000
  });

  t.after(() => {
    socket.disconnect();
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('deck-io connect timeout')), 8000);
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  const statePromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('state timeout')), 5000);
    socket.on('state', (snap) => {
      clearTimeout(timer);
      resolve(snap);
    });
  });

  socket.emit('domain:playhead:set', { year: 2010 });
  const snap = await statePromise;
  assert.ok(snap.playhead);
  assert.equal(snap.playhead.year, 2010);
});
