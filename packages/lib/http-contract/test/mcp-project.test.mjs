import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import {
  defineRoutes,
  projectRoutesToMcp,
  resolveRouteMcpUri,
  fillExpressPath,
  bindProjectedHttpReaders,
  renderRouteMcpCatalog
} from '../src/index.mjs';

const SAMPLE = defineRoutes('sample', [
  {
    id: 'health',
    method: 'GET',
    path: '/health',
    summary: 'Health',
    responses: { 200: z.object({ ok: z.literal(true) }) },
    envelope: 'plain'
  },
  {
    id: 'stats',
    method: 'GET',
    path: '/api/stats',
    summary: 'Stats',
    responses: { 200: z.looseObject({}) },
    envelope: 'plain',
    xMcpResource: 'firehose://stats'
  },
  {
    id: 'corpora.get',
    method: 'GET',
    path: '/api/corpora/:corpusId',
    summary: 'Corpus by id',
    request: { params: z.object({ corpusId: z.string() }) },
    responses: { 200: z.looseObject({}) },
    envelope: 'plain',
    xMcpResource: 'firehose://corpus/{corpusId}'
  },
  {
    id: 'mutate',
    method: 'POST',
    path: '/api/x',
    summary: 'Mutation',
    responses: { 200: z.object({ ok: z.literal(true) }) },
    envelope: 'plain'
  }
]);

test('projectRoutesToMcp maps GET to resources and templates; skips POST', () => {
  const { resources, templates } = projectRoutesToMcp(SAMPLE);

  assert.equal(resources.length, 2);
  assert.equal(templates.length, 1);
  assert.ok(resources.some((r) => r.uri === 'firehose://stats'));
  assert.ok(resources.some((r) => r.uri === 'rest://health'));
  assert.equal(templates[0].uriTemplate, 'firehose://corpus/{corpusId}');
  assert.equal(templates[0].routeId, 'corpora.get');
  assert.ok(!resources.some((r) => r.routeId === 'mutate'));
  assert.ok(!templates.some((t) => t.routeId === 'mutate'));
});

test('resolveRouteMcpUri prefers xMcpResource over derived rest:// URI', () => {
  assert.equal(
    resolveRouteMcpUri(SAMPLE.find((r) => r.id === 'stats')),
    'firehose://stats'
  );
  assert.equal(
    resolveRouteMcpUri(SAMPLE.find((r) => r.id === 'health')),
    'rest://health'
  );
  assert.equal(
    resolveRouteMcpUri(SAMPLE.find((r) => r.id === 'corpora.get')),
    'firehose://corpus/{corpusId}'
  );
});

test('fillExpressPath substitutes path params', () => {
  assert.equal(
    fillExpressPath('/api/corpora/:corpusId', { corpusId: 'candidate' }),
    '/api/corpora/candidate'
  );
});

test('bindProjectedHttpReaders GETs baseUrl + filled path', async () => {
  const calls = [];
  const projected = projectRoutesToMcp(SAMPLE);
  const { registry, templateRegistry } = bindProjectedHttpReaders(projected, {
    baseUrl: 'http://example.test',
    fetchImpl: async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ url })
      };
    }
  });

  const stats = await registry.find((r) => r.uri === 'firehose://stats').read();
  assert.equal(stats.url, 'http://example.test/api/stats');

  const corpus = await templateRegistry
    .find((t) => t.uriTemplate === 'firehose://corpus/{corpusId}')
    .read({ corpusId: 'candidate' });
  assert.equal(corpus.url, 'http://example.test/api/corpora/candidate');
  assert.deepEqual(calls, [
    'http://example.test/api/stats',
    'http://example.test/api/corpora/candidate'
  ]);
});

test('renderRouteMcpCatalog lists resource-template rows', () => {
  const md = renderRouteMcpCatalog(SAMPLE);
  assert.match(md, /resource-template/);
  assert.match(md, /firehose:\/\/corpus\/\{corpusId\}/);
  assert.match(md, /corpora\.get/);
});
