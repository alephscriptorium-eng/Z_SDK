import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSpecMatches } from '@zeus/http-contract';
import { buildAsyncApiSpec } from '../spec/build.mjs';
import { EVENT_KINDS } from '../src/index.mjs';

const specPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'spec',
  'asyncapi.yaml'
);

test('AsyncAPI lists the four event kinds', () => {
  const yaml = buildAsyncApiSpec();
  for (const kind of EVENT_KINDS) {
    assert.match(yaml, new RegExp(`name: ${kind}`));
  }
  assert.match(yaml, /title: Zeus Protocol/);
  assert.match(yaml, /game:/);
});

test('asyncapi.yaml is in sync with generator', () => {
  assertSpecMatches(buildAsyncApiSpec, specPath, 'npm run spec:generate -w @zeus/protocol');
});
