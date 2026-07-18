/**
 * Real gossip feed via SSB MCP (DISK_04).
 */

import { callToolJson, createFeedMcpClients } from './mcp-client.mjs';
import { makeFeedItem, withDropletAlias } from './item.mjs';

const PREFETCH_LOW = 4;
const PREFETCH_BATCH = 16;
const DEFAULT_CORPORA = Object.freeze(['tribes', 'parliament', 'votes']);

function messageUri(corpus, key) {
  const encoded = encodeURIComponent(String(key));
  return `ssb://message/${corpus}/${encoded}`;
}

/**
 * @param {{
 *   mcpPorts: object,
 *   seed?: number,
 *   logger?: Console,
 *   host?: string,
 *   corpora?: string[],
 *   clients?: Awaited<ReturnType<typeof createFeedMcpClients>>
 * }} opts
 */
export function createRealGossipFeed({
  mcpPorts,
  seed = 1,
  logger = console,
  host = 'localhost',
  corpora = DEFAULT_CORPORA,
  clients: injectedClients = null
}) {
  let clients = injectedClients;
  let ownsClients = false;
  const offsets = Object.fromEntries(corpora.map((c) => [c, 0]));
  let corpusCursor = 0;
  let itemIndex = 0;
  const buffer = [];
  let fetching = false;

  async function ensureClients() {
    if (clients) return clients;
    clients = await createFeedMcpClients(mcpPorts, { host });
    ownsClients = true;
    return clients;
  }

  async function refillBuffer() {
    if (fetching || !clients?.ssb || corpora.length === 0) return;
    fetching = true;
    try {
      let attempts = 0;
      while (buffer.length < PREFETCH_BATCH && attempts < corpora.length) {
        const corpus = corpora[corpusCursor % corpora.length];
        corpusCursor += 1;
        attempts += 1;
        const data = await callToolJson(clients.ssb, 'ssb_list_messages', {
          corpus,
          limit: PREFETCH_BATCH,
          offset: offsets[corpus] ?? 0
        });
        const messages = data.messages ?? [];
        if (messages.length === 0) continue;
        for (const msg of messages) {
          const key = msg.key ?? msg.meta?.key;
          if (!key) continue;
          const contentType = msg.value?.content?.type ?? msg.content?.type ?? 'message';
          buffer.push(
            makeFeedItem({
              family: 'gossip',
              kind: 'message',
              corpus,
              index: itemIndex,
              uri: messageUri(corpus, key),
              text: contentType,
              curation_status: 'raw',
              meta: { seed, key, type: contentType }
            })
          );
          itemIndex += 1;
          offsets[corpus] = (offsets[corpus] ?? 0) + 1;
        }
      }
    } catch (err) {
      logger.warn?.('[feed-kit] gossip prefetch failed:', err.message);
    } finally {
      fetching = false;
    }
  }

  const feed = {
    family: /** @type {const} */ ('gossip'),
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
