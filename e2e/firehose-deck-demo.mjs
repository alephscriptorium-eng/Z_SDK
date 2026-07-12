/**
 * E2E Tablero Plato C: firehose-mcp discovery + deck C load + micropost resolve + contextual links.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoomSessionClient } from '@zeus/rooms';
import { createScriptoriumServer } from '@zeus/socket-server';
import { startFirehoseMcp } from '../packages/mcp/linea-firehose/src/start.mjs';
import { createPlayerServer } from '../packages/app/player-ui/src/server.mjs';
import { PresetStore } from '@zeus/presets-sdk';
import { assert, shutdownE2E, safeClose } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const SCRIPTORIUM_PORT = 13017;
const FIREHOSE_MCP_PORT = 13008;
const PLAYER_PORT = 13018;
const RUNTIME_URL = `http://localhost:${SCRIPTORIUM_PORT}/runtime`;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

let scriptorium = null;
let firehoseMcp = null;
let player = null;
let client = null;
process.env.ZEUS_SCRIPTORIUM_URL = `http://localhost:${SCRIPTORIUM_PORT}`;

try {
  console.log('1. Seed ALEPH presets...');
  const { execSync } = await import('node:child_process');
  execSync('node scripts/seed-aleph-presets.mjs', { cwd: repoRoot, stdio: 'inherit' });

  const store = new PresetStore({ dataDir: path.join(repoRoot, 'data') });
  const presetC = store.getByName('aleph-firehose-browse');
  assert(presetC, 'aleph-firehose-browse missing — run seed:aleph');
  assert(
    presetC.items.some((i) => i.name === 'firehose_list_posts'),
    'aleph-firehose-browse should include firehose_list_posts tool'
  );

  console.log('2. Starting scriptorium-server...');
  scriptorium = await createScriptoriumServer({ port: SCRIPTORIUM_PORT, host: 'localhost', bridge: 'local' });

  console.log('3. Starting firehose-mcp-server...');
  firehoseMcp = await startFirehoseMcp({ port: FIREHOSE_MCP_PORT });
  const firehoseHealthUrl = `http://localhost:${FIREHOSE_MCP_PORT}/mcp/health`;
  const health = await fetchJson(firehoseHealthUrl);
  assert(health.server === 'firehose-mcp-server', 'firehose MCP health mismatch');

  console.log('4. Starting player-ui (room transport)...');
  player = await createPlayerServer({
    port: PLAYER_PORT,
    host: 'localhost',
    dataDir: path.join(repoRoot, 'data'),
    discoveryUrls: [`http://localhost:${FIREHOSE_MCP_PORT}`]
  });

  const base = `http://localhost:${PLAYER_PORT}`;

  console.log('4. REST /api/aleph/config defaultPresets.C...');
  const config = await fetchJson(`${base}/api/aleph/config`);
  assert(config.defaultPresets?.C === 'aleph-firehose-browse', 'default Plato C preset mismatch');

  console.log('5. REST /api/aleph/topology includes firehose...');
  const topo = await fetchJson(`${base}/api/aleph/topology`);
  assert(topo.nodes?.some((n) => n.id === 'firehose-mcp-server'), 'topology missing firehose-mcp-server');
  assert(topo.nodes?.some((n) => n.id === 'firehose-browser'), 'topology missing firehose-browser');

  console.log('6. Room client domain:deck:load C + deck:resolved...');
  client = createRoomSessionClient({ scriptoriumUrl: RUNTIME_URL, validate: 'off' });
  const initialState = client.waitForEvent('session:state', null, 15000);
  await new Promise((res, rej) => {
    client.connect();
    const sock = client.getSocket();
    sock.on('connect', res);
    sock.on('connect_error', rej);
  });
  await initialState;

  const waitResolved = (predicate, timeoutMs = 15000) =>
    client.waitForEvent(
      'deck:resolved',
      (p) => p.deckId === 'C' && (predicate ? predicate(p) : true),
      timeoutMs
    );

  const loadedC = waitResolved((p) => p.kind === 'firehose' && (p.posts?.items?.length ?? 0) > 0);
  client.deckLoad({
    deckId: 'C',
    serverName: 'firehose-mcp-server',
    presetId: presetC.id
  });
  const resolvedC = await loadedC;

  assert(resolvedC.kind === 'firehose', 'deck C resolved.kind should be firehose');
  assert(resolvedC.posts?.items?.length > 0, 'deck C should list microposts');
  assert(resolvedC.selected?.filePath, 'deck C should auto-select first post');
  assert(resolvedC.stats?.totals?.candidate === 605, 'candidate count mismatch');

  console.log('7. micropost:select second post...');
  const second = resolvedC.posts.items[1] || resolvedC.posts.items[0];
  const selectedPromise = waitResolved(
    (p) => p.selected?.filePath === second.filePath
  );
  client.micropostSelect({
    deckId: 'C',
    filePath: second.filePath,
    corpus: resolvedC.corpus,
    path: resolvedC.path
  });
  const selected = await selectedPromise;
  assert(selected.selected?.text, 'selected post should include text');

  console.log('8. GET /api/aleph/firehose-links with deck context...');
  const qs = new URLSearchParams({
    corpus: selected.corpus,
    path: selected.path || '',
    file: selected.selected.filePath
  });
  const links = await fetchJson(`${base}/api/aleph/firehose-links?${qs}`);
  assert(links.items?.some((i) => i.id === 'firehose-selection'), 'expected selection link item');
  const selection = links.items.find((i) => i.id === 'firehose-selection');
  assert(selection.href?.includes('3016'), 'selection href should target firehose UI');
  assert(selection.href.includes('corpus='), 'selection href missing corpus');

  console.log('9. firehose:corpus raw...');
  const rawPromise = waitResolved((p) => p.corpus === 'raw');
  client.emit('firehose:corpus', { deckId: 'C', corpus: 'raw', path: '' });
  const rawResolved = await rawPromise;
  assert(rawResolved.corpus === 'raw', 'corpus switch failed');

  console.log('\nfirehose-deck e2e OK');
} catch (err) {
  console.error('\nfirehose-deck e2e: FAILED');
  console.error(err);
  process.exitCode = 1;
} finally {
  await shutdownE2E({
    lineaHandles: firehoseMcp ? [firehoseMcp] : [],
    player,
    sockets: client ? [client] : []
  });
  await safeClose(scriptorium);
}
