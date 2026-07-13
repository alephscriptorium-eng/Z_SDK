import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');
const viewerRoots = [
  'packages/app/player-3d-ui/assets/js',
  'packages/app/player-3d-ui/src',
  'packages/platform/3d-monitor/assets/js',
  'packages/platform/3d-monitor/src',
  'packages/platform/firehose-browser/src'
];

function collectSourceFiles(dir) {
  const abs = path.join(repoRoot, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const full = path.join(abs, entry.name);
    if (entry.isDirectory()) out.push(...collectSourceFiles(path.relative(repoRoot, full)));
    else if (/\.(mjs|js)$/.test(entry.name) && !entry.name.endsWith('.test.mjs')) out.push(full);
  }
  return out;
}

test('G-D6: viewers do not import createMapEngine as local authority', { timeout: 5000 }, () => {
  const offenders = [];
  for (const root of viewerRoots) {
    for (const file of collectSourceFiles(root)) {
      const text = fs.readFileSync(file, 'utf8');
      if (/createMapEngine/.test(text) || /from\s+['"].*map-engine/.test(text)) {
        offenders.push(path.relative(repoRoot, file));
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `viewers must not import createMapEngine (M3 authority): ${offenders.join(', ')}`
  );
});

test('G-DM.4: player-3d viewer consumes declared slice via projectSlice', { timeout: 5000 }, () => {
  const viewerMain = path.join(repoRoot, 'packages/app/player-3d-ui/assets/js/viewer-main.mjs');
  const text = fs.readFileSync(viewerMain, 'utf8');
  assert.match(text, /projectSlice/);
  assert.match(text, /SCENE_IDS\.player3d/);
});

test('G-DM.4b: operator-ui host consumes declared slice via projectSlice', { timeout: 5000 }, () => {
  const bridge = path.join(
    repoRoot,
    'packages/operator-ui/projects/dev-app/src/app/zeus-session-bridge.service.ts'
  );
  const text = fs.readFileSync(bridge, 'utf8');
  assert.match(text, /projectSlice/);
  assert.match(text, /SCENE_IDS\.operator/);
});

test('G-DM.3 firehose bridge projects deck C via firehoseDeckContextFromSession', { timeout: 5000 }, () => {
  const routes = path.join(repoRoot, 'packages/app/player-ui/src/aleph-routes.mjs');
  const text = fs.readFileSync(routes, 'utf8');
  assert.match(text, /firehoseDeckContextFromSession/);
  assert.match(text, /getSessionSnapshot/);
});

const inboundRoots = [
  'packages/lib/session-protocol/src',
  'packages/lib/session-domain/src',
  'packages/app/player-ui/src/socket-handlers.mjs'
];

test('G-DM.5: no legacy deck:load or playhead:set inbound events', { timeout: 5000 }, () => {
  const offenders = [];
  for (const rel of inboundRoots) {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) continue;
    const files = fs.statSync(abs).isDirectory()
      ? collectSourceFiles(rel)
      : [abs];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      for (const line of text.split('\n')) {
        if (/domain:(?:deck:load|playhead:set)/.test(line)) continue;
        if (/(?:deck:load|playhead:set)/.test(line)) {
          offenders.push(`${path.relative(repoRoot, file)}: ${line.trim()}`);
        }
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `legacy inbound deck/playhead aliases must be removed (M4): ${offenders.join('; ')}`
  );
});
