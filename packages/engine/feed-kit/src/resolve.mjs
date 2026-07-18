/**
 * Async resolution of feed families: auto probe → real | synthetic.
 */

import { FEED_FAMILIES } from './families.mjs';
import {
  createSyntheticFeedBag,
  createSyntheticStreamFeed,
  createSyntheticGossipFeed,
  createSyntheticStaticFeed
} from './synthetic.mjs';
import { probeFeedMcpHealth, createFeedMcpClients } from './mcp-client.mjs';
import { createRealStreamFeed } from './stream-real.mjs';
import { createRealGossipFeed } from './gossip-real.mjs';
import { createRealStaticFeed } from './static-real.mjs';

/**
 * @typedef {'auto'|'synthetic'|'real'} FeedMode
 */

/**
 * Resolve a bag of feeds for the three DATOS.md §3 families.
 *
 * @param {{
 *   mode?: FeedMode,
 *   seed?: number,
 *   logger?: Console,
 *   mcpPorts?: object,
 *   host?: string,
 *   families?: import('./families.mjs').FeedFamily[],
 *   streamCursor?: number,
 *   streamCorpus?: string,
 *   staticYears?: number[],
 *   gossipCorpora?: string[],
 *   requireForAuto?: ('stream'|'static'|'gossip')[]
 * }} [opts]
 */
export async function resolveRuntimeFeeds({
  mode = 'auto',
  seed = 1,
  logger = console,
  mcpPorts = {},
  host = 'localhost',
  families = [...FEED_FAMILIES],
  streamCursor = 0,
  streamCorpus = 'raw',
  staticYears,
  gossipCorpora,
  requireForAuto = ['stream', 'static']
} = {}) {
  if (mode === 'synthetic') {
    return pickFamilies(createSyntheticFeedBag({ seed }), families);
  }

  if (mode === 'auto') {
    const ok = await probeFeedMcpHealth(mcpPorts, {
      host,
      require: requireForAuto
    });
    if (!ok) {
      logger.warn?.('[feed-kit] auto → sintético (MCP no responde)');
      return pickFamilies(createSyntheticFeedBag({ seed }), families);
    }
    mode = 'real';
  }

  const sharedClients = await createFeedMcpClients(mcpPorts, { host, logger });
  const wanted = new Set(families);

  /** @type {Record<string, object>} */
  const realFamilies = {};
  let anyReal = false;

  if (wanted.has('stream')) {
    if (sharedClients.firehose) {
      realFamilies.stream = createRealStreamFeed({
        mcpPorts,
        seed,
        logger,
        host,
        corpus: streamCorpus,
        cursor: streamCursor,
        clients: sharedClients
      });
      anyReal = true;
    } else {
      logger.warn?.('[feed-kit] stream → sintético (firehose MCP ausente)');
      realFamilies.stream = createSyntheticStreamFeed({ seed });
    }
  }
  if (wanted.has('static')) {
    if (sharedClients.wp || sharedClients.espana) {
      realFamilies.static = createRealStaticFeed({
        mcpPorts,
        seed,
        logger,
        host,
        years: staticYears,
        clients: sharedClients
      });
      anyReal = true;
    } else {
      logger.warn?.('[feed-kit] static → sintético (linea MCP ausente)');
      realFamilies.static = createSyntheticStaticFeed({ seed });
    }
  }
  if (wanted.has('gossip')) {
    if (sharedClients.ssb) {
      realFamilies.gossip = createRealGossipFeed({
        mcpPorts,
        seed,
        logger,
        host,
        corpora: gossipCorpora,
        clients: sharedClients
      });
      anyReal = true;
    } else {
      logger.warn?.('[feed-kit] gossip → sintético (ssb MCP ausente)');
      realFamilies.gossip = createSyntheticGossipFeed({ seed });
    }
  }

  const bag = {
    mode: anyReal ? 'real' : 'synthetic',
    families: realFamilies,
    requiresApproval: anyReal,
    async connect() {
      await Promise.all(
        Object.values(realFamilies)
          .filter((f) => typeof f.connect === 'function')
          .map((f) => f.connect())
      );
    },
    async close() {
      await sharedClients.close();
    }
  };

  await bag.connect();
  return bag;
}

/**
 * @param {{ mode: string, families: Record<string, object>, close?: Function, connect?: Function }} bag
 * @param {string[]} families
 */
function pickFamilies(bag, families) {
  const wanted = new Set(families);
  const picked = {};
  for (const id of Object.keys(bag.families)) {
    if (wanted.has(id)) picked[id] = bag.families[id];
  }
  return {
    mode: bag.mode,
    families: picked,
    connect: bag.connect,
    close: bag.close
  };
}
