import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSpecMatches } from '@zeus/http-contract';
import { buildMcpHttpSpec } from '../spec/build.mjs';

const specPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'spec', 'mcp-http.openapi.yaml');

test('mcp-http.openapi.yaml is in sync (in-memory)', () => {
  assertSpecMatches(buildMcpHttpSpec, specPath, 'npm run spec:generate -w @zeus/presets-sdk');
});
