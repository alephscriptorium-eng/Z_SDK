/**
 * Unified curation chain (DATOS.md §2 / D-15).
 *
 * Historical field names (`delta_status`, firehose corpus folders,
 * Transmedia `editorialStatus`) map onto one enum. Browser-safe.
 */

/** @type {readonly string[]} */
export const CURATION_STATUSES = Object.freeze([
  'raw',
  'candidate',
  'pending',
  'draft',
  'triaged',
  'labeled',
  'curated',
  'canon',
  'rumor',
  'proposal',
  'discarded'
]);

const STATUS_SET = new Set(CURATION_STATUSES);

/**
 * Synonyms → preferred status in the unified chain.
 * `curated` and `canon` remain distinct tokens but are treated as terminal
 * curated states; callers may compare with {@link isCanonStatus}.
 */
const ALIASES = Object.freeze({
  raw: 'raw',
  candidate: 'candidate',
  pending: 'pending',
  draft: 'draft',
  triaged: 'triaged',
  labeled: 'labeled',
  curated: 'curated',
  canon: 'canon',
  rumor: 'rumor',
  proposal: 'proposal',
  discarded: 'discarded'
});

/** Object keys that may carry a curation status. */
export const CURATION_STATUS_KEYS = Object.freeze([
  'curation_status',
  'editorialStatus',
  'delta_status',
  'status',
  'labeled'
]);

/**
 * Curated-sidecar detection (WP-U202 · driver LINEAS · familia curada).
 * Resolved by FORM, with no sidecar-filename literals: in a LINEAS volume
 * EVERY `*.md` is a curated sidecar, at any depth and under any name.
 * That is the corpus design rule itself (DATOS §2: «el wikitext (dato de
 * autoridad) es la verdad; el markdown es índice y curación»), and it is
 * what the real reader already does — `loader.mjs readRegistro` takes
 * every markdown file of a registro directory, deliberately without
 * hardcoding sidecar filenames. Import merges must NEVER overwrite these
 * paths (H-01 §④: what the human touched is not overwritten — existing
 * sidecar in the destination → discard + report; missing → may land as
 * «lo que falta»).
 *
 * Deliberate over-approximation, declared: a markdown file that is NOT
 * curation (DATOS §2 lists `raw/linea.md` as a raw history export) is
 * protected too. The asymmetry is the reason — a false positive only
 * reclassifies an entry of the merge report, while a false negative would
 * overwrite human curation, which is not recoverable. Non-markdown support
 * (wikitext, JSON, YAML) is never a sidecar.
 * Pure path predicate — browser-safe.
 * @param {string} relPath — path relative to the LINEAS volume root
 * @returns {boolean}
 */
export function isCuratedSidecarPath(relPath) {
  const p = String(relPath || '').replace(/\\/g, '/').toLowerCase();
  const base = p.split('/').pop() || '';
  return base.endsWith('.md');
}

/**
 * @param {unknown} value
 * @returns {string|null}
 */
export function normalizeCurationStatus(value) {
  if (value == null) return null;
  if (typeof value === 'boolean') {
    return value ? 'labeled' : null;
  }
  if (typeof value !== 'string') return null;
  const key = value.trim().toLowerCase();
  if (!key) return null;
  if (Object.prototype.hasOwnProperty.call(ALIASES, key)) return ALIASES[key];
  return null;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isCurationStatus(value) {
  return STATUS_SET.has(/** @type {string} */ (value));
}

/**
 * Terminal curated / canon states.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isCanonStatus(value) {
  const n = normalizeCurationStatus(value);
  return n === 'curated' || n === 'canon' || n === 'labeled';
}

/**
 * Read curation status from a record using known field aliases.
 * @param {object|null|undefined} record
 * @returns {string|null}
 */
export function readCurationStatus(record) {
  if (!record || typeof record !== 'object') return null;
  for (const key of CURATION_STATUS_KEYS) {
    if (!(key in record)) continue;
    const normalized = normalizeCurationStatus(record[key]);
    if (normalized) return normalized;
  }
  return null;
}

/**
 * Map a firehose corpus folder id onto the unified enum.
 * @param {string} corpusId
 * @returns {string|null}
 */
export function curationStatusFromCorpus(corpusId) {
  return normalizeCurationStatus(corpusId);
}
