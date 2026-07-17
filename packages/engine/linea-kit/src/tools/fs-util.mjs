/**
 * Shared fs helpers for linea-kit tools (node-only).
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

/**
 * @returns {string} ISO-8601 UTC timestamp
 */
export function nowIso(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * @param {string} dir
 */
export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * @param {string} absPath
 * @param {unknown} data
 * @param {{ spaces?: number }} [opts]
 */
export function writeJson(absPath, data, opts = {}) {
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, `${JSON.stringify(data, null, opts.spaces ?? 2)}\n`, 'utf8');
}

/**
 * @param {string} absPath
 * @param {unknown} data
 */
export function writeYaml(absPath, data) {
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, yaml.stringify(data), 'utf8');
}

/**
 * @param {string} absPath
 * @param {string} text
 */
export function writeText(absPath, text) {
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
}

/**
 * @param {string} absPath
 * @returns {boolean}
 */
export function exists(absPath) {
  return fs.existsSync(absPath);
}

/**
 * @param {string} absPath
 * @returns {unknown}
 */
export function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
}

/**
 * @param {string} absPath
 * @returns {unknown}
 */
export function readYaml(absPath) {
  return yaml.parse(fs.readFileSync(absPath, 'utf8'));
}
