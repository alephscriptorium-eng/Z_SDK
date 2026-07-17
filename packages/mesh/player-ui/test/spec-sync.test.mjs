import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSpecMatches } from '@zeus/http-contract';
import { buildPlayerSpec } from '../spec/build.mjs';

const specPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'spec', 'openapi.yaml');

test('player openapi.yaml is in sync (in-memory)', () => {
  assertSpecMatches(buildPlayerSpec, specPath, 'node packages/mesh/player-ui/spec/generate.mjs');
});
