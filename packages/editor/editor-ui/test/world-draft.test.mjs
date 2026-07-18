/**
 * World draft + materials (unit, no Notario).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setupSmokeVolumesEnv } from '@zeus/test-utils';

setupSmokeVolumesEnv(import.meta.url);

const {
  createDefaultDraft,
  createPlazaDraft,
  validateDraft,
  listMaterials,
  GAME_CATALOG
} = await import('../src/world/materials.mjs');
const { createDraftStore } = await import('../src/world/draft-store.mjs');
const { materializeStartPack } = await import('../src/world/materialize-pack.mjs');

test('default draft validates and lists materials', () => {
  const draft = createDefaultDraft();
  const checked = validateDraft(draft);
  assert.equal(checked.ok, true, checked.error);
  const mats = listMaterials();
  assert.ok(mats.scenes.some((s) => s.id === 'vaiven-dos-nodos'));
  assert.ok(mats.lines.some((l) => l.id === 'juguete'));
  assert.ok(mats.games.some((g) => g.id === 'sketch'));
  assert.ok(mats.games.some((g) => g.id === 'plaza' && g.kind === 'narrative'));
  assert.equal(GAME_CATALOG.sketch.kind, 'toy');
});

test('plaza draft validates with story-board actos', () => {
  const draft = createPlazaDraft();
  const checked = validateDraft(draft);
  assert.equal(checked.ok, true, checked.error);
  assert.equal(checked.draft.gameId, 'plaza');
  assert.ok(checked.draft.storyBoard.acts.length >= 1);
});

test('unknown gameId is rejected (no sketch-only hard-gate)', () => {
  const draft = { ...createDefaultDraft(), gameId: 'delta' };
  const checked = validateDraft(draft);
  assert.equal(checked.ok, false);
  assert.match(checked.error, /unknown gameId/);
  assert.equal(checked.rule, 'world.draft.gameId');
});

test('plaza without storyBoard fails', () => {
  const draft = { ...createPlazaDraft(), storyBoard: null };
  const checked = validateDraft(draft);
  assert.equal(checked.ok, false);
  assert.equal(checked.rule, 'world.draft.storyBoard');
});

test('draft store persists labelset', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'editor-world-'));
  try {
    const store = createDraftStore(dir);
    const saved = store.write({ labelset: ['rojo', 'azul'] });
    assert.deepEqual(saved.labelset, ['rojo', 'azul']);
    assert.deepEqual(store.read().labelset, ['rojo', 'azul']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('materializeStartPack writes scene labelset line casos', () => {
  const libraryRoot = mkdtempSync(path.join(tmpdir(), 'lib-sketch-'));
  const packRoot = path.join(libraryRoot, 'packages', 'startpack-sketch');
  try {
    mkdirSync(path.join(packRoot, 'volumes', 'DISK_03', 'FORCES'), { recursive: true });
    writeFileSync(
      path.join(packRoot, 'package.json'),
      JSON.stringify({ name: '@zeus/startpack-sketch', version: '0.1.0' }, null, 2)
    );
    writeFileSync(
      path.join(packRoot, 'manifest.json'),
      JSON.stringify({
        schema: 'zeus.startpack/v0',
        game: 'sketch',
        version: '0.1.0',
        round: {},
        seeds: { gamemap: 'seeds/gamemap.json', scene: 'seeds/scene.json', casos: 'seeds/casos.md' },
        volumes: { root: 'volumes' },
        acta: 'acta/ACTA.md'
      }, null, 2)
    );

    const draft = createDefaultDraft();
    const result = materializeStartPack(draft, { libraryRoot, game: 'sketch' });
    assert.equal(result.ok, true, result.error);
    assert.ok(existsSync(path.join(packRoot, 'seeds', 'scene.json')));
    assert.ok(existsSync(path.join(packRoot, 'seeds', 'casos.md')));
    const gamemap = JSON.parse(readFileSync(path.join(packRoot, 'seeds', 'gamemap.json'), 'utf8'));
    assert.deepEqual(gamemap.labelset, ['alpha', 'beta']);
    assert.equal(gamemap.lineId, 'juguete');
    assert.ok(existsSync(path.join(packRoot, 'volumes', 'DISK_02', 'LINEAS', 'registry.yaml')));
  } finally {
    rmSync(libraryRoot, { recursive: true, force: true });
  }
});

test('materializeStartPack plaza writes story-board (gameId !== sketch)', () => {
  const libraryRoot = mkdtempSync(path.join(tmpdir(), 'lib-plaza-'));
  const packRoot = path.join(libraryRoot, 'packages', 'startpack-plaza');
  try {
    mkdirSync(path.join(packRoot, 'volumes', 'DISK_02', 'LINEAS'), { recursive: true });
    writeFileSync(
      path.join(packRoot, 'package.json'),
      JSON.stringify({ name: '@zeus/startpack-plaza', version: '0.1.0' }, null, 2)
    );
    writeFileSync(
      path.join(packRoot, 'manifest.json'),
      JSON.stringify({
        schema: 'zeus.startpack/v0',
        game: 'plaza',
        version: '0.1.0',
        round: {},
        seeds: {
          gamemap: 'seeds/gamemap.json',
          storyBoard: 'seeds/story-board.json',
          casos: 'seeds/casos.md'
        },
        volumes: { root: 'volumes' },
        acta: 'acta/ACTA.md'
      }, null, 2)
    );

    const draft = createPlazaDraft();
    const result = materializeStartPack(draft, { libraryRoot, game: 'plaza' });
    assert.equal(result.ok, true, result.error);
    assert.equal(result.kind, 'narrative');
    assert.notEqual(draft.gameId, 'sketch');
    assert.ok(existsSync(path.join(packRoot, 'seeds', 'story-board.json')));
    const board = JSON.parse(readFileSync(path.join(packRoot, 'seeds', 'story-board.json'), 'utf8'));
    assert.equal(board.acts[0].id, 'act-0');
    assert.ok(board.acts[0].widgets.includes('panel-reic'));
    assert.ok(existsSync(path.join(packRoot, 'seeds', 'uichain', 'panel-reic.prompt.md')));
    assert.ok(existsSync(path.join(packRoot, 'volumes', 'DISK_02', 'LINEAS', 'registry.yaml')));
  } finally {
    rmSync(libraryRoot, { recursive: true, force: true });
  }
});
