/**
 * Read-only loader for DISK_04/SSB.
 */

import fs from 'node:fs';
import path from 'node:path';
import { resolveSsbBasePath } from '@zeus/presets-sdk';
import {
  MANIFEST_NAME,
  SSB_CORPORA,
  SSB_VOLUME_ID,
  messageFileName
} from './types.mjs';

/**
 * @param {string} [basePath]
 */
export function loadSsbManifest(basePath) {
  const root = basePath ?? resolveSsbBasePath();
  const abs = path.join(root, MANIFEST_NAME);
  if (!fs.existsSync(abs)) {
    return {
      error: 'ssb_manifest_missing',
      rule: 'DISK_04/SSB/manifest.json required — run npm run sync -w @zeus/ssb-system',
      path: abs
    };
  }
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

/**
 * @param {string} [basePath]
 */
export function getSsbStats(basePath) {
  const root = basePath ?? resolveSsbBasePath();
  const manifest = loadSsbManifest(root);
  if (manifest.error) return manifest;

  const corpora = (manifest.corpora || SSB_CORPORA).map((c) => {
    const dir = path.join(root, c.path || c.id);
    let liveFiles = 0;
    if (fs.existsSync(dir)) {
      liveFiles = fs.readdirSync(dir).filter((n) => n.endsWith('.json')).length;
    }
    return {
      id: c.id,
      path: c.path || c.id,
      label: c.label || c.id,
      files: liveFiles,
      empty: liveFiles === 0
    };
  });

  return {
    volume: SSB_VOLUME_ID,
    path: root,
    syncedAt: manifest.syncedAt ?? null,
    source: manifest.source ?? null,
    totals: manifest.totals ?? null,
    corpora,
    files: corpora.reduce((n, c) => n + c.files, 0)
  };
}

/**
 * @param {string} corpusId
 * @param {string} [basePath]
 * @param {{ limit?: number, offset?: number }} [opts]
 */
export function browseSsbCorpus(corpusId, basePath, opts = {}) {
  const root = basePath ?? resolveSsbBasePath();
  const corpus = SSB_CORPORA.find((c) => c.id === corpusId);
  if (!corpus) {
    return { error: `Unknown corpus: ${corpusId}`, rule: 'ssb.corpus.id' };
  }
  const dir = path.join(root, corpus.path);
  if (!fs.existsSync(dir)) {
    return {
      corpus: corpusId,
      path: corpus.path,
      entries: [],
      pagination: { limit: 0, offset: 0, total: 0, hasMore: false }
    };
  }

  const limit = Math.min(Math.max(Number(opts.limit) || 200, 1), 500);
  const offset = Math.max(Number(opts.offset) || 0, 0);
  const names = fs
    .readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .sort();
  const slice = names.slice(offset, offset + limit);
  const entries = slice.map((name) => {
    const abs = path.join(dir, name);
    const st = fs.statSync(abs);
    let key = null;
    let type = null;
    try {
      const row = JSON.parse(fs.readFileSync(abs, 'utf8'));
      key = row.key ?? null;
      type = row.type ?? null;
    } catch {
      /* listing stays honest without full parse failure */
    }
    return {
      name,
      key,
      type,
      size: st.size,
      mtime: st.mtime.toISOString()
    };
  });

  return {
    corpus: corpusId,
    path: corpus.path,
    entries,
    pagination: {
      limit,
      offset,
      total: names.length,
      hasMore: offset + limit < names.length
    }
  };
}

/**
 * @param {string} key — SSB message key
 * @param {string} [basePath]
 */
export function loadSsbMessage(key, basePath) {
  const root = basePath ?? resolveSsbBasePath();
  const fileName = messageFileName(key);
  for (const corpus of SSB_CORPORA) {
    const abs = path.join(root, corpus.path, fileName);
    if (fs.existsSync(abs)) {
      const row = JSON.parse(fs.readFileSync(abs, 'utf8'));
      return { ...row, corpus: corpus.id, filePath: `${corpus.path}/${fileName}` };
    }
  }
  return {
    error: 'ssb_message_not_found',
    rule: 'message key not in exported corpora',
    key
  };
}

/**
 * @param {string} corpusId
 * @param {string} [basePath]
 * @param {{ limit?: number, offset?: number }} [opts]
 */
export function listSsbMessages(corpusId, basePath, opts = {}) {
  const browse = browseSsbCorpus(corpusId, basePath, opts);
  if (browse.error) return browse;
  const root = basePath ?? resolveSsbBasePath();
  const messages = [];
  for (const entry of browse.entries) {
    if (!entry.key) continue;
    const loaded = loadSsbMessage(entry.key, root);
    if (!loaded.error) messages.push(loaded);
  }
  return {
    corpus: corpusId,
    messages,
    pagination: browse.pagination
  };
}
