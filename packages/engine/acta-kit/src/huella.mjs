/**
 * Hash del último evento del barrio en el ledger (input inyectable; pura).
 * Sin Date.now ni random: el caller pasa el evento / blob.
 */

import { createHash } from 'node:crypto';

/**
 * @param {unknown} evento — último evento ledger del barrio (objeto o string)
 * @returns {string} hex sha256
 */
export function huellaLedger(evento) {
  const blob =
    typeof evento === 'string'
      ? evento
      : JSON.stringify(evento ?? null);
  return createHash('sha256').update(blob, 'utf8').digest('hex');
}
