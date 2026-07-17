/**
 * E2E dual-ui — post-U31: player-ui is DJ (not session master).
 * Smoke health of socket + player-ui DJ + player-3d. Operator rewire = U32.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createScriptoriumServer } from '@zeus/socket-server';
import { createPlayerServer } from '../packages/app/player-ui/src/server.mjs';
import { createPlayer3dServer } from '../packages/app/player-3d-ui/src/server.mjs';
import { assert, shutdownE2E, safeClose } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data', 'e2e-dual-ui-run');

const SCRIPTORIUM_PORT = 13047;
const PLAYER_PORT = 13048;
const PLAYER_3D_PORT = 13049;
const ROOM = 'ARG_DUAL';

const handles = [];

try {
  process.env.ZEUS_SCRIPTORIUM_URL = `http://localhost:${SCRIPTORIUM_PORT}`;
  process.env.ZEUS_ARG_ROOM = ROOM;

  console.log('1. Starting socket-server...');
  const scriptorium = await createScriptoriumServer({
    port: SCRIPTORIUM_PORT,
    host: 'localhost',
    bridge: 'local'
  });
  handles.push(scriptorium);

  console.log('2. Starting player-ui (DJ)...');
  const player = await createPlayerServer({
    port: PLAYER_PORT,
    host: 'localhost',
    dataDir,
    room: ROOM,
    discoveryExclusive: false,
    discoveryTimeoutMs: 2000
  });
  handles.push(player);

  console.log('3. Starting player-3d-ui...');
  const player3d = await createPlayer3dServer({
    port: PLAYER_3D_PORT,
    host: 'localhost'
  });
  handles.push(player3d);

  const playerHealth = await fetch(`http://localhost:${PLAYER_PORT}/health`);
  const playerJson = await playerHealth.json();
  assert(playerHealth.status === 200, `player-ui /health status ${playerHealth.status}`);
  assert(playerJson.role === 'dj', 'player-ui must report role=dj');
  assert(playerJson.room === ROOM, `player-ui room ${playerJson.room}`);

  const p3dHealth = await fetch(`http://localhost:${PLAYER_3D_PORT}/health`);
  assert(p3dHealth.status === 200, `player-3d /health status ${p3dHealth.status}`);

  console.log('\ne2e dual-ui-demo: OK (DJ smoke; operator/projection → U32)');
} catch (err) {
  console.error('\ne2e dual-ui-demo: FAILED', err);
  process.exitCode = 1;
} finally {
  await shutdownE2E(handles, safeClose);
}
