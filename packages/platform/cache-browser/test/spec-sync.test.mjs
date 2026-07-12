import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSpecMatches } from '@zeus/http-contract';
import { buildViewSpec } from '../spec/build.mjs';

const specPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'spec', 'openapi.yaml');

test('view openapi.yaml is in sync (in-memory)', () => {
  assertSpecMatches(buildViewSpec, specPath, 'node packages/platform/cache-browser/spec/generate.mjs');
});
