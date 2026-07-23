/**
 * Regenerate all HTTP OpenAPI specs + mcp-resources.md.
 * Run: npm run spec:generate:http
 *
 * WP-U161 · excepción ops firmada: `buildAllSpecs` sigue viniendo de
 * `@alephscript/mcp-core-sdk/spec` (devDependency de root). Genera los YAML
 * bajo `packages/engine/http-contract/spec/mcp-core/`. No se extrae stub a
 * Zeus en este WP: es tooling de regeneración de specs del plano mcp-core,
 * no runtime de consumidores `@zeus/*`. Extraer stub = WP futuro con GO.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMcpResourceCatalog } from '../packages/engine/http-contract/spec/build.mjs';
import { buildMcpHttpSpec } from '../packages/engine/presets-sdk/spec/build.mjs';
import { buildHorsePresetSpec } from '../packages/engine/presets-sdk/src/horse/build.mjs';
import { buildEditorSpec } from '../packages/editor/editor-ui/spec/build.mjs';
import { buildPlayerSpec } from '../packages/mesh/player-ui/spec/build.mjs';
import { buildViewSpec } from '../packages/mesh/cache-browser/spec/build.mjs';
import { buildFirehoseSpec } from '../packages/mesh/firehose-browser/spec/build.mjs';
import { buildAllSpecs } from '@alephscript/mcp-core-sdk/spec';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const generators = [
  {
    rel: 'packages/engine/http-contract/spec/mcp-resources.md',
    build: buildMcpResourceCatalog
  },
  {
    rel: 'packages/engine/presets-sdk/spec/mcp-http.openapi.yaml',
    build: buildMcpHttpSpec
  },
  {
    rel: 'packages/engine/presets-sdk/spec/horse-preset.openapi.yaml',
    build: buildHorsePresetSpec
  },
  {
    rel: 'packages/editor/editor-ui/spec/openapi.yaml',
    build: buildEditorSpec
  },
  {
    rel: 'packages/mesh/player-ui/spec/openapi.yaml',
    build: buildPlayerSpec
  },
  {
    rel: 'packages/mesh/cache-browser/spec/openapi.yaml',
    build: buildViewSpec
  },
  {
    rel: 'packages/mesh/firehose-browser/spec/openapi.yaml',
    build: buildFirehoseSpec
  },
  {
    rel: 'packages/engine/http-contract/spec/mcp-core/runtime.asyncapi.yaml',
    build: () => buildAllSpecs().asyncapi
  },
  {
    rel: 'packages/engine/http-contract/spec/mcp-core/control-plane.openapi.yaml',
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
