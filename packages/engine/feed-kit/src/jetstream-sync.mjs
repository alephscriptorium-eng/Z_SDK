/**
 * ATProto jetstream → DISK_01/FIREHOSE (stream family reference producer).
 *
 * Modes:
 * - fixture: write sample jetstream posts into a volumes tree (tests / offline)
 * - live: connect to Jetstream WebSocket and append posts under corpus/raw
 *
 * Degradación a sintético sigue viviendo en resolveRuntimeFeeds (no aquí).
 *
 * ── WP-U204 · DEMOLICIÓN del escritor legado ───────────────────────────────
 * `ensureFirehoseVolumeLayout` vivía aquí y ESCRIBÍA `volumes.json` con un
 * `fs.writeFileSync` propio (antiguo :120), inventando la entrada del volumen
 * si faltaba e inyectando `source.syncedAt` (antiguo :113) — un campo temporal
 * dentro del manifiesto que cambiaba el sello sha256 en CADA sync (U199).
 * Está eliminado. En su lugar:
 * - `resolveFirehoseVolumeRoot` **no escribe manifiesto**: exige que el
 *   manifiesto YA declare el volumen (lo siembra el import, U201/U204) y
 *   aborta honestamente si no. Un sync vivo no crea topología.
 * - `syncedAt` es **estado**: se registra en `volumes.state.json` vía
 *   `recordVolumeSync` (@zeus/volumes-ops), que nunca entra en el sello.
 * Invariante resultante: el ÚNICO escritor de `volumes.json` es
 * `sealManifest` (volumes-ops/src/manifest.mjs), usado solo por `importPack`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { isJetstreamPost, normalizeFirehosePost } from '@zeus/firehose-core';
import {
  loadVolumesConfig,
  resolveVolumesRoot,
  resetVolumesCache
} from '@zeus/presets-sdk/volumes';
import { syncVolumeCounters, recordVolumeSync } from '@zeus/volumes-ops';

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

export const FIREHOSE_VOLUME_ID = 'firehose';

/**
 * Resolve the FIREHOSE volume root of an ALREADY SEEDED volumes root.
 *
 * Fail-closed (U199/U200/U201 + WP-U204): the manifest must exist and must
 * declare the volume. A live sync NEVER creates manifest topology — that is
 * the import's exclusive job (`importPack`, CONTRATO-IMPORT-PACK-v1). Only
 * the DATA-PLANE directories of the corpora the manifest already declares are
 * materialized here.
 *
 * @param {string} volumesRoot
 * @param {{ volumeId?: string }} [opts]
 * @returns {{ firehoseRoot: string, volumeId: string, corpora: object[] }}
 */
export function resolveFirehoseVolumeRoot(volumesRoot, { volumeId = FIREHOSE_VOLUME_ID } = {}) {
  return withVolumesRoot(volumesRoot, () => {
    let config;
    try {
      config = loadVolumesConfig();
    } catch (err) {
      throw new Error(
        `[feed-kit] root de volúmenes no operable (${err instanceof Error ? err.message : err}) — ` +
          'siembra con el contrato de import v1 (importPack); el sync vivo no crea manifiestos (U199/U204).'
      );
    }
    const entry = config.volumes?.[volumeId];
    if (!entry?.path) {
      throw new Error(
        `[feed-kit] el manifiesto no declara el volumen '${volumeId}' con path — ` +
          'un sync vivo NO inventa entradas de manifiesto: importa primero el pack ' +
          '(importPack, CONTRATO-IMPORT-PACK-v1 · WP-U204).'
      );
    }
    const root = resolveVolumesRoot();
    const firehoseRoot = path.join(root, entry.path.split('/').join(path.sep));
    const corpora = entry.corpora ?? [];
    for (const corpus of corpora) {
      fs.mkdirSync(path.join(firehoseRoot, String(corpus.path || corpus.id)), { recursive: true });
    }
    return { firehoseRoot, volumeId, corpora };
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
 * Recount corpus files via volumes-ops (any file type). Since U199 the
 * count is recorded in volumes.state.json — the volumes.json manifest
 * stays sealed (read-only for measurement).
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
    if (!config.volumes?.[FIREHOSE_VOLUME_ID]?.corpora) return null;
    const { corpora } = syncVolumeCounters(FIREHOSE_VOLUME_ID);
    return corpora;
  });
}

/**
 * Record the live sync mark in volumes.state.json (WP-U204 — «sync vivo =
 * estado»). The manifest is NOT touched: `syncedAt` inside volumes.json used
 * to break the U199 seal on every run.
 * @param {string} volumesRoot
 * @param {{ volumeId?: string, syncedAt?: string, source?: object }} [opts]
 */
export function recordFirehoseSync(volumesRoot, opts = {}) {
  const { volumeId = FIREHOSE_VOLUME_ID, ...mark } = opts;
  return withVolumesRoot(volumesRoot, () =>
    recordVolumeSync(volumeId, { source: { kind: 'atproto-jetstream' }, ...mark })
  );
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
  const { firehoseRoot } = resolveFirehoseVolumeRoot(volumesRoot);
  const written = [];
  for (const post of posts) {
    const result = writeJetstreamPost(firehoseRoot, post, { corpus, batch });
    if (result.ok) written.push(result);
  }
  const { syncedAt } = recordFirehoseSync(volumesRoot);
  const corpora = refreshFirehoseCorpusCounts(volumesRoot);
  return {
    ok: true,
    mode: 'fixture',
    written: written.length,
    files: written.map((w) => w.filePath),
    syncedAt,
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

  const { firehoseRoot } = resolveFirehoseVolumeRoot(volumesRoot);
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

  const { syncedAt } = recordFirehoseSync(volumesRoot);
  const corpora = refreshFirehoseCorpusCounts(volumesRoot);
  return {
    ok: true,
    mode: 'live',
    url: wantedUrl.toString(),
    written: written.length,
    files: written.map((w) => w.filePath),
    syncedAt,
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
