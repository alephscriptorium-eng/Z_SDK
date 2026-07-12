import test from 'node:test';
import assert from 'node:assert/strict';

import { corpusRelPath, FIREHOSE_VOLUME_ID } from '@zeus/presets-sdk/paths';
import { resolveVolume } from '@zeus/presets-sdk/volumes';
import { resolveZeusHost } from '@zeus/presets-sdk/env';
import { buildUiHref } from '@zeus/presets-sdk/discovery';
import { resolvePresetOffer } from '@zeus/presets-sdk/horse';

test('family subpath exports resolve', () => {
  assert.equal(typeof corpusRelPath, 'function');
  assert.equal(FIREHOSE_VOLUME_ID, 'firehose');
  assert.equal(typeof resolveVolume, 'function');
  assert.equal(typeof resolveZeusHost, 'function');
  assert.equal(typeof buildUiHref, 'function');
  assert.equal(typeof resolvePresetOffer, 'function');
});
