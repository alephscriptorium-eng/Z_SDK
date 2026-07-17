/**
 * segmentar — historial → satellite manifest with milestones by rules.
 * Concept from segment_linea.py (not a line-by-line port).
 */

import path from 'node:path';
import { validate } from '../validate.mjs';
import { ensureDir, exists, nowIso, readJson, writeJson, writeText } from './fs-util.mjs';
import { applyMilestoneRules } from './milestone-rules.mjs';
import { materializarTronco } from './crear-linea.mjs';

/**
 * @typedef {object} RawRegistro
 * @property {number} oldid
 * @property {number|null} [parent_oldid]
 * @property {string} [timestamp]
 * @property {string} [user]
 * @property {number} [byte_delta]
 * @property {number} [bytes]
 * @property {string|null} [section]
 * @property {string} [summary]
 * @property {boolean} [milestone]
 * @property {object} [urls]
 */

/**
 * @param {RawRegistro[]} rawRegs
 * @param {{
 *   corpus: string,
 *   title?: string,
 *   source?: string,
 *   wikiBase?: string,
 *   articleTitle?: string,
 *   byteDeltaThreshold?: number,
 *   keywords?: string[],
 *   editorAllowlist?: Set<string>|string[],
 *   ordering?: 'newest_first'|'oldest_first'
 * }} opts
 */
export function segmentarHistorial(rawRegs, opts) {
  if (!Array.isArray(rawRegs) || rawRegs.length === 0) {
    return {
      ok: false,
      error: 'registros empty',
      rule: 'segmentar.empty'
    };
  }

  const editorAllowlist = Array.isArray(opts.editorAllowlist)
    ? new Set(opts.editorAllowlist)
    : opts.editorAllowlist instanceof Set
      ? opts.editorAllowlist
      : new Set();

  const wikiBase = opts.wikiBase ?? 'https://example.test/w/index.php';
  const ordering = opts.ordering ?? 'newest_first';

  /** @type {object[]} */
  const registros = rawRegs.map((raw, i) => {
    const id = `r${String(i + 1).padStart(4, '0')}`;
    const marked = applyMilestoneRules(raw, {
      byteDeltaThreshold: opts.byteDeltaThreshold,
      keywords: opts.keywords,
      editorAllowlist
    });
    const oldid = Number(raw.oldid);
    return {
      id,
      oldid,
      parent_oldid: raw.parent_oldid ?? null,
      timestamp: raw.timestamp ?? '',
      user: raw.user ?? 'unknown',
      byte_delta: raw.byte_delta ?? 0,
      bytes: raw.bytes,
      section: raw.section ?? null,
      summary: raw.summary ?? '',
      milestone: marked.milestone,
      milestone_reasons: marked.milestone_reasons,
      delta_status: 'pending',
      urls: raw.urls ?? {
        revision: `${wikiBase}?oldid=${oldid}`
      }
    };
  });

  // Newest-first by oldid (historial convention).
  registros.sort((a, b) => b.oldid - a.oldid);
  if (ordering === 'oldest_first') registros.reverse();

  for (let i = 0; i < registros.length; i += 1) {
    registros[i].id = `r${String(i + 1).padStart(4, '0')}`;
    const regResult = validate('registro', registros[i]);
    if (!regResult.ok) {
      return {
        ok: false,
        error: `registro invalid at index ${i}`,
        validation: regResult,
        rule: 'segmentar.registro_schema'
      };
    }
  }

  const oldest = [...registros].sort((a, b) => a.oldid - b.oldid)[0];
  const newest = [...registros].sort((a, b) => b.oldid - a.oldid)[0];
  const milestones = registros.filter((r) => r.milestone).map((r) => r.id);

  const manifest = {
    meta: {
      corpus: opts.corpus,
      title: opts.title ?? opts.articleTitle ?? opts.corpus,
      source: opts.source ?? 'raw/linea.json',
      generated_at: nowIso(),
      registro_count: registros.length,
      ordering: ordering === 'oldest_first' ? 'oldest_first' : 'newest_first',
      snapshots: {
        inicial: {
          role: 'inicial',
          oldid: oldest.oldid,
          timestamp: oldest.timestamp
        },
        final: {
          role: 'final',
          oldid: newest.oldid,
          timestamp: newest.timestamp
        }
      },
      milestones
    },
    registros
  };

  const satResult = validate('manifest-satelite', manifest);
  if (!satResult.ok) {
    return {
      ok: false,
      error: 'manifest-satelite invalid',
      validation: satResult,
      rule: 'segmentar.manifest_schema'
    };
  }

  return { ok: true, manifest, milestoneCount: milestones.length };
}

/**
 * Segment historial file into satélite manifest on disk.
 * @param {{
 *   satDir: string,
 *   registros?: RawRegistro[],
 *   rawPath?: string,
 *   corpus?: string,
 *   title?: string,
 *   byteDeltaThreshold?: number,
 *   keywords?: string[],
 *   editorAllowlist?: string[],
 *   writeNodoSections?: boolean,
 *   nodoIds?: string[]
 * }} options
 */
export function segmentar(options) {
  const satDir = path.resolve(options.satDir);
  ensureDir(satDir);

  /** @type {RawRegistro[]} */
  let rawRegs = options.registros ?? [];
  if (!rawRegs.length && options.rawPath) {
    const rawPath = path.resolve(options.rawPath);
    if (!exists(rawPath)) {
      return { ok: false, error: `raw not found: ${rawPath}`, rule: 'segmentar.raw_missing' };
    }
    const data = readJson(rawPath);
    rawRegs = Array.isArray(data) ? data : data.registros ?? data.edits ?? [];
  }
  if (!rawRegs.length) {
    const defaultRaw = path.join(satDir, 'raw', 'linea.json');
    if (exists(defaultRaw)) {
      const data = readJson(defaultRaw);
      rawRegs = Array.isArray(data) ? data : data.registros ?? data.edits ?? [];
    }
  }

  const result = segmentarHistorial(rawRegs, {
    corpus: options.corpus ?? path.basename(path.resolve(satDir, '../..')),
    title: options.title,
    byteDeltaThreshold: options.byteDeltaThreshold,
    keywords: options.keywords,
    editorAllowlist: options.editorAllowlist
  });
  if (!result.ok) return result;

  writeJson(path.join(satDir, 'manifest.json'), result.manifest);
  writeText(
    path.join(satDir, 'raw', 'linea.json'),
    JSON.stringify({ registros: rawRegs }, null, 2)
  );

  if (options.writeNodoSections !== false) {
    const nodoIds = options.nodoIds ?? ['N01'];
    const sections = {
      version: '0.1.0',
      linea_id: options.corpus ?? 'linea',
      description: 'Bridge tronco↔satélite (scaffold)',
      nodos: Object.fromEntries(
        nodoIds.map((id, i) => [
          id,
          {
            sections: [i === 0 ? 'Intro' : `Sección ${id}`],
            notes: 'synthetic'
          }
        ])
      )
    };
    const secResult = validate('nodo-sections', sections);
    if (!secResult.ok) {
      return {
        ok: false,
        error: 'nodo-sections invalid',
        validation: secResult,
        rule: 'segmentar.sections_schema'
      };
    }
    writeJson(path.join(satDir, 'nodo-sections.json'), sections);
  }

  // Snapshot endpoint stubs for extremes.
  const snaps = result.manifest.meta.snapshots;
  for (const [role, snap] of Object.entries(snaps)) {
    const meta = {
      role,
      oldid: snap.oldid,
      timestamp: snap.timestamp,
      path: `snapshots/${role}/`,
      cache_wikitext: false,
      fetched: false
    };
    writeJson(path.join(satDir, 'snapshots', role, 'meta.json'), meta);
  }

  return {
    ok: true,
    satDir,
    manifestPath: path.join(satDir, 'manifest.json'),
    registroCount: result.manifest.registros.length,
    milestoneCount: result.milestoneCount,
    manifest: result.manifest
  };
}

export { materializarTronco };
