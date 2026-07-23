/**
 * Eje IV gate — two independent TS consumers resolve subpath `"types"`
 * via `tsc --noEmit` (WP-U155).
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
const fixtureSrc = path.join(here, 'fixtures', 'ts-subpath-smoke');
const protocolRoot = path.join(here, '..');

function resolveTsc() {
  const require = createRequire(import.meta.url);
  const candidates = [
    'typescript/bin/tsc',
    path.join(protocolRoot, '../../../node_modules/typescript/bin/tsc'),
    path.join(protocolRoot, '../../../../node_modules/typescript/bin/tsc')
  ];
  for (const id of candidates) {
    try {
      const resolved = id.includes('/') || id.includes('\\')
        ? id
        : require.resolve(id);
      if (fs.existsSync(resolved)) return { cmd: process.execPath, argsPrefix: [resolved] };
    } catch {
      /* try next */
    }
  }
  return { cmd: 'npx', argsPrefix: ['--yes', '-p', 'typescript@5.9.3', 'tsc'] };
}

test('Eje IV: tsc resolves peer-card-seat + roles subpath types (two consumers)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u155-ts-'));
  try {
    for (const name of ['consumer-seat.ts', 'consumer-roles.ts', 'tsconfig.json']) {
      fs.copyFileSync(path.join(fixtureSrc, name), path.join(tmp, name));
    }
    // Absolute file: link — relative path in fixture is only documentation.
    const protocolAbs = path.resolve(protocolRoot).replace(/\\/g, '/');
    fs.writeFileSync(
      path.join(tmp, 'package.json'),
      JSON.stringify(
        {
          name: 'zeus-protocol-ts-subpath-smoke',
          private: true,
          type: 'module',
          dependencies: {
            '@zeus/protocol': `file:${protocolAbs}`,
            '@types/node': '22.10.2'
          }
        },
        null,
        2
      )
    );

    const install = spawnSync(
      'npm',
      ['install', '--no-package-lock', '--ignore-scripts'],
      {
        cwd: tmp,
        encoding: 'utf8',
        shell: true
      }
    );
    assert.equal(
      install.status,
      0,
      `npm install smoke fixture failed:\n${install.stdout}\n${install.stderr}`
    );

    const { cmd, argsPrefix } = resolveTsc();
    const tsc = spawnSync(cmd, [...argsPrefix, '-p', tmp], {
      cwd: tmp,
      encoding: 'utf8',
      shell: true,
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
