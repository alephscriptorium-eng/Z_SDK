/**
 * Eje IV gate — two independent TS consumers resolve `"types"` for the
 * WP-U157 grafo-cercano lote via `tsc --noEmit`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureSrc = path.join(here, 'fixtures', 'ts-grafo-cercano-smoke');
const repoRoot = path.resolve(here, '../../../..');

/** Packages under test + type peers referenced by their .d.ts. */
const LOTE = {
  '@zeus/view-kit': 'packages/engine/view-kit',
  '@zeus/game-engine': 'packages/engine/game-engine',
  '@zeus/authority-kit': 'packages/engine/authority-kit',
  '@zeus/room-client-browser': 'packages/engine/room-client-browser',
  '@zeus/http-contract': 'packages/engine/http-contract',
  '@zeus/ui-kit': 'packages/engine/ui-kit',
  '@zeus/app-shell': 'packages/engine/app-shell',
  '@zeus/player-mcp-kit': 'packages/engine/player-mcp-kit',
  '@zeus/socket-server': 'packages/mesh/socket-server',
  '@zeus/protocol': 'packages/engine/protocol',
  '@zeus/presets-sdk': 'packages/engine/presets-sdk',
  '@zeus/rooms': 'packages/engine/rooms',
  '@zeus/ui-3d-kit': 'packages/engine/ui-3d-kit'
};

function resolveTsc() {
  const require = createRequire(import.meta.url);
  const candidates = [
    'typescript/bin/tsc',
    path.join(repoRoot, 'node_modules/typescript/bin/tsc'),
    path.join(repoRoot, '../../z-sdk/node_modules/typescript/bin/tsc')
  ];
  for (const id of candidates) {
    try {
      const resolved =
        id.includes('/') || id.includes('\\') ? id : require.resolve(id);
      if (!fs.existsSync(resolved)) continue;
      // Monorepo may ship TS 4.x (docs tooling); Zod/NodeNext smoke needs 5.x+.
      const pkgJson = path.resolve(path.dirname(resolved), '../package.json');
      const major = fs.existsSync(pkgJson)
        ? Number(JSON.parse(fs.readFileSync(pkgJson, 'utf8')).version.split('.')[0])
        : 0;
      if (major < 5) continue;
      return { cmd: process.execPath, argsPrefix: [resolved] };
    } catch {
      /* try next */
    }
  }
  return { cmd: 'npx', argsPrefix: ['--yes', '-p', 'typescript@5.9.3', 'tsc'] };
}

test('Eje IV: tsc resolves grafo-cercano lote types (two consumers)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u157-ts-'));
  try {
    for (const name of ['consumer-a.ts', 'consumer-b.ts', 'tsconfig.json']) {
      fs.copyFileSync(path.join(fixtureSrc, name), path.join(tmp, name));
    }

    const npmrcSrc = path.join(repoRoot, '.npmrc');
    if (fs.existsSync(npmrcSrc)) {
      fs.copyFileSync(npmrcSrc, path.join(tmp, '.npmrc'));
    }

    const deps = {
      '@types/node': '22.10.2'
    };
    for (const [name, rel] of Object.entries(LOTE)) {
      const abs = path.resolve(repoRoot, rel).replace(/\\/g, '/');
      assert.ok(fs.existsSync(abs), `missing package path ${abs}`);
      deps[name] = `file:${abs}`;
    }

    fs.writeFileSync(
      path.join(tmp, 'package.json'),
      JSON.stringify(
        {
          name: 'zeus-u157-grafo-cercano-ts-smoke',
          private: true,
          type: 'module',
          dependencies: deps
        },
        null,
        2
      )
    );

    const install = spawnSync(
      'npm',
      ['install', '--no-package-lock', '--ignore-scripts', '--legacy-peer-deps'],
      {
        cwd: tmp,
        encoding: 'utf8',
        shell: process.platform === 'win32',
        env: { ...process.env, npm_config_yes: 'true' }
      }
    );
    assert.equal(
      install.status,
      0,
      `npm install smoke fixture failed:\n${install.stdout}\n${install.stderr}`
    );

    const { cmd, argsPrefix } = resolveTsc();
    // Avoid shell:true with node.exe under "Program Files" (Windows splits the path).
    const tsc = spawnSync(cmd, [...argsPrefix, '-p', tmp], {
      cwd: tmp,
      encoding: 'utf8',
      shell: cmd === 'npx' && process.platform === 'win32',
      env: { ...process.env, npm_config_yes: 'true' }
    });
    assert.equal(
      tsc.status,
      0,
      `tsc --noEmit failed (Eje IV):\n${tsc.stdout}\n${tsc.stderr}`
    );
    assert.doesNotMatch(`${tsc.stdout}\n${tsc.stderr}`, /error TS/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
