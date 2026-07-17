/**
 * MCP tools for the SSB volume (read-only).
 */

import { z } from 'zod';
import { jsonContent } from '@zeus/presets-sdk';
import {
  browseSsbCorpus,
  getSsbStats,
  listSsbMessages,
  loadSsbManifest,
  loadSsbMessage
} from './loader.mjs';

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {{ basePath: string }} ctx
 */
export function buildMcp(server, { basePath }) {
  server.registerTool(
    'ssb_browse',
    {
      title: 'Browse SSB corpus directory',
      description:
        'Lazy listing of exported JSON messages in tribes, parliament, or votes.',
      inputSchema: {
        corpus: z
          .enum(['tribes', 'parliament', 'votes'])
          .describe('Corpus id under DISK_04/SSB.'),
        limit: z.number().optional().describe('Page size (default 200, max 500).'),
        offset: z.number().optional().describe('Pagination offset (default 0).')
      }
    },
    async ({ corpus, limit, offset }) =>
      jsonContent(browseSsbCorpus(corpus, basePath, { limit, offset }))
  );

  server.registerTool(
    'ssb_list_messages',
    {
      title: 'List SSB messages in a corpus',
      description: 'Returns parsed message JSON rows for a corpus page.',
      inputSchema: {
        corpus: z.enum(['tribes', 'parliament', 'votes']),
        limit: z.number().optional(),
        offset: z.number().optional()
      }
    },
    async ({ corpus, limit, offset }) =>
      jsonContent(listSsbMessages(corpus, basePath, { limit, offset }))
  );

  server.registerTool(
    'ssb_get_message',
    {
      title: 'Read one SSB message by key',
      description: 'Loads a single exported message (`%hash=.sha256`).',
      inputSchema: {
        key: z.string().describe('SSB message key.')
      }
    },
    async ({ key }) => jsonContent(loadSsbMessage(key, basePath))
  );
}

/**
 * @param {string} basePath
 */
export function buildSsbCardExamples(basePath) {
  const stats = getSsbStats(basePath);
  const first =
    stats.corpora?.find((c) => !c.empty)?.id ??
    stats.corpora?.[0]?.id ??
    'tribes';
  return {
    goldenPath: {
      prompt: 'browse-corpus',
      args: { corpus: first },
      resolveUri: `ssb://corpus/${first}`,
      toolSample: {
        name: 'ssb_browse',
        args: { corpus: first, limit: 5, offset: 0 }
      }
    },
    sampleResolve: [
      { uri: 'ssb://stats', expect: 'object with corpora totals' },
      { uri: 'ssb://manifest', expect: 'object with syncedAt and corpora' },
      { uri: `ssb://corpus/${first}`, expect: 'object with corpus id and files' }
    ],
    prompts: [
      { name: 'explore-ssb', args: {} },
      { name: 'browse-corpus', args: { corpus: first } },
      { name: 'self-check', args: {} }
    ],
    mutationPrompts: []
  };
}

/**
 * @param {string} basePath
 */
export function getResourceRegistry(basePath) {
  return [
    {
      name: 'ssb-stats',
      uri: 'ssb://stats',
      title: 'SSB volume stats',
      mimeType: 'application/json',
      description: 'Corpus file counts for DISK_04/SSB.',
      read: () => getSsbStats(basePath)
    },
    {
      name: 'ssb-manifest',
      uri: 'ssb://manifest',
      title: 'SSB export manifest',
      mimeType: 'application/json',
      description: 'manifest.json written by the SSB sync exporter.',
      read: () => loadSsbManifest(basePath)
    }
  ];
}

/**
 * @param {string} basePath
 */
export function getTemplateRegistry(basePath) {
  return [
    {
      name: 'ssb-corpus',
      uriTemplate: 'ssb://corpus/{corpusId}',
      title: 'SSB corpus metadata',
      mimeType: 'application/json',
      description: 'Metadata for tribes, parliament, or votes corpus.',
      read: (variables) => {
        const stats = getSsbStats(basePath);
        if (stats.error) return stats;
        const listed = stats.corpora?.find((c) => c.id === variables.corpusId);
        if (!listed) return { error: `Unknown corpus: ${variables.corpusId}` };
        return listed;
      }
    },
    {
      name: 'ssb-message',
      uriTemplate: 'ssb://message/{key}',
      title: 'SSB message',
      mimeType: 'application/json',
      description: 'Single exported message by SSB key (URL-encoded).',
      read: (variables) => {
        const key = decodeURIComponent(variables.key);
        return loadSsbMessage(key, basePath);
      }
    }
  ];
}

/**
 * @param {string} basePath
 */
export function getPromptRegistry(_basePath) {
  return [
    {
      name: 'explore-ssb',
      title: 'Explore SSB volume',
      description: 'Onboarding for DISK_04/SSB read-only loader.',
      argsSchema: {},
      render: () => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Explore the SSB OASIS volume (DISK_04/SSB).',
                '',
                'Steps:',
                '1. Read server://card.examples (goldenPath, sampleResolve).',
                '2. Read ssb://stats and ssb://manifest.',
                '3. Follow goldenPath: getPrompt + ssb_browse + resolveUri.',
                '4. This server is read-only (sync is a separate CLI process).'
              ].join('\n')
            }
          }
        ]
      })
    },
    {
      name: 'browse-corpus',
      title: 'Browse SSB corpus',
      description: 'Browse tribes, parliament, or votes.',
      argsSchema: {
        corpus: z
          .enum(['tribes', 'parliament', 'votes'])
          .describe('Corpus id under DISK_04/SSB.')
      },
      render: ({ corpus }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `Browse SSB corpus "${corpus}" on DISK_04/SSB.`,
                '',
                'Steps:',
                `1. Read ssb://corpus/${corpus}.`,
                `2. Call ssb_browse({ corpus: "${corpus}", limit: 50, offset: 0 }).`,
                '3. Optionally ssb_get_message({ key }) for a listed key.'
              ].join('\n')
            }
          }
        ]
      })
    },
    {
      name: 'self-check',
      title: 'SSB prompt self-check',
      description: 'Validate prompts and sampleResolve URIs (read-only).',
      argsSchema: {},
      render: () => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Run a self-check of ssb-system MCP prompts (read-only).',
                '',
                'Steps:',
                '1. getPrompts — enumerate prompts.',
                '2. Read server://card.examples — goldenPath + sampleResolve.',
                '3. Resolve each sampleResolve URI; assert JSON.',
                '4. Report table: uri | OK? | notes.'
              ].join('\n')
            }
          }
        ]
      })
    }
  ];
}
