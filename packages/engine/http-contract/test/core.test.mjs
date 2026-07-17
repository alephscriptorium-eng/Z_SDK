import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { z } from 'zod';
import {
  defineRoutes,
  assertNoRouteCollisions,
  buildOpenApiDoc,
  renderRouteIndex,
  expressPathToOpenApi,
  assertSpecMatches,
  ErrorPlain,
  Envelopes
} from '../src/index.mjs';

test('defineRoutes validates entries', () => {
  const routes = defineRoutes('test', [
    {
      id: 'health',
      method: 'GET',
      path: '/health',
      summary: 'Health check',
      responses: { 200: z.object({ status: z.string() }) }
    }
  ]);
  assert.equal(routes.length, 1);
});

test('assertNoRouteCollisions detects duplicates', () => {
  const routes = defineRoutes('test', [
    {
      id: 'a',
      method: 'GET',
      path: '/x',
      summary: 'a',
      responses: { 200: z.object({}) }
    },
    {
      id: 'b',
      method: 'GET',
      path: '/x',
      summary: 'b',
      responses: { 200: z.object({}) }
    }
  ]);
  assert.throws(() => assertNoRouteCollisions(routes), /duplicate route/);
});

test('expressPathToOpenApi converts params', () => {
  assert.equal(expressPathToOpenApi('/api/presets/:id'), '/api/presets/{id}');
});

test('buildOpenApiDoc produces YAML with operationId', () => {
  const yaml = buildOpenApiDoc(
    defineRoutes('test', [
      {
        id: 'health',
        method: 'GET',
        path: '/health',
        summary: 'Health',
        responses: { 200: z.object({ status: z.literal('ok') }) },
        envelope: 'plain'
      }
    ]),
    { title: 'Test API', version: '0.0.1' }
  );
  assert.match(yaml, /operationId: health/);
  assert.match(yaml, /openapi: 3\.1\.0/);
});

test('renderRouteIndex is deterministic table', () => {
  const routes = defineRoutes('test', [
    {
      id: 'b',
      method: 'GET',
      path: '/b',
      summary: 'B route',
      responses: { 200: z.object({}) }
    },
    {
      id: 'a',
      method: 'GET',
      path: '/a',
      summary: 'A route',
      responses: { 200: z.object({}) }
    }
  ]);
  const table = renderRouteIndex(routes);
  assert.match(table, /\| GET \| `\/a` \| A route \|/);
  const aPos = table.indexOf('/a');
  const bPos = table.indexOf('/b');
  assert.ok(aPos < bPos, 'sorted by path');
});

test('envelope schemas parse samples', () => {
  assert.ok(ErrorPlain.safeParse({ error: 'x' }).success);
  assert.ok(Envelopes.ErrorEnvelopeEditor.safeParse({ success: false, error: 'x' }).success);
});

test('assertSpecMatches compares in memory', () => {
  const tmpDir = import.meta.dirname;
  const specPath = `${tmpDir}/.tmp-spec.yaml`;
  const build = () => 'openapi: 3.1.0\n';
  fs.writeFileSync(specPath, build());
  try {
    assertSpecMatches(build, specPath);
    assert.throws(
      () => assertSpecMatches(() => 'drift\n', specPath),
      /spec drift/
    );
  } finally {
    fs.unlinkSync(specPath);
  }
});
