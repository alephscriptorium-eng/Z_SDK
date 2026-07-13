/**
 * Panel Q — inventario de presets (WP-12).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCloakInventory } from '../assets/js/kit/cloak-panel.mjs';

test('renderCloakInventory: start pack primero y activo resaltado', () => {
  const html = renderCloakInventory({
    startPack: ['aleph-tronco-puro', 'aleph-firehose-browse'],
    equipped: { presetId: 'aleph-tronco-puro', label: 'Tronco' },
    presets: [
      { name: 'aleph-firehose-browse', description: 'browse firehose' },
      { name: 'aleph-tronco-puro', description: 'tronco' },
      { name: 'other-preset', description: 'locked' }
    ]
  });
  assert.match(html, /cloak-item-active/);
  assert.match(html, /aleph-tronco-puro/);
  assert.match(html, /cloak-item-locked/);
  assert.match(html, /other-preset/);
});
