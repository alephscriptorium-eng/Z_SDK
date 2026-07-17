/**
 * MCP server factory for DISK_03/FORCES (read-only force:// resources).
 */

import { z } from 'zod';
import { promptMessages } from '@zeus/presets-sdk';
import { createStandardMcpServer } from '@zeus/presets-sdk/mcp';
import {
  buildForcesRegistryView,
  resolveForce,
  resolveForceScene
} from './loader.mjs';
import { SERVER_NAME, SERVER_VERSION } from './config.mjs';
import * as logic from './logic.mjs';

function getResourceRegistry(forcesData) {
  return [
    {
      name: 'force-registry',
      uri: 'force://registry',
      title: 'Forces registry',
      mimeType: 'application/json',
      description:
        'Aggregated registry: session_budget, exclusions, boot, force_ids, cota_ids.',
      read: () => buildForcesRegistryView(forcesData)
    },
    {
      name: 'force-info',
      uri: 'force://info',
      title: 'Forces volume info',
      mimeType: 'application/json',
      description: 'Static fact card for the forces MCP loader (counts + boot).',
      read: () => {
        const view = buildForcesRegistryView(forcesData);
        return {
          name: SERVER_NAME,
          volume: 'forces',
          boot: view.boot,
          force_count: view.force_count,
          cota_count: view.cota_count,
          session_budget: view.session_budget
        };
      }
    }
  ];
}

function getTemplateRegistry(forcesData) {
  return [
    {
      name: 'force-card',
      uriTemplate: 'force://{id}',
      title: 'Force or cota card',
      mimeType: 'application/json',
      description:
        'Activation card for a force or cota id. pending_refs lists unmounted linea:* (not an error).',
      read: (variables) => resolveForce(forcesData, variables.id)
    },
    {
      name: 'force-scene',
      uriTemplate: 'force://{id}/scene/{session}/{slug}',
      title: 'Force scene layers',
      mimeType: 'application/json',
      description:
        'Scene corpus layers (prompt/think/output) for session/slug under a force or cota.',
      read: async (variables) =>
        resolveForceScene(forcesData, variables.id, variables.session, variables.slug)
    }
  ];
}

function getPromptRegistry() {
  return [
    {
      name: 'explore-server',
      title: 'Forces server exploration',
      description: 'Onboarding: read force://registry and exercise golden path.',
      argsSchema: {},
      render: () =>
        promptMessages(
          [
            'Explore the forces MCP server (read-only).',
            '',
            'Steps:',
            '1. Read server://card for examples (goldenPath, sampleResolve).',
            '2. Read force://registry — confirm session_budget.',
            '3. Resolve force://{id} for the boot or a listed force_id.',
            '4. Resolve force://{id}/scene/{session}/{slug} for the anchor_scene.',
            '5. Note: linea:* in pending_refs means connection pending, not failure.'
          ].join('\n')
        )
    },
    {
      name: 'report-force',
      title: 'Force card report',
      description: 'Instructions to report a force/cota card and its anchor scene.',
      argsSchema: {
        id: z.string().optional().describe('Force or cota id (from force://registry).')
      },
      render: ({ id }) => {
        const target = id ? `id ${id}` : 'an id from force://registry';
        const cardUri = id ? `force://${id}` : 'force://{id}';
        return promptMessages(
          [
            `Produce a force/cota report for ${target}.`,
            '',
            'Steps:',
            '1. Read force://registry for session_budget context.',
            `2. Read ${cardUri} for card, anchor_scene, pending_refs.`,
            '3. Split anchor_scene into session/slug; read force://{id}/scene/{session}/{slug}.',
            '4. Summarize viewpoint/lore (if present), triggers, and whether linea refs are pending.'
          ].join('\n')
        );
      }
    },
    {
      name: 'self-check',
      title: 'Forces prompt self-check',
      description: 'Validate prompts and sampleResolve URIs (read-only).',
      argsSchema: {},
      render: () =>
        promptMessages(
          [
            'Run a self-check of forces MCP prompts (read-only).',
            '',
            'Steps:',
            '1. getPrompts — enumerate prompts.',
            '2. Read server://card.examples — goldenPath + sampleResolve.',
            '3. For each sampleResolve URI, getResourceByUri; assert JSON.',
            '4. Confirm force://registry includes session_budget.',
            '5. Report table: uri | OK? | notes.'
          ].join('\n')
        )
    }
  ];
}

/**
 * @param {number} port
 * @param {object} forcesData
 */
export function createServer(port, forcesData) {
  return createStandardMcpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    port,
    registry: getResourceRegistry(forcesData),
    templateRegistry: getTemplateRegistry(forcesData),
    promptRegistry: getPromptRegistry(),
    buildMcp: (server) => logic.buildMcp(server, { forcesData }),
    logLabel: SERVER_NAME,
    getCardExamples: () => logic.buildForceCardExamples(forcesData)
  });
}
