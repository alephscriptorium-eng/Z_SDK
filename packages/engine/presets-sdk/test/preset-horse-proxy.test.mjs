import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePresetOffer } from '../src/horse/resolve-offer.mjs';
import { createPresetHorseProxy } from '../src/horse/preset-horse-proxy.mjs';
import { horsePresetFixture } from '../src/horse/fixture.mjs';

const offer = resolvePresetOffer(horsePresetFixture.preset, horsePresetFixture.catalog);
const proxy = createPresetHorseProxy({ offer, upstream: horsePresetFixture.upstream });

test('PresetHorseProxy: tools/list returns only preset tools', async () => {
  const res = await proxy.handleMessage({ jsonrpc: '2.0', method: 'tools/list', id: 1 });
  assert.equal(res.result.tools.length, 2);
  assert.deepEqual(res.result.tools.map((t) => t.name).sort(), ['echo', 'get_status']);
});

test('PresetHorseProxy: tools/call proxies upstream via _meta.serverName', async () => {
  const res = await proxy.handleMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    id: 2,
    params: { name: 'echo', arguments: { text: 'hi' } }
  });
  assert.equal(res.result.content[0].text, 'hi');
});

test('PresetHorseProxy: unknown tool returns error', async () => {
  const res = await proxy.handleMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    id: 3,
    params: { name: 'secret_tool', arguments: {} }
  });
  assert.ok(res.error);
});

test('PresetHorseProxy: preset resource returns metadata JSON', async () => {
  const res = await proxy.handleMessage({
    jsonrpc: '2.0',
    method: 'resources/read',
    id: 4,
    params: { uri: 'preset://fixture-observer' }
  });
  const parsed = JSON.parse(res.result.contents[0].text);
  assert.equal(parsed.id, 'fixture-observer');
  assert.equal(parsed.curated, true);
});

test('PresetHorseProxy: preset.system prompt from preset.prompt', async () => {
  const res = await proxy.handleMessage({
    jsonrpc: '2.0',
    method: 'prompts/get',
    id: 5,
    params: { name: 'preset.system', arguments: {} }
  });
  assert.match(res.result.messages[0].content.text, /fixture peer/);
});
