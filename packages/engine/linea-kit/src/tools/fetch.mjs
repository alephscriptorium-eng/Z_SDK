/**
 * fetch — materialize snapshot wikitext with an explicit approval gate.
 * Concept from fetch_snapshot.py: nothing hits disk without approval.
 */

import path from 'node:path';
import { validate } from '../validate.mjs';
import { ensureDir, nowIso, writeJson, writeText } from './fs-util.mjs';

/**
 * @param {{
 *   satDir: string,
 *   oldid: number,
 *   wikitext: string,
 *   approve: boolean,
 *   approvalToken?: string,
 *   expectedToken?: string,
 *   sourceUrl?: string,
 *   title?: string,
 *   timestamp?: string,
 *   user?: string,
 *   parent_oldid?: number|null,
 *   bytes?: number
 * }} options
 */
export function fetchSnapshot(options) {
  if (!options.satDir) {
    return { ok: false, error: 'satDir is required', rule: 'fetch.sat_dir' };
  }
  const oldid = Number(options.oldid);
  if (!Number.isFinite(oldid) || oldid <= 0) {
    return {
      ok: false,
      error: `Invalid oldid "${options.oldid}": must be a positive number`,
      rule: 'fetch.oldid'
    };
  }
  if (typeof options.wikitext !== 'string') {
    return {
      ok: false,
      error: 'wikitext string is required (offline materialization)',
      rule: 'fetch.wikitext'
    };
  }

  if (!options.approve) {
    return {
      ok: false,
      error: 'Fetch refused: approval gate (pass approve: true)',
      rule: 'fetch.approval_required',
      hint: 'El patrón del mesh es pedir el dato remoto y materializarlo solo con APROBAR.'
    };
  }

  if (options.expectedToken) {
    if (options.approvalToken !== options.expectedToken) {
      return {
        ok: false,
        error: 'Fetch refused: approval token mismatch',
        rule: 'fetch.token_mismatch'
      };
    }
  }

  const satDir = path.resolve(options.satDir);
  const cacheDir = path.join(satDir, 'cache', 'snapshots');
  ensureDir(cacheDir);

  const wikitextPath = path.join(cacheDir, `${oldid}.wikitext`);
  const metaPath = path.join(cacheDir, `${oldid}.meta.json`);
  const fetched_at = nowIso();

  const meta = {
    oldid,
    parent_oldid: options.parent_oldid ?? null,
    title: options.title ?? '',
    timestamp: options.timestamp ?? fetched_at,
    user: options.user ?? 'fetch',
    bytes: options.bytes ?? Buffer.byteLength(options.wikitext, 'utf8'),
    fetched_at,
    ...(options.sourceUrl ? { source_url: options.sourceUrl } : {})
  };

  const metaResult = validate('cache-sidecar-meta', meta);
  if (!metaResult.ok) {
    return {
      ok: false,
      error: 'cache-sidecar-meta invalid',
      validation: metaResult,
      rule: 'fetch.meta_schema'
    };
  }

  writeText(wikitextPath, options.wikitext);
  writeJson(metaPath, meta);

  return {
    ok: true,
    oldid,
    wikitextPath,
    metaPath,
    bytes: meta.bytes,
    fetched_at
  };
}
