/**
 * Feeds reales read-only vía MCP (linea-firehose :3008, linea-system :4111/:4112).
 * commitLabel = ledger-only; excavateCorridor = cache_wikitext runtime fetch.
 */

import { resolveMcpApprovalToken } from '@zeus/presets-sdk';
import { createSyntheticMazeSource } from '@zeus/arg-domain';
import { curationStatusFromCorpus } from '@zeus/linea-kit/curation';
import { callToolJson, createArgMcpClients } from './mcp-client.mjs';

const PREFETCH_LOW = 8;
const PREFETCH_BATCH = 24;

function postUri(corpus, filePath) {
  const parts = String(filePath).split('/').filter(Boolean);
  const batch = parts[0] ?? 'batch';
  const file = parts.length > 1 ? parts.slice(1).join('/') : parts[0] ?? 'post.json';
  return `firehose://post/${corpus}/${batch}/${file}`;
}

function chamberYear(chamber, baseYear = 1874) {
  if (chamber?.ref?.index != null) return Number(chamber.ref.index);
  return baseYear + chamber.col * 12 + chamber.row * 4;
}

/**
 * @param {{
 *   mcpPorts: object,
 *   seed?: number,
 *   logger?: Console,
 *   gamemap?: object,
 *   approvalToken?: string,
 *   host?: string,
 *   clients?: Awaited<ReturnType<typeof createArgMcpClients>>
 * }} opts
 */
export function createRealFeeds({
  mcpPorts,
  seed = 1,
  logger = console,
  gamemap = {},
  approvalToken = resolveMcpApprovalToken(),
  host = 'localhost',
  clients: injectedClients = null
}) {
  let clients = injectedClients;
  let ownsClients = false;

  async function ensureClients() {
    if (clients) return clients;
    clients = await createArgMcpClients(mcpPorts, { host });
    ownsClients = true;
    return clients;
  }

  const firehoseCursor = gamemap?.seeds?.firehoseCursor ?? 0;
  let listOffset = firehoseCursor;
  let dropletIndex = firehoseCursor;
  const buffer = [];
  let fetching = false;
  const firehoseCorpus = 'raw';
  const firehoseCurationStatus = curationStatusFromCorpus(firehoseCorpus);

  async function refillBuffer() {
    if (fetching || !clients?.firehose) return;
    fetching = true;
    try {
      const data = await callToolJson(clients.firehose, 'firehose_list_posts', {
        corpus: firehoseCorpus,
        limit: PREFETCH_BATCH,
        offset: listOffset
      });
      const posts = data.posts ?? [];
      if (posts.length === 0) return;
      for (const post of posts) {
        buffer.push({
          kind: 'micropost',
          corpus: firehoseCorpus,
          curation_status: firehoseCurationStatus,
          index: dropletIndex,
          uri: postUri(firehoseCorpus, post.filePath)
        });
        dropletIndex += 1;
        listOffset += 1;
      }
    } catch (err) {
      logger.warn?.('[arg-feeds] firehose prefetch failed:', err.message);
    } finally {
      fetching = false;
    }
  }

  const syntheticFallback = createSyntheticMazeSource({ seed });

  const firehose = {
    kind: 'real',
    nextDroplets(count = 1) {
      if (buffer.length < PREFETCH_LOW) {
        ensureClients().then(() => refillBuffer()).catch(() => {});
      }
      if (buffer.length === 0) return [];
      return buffer.splice(0, count);
    },
    commitLabel(_ref, _label) {
      return Promise.resolve({ ok: true, committed: false, ledgerOnly: true });
    }
  };

  const mazeSource = {
    kind: 'real',
    /**
     * Carga start pack de gamemap.seeds.mazePack o deriva refs vía get_nodo.
     * @param {{ chambers: Record<string,object>, corridors: Record<string,object> }} topology
     */
    async loadMaze(topology) {
      const pack = gamemap?.seeds?.mazePack;
      if (pack?.chamberStates && pack?.corridorStates) {
        return {
          seed,
          chamberRefs: pack.chamberRefs ?? {},
          chamberStates: pack.chamberStates,
          corridorStates: pack.corridorStates
        };
      }

      await ensureClients();
      const chamberRefs = {};
      const chamberStates = {};
      for (const chamber of Object.values(topology.chambers)) {
        const year = chamberYear(chamber);
        chamberRefs[chamber.id] = { kind: 'nodo', uri: `linea://nodo/${year}`, index: year };
        chamberStates[chamber.id] = 'ghost';
        if (clients.espana) {
          try {
            const nodo = await callToolJson(clients.espana, 'get_nodo', { year });
            if (nodo?.nodo?.id) {
              chamberRefs[chamber.id] = { kind: 'nodo', uri: `linea://nodo/${year}`, index: year };
            }
          } catch (err) {
            logger.warn?.(`[arg-feeds] get_nodo ${year}:`, err.message);
          }
        }
      }

      const corridorStates = {};
      for (const corridor of Object.values(topology.corridors)) {
        corridorStates[corridor.id] = 'ghost';
      }
      const rows = Math.max(...Object.values(topology.chambers).map((c) => c.row));
      for (const corridor of Object.values(topology.corridors)) {
        const a = topology.chambers[corridor.a];
        const b = topology.chambers[corridor.b];
        if (a.row === rows && b.row === rows) corridorStates[corridor.id] = 'open';
      }
      for (const chamber of Object.values(topology.chambers)) {
        if (chamber.row === rows) chamberStates[chamber.id] = 'cached';
      }
      return { seed, chamberRefs, chamberStates, corridorStates };
    },

    /**
     * Runtime fetch vía cache_wikitext (gate APROBAR); no muta manifest.
     * @param {{ id, a, b, chamberA?: object, chamberB?: object }} corridor
     * @param {string} approval
     */
    async excavateCorridor(corridor, approval) {
      if (approval !== approvalToken) {
        throw new Error('aprobacion_requerida');
      }
      await ensureClients();
      if (!clients.wp) throw new Error('mcp_wp_no_disponible');

      const chamber = corridor.chamberB ?? corridor.chamberA;
      const year = chamberYear(chamber);
      const registros = await callToolJson(clients.wp, 'get_registros_for_year', { year });
      const oldid =
        registros?.anchor?.oldid ??
        registros?.registros?.[0]?.oldid ??
        null;
      if (!oldid) throw new Error('sin_oldid');

      const cache = await callToolJson(clients.wp, 'cache_wikitext', { oldid: Number(oldid) });
      return { ok: true, committed: false, cached: true, oldid: Number(oldid), status: cache.status };
    },

    /** Sintético embebido si MCP no alcanza en tests. */
    _synthetic: syntheticFallback
  };

  return {
    mode: 'real',
    requiresApproval: true,
    externalDig: true,
    approvalToken,
    firehose,
    mazeSource,
    async connect() {
      await ensureClients();
      await refillBuffer();
    },
    async close() {
      if (ownsClients && clients?.close) await clients.close();
    }
  };
}
