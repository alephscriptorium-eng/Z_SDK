import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolvePresetOffer,
  broadcastPresetOffer,
  createPresetHorseProxy,
  horsePresetFixture
} from '@zeus/presets-sdk/horse';
import { createHubClient, linkHubClients, horseRpc } from '../lib/horse-preset-hub.mjs';

const ROOM = 'horse-preset.test';

test('horse preset ping-pong: peer-b lists only curated tools', async () => {
  const peerA = createHubClient('horse-a');
  const peerB = createHubClient('consumer-b');
  linkHubClients([peerA, peerB]);

  const { preset, catalog, upstream } = horsePresetFixture;
  const offer = resolvePresetOffer(preset, catalog);
  broadcastPresetOffer(peerA, ROOM, 'horse-a', offer);

  const proxy = createPresetHorseProxy({ offer, upstream });
  proxy.attach(peerA, ROOM, 'horse-a');

  const listRes = await horseRpc(peerB, ROOM, 'consumer-b', 'horse-a', 'tools/list', {}, 1);
  assert.equal(listRes.result.tools.length, 2);
  assert.deepEqual(listRes.result.tools.map((t) => t.name).sort(), ['echo', 'get_status']);
  assert.ok(listRes.result.tools.every((t) => t._meta?.serverName === 'alpha-mcp'));

  const callRes = await horseRpc(
    peerB,
    ROOM,
    'consumer-b',
    'horse-a',
    'tools/call',
    { name: 'echo', arguments: { text: 'ping-pong' } },
    2
  );
  assert.equal(callRes.result.content[0].text, 'ping-pong');

  proxy.detach();
});

test('horse preset offer includes _meta.preset', () => {
  const offer = resolvePresetOffer(horsePresetFixture.preset, horsePresetFixture.catalog);
  assert.equal(offer._meta.preset.curated, true);
  assert.equal(offer._meta.preset.id, 'fixture-observer');
});
