/**
 * ATProto jetstream → DISK_01/FIREHOSE (stream family reference producer).
 *
 * Modes:
 * - fixture: write sample jetstream posts into a volumes tree (tests / offline)
 * - live: connect to Jetstream WebSocket and append posts under corpus/raw
 *
 * Degradación a sintético sigue viviendo en resolveRuntimeFeeds (no aquí).
 */

import fs from 'node:fs';
import path from 'node:path';
import { isJetstreamPost, normalizeFirehosePost } from '@zeus/firehose-core';
import {
  loadVolumesConfig,
  resolveVolumesRoot,
  resetVolumesCache
} from '@zeus/presets-sdk/volumes';
import { syncVolumeCounters } from '@zeus/volumes-ops';

/**
 * Run `fn` with ZEUS_VOLUMES_ROOT pointing at `volumesRoot`, restoring env + cache.
 * @template T
 * @param {string} volumesRoot
 * @param {() => T} fn
 * @returns {T}
 */
function withVolumesRoot(volumesRoot, fn) {
  const prev = process.env.ZEUS_VOLUMES_ROOT;
  process.env.ZEUS_VOLUMES_ROOT = volumesRoot;
  resetVolumesCache();
  try {
    return fn();
  } finally {
    if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
    else process.env.ZEUS_VOLUMES_ROOT = prev;
    resetVolumesCache();
  }
}

/** Default public Jetstream (override with ZEUS_JETSTREAM_URL). */
export const DEFAULT_JETSTREAM_URL = 'wss://jetstream2.us-east.bsky.network/subscribe';

const SAMPLE_POSTS = Object.freeze([
  {
    did: 'did:plc:feedkit',
    kind: 'commit',
    handle: 'feedkit.bsky.social',
    uri: 'at://did:plc:feedkit/app.bsky.feed.post/u85a',
    commit: {
      collection: 'app.bsky.feed.post',
      rkey: 'u85a',
      record: {
        text: 'feed-kit jetstream fixture A',
        createdAt: '2026-07-18T00:00:00.000Z'
      }
    }
  },
  {
    did: 'did:plc:feedkit',
    kind: 'commit',
    handle: 'feedkit.bsky.social',
    uri: 'at://did:plc:feedkit/app.bsky.feed.post/u85b',
    commit: {
      collection: 'app.bsky.feed.post',
      rkey: 'u85b',
      record: {
        text: 'feed-kit jetstream fixture B',
        createdAt: '2026-07-18T00:01:00.000Z'
      }
    }
  }
]);

/**
 * Ensure a minimal volumes.json + FIREHOSE tree under volumesRoot.
 * @param {string} volumesRoot
 * @param {{ label?: string }} [opts]
 */
export function ensureFirehoseVolumeLayout(volumesRoot, { label = 'Firehose ONFALO' } = {}) {
  const firehoseRoot = path.join(volumesRoot, 'DISK_01', 'FIREHOSE');
  for (const corpus of ['raw', 'candidate', 'discarded', 'labeled']) {
    fs.mkdirSync(path.join(firehoseRoot, corpus), { recursive: true });
  }

  return withVolumesRoot(volumesRoot, () => {
    let doc;
    try {
      doc = structuredClone(loadVolumesConfig());
      doc.volumes = doc.volumes ?? {};
    } catch {
      doc = { root: '.', volumes: {} };
    }

    const existing = doc.volumes.firehose;
    const corpora = (existing?.corpora ?? []).length
      ? existing.corpora
      : [
          { id: 'candidate', path: 'candidate', label: 'Candidatos', files: 0 },
          { id: 'raw', path: 'raw', label: 'Raw', files: 0 },
          { id: 'discarded', path: 'discarded', label: 'Descartados', files: 0 },
          { id: 'labeled', path: 'labeled', label: 'Etiquetados', files: 0 }
        ];

    doc.volumes.firehose = {
      disk: 'DISK_01',
      path: 'DISK_01/FIREHOSE',
      readonly: true,
      label: existing?.label ?? label,
      source: {
        ...(existing?.source ?? {}),
        kind: 'atproto-jetstream',
        syncedAt: new Date().toISOString()
      },
      corpora
    };

    const root = resolveVolumesRoot();
    const configPath = path.join(root, 'volumes.json');
    fs.writeFileSync(configPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    resetVolumesCache();
    return { firehoseRoot, volumesPath: configPath };
  });
}

/**
 * Write one jetstream post JSON under corpus batch dir.
 * @param {string} firehoseRoot
 * @param {object} raw
 * @param {{ corpus?: string, batch?: string }} [opts]
 */
export function writeJetstreamPost(firehoseRoot, raw, { corpus = 'raw', batch = 'jetstream' } = {}) {
  if (!isJetstreamPost(raw)) {
    return { ok: false, error: 'not_jetstream_post' };
  }
  const norm = normalizeFirehosePost(raw);
  const rkey =
    raw.commit?.rkey ||
    String(norm.id || Date.now())
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .slice(0, 64);
  const dir = path.join(firehoseRoot, corpus, batch);
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `${rkey}.json`;
  const abs = path.join(dir, fileName);
  fs.writeFileSync(abs, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
  return {
    ok: true,
    filePath: `${batch}/${fileName}`,
    absPath: abs,
    text: norm.text
  };
}

/**
 * Recount corpus files via volumes-ops (any file type) and invalidate cache.
 * @param {string} volumesRoot
 */
export function refreshFirehoseCorpusCounts(volumesRoot) {
  return withVolumesRoot(volumesRoot, () => {
    let config;
    try {
      config = loadVolumesConfig();
    } catch {
      return null;
    }
    if (!config.volumes?.firehose?.corpora) return null;
    const { corpora } = syncVolumeCounters('firehose');
    return corpora;
  });
}

/**
 * Fixture sync: write SAMPLE_POSTS (or provided posts) into DISK_01.
 * @param {{
 *   volumesRoot: string,
 *   posts?: object[],
 *   corpus?: string,
 *   batch?: string
 * }} opts
 */
export function syncJetstreamFixture(opts) {
  const { volumesRoot, posts = SAMPLE_POSTS, corpus = 'raw', batch = 'jetstream' } = opts;
  const { firehoseRoot } = ensureFirehoseVolumeLayout(volumesRoot);
  const written = [];
  for (const post of posts) {
    const result = writeJetstreamPost(firehoseRoot, post, { corpus, batch });
    if (result.ok) written.push(result);
  }
  const corpora = refreshFirehoseCorpusCounts(volumesRoot);
  return {
    ok: true,
    mode: 'fixture',
    written: written.length,
    files: written.map((w) => w.filePath),
    corpora
  };
}

/**
 * Live Jetstream WebSocket → DISK_01. Stops after `maxPosts` or `durationMs`.
 * @param {{
 *   volumesRoot: string,
 *   url?: string,
 *   maxPosts?: number,
 *   durationMs?: number,
 *   corpus?: string,
 *   batch?: string,
 *   logger?: Console,
 *   WebSocketImpl?: typeof WebSocket
 * }} opts
 */
export async function syncJetstreamLive(opts) {
  const {
    volumesRoot,
    url = process.env.ZEUS_JETSTREAM_URL || DEFAULT_JETSTREAM_URL,
    maxPosts = 50,
    durationMs = 30_000,
    corpus = 'raw',
    batch = 'jetstream',
    logger = console,
    WebSocketImpl = globalThis.WebSocket
  } = opts;

  if (typeof WebSocketImpl !== 'function') {
    throw new Error('WebSocket no disponible; usa mode=fixture o Node ≥22');
  }

  const { firehoseRoot } = ensureFirehoseVolumeLayout(volumesRoot);
  const wantedUrl = new URL(url);
  if (!wantedUrl.searchParams.has('wantedCollections')) {
    wantedUrl.searchParams.set('wantedCollections', 'app.bsky.feed.post');
  }

  const written = [];
  await new Promise((resolve, reject) => {
    const ws = new WebSocketImpl(wantedUrl.toString());
    const timer = setTimeout(() => {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      resolve(undefined);
    }, durationMs);

    ws.addEventListener?.('open', () => {
      logger.info?.(`[feed-kit] jetstream connected ${wantedUrl.host}`);
    });
    ws.addEventListener?.('message', (ev) => {
      try {
        const raw = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data));
        if (!isJetstreamPost(raw)) return;
        const result = writeJetstreamPost(firehoseRoot, raw, { corpus, batch });
        if (result.ok) {
          written.push(result);
          if (written.length >= maxPosts) {
            clearTimeout(timer);
            ws.close();
            resolve(undefined);
          }
        }
      } catch (err) {
        logger.warn?.('[feed-kit] jetstream message skip:', err.message);
      }
    });
    ws.addEventListener?.('error', (err) => {
      clearTimeout(timer);
      reject(err?.error ?? err ?? new Error('jetstream_ws_error'));
    });
    // Node ws package style
    if (typeof ws.on === 'function') {
      ws.on('open', () => logger.info?.(`[feed-kit] jetstream connected ${wantedUrl.host}`));
      ws.on('message', (data) => {
        try {
          const raw = JSON.parse(String(data));
          if (!isJetstreamPost(raw)) return;
          const result = writeJetstreamPost(firehoseRoot, raw, { corpus, batch });
          if (result.ok) {
            written.push(result);
            if (written.length >= maxPosts) {
              clearTimeout(timer);
              ws.close();
              resolve(undefined);
            }
          }
        } catch (err) {
          logger.warn?.('[feed-kit] jetstream message skip:', err.message);
        }
      });
      ws.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    }
  });

  const corpora = refreshFirehoseCorpusCounts(volumesRoot);
  return {
    ok: true,
    mode: 'live',
    url: wantedUrl.toString(),
    written: written.length,
    files: written.map((w) => w.filePath),
    corpora
  };
}

/**
 * CLI/entry: `--fixture` or live.
 * @param {{
 *   volumesRoot: string,
 *   fixture?: boolean,
 *   url?: string,
 *   maxPosts?: number,
 *   durationMs?: number,
 *   logger?: Console
 * }} opts
 */
export async function runJetstreamSync(opts) {
  if (opts.fixture || process.env.ZEUS_JETSTREAM_FIXTURE === '1') {
    return syncJetstreamFixture({ volumesRoot: opts.volumesRoot });
  }
  return syncJetstreamLive({
    volumesRoot: opts.volumesRoot,
    url: opts.url,
    maxPosts: opts.maxPosts,
    durationMs: opts.durationMs,
    logger: opts.logger
  });
}

export { SAMPLE_POSTS };
