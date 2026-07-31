/**
 * Family-driver registry (WP-U202 — seed for the U242 generalization).
 * Internal and intentionally minimal: importPack consults it to delegate
 * the family step (detect → validate → merge plan). Contract:
 * - a volume DECLARING an unknown family aborts the import
 *   (`familia_desconocida` — H-01 §③: sin driver no se importa, no hay
 *   copia optimista de una familia declarada sin driver);
 * - a volume declaring no family and carrying no family signature follows
 *   the generic CONTRATO-IMPORT-PACK-v1 path (U201) — hardening this to
 *   family-mandatory is U242's call, not this seed's.
 * Node-only.
 */

import { LINEAS_DRIVER, LINEAS_FAMILY } from './driver-lineas.mjs';
import { FORCES_DRIVER, FORCES_FAMILY } from './driver-forces.mjs';
import { FIREHOSE_DRIVER, FIREHOSE_FAMILY } from './driver-firehose.mjs';

/** @type {Record<string, { family: string, detect: Function, validate: Function, merge: Function }>} */
export const FAMILY_DRIVERS = Object.freeze({
  [LINEAS_FAMILY]: LINEAS_DRIVER,
  [FORCES_FAMILY]: FORCES_DRIVER,
  [FIREHOSE_FAMILY]: FIREHOSE_DRIVER
});

/**
 * Resolve the family of a pack volume.
 *
 * `volumeDir` (WP-U204) is the volume's absolute directory INSIDE THE PACK:
 * families whose signature is not a file name but the CONTENT of what is
 * there (FIREHOSE — «detect sin firma en disco») need to read to answer
 * honestly. Drivers that key off a signature file ignore it.
 *
 * @param {object} volumeEntry — pack manifest volume entry (may declare `family`)
 * @param {string[]} volumeFiles — posix rels of the volume's files in the pack
 * @param {string} [volumeDir] — absolute dir of the volume inside the pack
 * @returns {{ family: string|null } | { error: string, family: string }}
 */
export function detectVolumeFamily(volumeEntry, volumeFiles, volumeDir) {
  const declared = volumeEntry?.family;
  if (declared != null) {
    if (!FAMILY_DRIVERS[declared]) {
      return { error: 'familia_desconocida', family: declared };
    }
    return { family: declared };
  }
  for (const driver of Object.values(FAMILY_DRIVERS)) {
    if (driver.detect({ volumeEntry, volumeFiles, volumeDir })) {
      return { family: driver.family };
    }
  }
  return { family: null };
}
