/**
 * Parseo genérico de playbooks tipo CASOS.md (`## C-xx — título`).
 * Sin fs: el caller aporta el markdown (el juego conoce la ruta).
 */

const CASE_HEADER = /^## (C-\d+[a-z]?)\b.*$/gm;

/** @returns {string[]} ids de caso en orden de aparición */
export function listCasoIds(markdown) {
  const ids = [];
  for (const match of String(markdown).matchAll(CASE_HEADER)) {
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
  const headers = [...String(markdown).matchAll(CASE_HEADER)];
  for (let i = 0; i < headers.length; i++) {
    if (headers[i][1].toLowerCase() !== wanted) continue;
    const start = headers[i].index;
    const end = i + 1 < headers.length ? headers[i + 1].index : markdown.length;
    return String(markdown).slice(start, end).trim();
  }
  return null;
}
