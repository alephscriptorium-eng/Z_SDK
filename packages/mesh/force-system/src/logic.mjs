/**
 * MCP tools for the forces volume (read-only).
 */

import { z } from 'zod';
import { jsonContent } from '@zeus/presets-sdk';
import {
  buildForcesRegistryView,
  resolveForce,
  resolveForceScene
} from './loader.mjs';

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {{ forcesData: object }} ctx
 */
export function buildMcp(server, { forcesData }) {
  server.registerTool(
    'get_force_registry',
    {
      title: 'Get forces registry',
      description:
        'Returns activation rules (session_budget, exclusions), boot id, and force/cota id lists.',
      inputSchema: {}
    },
    async () => jsonContent(buildForcesRegistryView(forcesData))
  );

  server.registerTool(
    'get_force',
    {
      title: 'Get force or cota card',
      description:
        'Returns activation card, anchor_scene, and pairs_with. Unmounted linea:* refs appear in pending_refs (not an error).',
      inputSchema: {
        id: z.string().describe('Force or cota id from force://registry')
      }
    },
    async ({ id }) => jsonContent(resolveForce(forcesData, id))
  );

  server.registerTool(
    'get_force_scene',
    {
      title: 'Get force scene layers',
      description:
        'Reads prompt/think/output layers for a scene under a force or cota (session + slug).',
      inputSchema: {
        id: z.string().describe('Force or cota id'),
        session: z.string().describe('Scene session folder name'),
        slug: z.string().describe('Scene slug folder name')
      }
    },
    async ({ id, session, slug }) =>
      jsonContent(await resolveForceScene(forcesData, id, session, slug))
  );
}

/**
 * @param {object} forcesData
 */
export function buildForceCardExamples(forcesData) {
  const view = buildForcesRegistryView(forcesData);
  const sampleId = view.boot || view.force_ids[0] || view.cota_ids[0];
  const sample = sampleId ? resolveForce(forcesData, sampleId) : null;
  const anchor = sample?.anchor_scene ? String(sample.anchor_scene).split('/') : null;
  const session = anchor?.[0];
  const slug = anchor?.[1];
  const sceneUri =
    sampleId && session && slug
      ? `force://${sampleId}/scene/${session}/${slug}`
      : 'force://{id}/scene/{session}/{slug}';

  return {
    goldenPath: {
      prompt: 'report-force',
      args: sampleId ? { id: sampleId } : {},
      resolveUri: sampleId ? `force://${sampleId}` : 'force://{id}'
    },
    sampleResolve: [
      { uri: 'force://registry', expect: 'object with session_budget and force_ids' },
      ...(sampleId
        ? [{ uri: `force://${sampleId}`, expect: 'object with card and anchor_scene' }]
        : []),
      ...(sampleId && session && slug
        ? [{ uri: sceneUri, expect: 'object with layers and is_anchor' }]
        : [])
    ],
    prompts: [
      { name: 'explore-server', args: {} },
      { name: 'report-force', args: sampleId ? { id: sampleId } : {} },
      { name: 'self-check', args: {} }
    ],
    mutationPrompts: []
  };
}
