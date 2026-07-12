import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSpecMatches } from '../src/spec-sync.mjs';
import { renderMcpResourceCatalog } from '../src/openapi.mjs';
import { RESOURCE_PAYLOADS } from '../src/mcp-resources/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const specPath = path.join(__dirname, '..', 'spec', 'mcp-resources.md');

test('RESOURCE_PAYLOADS covers expected URIs', () => {
  assert.ok(RESOURCE_PAYLOADS.has('linea://info'));
  assert.ok(RESOURCE_PAYLOADS.has('linea://registros/year/{year}'));
  assert.ok(RESOURCE_PAYLOADS.has('firehose://stats'));
  assert.ok(RESOURCE_PAYLOADS.has('body://info'));
  assert.ok(RESOURCE_PAYLOADS.has('server://card'));
  assert.ok(RESOURCE_PAYLOADS.size >= 17);
});

test('mcp-resources.md is in sync (in-memory)', () => {
  assertSpecMatches(
    () => renderMcpResourceCatalog(RESOURCE_PAYLOADS),
    specPath,
    'npm run spec:generate -w @zeus/http-contract'
  );
});
