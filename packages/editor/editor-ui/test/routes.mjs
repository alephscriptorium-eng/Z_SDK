/**
 * Route coverage for @zeus/editor-ui — world draft + cloak API + plaza release.
 * Release tests isolate dataDir and restore Notario side-effects on startpacks.
 * Games-library is optional: without sibling checkout, release tests skip ⏳ (WP-U119).
 */

import test from 'node:test';
import { setupSmokeVolumesEnv } from '@zeus/test-utils';

setupSmokeVolumesEnv(import.meta.url);

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP_NO_GAMES_LIBRARY =
  '⏳ Z_SDK-games-library unusable — need ZEUS_GAMES_LIBRARY_ROOT/sibling with notario-release.mjs + node_modules/@zeus/startpack-kit (CI)';

/**
 * True when library can run Notario release (script + linked startpack-kit).
 * @param {string} root
 * @returns {boolean}
 */
function isUsableLibraryRoot(root) {
  return (
    existsSync(path.join(root, 'scripts', 'notario-release.mjs')) &&
    existsSync(path.join(root, 'node_modules', '@zeus', 'startpack-kit'))
  );
}

/**
 * Resolve games-library (env, worktree U111, or sibling main).
 * @returns {string|null}
 */
function resolveLibraryRoot() {
  if (process.env.ZEUS_GAMES_LIBRARY_ROOT) {
    const root = path.resolve(process.env.ZEUS_GAMES_LIBRARY_ROOT);
    return isUsableLibraryRoot(root) ? root : null;
  }
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, '../../../../../../../Z_SDK-games-library/.worktrees/wp-u111-editor-materialize-narrativo'),
    path.resolve(here, '../../../../../../Z_SDK-games-library/.worktrees/wp-u111-editor-materialize-narrativo'),
    path.resolve(here, '../../../../../../../Z_SDK-games-library'),
    path.resolve(here, '../../../../../../Z_SDK-games-library'),
    path.resolve(here, '../../../../../../../Z_SDK-games-library-u70')
  ];
  for (const c of candidates) {
    if (isUsableLibraryRoot(c)) return c;
  }
  return null;
}

const LIBRARY_ROOT = resolveLibraryRoot();

/**
 * Restore startpack trees dirtied by materialize + Notario.
 * @param {string} libraryRoot
 * @param {string[]} games
 */
function restoreStartpacks(libraryRoot, games = ['sketch', 'plaza']) {
  for (const game of games) {
    const packRel = path.join('packages', `startpack-${game}`);
    spawnSync('git', ['checkout', '--', packRel], {
      cwd: libraryRoot,
      encoding: 'utf8',
      shell: false
    });
    spawnSync('git', ['clean', '-fd', '--', packRel], {
      cwd: libraryRoot,
      encoding: 'utf8',
      shell: false
    });
  }
}

function makeTempDataDir() {
  return mkdtempSync(path.join(tmpdir(), 'editor-ui-data-'));
}

test('editor world + cloak routes', async (t) => {
  const { createEditorServer } = await import('../src/server.mjs');
  const dataDir = makeTempDataDir();
  const prev = process.env.ZEUS_GAMES_LIBRARY_ROOT;
  if (LIBRARY_ROOT) process.env.ZEUS_GAMES_LIBRARY_ROOT = LIBRARY_ROOT;

  const handle = await createEditorServer({ port: 0, host: '127.0.0.1', dataDir });
  t.after(async () => {
    await handle.close();
    rmSync(dataDir, { recursive: true, force: true });
    if (prev === undefined) delete process.env.ZEUS_GAMES_LIBRARY_ROOT;
    else process.env.ZEUS_GAMES_LIBRARY_ROOT = prev;
  });

  const home = await fetch(`${handle.url}/`);
  assert.equal(home.status, 200, 'GET / should return 200');
  assert.match(await home.text(), /World Editor|gamemap|Release/i);

  const cloaksPage = await fetch(`${handle.url}/cloaks`);
  assert.equal(cloaksPage.status, 200, 'GET /cloaks should return 200');

  const matsRes = await fetch(`${handle.url}/api/world/materials`);
  assert.equal(matsRes.status, 200);
  const matsBody = await matsRes.json();
  assert.ok(matsBody.materials.games.some((g) => g.id === 'plaza'));

  const draftRes = await fetch(`${handle.url}/api/world/draft`);
  assert.equal(draftRes.status, 200);
  const draftBody = await draftRes.json();
  assert.equal(draftBody.success, true);
  assert.equal(draftBody.draft.gameId, 'sketch');

  const putRes = await fetch(`${handle.url}/api/world/draft`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...draftBody.draft,
      labelset: ['norte', 'sur']
    })
  });
  assert.equal(putRes.status, 200);
  const putBody = await putRes.json();
  assert.deepEqual(putBody.draft.labelset, ['norte', 'sur']);

  // Cloak API still available (presets under the hood)
  const listRes = await fetch(`${handle.url}/api/presets`);
  assert.equal(listRes.status, 200);
  const listBody = await listRes.json();
  assert.equal(listBody.success, true);
  assert.ok(Array.isArray(listBody.presets));
});

test(
  'editor world release produces installable tarball (sketch preset)',
  { skip: LIBRARY_ROOT ? false : SKIP_NO_GAMES_LIBRARY },
  async (t) => {
    const { createEditorServer } = await import('../src/server.mjs');
    const { createDefaultDraft } = await import('../src/world/materials.mjs');
    const dataDir = makeTempDataDir();
    const prev = process.env.ZEUS_GAMES_LIBRARY_ROOT;
    process.env.ZEUS_GAMES_LIBRARY_ROOT = LIBRARY_ROOT;

    const handle = await createEditorServer({ port: 0, host: '127.0.0.1', dataDir });
    t.after(async () => {
      await handle.close();
      restoreStartpacks(LIBRARY_ROOT, ['sketch', 'plaza']);
      rmSync(dataDir, { recursive: true, force: true });
      if (prev === undefined) delete process.env.ZEUS_GAMES_LIBRARY_ROOT;
      else process.env.ZEUS_GAMES_LIBRARY_ROOT = prev;
    });

    const draft = createDefaultDraft();
    assert.equal(draft.gameId, 'sketch');

    const res = await fetch(`${handle.url}/api/world/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft, skipTests: true })
    });
    const body = await res.json();
    assert.equal(res.status, 200, body.error || JSON.stringify(body));
    assert.equal(body.success, true);
    assert.equal(body.draft.gameId, 'sketch');
    assert.ok(body.tarball, 'tarball path expected');
    assert.match(body.tarball.replace(/\\/g, '/'), /zeus-startpack-sketch-.*\.tgz$/);
  }
);

test(
  'editor world release plaza produces installable tarball (gameId !== sketch)',
  { skip: LIBRARY_ROOT ? false : SKIP_NO_GAMES_LIBRARY },
  async (t) => {
    const { createEditorServer } = await import('../src/server.mjs');
    const { createPlazaDraft } = await import('../src/world/materials.mjs');
    const dataDir = makeTempDataDir();
    const prev = process.env.ZEUS_GAMES_LIBRARY_ROOT;
    process.env.ZEUS_GAMES_LIBRARY_ROOT = LIBRARY_ROOT;

    const handle = await createEditorServer({ port: 0, host: '127.0.0.1', dataDir });
    t.after(async () => {
      await handle.close();
      restoreStartpacks(LIBRARY_ROOT, ['sketch', 'plaza']);
      rmSync(dataDir, { recursive: true, force: true });
      if (prev === undefined) delete process.env.ZEUS_GAMES_LIBRARY_ROOT;
      else process.env.ZEUS_GAMES_LIBRARY_ROOT = prev;
    });

    const draft = createPlazaDraft();
    assert.notEqual(draft.gameId, 'sketch');

    const res = await fetch(`${handle.url}/api/world/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft, skipTests: true })
    });
    const body = await res.json();
    assert.equal(res.status, 200, body.error || JSON.stringify(body));
    assert.equal(body.success, true);
    assert.equal(body.draft.gameId, 'plaza');
    assert.ok(body.tarball, 'tarball path expected');
    assert.match(body.tarball.replace(/\\/g, '/'), /zeus-startpack-plaza-.*\.tgz$/);
  }
);
