/**
 * Real static feed via linea MCP (DISK_02): iterator of nodo anchors + materialize.
 */

import { resolveMcpApprovalToken } from '@zeus/presets-sdk';
import { callToolJson, createFeedMcpClients } from './mcp-client.mjs';
import { makeFeedItem, withDropletAlias } from './item.mjs';

/**
 * @param {{
 *   mcpPorts: object,
 *   seed?: number,
 *   logger?: Console,
 *   host?: string,
 *   years?: number[],
 *   approvalToken?: string,
 *   clients?: Awaited<ReturnType<typeof createFeedMcpClients>>
 * }} opts
 */
export function createRealStaticFeed({
  mcpPorts,
  seed = 1,
  logger = console,
  host = 'localhost',
  years = [1874, 1875, 1876, 1877, 1878],
  approvalToken = resolveMcpApprovalToken(),
  clients: injectedClients = null
}) {
  let clients = injectedClients;
  let ownsClients = false;
  let cursor = 0;

  async function ensureClients() {
    if (clients) return clients;
    clients = await createFeedMcpClients(mcpPorts, { host });
    ownsClients = true;
    return clients;
  }

  const feed = {
    family: /** @type {const} */ ('static'),
    kind: 'real',
    requiresApproval: true,
    approvalToken,
    nextItems(count = 1) {
      const out = [];
      for (let i = 0; i < count; i++) {
        const year = years[cursor % years.length];
        cursor += 1;
        out.push(
          makeFeedItem({
            family: 'static',
            kind: 'nodo',
            index: year,
            uri: `linea://nodo/${year}`,
            text: String(year),
            curation_status: 'canon',
            meta: { seed }
          })
        );
      }
      return out;
    },
    /**
     * Runtime cache via cache_wikitext (approval gate); does not mutate manifest.
     * @param {{ year?: number, index?: number }} anchor
     * @param {string} approval
     */
    async materialize(anchor, approval) {
      if (approval !== approvalToken) {
        throw new Error('aprobacion_requerida');
      }
      await ensureClients();
      if (!clients.wp) throw new Error('mcp_wp_no_disponible');

      const year = Number(anchor?.year ?? anchor?.index);
      if (!Number.isFinite(year)) throw new Error('year_requerido');

      const registros = await callToolJson(clients.wp, 'get_registros_for_year', { year });
      const oldid =
        registros?.anchor?.oldid ?? registros?.registros?.[0]?.oldid ?? null;
      if (!oldid) throw new Error('sin_oldid');

      const cache = await callToolJson(clients.wp, 'cache_wikitext', {
        oldid: Number(oldid)
      });
      return {
        ok: true,
        committed: false,
        cached: true,
        oldid: Number(oldid),
        status: cache.status
      };
    },
    commitLabel(_ref, _label) {
      return Promise.resolve({ ok: true, committed: false, ledgerOnly: true });
    },
    async connect() {
      await ensureClients();
      if (clients.espana) {
        try {
          await callToolJson(clients.espana, 'get_nodo', { year: years[0] });
        } catch (err) {
          logger.warn?.('[feed-kit] static probe get_nodo:', err.message);
        }
      }
    },
    async close() {
      if (ownsClients && clients?.close) await clients.close();
    }
  };

  return withDropletAlias(feed);
}
