import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSpecMatches } from '@zeus/http-contract';
import { EVENTS } from '../src/protocol.mjs';
import { INBOUND_SCHEMAS } from '../src/schemas/inbound.mjs';
import { OUTBOUND_SCHEMAS } from '../src/schemas/outbound.mjs';
import { buildAsyncApiSpec } from '../spec/build.mjs';

const specPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'spec', 'asyncapi.yaml');

test('EVENTS manifest aligns with schema maps', () => {
  for (const [event, meta] of Object.entries(EVENTS)) {
    if (meta.direction === 'inbound') {
      assert.ok(INBOUND_SCHEMAS.has(event), `missing inbound schema for ${event}`);
    } else {
      assert.ok(OUTBOUND_SCHEMAS.has(event), `missing outbound schema for ${event}`);
    }
  }
});

test('asyncapi.yaml is in sync with generator (in-memory)', () => {
  assertSpecMatches(buildAsyncApiSpec, specPath, 'npm run spec:generate -w @zeus/session-protocol');
});
