#!/usr/bin/env node
/**
 * smoke:external-consumer — WP-U54 + WP-U161
 *
 * Packs @zeus/protocol + @zeus/rooms + @zeus/socket-core, installs into a
 * clean directory outside the workspace (tarball/file — not registry publish),
 * starts socket-server, runs the consumer with Node and Bun.
 *
 * Consumer .npmrc is @zeus-only (no @alephscript scope) — CA WP-U161.
 * No npm publish. No ZEUS_OPEN_BROWSER.
 */

import { spawn, spawnSync } from 'node:child_process';
import {
  rmSync,
  writeFileSync,
  readFileSync,
  copyFileSync,
  existsSync,
  mkdtempSync,
  readdirSync
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exampleDir = path.join(root, 'examples', 'external-consumer');
const HOST = 'localhost';
const PORT = Number(process.env.ZEUS_SMOKE_SCRIPTORIUM_PORT || 13054);
const ROOM = 'EXTERNAL_SMOKE';
const SECRET = process.env.ZEUS_SCRIPTORIUM_SECRET || 'dev-secret';
const USER = 'external-anon';
const ZEUS_REGISTRY = 'https://npm.scriptorium.escrivivir.co';

const children = [];

function fail(msg) {
  console.error(`smoke:external-consumer FAIL — ${msg}`);
  process.exitCode = 1;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttp(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await sleep(200);
  }
  throw new Error(`timeout waiting for ${url}`);
}

function packWorkspace(pkgName) {
  const r = spawnSync(
    'npm',
    ['pack', '-w', pkgName, '--pack-destination', packDir],
    { cwd: root, encoding: 'utf8', shell: true }
  );
  if (r.status !== 0) {
    throw new Error(`npm pack ${pkgName} failed:\n${r.stderr || r.stdout}`);
  }
  const lines = (r.stdout || '')
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const tgzName = lines[lines.length - 1];
  if (!tgzName || !tgzName.endsWith('.tgz')) {
    throw new Error(`could not resolve tarball name for ${pkgName}: ${r.stdout}`);
  }
  const tgz = path.join(packDir, path.basename(tgzName));
  if (!existsSync(tgz)) throw new Error(`tarball missing: ${tgz}`);
  return tgz;
}

function writeNpmrc(dir) {
  // WP-U161: consumer scope routing is @zeus-only — no @alephscript line.
  // Scope routing only — no auth tokens (swarm smoke).
  writeFileSync(
    path.join(dir, '.npmrc'),
    [`@zeus:registry=${ZEUS_REGISTRY}`, ''].join('\n')
  );
}

/** CA WP-U161: .npmrc solo-@zeus and zero @alephscript packages in the tree. */
function assertZeusOnlyConsumerTree(dir) {
  const npmrcPath = path.join(dir, '.npmrc');
  if (!existsSync(npmrcPath)) {
    throw new Error('consumer .npmrc missing');
  }
  const npmrcText = readFileSync(npmrcPath, 'utf8');
  if (/@alephscript\s*:/m.test(npmrcText)) {
    throw new Error(`consumer .npmrc still routes @alephscript:\n${npmrcText}`);
  }
  if (!npmrcText.includes('@zeus:registry=')) {
    throw new Error(`consumer .npmrc missing @zeus registry:\n${npmrcText}`);
  }
  const alephDir = path.join(dir, 'node_modules', '@alephscript');
  if (existsSync(alephDir)) {
    const kids = readdirSync(alephDir);
    throw new Error(
      `consumer node_modules still has @alephscript/*: ${kids.join(', ')}`
    );
  }
  console.log('consumer .npmrc solo-@zeus + zero @alephscript in tree: ok');
}

function parseLastJsonLine(stdout) {
  const lines = String(stdout || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lines[i].startsWith('{')) {
      try {
        return JSON.parse(lines[i]);
      } catch {
        /* try earlier line */
      }
    }
  }
  throw new Error(`no JSON result line in consumer output:\n${stdout}`);
}

const packDir = mkdtempSync(path.join(os.tmpdir(), 'zeus-u161-packs-'));
const cleanDir = mkdtempSync(path.join(os.tmpdir(), 'zeus-u161-external-'));

console.log('smoke:external-consumer (WP-U161 · scope @zeus-only)');
console.log(`  packs:  ${packDir}`);
console.log(`  clean:  ${cleanDir}`);
console.log(`  room:   ${ROOM} @ http://${HOST}:${PORT}`);
console.log('');

let protocolTgz;
let roomsTgz;
let socketCoreTgz;

try {
  // Ensure protocol types exist before pack
  const gen = spawnSync('npm', ['run', 'types:generate', '-w', '@zeus/protocol'], {
    cwd: root,
    encoding: 'utf8',
    shell: true
  });
  if (gen.status !== 0) {
    throw new Error(`types:generate failed:\n${gen.stderr || gen.stdout}`);
  }

  // socket-core must be packed: rooms depends on it and it is not on registry yet.
  socketCoreTgz = packWorkspace('@zeus/socket-core');
  protocolTgz = packWorkspace('@zeus/protocol');
  roomsTgz = packWorkspace('@zeus/rooms');
  console.log(`packed ${path.basename(socketCoreTgz)}`);
  console.log(`packed ${path.basename(protocolTgz)}`);
  console.log(`packed ${path.basename(roomsTgz)}`);

  writeNpmrc(cleanDir);
  writeFileSync(
    path.join(cleanDir, 'package.json'),
    JSON.stringify(
      {
        name: 'zeus-external-smoke',
        private: true,
        type: 'module',
        version: '0.0.0'
      },
      null,
      2
    )
  );
  copyFileSync(
    path.join(exampleDir, 'consumer.mjs'),
    path.join(cleanDir, 'consumer.mjs')
  );
  copyFileSync(
    path.join(exampleDir, 'consumer.ts'),
    path.join(cleanDir, 'consumer.ts')
  );

  const install = spawnSync(
    'npm',
    [
      'install',
      socketCoreTgz,
      protocolTgz,
      roomsTgz,
      '--no-fund',
      '--no-audit'
    ],
    { cwd: cleanDir, encoding: 'utf8', shell: true }
  );
  if (install.status !== 0) {
    throw new Error(
      `npm install tarballs failed (exit ${install.status}):\n${install.stderr || install.stdout}`
    );
  }
  console.log(`install from tarballs (solo-@zeus .npmrc): exit ${install.status}`);
  assertZeusOnlyConsumerTree(cleanDir);

  // Verify .d.ts landed in node_modules
  const dtsProtocol = path.join(
    cleanDir,
    'node_modules',
    '@zeus',
    'protocol',
    'types',
    'index.d.ts'
  );
  const dtsRooms = path.join(
    cleanDir,
    'node_modules',
    '@zeus',
    'rooms',
    'types',
    'index.d.ts'
  );
  if (!existsSync(dtsProtocol)) throw new Error(`missing ${dtsProtocol}`);
  if (!existsSync(dtsRooms)) throw new Error(`missing ${dtsRooms}`);
  console.log('.d.ts present in installed packages: ok');

  const env = {
    ...process.env,
    ZEUS_HOST: HOST,
    ZEUS_PORT_SCRIPTORIUM: String(PORT),
    ZEUS_SCRIPTORIUM_URL: `http://${HOST}:${PORT}`,
    ZEUS_SCRIPTORIUM_ROOM: ROOM,
    ZEUS_SCRIPTORIUM_USER: USER,
    ZEUS_SCRIPTORIUM_SECRET: SECRET,
    ZEUS_SCRIPTORIUM_BRIDGE: 'local'
  };
  delete env.ZEUS_OPEN_BROWSER;

  const socket = spawn(process.execPath, [path.join(root, 'packages/mesh/socket-server/src/index.mjs')], {
    cwd: root,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  children.push(socket);
  socket.stderr.on('data', (c) => process.stderr.write(`[socket] ${c}`));

  await waitForHttp(`http://${HOST}:${PORT}/health`);
  console.log('socket-server: healthy');

  const consumerEnv = { ...env };

  const nodeRun = spawnSync(process.execPath, ['consumer.mjs'], {
    cwd: cleanDir,
    env: consumerEnv,
    encoding: 'utf8',
    shell: false
  });
  if (nodeRun.status !== 0) {
    throw new Error(`Node consumer failed:\n${nodeRun.stderr || nodeRun.stdout}`);
  }
  const nodeOut = (nodeRun.stdout || '').trim();
  console.log('Node stdout (truncated):\n', nodeOut.slice(-400));
  const nodeJson = parseLastJsonLine(nodeOut);
  if (!nodeJson.ok || nodeJson.runtime !== 'node') {
    throw new Error(`unexpected Node result: ${JSON.stringify(nodeJson)}`);
  }
  console.log('Node:', JSON.stringify(nodeJson));

  const bunPath = spawnSync('bun', ['--version'], { encoding: 'utf8', shell: true });
  if (bunPath.status !== 0) {
    throw new Error('bun not available on PATH — CA requires Node and Bun');
  }
  console.log(`bun ${(bunPath.stdout || '').trim()}`);

  const bunRun = spawnSync('bun', ['run', 'consumer.ts'], {
    cwd: cleanDir,
    env: consumerEnv,
    encoding: 'utf8',
    shell: true
  });
  if (bunRun.status !== 0) {
    throw new Error(`Bun consumer failed:\n${bunRun.stderr || bunRun.stdout}`);
  }
  const bunOut = (bunRun.stdout || '').trim();
  console.log('Bun stdout (truncated):\n', bunOut.slice(-400));
  const bunJson = parseLastJsonLine(bunOut);
  if (!bunJson.ok || bunJson.runtime !== 'bun' || bunJson.typed !== true) {
    throw new Error(`unexpected Bun result: ${JSON.stringify(bunJson)}`);
  }
  console.log('Bun:', JSON.stringify(bunJson));

  console.log('');
  console.log(
    'smoke:external-consumer — GREEN (Node + Bun, tarball install, .npmrc solo-@zeus)'
  );
  console.log('registry install: ⏳ (no publish in swarm; socket-core via tarball)');
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
} finally {
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }
  if (process.env.ZEUS_SMOKE_CLEANUP === '1') {
    rmSync(packDir, { recursive: true, force: true });
    rmSync(cleanDir, { recursive: true, force: true });
  }
}

process.exit(process.exitCode ?? 0);
