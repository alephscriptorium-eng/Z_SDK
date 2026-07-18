/**
 * Persist world draft under editor dataDir (node-only).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createDefaultDraft, validateDraft } from './materials.mjs';

const FILE_NAME = 'world-draft.json';

/**
 * @param {string} dataDir
 */
export function createDraftStore(dataDir) {
  const filePath = path.join(dataDir, FILE_NAME);

  function ensureDir() {
    mkdirSync(dataDir, { recursive: true });
  }

  function read() {
    if (!existsSync(filePath)) {
      return createDefaultDraft();
    }
    try {
      const raw = JSON.parse(readFileSync(filePath, 'utf8'));
      return { ...createDefaultDraft(), ...raw };
    } catch {
      return createDefaultDraft();
    }
  }

  /**
   * @param {object} patch
   */
  function write(patch) {
    const next = { ...read(), ...patch };
    const checked = validateDraft(next);
    if (!checked.ok) {
      const err = new Error(checked.error);
      err.details = { rule: checked.rule };
      throw err;
    }
    ensureDir();
    writeFileSync(filePath, JSON.stringify(checked.draft, null, 2), 'utf8');
    return checked.draft;
  }

  function reset() {
    const draft = createDefaultDraft();
    ensureDir();
    writeFileSync(filePath, JSON.stringify(draft, null, 2), 'utf8');
    return draft;
  }

  return { filePath, read, write, reset };
}
