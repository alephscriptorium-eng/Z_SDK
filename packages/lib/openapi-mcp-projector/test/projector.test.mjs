import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectOpenApiFile } from '../src/index.mjs';

const playerOpenApi = path.join(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../app/player-ui/spec/openapi.yaml'
);

test('projects player-ui OpenAPI to listable MCP tools', () => {
  const projected = projectOpenApiFile(playerOpenApi);
  assert.ok(Array.isArray(projected.tools));
  assert.ok(projected.tools.length > 0, 'expected at least one tool from mutations');
  assert.ok(projected.templates.length > 0 || projected.resources.length > 0, 'expected GET projections');
  for (const t of projected.tools) {
    assert.ok(t.name);
    assert.ok(t.inputSchema);
  }
});
