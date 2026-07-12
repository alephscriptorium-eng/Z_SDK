import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { buildOpenApiDoc, defineRoutes } from '../src/index.mjs';

test('buildOpenApiDoc preserves multiple $defs as distinct component refs', () => {
  const Part = z.object({ label: z.string() });
  const Tag = z.object({ count: z.number() });
  const body = z.object({
    first: Part,
    second: Tag,
    alsoFirst: Part,
    alsoTag: Tag
  });

  const yaml = buildOpenApiDoc(
    defineRoutes('test', [
      {
        id: 'multi_def',
        method: 'POST',
        path: '/multi-def',
        summary: 'Body with nested defs',
        request: { body },
        responses: { 200: z.object({ ok: z.literal(true) }) },
        envelope: 'plain'
      }
    ]),
    { title: 'Multi Def Test', version: '0.0.1' }
  );

  assert.match(yaml, /\$ref: "#\/components\/schemas\/__schema0"/);
  assert.match(yaml, /\$ref: "#\/components\/schemas\/__schema1"/);
  assert.match(yaml, /__schema0:/);
  assert.match(yaml, /__schema1:/);
});
