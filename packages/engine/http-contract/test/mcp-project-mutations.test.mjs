/**
 * WP-U172 — mutation RouteEntry → MCP tool projection.
 * GET readers stay resources/templates; POST/PUT/PATCH/DELETE become gated tools.
 * The gate + wire are injected by the consumer (D-8): no game names here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import {
  defineRoutes,
  projectRoutesToMcp,
  projectRouteToMcpTool,
  bindProjectedHttpMutators,
  bindProjectedHttpReaders,
  renderRouteMcpCatalog,
  MUTATION_METHODS
} from '../src/index.mjs';

const ROUTES = defineRoutes('u172-sample', [
  {
    id: 'reparto.list',
    method: 'GET',
    path: '/api/reparto',
    summary: 'List cast',
    responses: { 200: z.looseObject({}) },
    envelope: 'plain'
  },
  {
    id: 'reparto.add',
    method: 'POST',
    path: '/api/reparto',
    summary: 'Add cast member',
    request: { body: z.object({ nombre: z.string(), acto: z.number().int() }) },
    responses: { 201: z.object({ ok: z.literal(true) }) },
    envelope: 'plain'
  },
  {
    id: 'linea.update',
    method: 'PUT',
    path: '/api/lineas/:lineaId',
    summary: 'Update line',
    request: {
      params: z.object({ lineaId: z.string() }),
      body: z.object({ texto: z.string() })
    },
    responses: { 200: z.object({ ok: z.literal(true) }) },
    envelope: 'plain'
  }
]);

// Consumer-injected approval gate (D-8) — engine never names it.
const APPROVAL_TOKEN = 'gate-ok';
function makeGate() {
  return (ctx) => {
    if (ctx.args?.approve !== true) {
      return {
        ok: false,
        error: 'Mutation refused: approval required',
        rule: 'demo.approval_required',
        gate: { tool: ctx.tool, token_required: true }
      };
    }
    if (ctx.args?.approvalToken !== APPROVAL_TOKEN) {
      return {
        ok: false,
        error: 'Mutation refused: token mismatch',
        rule: 'demo.token_mismatch',
        gate: { tool: ctx.tool }
      };
    }
    return { ok: true, gate: { tool: ctx.tool, approved_by: 'reparto-lead' } };
  };
}

test('projectRoutesToMcp projects mutations as tools; GET readers intact', () => {
  const { resources, templates, tools } = projectRoutesToMcp(ROUTES);

  // GET side unchanged: one resource, no templates.
  assert.equal(resources.length, 1);
  assert.equal(templates.length, 0);
  assert.equal(resources[0].routeId, 'reparto.list');
  assert.equal(resources[0].uri, 'rest://api/reparto');

  // Mutations projected as tools, carrying their zod envelope schema.
  assert.equal(tools.length, 2);
  const add = tools.find((t) => t.routeId === 'reparto.add');
  const upd = tools.find((t) => t.routeId === 'linea.update');
  assert.equal(add.name, 'reparto.add');
  assert.equal(add.method, 'POST');
  assert.equal(add.path, '/api/reparto');
  assert.ok(add.bodySchema, 'body schema carried onto tool');
  assert.equal(add.paramsSchema, null);
  assert.equal(upd.method, 'PUT');
  assert.ok(upd.paramsSchema, 'params schema carried onto tool');
});

test('projectRouteToMcpTool honours xMcpTool override', () => {
  const route = {
    id: 'reparto.add',
    method: 'post',
    path: '/api/reparto',
    summary: 'Add',
    xMcpTool: 'reparto_add',
    responses: { 201: z.object({}) }
  };
  const tool = projectRouteToMcpTool(route);
  assert.equal(tool.name, 'reparto_add');
  assert.equal(tool.method, 'POST');
  assert.equal(tool.xMcpTool, 'reparto_add');
});

test('MUTATION_METHODS is the non-GET write set', () => {
  assert.ok(MUTATION_METHODS.has('POST'));
  assert.ok(MUTATION_METHODS.has('PUT'));
  assert.ok(MUTATION_METHODS.has('PATCH'));
  assert.ok(MUTATION_METHODS.has('DELETE'));
  assert.ok(!MUTATION_METHODS.has('GET'));
});

test('GREEN: gated + valid envelope → mutation performed, gate card approved', async () => {
  const calls = [];
  const { tools } = projectRoutesToMcp(ROUTES);
  const { toolRegistry } = bindProjectedHttpMutators(
    { tools },
    {
      baseUrl: 'http://example.test',
      gate: makeGate(),
      fetchImpl: async (url, init) => {
        calls.push({ url, method: init.method, body: init.body });
        return { ok: true, status: 201, text: async () => JSON.stringify({ ok: true }) };
      }
    }
  );

  const add = toolRegistry.find((t) => t.name === 'reparto.add');
  const res = await add.call({
    body: { nombre: 'A', acto: 1 },
    approve: true,
    approvalToken: APPROVAL_TOKEN
  });

  assert.equal(res.ok, true);
  assert.equal(res.status, 201);
  assert.deepEqual(res.data, { ok: true });
  assert.equal(res.gate.approved, true);
  assert.equal(res.gate.tool, 'reparto.add');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].url, 'http://example.test/api/reparto');
  assert.deepEqual(JSON.parse(calls[0].body), { nombre: 'A', acto: 1 });
});

test('GREEN: PUT tool fills :param path and mutates', async () => {
  const calls = [];
  const { tools } = projectRoutesToMcp(ROUTES);
  const { toolRegistry } = bindProjectedHttpMutators(
    { tools },
    {
      baseUrl: 'http://example.test/',
      gate: makeGate(),
      fetchImpl: async (url, init) => {
        calls.push({ url, method: init.method });
        return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true }) };
      }
    }
  );

  const upd = toolRegistry.find((t) => t.name === 'linea.update');
  const res = await upd.call({
    params: { lineaId: 'L7' },
    body: { texto: 'hola' },
    approve: true,
    approvalToken: APPROVAL_TOKEN
  });

  assert.equal(res.ok, true);
  assert.equal(calls[0].method, 'PUT');
  assert.equal(calls[0].url, 'http://example.test/api/lineas/L7');
});

test('RED: no gate wired → refused, network never hit', async () => {
  let fetched = false;
  const { tools } = projectRoutesToMcp(ROUTES);
  const { toolRegistry } = bindProjectedHttpMutators(
    { tools },
    {
      baseUrl: 'http://example.test',
      fetchImpl: async () => {
        fetched = true;
        return { ok: true, status: 200, text: async () => '{}' };
      }
    }
  );

  const add = toolRegistry.find((t) => t.name === 'reparto.add');
  const res = await add.call({ body: { nombre: 'A', acto: 1 } });

  assert.equal(res.ok, false);
  assert.equal(res.rule, 'http-contract.gate_missing');
  assert.equal(res.gate.approved, false);
  assert.equal(fetched, false);
});

test('RED: gate denies → refused, gate card visible, network never hit', async () => {
  let fetched = false;
  const { tools } = projectRoutesToMcp(ROUTES);
  const { toolRegistry } = bindProjectedHttpMutators(
    { tools },
    {
      baseUrl: 'http://example.test',
      gate: makeGate(),
      fetchImpl: async () => {
        fetched = true;
        return { ok: true, status: 200, text: async () => '{}' };
      }
    }
  );

  const add = toolRegistry.find((t) => t.name === 'reparto.add');
  const res = await add.call({ body: { nombre: 'A', acto: 1 }, approve: false });

  assert.equal(res.ok, false);
  assert.equal(res.rule, 'demo.approval_required');
  assert.equal(res.gate.approved, false);
  assert.equal(res.gate.detail.tool, 'reparto.add');
  assert.equal(fetched, false);
});

test('RED: gate ok but invalid body envelope → VALIDATION_ERROR, network never hit', async () => {
  let fetched = false;
  const { tools } = projectRoutesToMcp(ROUTES);
  const { toolRegistry } = bindProjectedHttpMutators(
    { tools },
    {
      baseUrl: 'http://example.test',
      gate: makeGate(),
      fetchImpl: async () => {
        fetched = true;
        return { ok: true, status: 201, text: async () => '{}' };
      }
    }
  );

  const add = toolRegistry.find((t) => t.name === 'reparto.add');
  const res = await add.call({
    body: { nombre: 'A' }, // missing `acto`
    approve: true,
    approvalToken: APPROVAL_TOKEN
  });

  assert.equal(res.ok, false);
  assert.equal(res.code, 'VALIDATION_ERROR');
  assert.equal(res.gate.approved, true); // gate passed; envelope failed
  assert.equal(res.details[0].part, 'body');
  assert.equal(fetched, false);
});

test('RED: gate ok but invalid params envelope → VALIDATION_ERROR', async () => {
  const { tools } = projectRoutesToMcp(ROUTES);
  const { toolRegistry } = bindProjectedHttpMutators(
    { tools },
    {
      baseUrl: 'http://example.test',
      gate: makeGate(),
      fetchImpl: async () => ({ ok: true, status: 200, text: async () => '{}' })
    }
  );

  const upd = toolRegistry.find((t) => t.name === 'linea.update');
  const res = await upd.call({
    params: {}, // missing lineaId
    body: { texto: 'x' },
    approve: true,
    approvalToken: APPROVAL_TOKEN
  });

  assert.equal(res.ok, false);
  assert.equal(res.code, 'VALIDATION_ERROR');
  assert.equal(res.details[0].part, 'params');
});

test('GET readers still bind alongside mutation tools (no regression)', async () => {
  const projected = projectRoutesToMcp(ROUTES);
  const { registry } = bindProjectedHttpReaders(projected, {
    baseUrl: 'http://example.test',
    fetchImpl: async (url) => ({ ok: true, status: 200, text: async () => JSON.stringify({ url }) })
  });
  assert.equal(registry.length, 1);
  const read = await registry[0].read();
  assert.equal(read.url, 'http://example.test/api/reparto');
});

test('renderRouteMcpCatalog lists tool rows for mutations', () => {
  const md = renderRouteMcpCatalog(ROUTES);
  assert.match(md, /\| tool \|/);
  assert.match(md, /reparto\.add/);
  assert.match(md, /tool:reparto\.add/);
});

// --- Corrección tras contrarrevisión (OBS-1/2/3) ---------------------------

test('RED (OBS-1): non-strict schema + extra field → sanitised body reaches endpoint', async () => {
  const calls = [];
  const { tools } = projectRoutesToMcp(ROUTES); // reparto.add body is non-strict
  const { toolRegistry } = bindProjectedHttpMutators(
    { tools },
    {
      baseUrl: 'http://example.test',
      gate: makeGate(),
      fetchImpl: async (url, init) => {
        calls.push({ body: init.body });
        return { ok: true, status: 201, text: async () => JSON.stringify({ ok: true }) };
      }
    }
  );

  const add = toolRegistry.find((t) => t.name === 'reparto.add');
  const res = await add.call({
    body: { nombre: 'A', acto: 1, evilExtra: 'leak' },
    approve: true,
    approvalToken: APPROVAL_TOKEN
  });

  assert.equal(res.ok, true);
  const sent = JSON.parse(calls[0].body);
  assert.deepEqual(sent, { nombre: 'A', acto: 1 });
  assert.equal('evilExtra' in sent, false, 'unknown key must not be forwarded');
});

test('OBS-2: duplicate tool name (colliding xMcpTool) throws in projection', () => {
  const DUP = defineRoutes('u172-dup', [
    {
      id: 'a.create',
      method: 'POST',
      path: '/api/a',
      summary: 'A',
      xMcpTool: 'shared_name',
      responses: { 201: z.object({ ok: z.literal(true) }) }
    },
    {
      id: 'b.create',
      method: 'POST',
      path: '/api/b',
      summary: 'B',
      xMcpTool: 'shared_name',
      responses: { 201: z.object({ ok: z.literal(true) }) }
    }
  ]);
  assert.throws(() => projectRoutesToMcp(DUP), /duplicate MCP tool name: shared_name/);
});

const RW_ROUTES = defineRoutes('u172-rw', [
  {
    id: 'linea.patch',
    method: 'PATCH',
    path: '/api/lineas/:lineaId',
    summary: 'Patch line',
    request: {
      params: z.object({ lineaId: z.string() }),
      body: z.object({ texto: z.string() })
    },
    responses: { 200: z.object({ ok: z.literal(true) }) },
    envelope: 'plain'
  },
  {
    id: 'linea.remove',
    method: 'DELETE',
    path: '/api/lineas/:lineaId',
    summary: 'Delete line',
    request: { params: z.object({ lineaId: z.string() }) },
    responses: { 200: z.object({ ok: z.literal(true) }) },
    envelope: 'plain'
  }
]);

test('GREEN (OBS-3): PATCH round-trip gate→validate→fetch', async () => {
  const calls = [];
  const { tools } = projectRoutesToMcp(RW_ROUTES);
  const { toolRegistry } = bindProjectedHttpMutators(
    { tools },
    {
      baseUrl: 'http://example.test',
      gate: makeGate(),
      fetchImpl: async (url, init) => {
        calls.push({ url, method: init.method, body: init.body });
        return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true }) };
      }
    }
  );

  const patch = toolRegistry.find((t) => t.name === 'linea.patch');
  const res = await patch.call({
    params: { lineaId: 'L9' },
    body: { texto: 'nuevo' },
    approve: true,
    approvalToken: APPROVAL_TOKEN
  });

  assert.equal(res.ok, true);
  assert.equal(calls[0].method, 'PATCH');
  assert.equal(calls[0].url, 'http://example.test/api/lineas/L9');
  assert.deepEqual(JSON.parse(calls[0].body), { texto: 'nuevo' });
});

test('GREEN (OBS-3): DELETE round-trip gate→validate→fetch', async () => {
  const calls = [];
  const { tools } = projectRoutesToMcp(RW_ROUTES);
  const { toolRegistry } = bindProjectedHttpMutators(
    { tools },
    {
      baseUrl: 'http://example.test',
      gate: makeGate(),
      fetchImpl: async (url, init) => {
        calls.push({ url, method: init.method });
        return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true }) };
      }
    }
  );

  const del = toolRegistry.find((t) => t.name === 'linea.remove');
  const res = await del.call({
    params: { lineaId: 'L9' },
    approve: true,
    approvalToken: APPROVAL_TOKEN
  });

  assert.equal(res.ok, true);
  assert.equal(calls[0].method, 'DELETE');
  assert.equal(calls[0].url, 'http://example.test/api/lineas/L9');
});

test('RED (OBS-3): DELETE with invalid params → VALIDATION_ERROR, network never hit', async () => {
  let fetched = false;
  const { tools } = projectRoutesToMcp(RW_ROUTES);
  const { toolRegistry } = bindProjectedHttpMutators(
    { tools },
    {
      baseUrl: 'http://example.test',
      gate: makeGate(),
      fetchImpl: async () => {
        fetched = true;
        return { ok: true, status: 200, text: async () => '{}' };
      }
    }
  );

  const del = toolRegistry.find((t) => t.name === 'linea.remove');
  const res = await del.call({ params: {}, approve: true, approvalToken: APPROVAL_TOKEN });

  assert.equal(res.ok, false);
  assert.equal(res.code, 'VALIDATION_ERROR');
  assert.equal(res.details[0].part, 'params');
  assert.equal(fetched, false);
});
