/**
 * E2E WP-U85: familias de feed unificadas (feed-kit).
 *
 * Escenario A — real: jetstream fixture → DISK_01 + SSB fixture → DISK_04;
 *   MCP firehose + ssb; resolveRuntimeFeeds → ítems ATProto + SSB;
 *   pozo domain tick emite tracks navegables.
 * Escenario B — auto → sintético sin MCP.
 *
 * Uso: npm run e2e:feed-families
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { resetVolumesCache } from '@zeus/presets-sdk';
import { syncJetstreamFixture, resolveRuntimeFeeds, probeFeedMcpHealth } from '@zeus/feed-kit';
import { exportSsbLogFile } from '@zeus/ssb-system';
import { startFirehoseMcp } from '../packages/mesh/linea-firehose/src/start.mjs';
import { startAll as startSsb } from '../packages/mesh/ssb-system/src/start.mjs';
import { shutdownE2E } from './helpers.mjs';
import { gamesPaths } from './games-root.mjs';

const { createPozoDomainState } = await import(gamesPaths().pozoDomain);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SSB_FIXTURE = join(root, 'packages/mesh/ssb-system/fixtures/ssb-log.json');

const HOST = 'localhost';
const FIREHOSE_PORT = 13018;
const SSB_PORT = 14124;

let failures = 0;
const mcpHandles = [];

function gate(id, ok, detail = '') {
  const mark = ok ? '✅' : '❌';
  console.log(`${mark} ${id}${detail ? ` · ${detail}` : ''}`);
  if (!ok) failures += 1;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

console.log('\n📡 e2e feed-families · WP-U85\n');

const volumesRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-feed-families-e2e-'));
const prev = {
  volumes: process.env.ZEUS_VOLUMES_ROOT,
  firehose: process.env.ZEUS_MCP_FIREHOSE,
  ssb: process.env.ZEUS_MCP_SSB
};

process.env.ZEUS_VOLUMES_ROOT = volumesRoot;
process.env.ZEUS_MCP_FIREHOSE = String(FIREHOSE_PORT);
process.env.ZEUS_MCP_SSB = String(SSB_PORT);
resetVolumesCache();

try {
  console.log('── Escenario A: stream (ATProto) + gossip (SSB) reales ──\n');

  const jet = syncJetstreamFixture({ volumesRoot });
  gate('G-U85.0 jetstream fixture → DISK_01', jet.ok && jet.written >= 2, `written=${jet.written}`);

  const ssbExport = exportSsbLogFile({
    logPath: SSB_FIXTURE,
    volumesRoot,
    provenance: { fixture: true, note: 'WP-U85 e2e' }
  });
  gate(
    'G-U85.1 SSB fixture → DISK_04',
    ssbExport.ok === true,
    JSON.stringify(ssbExport.counts ?? {})
  );

  mcpHandles.push(await startFirehoseMcp({ port: FIREHOSE_PORT }));
  mcpHandles.push(...(await startSsb(path.join(volumesRoot, 'DISK_04', 'SSB'))));

  const fhHealth = await fetch(`http://${HOST}:${FIREHOSE_PORT}/mcp/health`);
  const ssbHealth = await fetch(`http://${HOST}:${SSB_PORT}/mcp/health`);
  gate('G-U85.2 firehose MCP health', fhHealth.ok, `status ${fhHealth.status}`);
  gate('G-U85.3 ssb MCP health', ssbHealth.ok, `status ${ssbHealth.status}`);

  const mcpPorts = {
    firehose: { disk: FIREHOSE_PORT },
    ssb: { disk: SSB_PORT }
  };

  const bag = await resolveRuntimeFeeds({
    mode: 'real',
    seed: 7,
    mcpPorts,
    families: ['stream', 'gossip'],
    requireForAuto: ['stream'],
    logger: console
  });

  gate('G-U85.4 resolve mode real', bag.mode === 'real', `mode=${bag.mode}`);

  await sleep(200);
  const streamItems = [];
  for (let i = 0; i < 8; i++) {
    streamItems.push(...(bag.families.stream.nextItems(2) ?? []));
    if (streamItems.some((it) => it.uri?.startsWith('firehose://post/'))) break;
    await sleep(150);
  }
  const atprotoItem = streamItems.find((it) => it.uri?.startsWith('firehose://post/'));
  gate(
    'G-U85.5 ATProto/stream item',
    Boolean(atprotoItem),
    atprotoItem?.uri ?? `got ${streamItems.length} items`
  );

  const gossipItems = [];
  for (let i = 0; i < 8; i++) {
    gossipItems.push(...(bag.families.gossip.nextItems(2) ?? []));
    if (gossipItems.some((it) => it.uri?.startsWith('ssb://message/'))) break;
    await sleep(150);
  }
  const ssbItem = gossipItems.find((it) => it.uri?.startsWith('ssb://message/'));
  gate(
    'G-U85.6 SSB/gossip item',
    Boolean(ssbItem),
    ssbItem?.uri ?? `got ${gossipItems.length} items`
  );

  // pozo consume la misma interfaz (regla dos juegos)
  const pozo = createPozoDomainState({
    now: () => 1000,
    feeds: {
      mode: bag.mode,
      families: {
        stream: {
          nextItems: () => (atprotoItem ? [atprotoItem] : [])
        },
        gossip: {
          nextItems: () => (ssbItem ? [ssbItem] : [])
        }
      }
    }
  });
  pozo.tick(1, 1000);
  const snap = pozo.snapshot('e2e');
  const out = pozo.drainOutbox();
  const uris = out.tracks.map((t) => t.ref?.uri).filter(Boolean);
  gate(
    'G-U85.7 pozo tracks ATProto+SSB',
    uris.some((u) => u.startsWith('firehose://post/')) &&
      uris.some((u) => u.startsWith('ssb://message/')),
    uris.join(' | ')
  );
  gate(
    'G-U85.8 pozo feed.items navegables',
    (snap.feed?.items?.length ?? 0) >= 2 &&
      snap.feed.items.some((i) => i.family === 'stream') &&
      snap.feed.items.some((i) => i.family === 'gossip'),
    `items=${snap.feed?.items?.length ?? 0} mode=${snap.feed?.mode}`
  );

  await bag.close?.();

  console.log('\n── Escenario B: auto → sintético ──\n');

  const warnings = [];
  const degraded = await resolveRuntimeFeeds({
    mode: 'auto',
    seed: 3,
    mcpPorts: {
      firehose: { disk: 59991 },
      lineas: { espana: 59992, wpHistoria: 59993 }
    },
    requireForAuto: ['stream', 'static'],
    logger: { warn: (m) => warnings.push(m) }
  });
  gate('G-U85.9 auto mode synthetic', degraded.mode === 'synthetic', `mode=${degraded.mode}`);
  gate(
    'G-U85.10 auto degrade log',
    warnings.some((w) => /auto → sintético/i.test(w)),
    warnings[0] ?? 'sin warn'
  );
  const [syn] = degraded.families.stream.nextItems(1);
  gate(
    'G-U85.11 synthetic stream uri',
    syn?.uri?.startsWith('firehose://synthetic/'),
    syn?.uri ?? 'none'
  );

  const probeOk = await probeFeedMcpHealth(
    { firehose: { disk: 59991 } },
    { timeoutMs: 200, require: ['stream'] }
  );
  gate('G-U85.12 probe false unreachable', probeOk === false);
} catch (err) {
  gate('E2E', false, err.message);
  console.error(err);
} finally {
  if (prev.volumes == null) delete process.env.ZEUS_VOLUMES_ROOT;
  else process.env.ZEUS_VOLUMES_ROOT = prev.volumes;
  if (prev.firehose == null) delete process.env.ZEUS_MCP_FIREHOSE;
  else process.env.ZEUS_MCP_FIREHOSE = prev.firehose;
  if (prev.ssb == null) delete process.env.ZEUS_MCP_SSB;
  else process.env.ZEUS_MCP_SSB = prev.ssb;
  resetVolumesCache();
  await shutdownE2E({ lineaHandles: mcpHandles });
  fs.rmSync(volumesRoot, { recursive: true, force: true });
  await sleep(200);
}

console.log(
  failures === 0
    ? '\n🟢 e2e feed-families: todos los gates en verde\n'
    : `\n🔴 e2e feed-families: ${failures} gate(s) en rojo\n`
);
process.exit(failures === 0 ? 0 : 1);
