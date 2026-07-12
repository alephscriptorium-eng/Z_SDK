import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  loadZeusEnv,
  resetZeusEnvLoader,
  MONOREPO_ROOT,
  resolveDiscoverySources,
  resolveVolume,
  resetVolumesCache
} from '../src/index.mjs';

test('MONOREPO_ROOT points at zeus-sdk package root', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(MONOREPO_ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.name, 'zeus-sdk');
});

test('env volumes and discovery', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-env-volumes-'));

  try {
    fs.mkdirSync(path.join(tempRoot, 'VOLUMES', 'DISK_02', 'LINEAS'), { recursive: true });
    fs.writeFileSync(
      path.join(tempRoot, 'VOLUMES', 'volumes.json'),
      JSON.stringify({
        root: '.',
        volumes: {
          lineas: {
            disk: 'DISK_02',
            path: 'DISK_02/LINEAS',
            readonly: true,
            label: 'Lineas de poder'
          }
        }
      }),
      'utf8'
    );

    const prevVolumesRoot = process.env.ZEUS_VOLUMES_ROOT;
    const prevMcpSun = process.env.ZEUS_MCP_SUN;

    process.env.ZEUS_VOLUMES_ROOT = path.join(tempRoot, 'VOLUMES');
    process.env.ZEUS_MCP_SUN = '5101';

    resetZeusEnvLoader();
    resetVolumesCache();
    loadZeusEnv(tempRoot);

    const lineas = resolveVolume('lineas');
    const expected = path.join(tempRoot, 'VOLUMES', 'DISK_02', 'LINEAS');
    assert.equal(lineas.absPath, path.resolve(expected), 'lineas path derived from ZEUS_VOLUMES_ROOT');

    const discovery = resolveDiscoverySources({});
    assert.ok(
      discovery.urls.includes('http://localhost:5101'),
      'resolveDiscoverySources honors ZEUS_MCP_SUN from env'
    );

    if (prevVolumesRoot == null) delete process.env.ZEUS_VOLUMES_ROOT;
    else process.env.ZEUS_VOLUMES_ROOT = prevVolumesRoot;
    if (prevMcpSun == null) delete process.env.ZEUS_MCP_SUN;
    else process.env.ZEUS_MCP_SUN = prevMcpSun;

    resetZeusEnvLoader();
    resetVolumesCache();
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
