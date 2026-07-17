/**
 * Intent catalog for volume ops (DATOS.md §4).
 * Engine-neutral roles only — no game names.
 */

import { createIntentCatalog } from '@zeus/protocol';

/**
 * Hard purge of volume/corpus files. Operator only; always seats the ledger.
 * Player/dj must not bypass via this intent — playable empty is a separate intent.
 */
export const VOLUMES_OPS_INTENT_DEFS = Object.freeze({
  empty_volume: {
    roles: ['operator'],
    description: 'Hard purge volume or corpus files; ledger seat required'
  },
  empty_playable: {
    roles: ['player', 'dj'],
    description:
      'Playable empty request (no hard disk purge here; games wire trama in U83)'
  }
});

export const VOLUMES_OPS_CATALOG = createIntentCatalog(VOLUMES_OPS_INTENT_DEFS);
