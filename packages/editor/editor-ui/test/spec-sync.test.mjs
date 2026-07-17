import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSpecMatches } from '@zeus/http-contract';
import { buildEditorSpec } from '../spec/build.mjs';

const specPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'spec', 'openapi.yaml');

test('editor openapi.yaml is in sync (in-memory)', () => {
  assertSpecMatches(buildEditorSpec, specPath, 'node packages/editor/editor-ui/spec/generate.mjs');
});
