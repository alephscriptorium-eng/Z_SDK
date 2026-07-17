/**
 * Files-first SSB log → DISK_04/SSB exporter (sync process, not a mesh daemon).
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  CORPUS_BY_TYPE,
  SSB_CORPORA,
  MANIFEST_NAME,
  SSB_VOLUME_ID,
  SSB_DISK,
  SSB_VOLUME_PATH,
  corpusForContent,
  messageFileName
} from './types.mjs';

/**
 * @param {unknown} raw
 * @returns {object[]}
 */
export function normalizeSsbLog(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = /** @type {Record<string, unknown>} */ (raw);
    if (Array.isArray(obj.messages)) return obj.messages;
    if (Array.isArray(obj.log)) return obj.log;
  }
  throw new Error('SSB log must be an array or { messages|log: [] }');
}

/**
 * @param {object} msg
 * @returns {{ key: string, value: object, content: object, corpus: string }|null}
 */
export function classifyMessage(msg) {
  if (!msg || typeof msg !== 'object') return null;
  const key = typeof msg.key === 'string' ? msg.key : null;
  const value = msg.value && typeof msg.value === 'object' ? msg.value : null;
  if (!key || !value) return null;
  const content = value.content;
  const corpus = corpusForContent(content);
  if (!corpus) return null;
  return { key, value, content, corpus };
}

/**
 * @param {object[]} messages
 */
export function partitionExportable(messages) {
  /** @type {Record<string, object[]>} */
  const byCorpus = { tribes: [], parliament: [], votes: [] };
  let skipped = 0;
  for (const msg of messages) {
    const classified = classifyMessage(msg);
    if (!classified) {
      skipped += 1;
      continue;
    }
    byCorpus[classified.corpus].push({
      key: classified.key,
      value: classified.value,
      content: classified.content,
      type:
        typeof classified.content?.type === 'string'
          ? classified.content.type
          : 'unknown'
    });
  }
  return { byCorpus, skipped, total: messages.length };
}

/**
 * @param {{
 *   log: unknown,
 *   volumesRoot: string,
 *   provenance?: object,
 *   syncedAt?: string
 * }} opts
 */
export function exportSsbLogToVolumes(opts) {
  const volumesRoot = path.resolve(opts.volumesRoot);
  const messages = normalizeSsbLog(opts.log);
  const { byCorpus, skipped, total } = partitionExportable(messages);
  const ssbRoot = path.join(volumesRoot, ...SSB_VOLUME_PATH.split('/'));
  fs.mkdirSync(ssbRoot, { recursive: true });

  /** @type {Record<string, number>} */
  const counts = {};
  for (const corpus of SSB_CORPORA) {
    const dir = path.join(ssbRoot, corpus.path);
    fs.mkdirSync(dir, { recursive: true });
    // Clear previous export files in this corpus (sync replaces snapshot).
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith('.json')) fs.unlinkSync(path.join(dir, name));
    }
    const rows = byCorpus[corpus.id] || [];
    for (const row of rows) {
      const file = path.join(dir, messageFileName(row.key));
      fs.writeFileSync(
        file,
        JSON.stringify(
          {
            key: row.key,
            value: row.value,
            type: row.type,
            corpus: corpus.id
          },
          null,
          2
        ),
        'utf8'
      );
    }
    counts[corpus.id] = rows.length;
  }

  const syncedAt = opts.syncedAt ?? new Date().toISOString();
  const manifest = {
    schema: 'ssb-manifest',
    version: 1,
    volume: SSB_VOLUME_ID,
    disk: SSB_DISK,
    path: SSB_VOLUME_PATH,
    syncedAt,
    source: {
      kind: 'ssb-log-export',
      ...(opts.provenance && typeof opts.provenance === 'object'
        ? opts.provenance
        : {})
    },
    totals: {
      input: total,
      exported: Object.values(counts).reduce((a, b) => a + b, 0),
      skipped
    },
    corpora: SSB_CORPORA.map((c) => ({
      id: c.id,
      path: c.path,
      label: c.label,
      files: counts[c.id] ?? 0
    })),
    typesKnown: Object.keys(CORPUS_BY_TYPE).sort()
  };

  fs.writeFileSync(
    path.join(ssbRoot, MANIFEST_NAME),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  upsertVolumesJsonEntry(volumesRoot, {
    syncedAt,
    provenance: opts.provenance,
    counts
  });

  return {
    ok: true,
    volumesRoot,
    ssbRoot,
    manifest,
    counts,
    skipped,
    total
  };
}

/**
 * @param {string} volumesRoot
 * @param {{ syncedAt: string, provenance?: object, counts: Record<string, number> }} meta
 */
function upsertVolumesJsonEntry(volumesRoot, meta) {
  const configPath = path.join(volumesRoot, 'volumes.json');
  /** @type {object} */
  let config = { root: '.', volumes: {} };
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!config.volumes || typeof config.volumes !== 'object') {
      config.volumes = {};
    }
  }

  const prev = config.volumes[SSB_VOLUME_ID] || {};
  config.volumes[SSB_VOLUME_ID] = {
    ...prev,
    disk: SSB_DISK,
    path: SSB_VOLUME_PATH,
    readonly: true,
    label: prev.label || 'SSB OASIS (Tribes & Parliament)',
    source: {
      ...(prev.source && typeof prev.source === 'object' ? prev.source : {}),
      ...(meta.provenance && typeof meta.provenance === 'object'
        ? meta.provenance
        : {}),
      syncedAt: meta.syncedAt,
      kind: 'ssb-pub-export'
    },
    corpora: SSB_CORPORA.map((c) => ({
      id: c.id,
      path: c.path,
      label: c.label,
      files: meta.counts[c.id] ?? 0
    }))
  };

  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

/**
 * Read a JSON log file from disk and export.
 * @param {{
 *   logPath: string,
 *   volumesRoot: string,
 *   provenance?: object
 * }} opts
 */
export function exportSsbLogFile(opts) {
  const raw = JSON.parse(fs.readFileSync(opts.logPath, 'utf8'));
  return exportSsbLogToVolumes({
    log: raw,
    volumesRoot: opts.volumesRoot,
    provenance: {
      logPath: path.resolve(opts.logPath),
      ...(opts.provenance && typeof opts.provenance === 'object'
        ? opts.provenance
        : {})
    }
  });
}
