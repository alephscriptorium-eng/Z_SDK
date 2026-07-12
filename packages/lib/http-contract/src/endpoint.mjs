import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveAppPort,
  resolveZeusHost,
  resolveZeusUiPorts
} from '@zeus/presets-sdk/env';

const OPENAPI_SERVER_DESCRIPTIONS = {
  editor: 'editor-ui default',
  player: 'player-ui default',
  view: 'view-ui default',
  firehose: 'firehose-view-ui default'
};

/**
 * OpenAPI `servers[]` entry from ZEUS_HOST + ZEUS_PORT_* env.
 * @param {'editor'|'player'|'view'|'firehose'} appId
 */
export function zeusOpenApiServers(appId) {
  const host = resolveZeusHost();
  const uis = resolveZeusUiPorts();
  const fallbackPort = uis[appId]?.port ?? 3000;
  const port = resolveAppPort(appId, fallbackPort);
  return [
    {
      url: `http://${host}:${port}`,
      description: OPENAPI_SERVER_DESCRIPTIONS[appId] ?? `${appId} default`
    }
  ];
}

/**
 * Read `version` from the nearest package.json (parent of caller's directory).
 * @param {string} importMetaUrl — pass `import.meta.url` from spec/build.mjs
 */
export function readPackageVersion(importMetaUrl) {
  const callerDir = dirname(fileURLToPath(importMetaUrl));
  const pkgPath = join(callerDir, '..', 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  return pkg.version;
}
