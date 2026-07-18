/**
 * Real stream feed via firehose MCP (DISK_01).
 */

import { curationStatusFromCorpus } from '@zeus/linea-kit/curation';
import { callToolJson, createFeedMcpClients } from './mcp-client.mjs';
import { makeFeedItem, withDropletAlias } from './item.mjs';

const PREFETCH_LOW = 8;
const PREFETCH_BATCH = 24;

function postUri(corpus, filePath) {
  const parts = String(filePath).split('/').filter(Boolean);
  const batch = parts[0] ?? 'batch';
  const file = parts.length > 1 ? parts.slice(1).join('/') : parts[0] ?? 'post.json';
  return `firehose://post/${corpus}/${batch}/${file}`;
}

/**
 * @param {{
 *   mcpPorts: object,
 *   seed?: number,
 *   logger?: Console,
 *   host?: string,
 *   corpus?: string,
 *   cursor?: number,
 *   clients?: Awaited<ReturnType<typeof createFeedMcpClients>>
 * }} opts
 */
export function createRealStreamFeed({
  mcpPorts,
  seed = 1,
  logger = console,
  host = 'localhost',
  corpus = 'raw',
  cursor = 0,
  clients: injectedClients = null
}) {
  let clients = injectedClients;
  let ownsClients = false;
  let listOffset = cursor;
  let itemIndex = cursor;
  const buffer = [];
  let fetching = false;
  const curationStatus = curationStatusFromCorpus(corpus);

  async function ensureClients() {
    if (clients) return clients;
    clients = await createFeedMcpClients(mcpPorts, { host });
    ownsClients = true;
    return clients;
  }

  async function refillBuffer() {
    if (fetching || !clients?.firehose) return;
    fetching = true;
    try {
      const data = await callToolJson(clients.firehose, 'firehose_list_posts', {
        corpus,
        limit: PREFETCH_BATCH,
        offset: listOffset
      });
      const posts = data.posts ?? [];
      if (posts.length === 0) return;
      for (const post of posts) {
        buffer.push(
          makeFeedItem({
            family: 'stream',
            kind: 'micropost',
            corpus,
            curation_status: curationStatus,
            index: itemIndex,
            uri: postUri(corpus, post.filePath),
            text: post.text ?? undefined,
            meta: { seed }
          })
        );
        itemIndex += 1;
        listOffset += 1;
      }
    } catch (err) {
      logger.warn?.('[feed-kit] stream prefetch failed:', err.message);
    } finally {
      fetching = false;
    }
  }

  const feed = {
    family: /** @type {const} */ ('stream'),
    kind: 'real',
    nextItems(count = 1) {
      if (buffer.length < PREFETCH_LOW) {
        ensureClients()
          .then(() => refillBuffer())
          .catch(() => {});
      }
      if (buffer.length === 0) return [];
      return buffer.splice(0, count);
    },
    commitLabel(_ref, _label) {
      return Promise.resolve({ ok: true, committed: false, ledgerOnly: true });
    },
    async connect() {
      await ensureClients();
      await refillBuffer();
    },
    async close() {
      if (ownsClients && clients?.close) await clients.close();
    }
  };

  return withDropletAlias(feed);
}
