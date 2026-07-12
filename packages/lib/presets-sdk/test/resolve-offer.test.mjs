import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePresetOffer } from '../src/horse/resolve-offer.mjs';
import { horsePresetFixture } from '../src/horse/fixture.mjs';

const catalog = horsePresetFixture.catalog;
const preset = horsePresetFixture.preset;

test('resolvePresetOffer: filters to preset items only', () => {
  const offer = resolvePresetOffer(preset, catalog);

  assert.equal(offer.tools.length, 2);
  assert.deepEqual(offer.tools.map((t) => t.name).sort(), ['echo', 'get_status']);
  assert.equal(offer.tools.every((t) => t._meta?.serverName === 'alpha-mcp'), true);
  assert.equal(offer._meta.preset.curated, true);
  assert.equal(offer._meta.preset.id, 'fixture-observer');
});

test('resolvePresetOffer: includes preset metadata resource', () => {
  const offer = resolvePresetOffer(preset, catalog);
  const meta = offer.resources.find((r) => r.uri === 'preset://fixture-observer');
  assert.ok(meta);
  assert.equal(meta._meta.preset, true);
});

test('resolvePresetOffer: includes preset.system prompt when prompt set', () => {
  const offer = resolvePresetOffer(preset, catalog);
  const sys = offer.prompts.find((p) => p.name === 'preset.system');
  assert.ok(sys);
  assert.equal(sys._meta.presetPrompt, preset.prompt);
});

test('resolvePresetOffer: catalog-only preset omits system prompt', () => {
  const noPrompt = { ...preset, prompt: '' };
  const offer = resolvePresetOffer(noPrompt, catalog);
  assert.equal(offer.prompts.find((p) => p.name === 'preset.system'), undefined);
});

test('resolvePresetOffer: collision guard fails on duplicate flat names', () => {
  const badPreset = {
    ...preset,
    items: [
      { serverName: 'alpha-mcp', type: 'tool', name: 'echo' },
      { serverName: 'beta-mcp', type: 'tool', name: 'echo' }
    ]
  };
  const badCatalog = [
    ...catalog,
    {
      serverName: 'beta-mcp',
      tools: [{ name: 'echo', description: 'dup', parameters: {}, type: 'tool' }],
      resources: [],
      resourceTemplates: [],
      prompts: []
    }
  ];
  assert.throws(
    () => resolvePresetOffer(badPreset, badCatalog),
    /collision/i
  );
});

test('resolvePresetOffer: requires preset.id', () => {
  assert.throws(() => resolvePresetOffer({}, catalog), /preset\.id/);
});
