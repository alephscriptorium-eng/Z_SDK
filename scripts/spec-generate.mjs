/**
 * Regenerate all HTTP OpenAPI specs + mcp-resources.md.
 * Run: npm run spec:generate:http
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMcpResourceCatalog } from '../packages/lib/http-contract/spec/build.mjs';
import { buildMcpHttpSpec } from '../packages/lib/presets-sdk/spec/build.mjs';
import { buildHorsePresetSpec } from '../packages/lib/presets-sdk/src/horse/build.mjs';
import { buildEditorSpec } from '../packages/app/editor-ui/spec/build.mjs';
import { buildPlayerSpec } from '../packages/app/player-ui/spec/build.mjs';
import { buildViewSpec } from '../packages/app/view-ui/spec/build.mjs';
import { buildFirehoseSpec } from '../packages/app/firehose-view-ui/spec/build.mjs';
import { buildAllSpecs } from '@alephscript/mcp-core-sdk/spec';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const generators = [
  {
    rel: 'packages/lib/http-contract/spec/mcp-resources.md',
    build: buildMcpResourceCatalog
  },
  {
    rel: 'packages/lib/presets-sdk/spec/mcp-http.openapi.yaml',
    build: buildMcpHttpSpec
  },
  {
    rel: 'packages/lib/presets-sdk/spec/horse-preset.openapi.yaml',
    build: buildHorsePresetSpec
  },
  {
    rel: 'packages/app/editor-ui/spec/openapi.yaml',
    build: buildEditorSpec
  },
  {
    rel: 'packages/app/player-ui/spec/openapi.yaml',
    build: buildPlayerSpec
  },
  {
    rel: 'packages/app/view-ui/spec/openapi.yaml',
    build: buildViewSpec
  },
  {
    rel: 'packages/app/firehose-view-ui/spec/openapi.yaml',
    build: buildFirehoseSpec
  },
  {
    rel: 'packages/lib/http-contract/spec/mcp-core/runtime.asyncapi.yaml',
    build: () => buildAllSpecs().asyncapi
  },
  {
    rel: 'packages/lib/http-contract/spec/mcp-core/control-plane.openapi.yaml',
    build: () => buildAllSpecs().openapi
  }
];

for (const { rel, build } of generators) {
  const outPath = path.join(root, rel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  console.log(`→ ${rel}`);
  fs.writeFileSync(outPath, build());
}

console.log('HTTP specs generated.');
