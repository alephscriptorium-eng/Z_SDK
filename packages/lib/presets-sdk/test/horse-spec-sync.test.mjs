import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSpecMatches } from '@zeus/http-contract';
import { buildHorsePresetSpec } from '../src/horse/build.mjs';

const specPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'spec',
  'horse-preset.openapi.yaml'
);

test('horse-preset.openapi.yaml is in sync (in-memory)', () => {
  assertSpecMatches(buildHorsePresetSpec, specPath, 'npm run spec:generate:http');
});
