/**
 * linea-editor MCP server — gated mutation surface over linea-kit/tools.
 */

import { z } from 'zod';
import {
  promptMessages,
  resolveMcpApprovalToken,
  mcpApprovalGateLine,
  jsonContent
} from '@zeus/presets-sdk';
import { createStandardMcpServer } from '@zeus/presets-sdk/mcp';
import { SERVER_NAME, SERVER_VERSION } from './config.mjs';
import { describeApprovalGate } from './gate.mjs';
import {
  MUTATION_TOOL_CREAR_LINEA,
  TOOL_EXPORT_STORY_BOARD,
  runCrearLineaGated,
  runExportStoryBoardGated
} from './tools.mjs';

/**
 * @param {{ lineasRoot: string, port: number }} config
 */
function buildCardExamples(config) {
  const { token, gateLine } = describeApprovalGate(MUTATION_TOOL_CREAR_LINEA);
  return {
    approvalToken: token,
    gateLine,
    lineasRoot: config.lineasRoot,
    goldenPath: {
      tool: MUTATION_TOOL_CREAR_LINEA,
      args: {
        id: 'juguete',
        approve: true,
        approvalToken: token
      }
    },
    mutationTools: [MUTATION_TOOL_CREAR_LINEA, TOOL_EXPORT_STORY_BOARD],
    sampleResolve: [
      { uri: 'editor://info', expect: 'object with lineasRoot and gate' }
    ]
  };
}

function getResourceRegistry(config) {
  return [
    {
      name: 'editor-info',
      uri: 'editor://info',
      title: 'linea-editor info',
      mimeType: 'application/json',
      description:
        'Fact card: volume root, visible approval gate, mutation tool names.',
      read: () => {
        const gate = describeApprovalGate([
          MUTATION_TOOL_CREAR_LINEA,
          TOOL_EXPORT_STORY_BOARD
        ]);
        return {
          name: SERVER_NAME,
          version: SERVER_VERSION,
          lineasRoot: config.lineasRoot,
          mutationTools: [MUTATION_TOOL_CREAR_LINEA, TOOL_EXPORT_STORY_BOARD],
          gate: {
            visible: true,
            token_env: 'ZEUS_MCP_APPROVAL_TOKEN',
            gate_line: gate.gateLine
          },
          frontier: {
            this_server: 'mutation + export',
            sibling_read: 'linea-system (read + cache)',
            path_model: 'linea-kit/viaje (camino; read-only here)'
          }
        };
      }
    }
  ];
}

function getPromptRegistry() {
  return [
    {
      name: 'explore-server',
      title: 'linea-editor exploration',
      description: 'Onboarding: read editor://info and exercise gated crear_linea.',
      argsSchema: {},
      render: () => {
        const token = resolveMcpApprovalToken();
        const gateLine = mcpApprovalGateLine(MUTATION_TOOL_CREAR_LINEA);
        return promptMessages(
          [
            'Explore linea-editor (gated authorship).',
            '',
            'Steps:',
            '1. Read server://card and editor://info.',
            `2. ${gateLine}`,
            `3. Call ${MUTATION_TOOL_CREAR_LINEA} with approve:true and approvalToken:\`${token}\`.`,
            '4. Confirm volume files + kit schema validation in the tool result.',
            '5. Optionally export_story_board — horse payload must be refs only.'
          ].join('\n')
        );
      }
    }
  ];
}

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {{ lineasRoot: string }} config
 */
export function buildMcp(server, config) {
  server.registerTool(
    MUTATION_TOOL_CREAR_LINEA,
    {
      title: 'Create trunk line (gated)',
      description:
        'Wraps linea-kit crearLinea. Requires approve + exact approvalToken. Writes under lineasRoot; validates kit schemas.',
      inputSchema: {
        id: z.string().describe('Line id (folder under LINEAS).'),
        etiqueta: z.string().optional(),
        autorTronco: z.string().optional(),
        referenciaWp: z.string().optional(),
        overwrite: z.boolean().optional(),
        approve: z.boolean().describe('Must be true after human approval.'),
        approvalToken: z
          .string()
          .describe('Exact ZEUS_MCP_APPROVAL_TOKEN value (default APROBAR).')
      }
    },
    async (args) =>
      jsonContent(
        runCrearLineaGated({
          ...args,
          lineasRoot: config.lineasRoot
        })
      )
  );

  server.registerTool(
    TOOL_EXPORT_STORY_BOARD,
    {
      title: 'Export story-board from line (gated)',
      description:
        'Emits story-board.json + TransmediaEvent refs. Horse-safe result = URIs only.',
      inputSchema: {
        lineDir: z.string().describe('Absolute path to an existing line folder.'),
        outPath: z.string().optional(),
        approve: z.boolean(),
        approvalToken: z.string()
      }
    },
    async (args) => {
      const full = runExportStoryBoardGated(args);
      // Strip corpus from MCP content when callers only need horse refs
      const { board, events, ...rest } = full;
      return jsonContent({
        ...rest,
        board_omitted: true,
        events_omitted: true,
        note: 'Full board written to outPath; horse payload is refs only'
      });
    }
  );
}

/**
 * @param {{ lineasRoot: string, port: number }} config
 */
export function createServer(config) {
  return createStandardMcpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    port: config.port,
    registry: getResourceRegistry(config),
    templateRegistry: [],
    promptRegistry: getPromptRegistry(),
    buildMcp: (server) => buildMcp(server, config),
    logLabel: SERVER_NAME,
    getCardExamples: () => buildCardExamples(config)
  });
}
