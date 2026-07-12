/**
 * Route coverage for @zeus/player-ui — aleph API and room session transport.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
import { fetchAndValidate, setupSmokeVolumesEnv } from '@zeus/test-utils';
import { resolveScriptoriumSecret } from '@zeus/rooms';
import { PLAYER_ROUTES } from '../src/contract.mjs';
import { startPlayerRoomStack } from './helpers.mjs';

setupSmokeVolumesEnv(import.meta.url);

const { createPlayerServer } = await import('../src/server.mjs');

const ROOM = 'scriptorium.default';

test('player aleph and room socket routes', async (t) => {
  const stack = await startPlayerRoomStack(createPlayerServer, { playerPort: 0 });

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
  assert.equal(viewBody.wikitext, null, 'view-links tolerates empty deck resolution');

  const { body: presetsBody, res: presets } = await fetchAndValidate(
    base,
    PLAYER_ROUTES,
    'presets.list'
  );
  assert.equal(presets.status, 200);
  assert.ok(Array.isArray(presetsBody));

  const runtimeUrl = `${stack.scriptoriumUrl}/runtime`;
  const socket = io(runtimeUrl, {
    transports: ['websocket'],
    reconnection: false,
    timeout: 5000,
    auth: { token: resolveScriptoriumSecret(), room: ROOM, user: 'routes-test' }
  });

  t.after(() => {
    socket.disconnect();
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('connect timeout')), 8000);
    socket.on('connect', () => {
      socket.emit('CLIENT_REGISTER', {
        usuario: 'routes-test',
        sesion: 'routes-test-1',
        type: 'RouteTest',
        features: ['test']
      });
      socket.emit('CLIENT_SUSCRIBE', { room: ROOM });
      clearTimeout(timer);
      resolve();
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    socket.connect();
  });

  const sessionState = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('session:state timeout')), 8000);
    socket.on('SET_STATE', (data) => {
      if (data?.type !== 'session:state' || !data.snapshot) return;
      clearTimeout(timer);
      resolve(data.snapshot);
    });
  });

  assert.ok('phase' in sessionState);
  assert.ok(sessionState.playhead);
  assert.ok(sessionState.decks);
});
