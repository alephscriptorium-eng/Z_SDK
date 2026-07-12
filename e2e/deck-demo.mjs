/**
 * E2E deck demo: linea-system + scriptorium room + player-ui master.
 * Verifies synchronized session:state, nodo+oldid resolution, and degraded deck.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoomSessionClient } from '@zeus/rooms';
import { createScriptoriumServer } from '@zeus/socket-server';
import { startAll } from '@zeus/linea-system';
import { createPlayerServer } from '../packages/app/player-ui/src/server.mjs';
import {
  ServerRegistry,
  PresetStore,
  discoverServers
} from '@zeus/presets-sdk';
import {
  assert,
  safeClose,
  shutdownE2E,
  lineasBasePath,
  applyE2eLineaPorts
} from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data', 'e2e-deck-run');

const SCRIPTORIUM_PORT = 13017;
const PLAYER_PORT = 13013;
const RUNTIME_URL = `http://localhost:${SCRIPTORIUM_PORT}/runtime`;
const TEST_YEAR = 2010;

fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });

let scriptorium = null;
let lineaHandles = [];
let player = null;
const sockets = [];
const restoreLineaPorts = applyE2eLineaPorts();
process.env.ZEUS_SCRIPTORIUM_URL = `http://localhost:${SCRIPTORIUM_PORT}`;

try {
  console.log('1. Starting scriptorium-server...');
  scriptorium = await createScriptoriumServer({ port: SCRIPTORIUM_PORT, host: 'localhost', bridge: 'local' });

  console.log('2. Starting linea-system servers...');
  lineaHandles = await startAll(lineasBasePath);
  const lineaUrls = lineaHandles.map((h) => new URL(h.url).origin);

  console.log('3. Building catalog and linea-sync-observer preset...');
  const found = await discoverServers({ urls: lineaUrls, timeoutMs: 5000 });
  assert(found.length === 2, `Expected 2 linea servers, got ${found.length}`);

  const registry = new ServerRegistry();
  for (const s of found) {
    await registry.registerServer(s.name, s.url, 'http');
  }
  const catalog = await registry.buildCatalog();
  assert(catalog.length === 2, 'catalog should have 2 linea servers');

  const store = new PresetStore({ dataDir, fileName: 'presets.json' });
  const items = [];
  for (const server of catalog) {
    items.push(
      { serverName: server.serverName, type: 'resource', name: 'linea-info' },
      { serverName: server.serverName, type: 'tool', name: 'get_nodo' },
      { serverName: server.serverName, type: 'resourceTemplate', name: 'linea-nodo' },
      { serverName: server.serverName, type: 'prompt', name: 'report-nodo' }
    );
    if (server.serverName === 'linea-wp-historia') {
      items.push(
        { serverName: server.serverName, type: 'tool', name: 'get_oldid' },
        { serverName: server.serverName, type: 'resourceTemplate', name: 'linea-oldid' }
      );
    }
  }

  const preset = store.create({
    name: 'linea-sync-observer',
    description: 'Cross-linea preset for reporting nodo + oldid at a given historical year',
    category: 'Analysis',
    prompt: 'Report the Villacañas nodo and WP oldid at the given year using linea resources.',
    items
  });

  await registry.close();

  console.log('4. Starting player-ui (room master)...');
  player = await createPlayerServer({
    port: PLAYER_PORT,
    host: 'localhost',
    dataDir,
    discoveryUrls: lineaUrls
  });

  console.log('5. Connecting two room session clients...');
  const clientA = createRoomSessionClient({ scriptoriumUrl: RUNTIME_URL, user: 'e2e-deck-a', validate: 'off' });
  const clientB = createRoomSessionClient({ scriptoriumUrl: RUNTIME_URL, user: 'e2e-deck-b', validate: 'off' });
  sockets.push(clientA, clientB);

  const initialA = clientA.waitForEvent('session:state');
  const initialB = clientB.waitForEvent('session:state');
  clientA.connect();
  clientB.connect();

  await Promise.all([
    new Promise((res, rej) => {
      const s = clientA.getSocket();
      s.on('connect', res);
      s.on('connect_error', rej);
    }),
    new Promise((res, rej) => {
      const s = clientB.getSocket();
      s.on('connect', res);
      s.on('connect_error', rej);
    })
  ]);

  await Promise.all([initialA, initialB]);

  console.log('6. Loading decks with preset...');
  const loadedA = clientA.waitForEvent('deck:resolved', (p) => p.deckId === 'A' && p.nodo?.nodo?.id);
  clientA.deckLoad({ deckId: 'A', serverName: 'linea-espana', presetId: preset.id });
  await loadedA;

  const loadedB = clientB.waitForEvent(
    'deck:resolved',
    (p) => p.deckId === 'B' && p.nodo?.nodo?.id && p.oldid?.oldid
  );
  clientB.deckLoad({ deckId: 'B', serverName: 'linea-wp-historia', presetId: preset.id });
  await loadedB;

  console.log(`7. Setting playhead to ${TEST_YEAR}...`);
  const statePromiseA = clientA.waitForEvent('session:state', (s) => s.playhead?.year === TEST_YEAR);
  const statePromiseB = clientB.waitForEvent('session:state', (s) => s.playhead?.year === TEST_YEAR);
  const resolvedPromiseA = clientA.waitForEvent(
    'deck:resolved',
    (p) => p.deckId === 'A' && p.year === TEST_YEAR && p.nodo?.nodo?.id
  );
  const resolvedPromiseB = clientB.waitForEvent(
    'deck:resolved',
    (p) => p.deckId === 'B' && p.year === TEST_YEAR && p.nodo?.nodo?.id && p.oldid?.oldid
  );
  clientA.setPlayhead(TEST_YEAR);

  const [stateA, stateB, resolvedA, resolvedB] = await Promise.all([
    statePromiseA,
    statePromiseB,
    resolvedPromiseA,
    resolvedPromiseB
  ]);

  assert(stateA.playhead.year === TEST_YEAR, 'client A playhead mismatch');
  assert(stateB.playhead.year === TEST_YEAR, 'client B playhead mismatch');
  assert(stateA.phase === stateB.phase, 'session phases should match');
  assert(stateA.decks.A.phase === 'playing' || stateA.decks.A.phase === 'cued', 'deck A should be active');
  assert(stateA.decks.B.phase === 'playing' || stateA.decks.B.phase === 'cued', 'deck B should be active');

  assert(resolvedA.deckId === 'A' && resolvedA.nodo?.nodo?.id, 'deck A nodo missing');
  assert(resolvedB.deckId === 'B' && resolvedB.nodo?.nodo?.id, 'deck B nodo missing');
  assert(resolvedB.oldid?.oldid, 'deck B oldid missing');
  assert(typeof resolvedB.oldid.oldid === 'number', 'oldid should be numeric');

  console.log('Sync OK:', {
    year: TEST_YEAR,
    nodoA: resolvedA.nodo.nodo.id,
    nodoB: resolvedB.nodo.nodo.id,
    oldid: resolvedB.oldid.oldid
  });

  console.log('8. Degraded case: stop linea-wp-historia...');
  const wpHandle = lineaHandles.find((h) => h.name === 'linea-wp-historia');
  assert(wpHandle, 'linea-wp-historia handle missing');
  await safeClose(wpHandle);
  lineaHandles = lineaHandles.filter((h) => h.name !== 'linea-wp-historia');
  await new Promise((r) => setTimeout(r, 300));

  await player.refreshDiscovery();
  const degradedPromise = clientA.waitForEvent('session:state', (s) => s.decks?.B?.phase === 'degraded');
  clientA.setPlayhead(TEST_YEAR);

  const degradedState = await degradedPromise;
  assert(degradedState.decks.A.phase !== 'degraded', 'deck A should remain healthy');
  assert(degradedState.decks.B.phase === 'degraded', 'deck B should be degraded');

  console.log('Degraded OK: deck A active, deck B degraded');

  console.log('\ne2e deck-demo: OK');
} catch (err) {
  console.error('\ne2e deck-demo: FAILED');
  console.error(err);
  process.exitCode = 1;
} finally {
  restoreLineaPorts();
  await shutdownE2E({ lineaHandles, player, sockets });
  await safeClose(scriptorium);
  delete process.env.ZEUS_SCRIPTORIUM_URL;
  if (process.exitCode) process.exit(process.exitCode);
}
