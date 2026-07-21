/**
 * MCP tools — gate to CityLifecycleRuntime.dispatchMando (única superficie).
 */

import { z } from 'zod';

function jsonContent(payload) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
}

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {{ runtime: import('./runtime.mjs').CityLifecycleRuntime }} ctx
 */
export function buildMcp(server, ctx) {
  const { runtime } = ctx;

  server.registerTool(
    'city_start',
    {
      title: 'City start (nodo/barrio)',
      description:
        'Mando: arrancar maquinarias del barrio vía lifecycle → Z06 launch/health.',
      inputSchema: {
        nodo: z.string().describe('Barrio id, e.g. state-machine')
      }
    },
    async ({ nodo }) => {
      try {
        return jsonContent(await runtime.dispatchMando('start', { nodo }));
      } catch (err) {
        return jsonContent({ ok: false, error: String(err?.message || err) });
      }
    }
  );

  server.registerTool(
    'city_stop',
    {
      title: 'City stop (nodo/barrio)',
      description: 'Mando: parada graceful del barrio (PARADA_SOLICITADA → Z06 stop).',
      inputSchema: {
        nodo: z.string()
      }
    },
    async ({ nodo }) => {
      try {
        return jsonContent(await runtime.dispatchMando('stop', { nodo }));
      } catch (err) {
        return jsonContent({ ok: false, error: String(err?.message || err) });
      }
    }
  );

  server.registerTool(
    'city_status',
    {
      title: 'City status',
      description: 'Snapshot proyectado del árbol (proceso → estado de juego).',
      inputSchema: {
        nodo: z.string().optional()
      }
    },
    async ({ nodo }) => {
      try {
        if (nodo) {
          return jsonContent(await runtime.dispatchMando('status', { nodo }));
        }
        return jsonContent({ ok: true, snapshot: runtime.snapshot() });
      } catch (err) {
        return jsonContent({ ok: false, error: String(err?.message || err) });
      }
    }
  );
}
