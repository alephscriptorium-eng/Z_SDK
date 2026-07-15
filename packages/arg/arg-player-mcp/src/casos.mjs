/**
 * Lectura y parseo del playbook de validación packages/arg/spec/CASOS.md.
 * Cada caso es una sección `## C-xx — título`.
 */

import fs from 'node:fs';
import { CASOS_PATH } from './config.mjs';

const CASE_HEADER = /^## (C-\d+[a-z]?)\b.*$/gm;

export function readCasosMarkdown(casosPath = CASOS_PATH) {
  return fs.readFileSync(casosPath, 'utf8');
}

/** @returns {string[]} ids de caso en orden de aparición (C-01, C-02, C-02b…) */
export function listCasoIds(markdown) {
  const ids = [];
  for (const match of markdown.matchAll(CASE_HEADER)) {
    ids.push(match[1]);
  }
  return ids;
}

/**
 * Extrae la sección completa de un caso (cabecera incluida).
 * @param {string} markdown
 * @param {string} casoId — p.ej. 'C-04b' (case-insensitive)
 * @returns {string|null}
 */
export function extractCaso(markdown, casoId) {
  const wanted = String(casoId).trim().toLowerCase();
  const headers = [...markdown.matchAll(CASE_HEADER)];
  for (let i = 0; i < headers.length; i++) {
    if (headers[i][1].toLowerCase() !== wanted) continue;
    const start = headers[i].index;
    const end = i + 1 < headers.length ? headers[i + 1].index : markdown.length;
    return markdown.slice(start, end).trim();
  }
  return null;
}
