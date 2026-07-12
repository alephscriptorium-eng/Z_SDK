/**
 * Shared JSON file reader with explicit error semantics.
 */

import fs from 'node:fs';

/**
 * @typedef {'empty-object' | 'error-field'} ReadJsonOnError
 */

/**
 * Read and parse a JSON file.
 *
 * @param {string} filePath
 * @param {{ onError?: ReadJsonOnError }} [options]
 * @returns {unknown}
 */
export function readJson(filePath, { onError = 'empty-object' } = {}) {
  if (onError === 'error-field' && !fs.existsSync(filePath)) {
    return { error: `file not found: ${filePath}` };
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    if (onError === 'error-field') {
      return { error: err.message };
    }
    return {};
  }
}
