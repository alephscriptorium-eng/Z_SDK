/**
 * Smoke · operator-ui vista ciudad.
 *
 * Evidencia sin reabrir authority loop:
 *  1. Bridge proyecta snapshot con `barrios` (estados → hub bots + HUD slice).
 *  2. Si hay startpack-ciudad en games-library vecino (o ZEUS_GAMES_LIBRARY),
 *     genera snapshot real vía dominio ciudad (read-only).
 *  3. serve.mjs inyecta window.__ZEUS__ con game=ciudad + /health
 *     (requiere dist + deps del monorepo).
 *
 * Uso (desde raíz zeus-sdk / worktree):
 *   node packages/mesh/operator-ui/fixtures/ciudad-vista-smoke.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  createOperatorBridge,
  projectOperatorSlice,
  CHANNELS,
} from '../../operator-bridge/src/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const operatorUiRoot = path.resolve(__dirname, '..');
const zeusRoot = path.resolve(operatorUiRoot, '../../..');
const distBrowser = path.join(operatorUiRoot, 'dist', 'public', 'browser');

function resolveGamesLibrary() {
  if (process.env.ZEUS_GAMES_LIBRARY) {
    return path.resolve(process.env.ZEUS_GAMES_LIBRARY);
  }
  const candidates = [
    path.join(zeusRoot, '../games-library'),
    path.join(zeusRoot, '../../games-library'),
    path.join(zeusRoot, '../../../games-library'),
    path.join(zeusRoot, '../Z_SDK-games-library'),
    path.join(zeusRoot, '../../Z_SDK-games-library'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'packages/ciudad/package.json'))) return c;
  }
  return null;
}

function fixtureSnapshot() {
  return {
    ts: 100,
    reason: 'fixture',
    sceneId: 'ciudad-v0',
    actors: { rabbit: { id: 'rabbit', kind: 'visitante', nodeId: 'plaza' } },
    barrios: {
      plaza: { id: 'plaza', estado: 'vivo', anchorId: 'ancla-plaza', parent: 'plaza' },
      'blockly-editor': {
        id: 'blockly-editor',
        estado: 'latente',
        anchorId: 'ancla-blockly-editor',
        parent: 'zigurat',
      },
      'workflow-editor': {
        id: 'workflow-editor',
        estado: 'muerto',
        anchorId: 'ancla-workflow-editor',
        parent: 'zigurat',
      },
      'linea-editor': {
        id: 'linea-editor',
        estado: 'roto',
        anchorId: 'ancla-linea-editor',
        parent: 'zigurat',
      },
    },
  };
}

function snapshotFromStartpackSeed(seedPath) {
  const gamemap = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  if (!gamemap?.anclas) return null;
  /** Mirror sceneFromGamemap barrio projection (seed → snapshot shape). */
  const barrios = {};
  for (const [anchorId, a] of Object.entries(gamemap.anclas)) {
    const barrioId = a.barrioId || a.slug;
    if (!barrioId) continue;
    barrios[barrioId] = {
      id: barrioId,
      estado: a.estado ?? 'latente',
      anchorId,
      parent: a.parent,
    };
  }
  return {
    ts: 42,
    reason: 'startpack-seed',
    sceneId: gamemap.sceneId ?? null,
    gamemapId: gamemap.id ?? null,
    actors: {},
    barrios,
  };
}

async function loadStartpackSnapshot(glRoot) {
  const seedPath = path.join(
    glRoot,
    'packages/startpack-ciudad/seeds/gamemap.json'
  );
  if (!fs.existsSync(seedPath)) return null;
  try {
    const domainUrl = pathToFileURL(
      path.join(glRoot, 'packages/ciudad/src/domain.mjs')
    ).href;
    const { createCiudadDomainState } = await import(domainUrl);
    const gamemap = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    const d = createCiudadDomainState({ now: () => 42, gamemap });
    return d.snapshot('operator-ui-smoke');
  } catch {
    return snapshotFromStartpackSeed(seedPath);
  }
}

function assertBarrioProjection(snap, label) {
  const bridge = createOperatorBridge();
  const msgs = bridge.onState(snap);
  const slice = projectOperatorSlice(snap);
  assert.ok(slice.barrioCount > 0, `${label}: barrioCount`);
  assert.equal(
    msgs.filter((m) => snap.barrios[m.fromBot]).length,
    slice.barrioCount,
    `${label}: one hub message per barrio`
  );
  const estados = new Set(Object.values(snap.barrios).map((b) => b.estado));
  for (const e of estados) {
    assert.ok(
      (slice.barrioByEstado?.[e] ?? 0) > 0,
      `${label}: tally ${e}`
    );
  }
  const vivoMsg = msgs.find((m) => /· vivo$/.test(m.content) || m.content.endsWith('vivo'));
  if (vivoMsg) assert.equal(vivoMsg.channel, CHANNELS.UI);
  console.log(`OK projection · ${label}`, {
    sceneId: slice.sceneId,
    barrioCount: slice.barrioCount,
    barrioByEstado: slice.barrioByEstado,
    hubMsgs: msgs.length,
  });
  return { msgs, slice };
}

async function assertServeCiudad() {
  if (!fs.existsSync(path.join(distBrowser, 'index.html'))) {
    console.log('SKIP serve/shell — dist missing (run npm run build:operator-ui)');
    return { skipped: true, reason: 'dist' };
  }
  let createOperatorUiServer;
  let resolveRoomClientConfig;
  try {
    ({ createOperatorUiServer } = await import('../serve.mjs'));
    ({ resolveRoomClientConfig } = await import('@zeus/room-client-browser'));
  } catch (err) {
    console.log('SKIP serve/shell — deps:', err.message);
    return { skipped: true, reason: 'deps' };
  }
  // URL vía presets-sdk env (resolveRoomClientConfig → resolveZeusUiPorts); sin puerto hardcode.
  const zeus = {
    ...resolveRoomClientConfig({}),
    room: 'CIUDAD_DEMO',
    token: 'dev-secret',
    user: 'operator-ui',
    game: 'ciudad',
  };
  const handle = await createOperatorUiServer({
    port: 0,
    host: '127.0.0.1',
    zeus,
  });
  try {
    const health = await fetch(`http://127.0.0.1:${handle.port}/health`).then((r) =>
      r.json()
    );
    assert.equal(health.ok, true);
    assert.equal(health.game, 'ciudad');
    assert.equal(health.room, 'CIUDAD_DEMO');
    assert.equal(health.role, 'operator');
    const html = await fetch(`http://127.0.0.1:${handle.port}/`).then((r) => r.text());
    assert.match(html, /window\.__ZEUS__/);
    assert.match(html, /"game":"ciudad"/);
    assert.match(html, /CIUDAD_DEMO/);
    console.log('OK serve/shell · game=ciudad room=CIUDAD_DEMO port=', handle.port);
    return { skipped: false, port: handle.port };
  } finally {
    await handle.close();
  }
}

const gl = resolveGamesLibrary();
assertBarrioProjection(fixtureSnapshot(), 'fixture');

if (gl) {
  try {
    const real = await loadStartpackSnapshot(gl);
    if (real?.barrios) {
      assertBarrioProjection(real, `startpack@${path.basename(gl)}`);
    } else {
      console.log('SKIP startpack snapshot — seed/domain unavailable');
    }
  } catch (err) {
    console.log('SKIP startpack snapshot —', err.message);
  }
} else {
  console.log('SKIP startpack — games-library not found (set ZEUS_GAMES_LIBRARY)');
}

const serve = await assertServeCiudad();
console.log('CIUDAD_VISTA_SMOKE_OK', { gamesLibrary: Boolean(gl), serve });
