import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSpecMatches } from '@zeus/http-contract';
import { buildFirehoseSpec } from '../spec/build.mjs';

const specPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'spec', 'openapi.yaml');

test('firehose openapi.yaml is in sync (in-memory)', () => {
  assertSpecMatches(buildFirehoseSpec, specPath, 'node packages/mesh/firehose-browser/spec/generate.mjs');
});
