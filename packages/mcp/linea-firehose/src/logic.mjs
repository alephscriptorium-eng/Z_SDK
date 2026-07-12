/**
 * MCP tools for the firehose volume (read-only disk corpus).
 */

import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import {
  jsonContent,
  corpusRelPath,
  resolveVolume,
  TRIAGE_MANIFEST_PATH,
  resolveMcpApprovalToken,
  buildUiHref,
  resolveZeusUiPorts
} from '@zeus/presets-sdk';
import {
  browseCorpus,
  listPosts,
  getFirehoseStats,
  listCorpora,
  getCorpusConfig,
  loadPostFile
} from '@zeus/firehose-core';

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function buildMcp(server) {
  server.registerTool(
    'firehose_browse',
    {
      title: 'Browse firehose corpus directory',
      description:
        'Lazy directory listing within a firehose corpus (candidate, raw, discarded, labeled). Returns entries with pagination.',
      inputSchema: {
        corpus: z.string().describe('Corpus id: candidate, raw, discarded, or labeled.'),
        path: z
          .string()
          .optional()
          .describe('Relative path within the corpus (e.g. batch timestamp dir). Empty for corpus root.'),
        limit: z.number().optional().describe('Page size (default 200, max 500).'),
        offset: z.number().optional().describe('Pagination offset (default 0).')
      }
    },
    async ({ corpus, path = '', limit, offset }) =>
      jsonContent(await browseCorpus(corpus, path, { limit, offset }))
  );

  server.registerTool(
    'firehose_list_posts',
    {
      title: 'List normalized microposts',
      description:
        'Returns Jetstream posts normalized for preview (handle, text, uri) from JSON files under a corpus path.',
      inputSchema: {
        corpus: z.string().describe('Corpus id.'),
        path: z.string().optional().describe('Relative directory or JSON file path within corpus.'),
        recursive: z.boolean().optional().describe('Recurse subdirectories (default true).'),
        limit: z.number().optional().describe('Max posts (default 50).'),
        offset: z.number().optional().describe('Offset (default 0).')
      }
    },
    async ({ corpus, path = '', recursive, limit, offset }) =>
      jsonContent(await listPosts(corpus, path, { recursive, limit, offset }))
  );

  server.registerTool(
    'firehose_get_post',
    {
      title: 'Read and normalize a single post file',
      description: 'Loads one JSON post by volume-relative path (e.g. candidate/batch/file.json).',
      inputSchema: {
        path: z
          .string()
          .describe('Path relative to FIREHOSE volume root, including corpus prefix.')
      }
    },
    async ({ path }) => jsonContent(await loadPostFile(path))
  );
}

export function getResourceRegistry() {
  return [
    {
      name: 'firehose-stats',
      uri: 'firehose://stats',
      title: 'Firehose volume stats',
      mimeType: 'application/json',
      description: 'Corpus file counts and volume metadata from VOLUMES/DISK_01/FIREHOSE.',
      read: () => getFirehoseStats()
    },
    {
      name: 'firehose-triage',
      uri: 'firehose://triage',
      title: 'Triage manifest',
      mimeType: 'application/json',
      description: 'Parsed triage-manifest.json at the firehose volume root.',
      read: () => {
        const volume = resolveVolume('firehose');
        const full = path.join(volume.absPath, TRIAGE_MANIFEST_PATH.replace(/\//g, path.sep));
        return JSON.parse(fs.readFileSync(full, 'utf8'));
      }
    }
  ];
}

export function getTemplateRegistry() {
  return [
    {
      name: 'firehose-corpus',
      uriTemplate: 'firehose://corpus/{corpusId}',
      title: 'Firehose corpus metadata',
      mimeType: 'application/json',
      description: 'Metadata for one corpus (id, label, path, files, empty flag).',
      read: (variables) => {
        const { corpus } = getCorpusConfig(variables.corpusId);
        const listed = listCorpora().find((c) => c.id === variables.corpusId);
        if (!listed) return { error: `Unknown corpus: ${variables.corpusId}` };
        return { ...listed, volumePath: corpus.path };
      }
    },
    {
      name: 'firehose-post',
      uriTemplate: 'firehose://post/{corpusId}/{batch}/{filename}',
      title: 'Normalized firehose post',
      mimeType: 'application/json',
      description:
        'Single post JSON normalized from candidate/raw batch layout (corpus/batch/filename.json).',
      read: async (variables) => {
        const rel = corpusRelPath(
          variables.corpusId,
          `${variables.batch}/${variables.filename}`
        );
        return loadPostFile(rel);
      }
    }
  ];
}

export function buildFirehoseCardExamples() {
  const stats = getFirehoseStats();
  const candidate = stats.corpora?.find((c) => c.id === 'candidate' && !c.empty);
  const corpusId = candidate?.id ?? stats.corpora?.find((c) => !c.empty)?.id ?? 'candidate';
  return {
    approvalToken: resolveMcpApprovalToken(),
    goldenPath: {
      prompt: 'browse-corpus',
      args: { corpus: corpusId },
      resolveUri: `firehose://corpus/${corpusId}`,
      toolSample: { name: 'firehose_browse', args: { corpus: corpusId, limit: 5, offset: 0 } }
    },
    sampleResolve: [
      { uri: 'firehose://stats', expect: 'object with corpora totals' },
      { uri: 'firehose://triage', expect: 'object with triage results' },
      { uri: `firehose://corpus/${corpusId}`, expect: 'object with corpus id and files count' }
    ],
    prompts: [
      { name: 'browse-corpus', args: { corpus: corpusId } },
      { name: 'triage-report', args: {} },
      { name: 'self-check', args: {} }
    ],
    mutationPrompts: []
  };
}

export function getPromptRegistry() {
  return [
    {
      name: 'explore-firehose',
      title: 'Explore firehose volume',
      description: 'Onboarding: stats, golden browse path, self-check recipe. Read-only volume.',
      argsSchema: {},
      render: () => {
        const firehoseUiUrl = buildUiHref(resolveZeusUiPorts().firehose);
        return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Explore the firehose ONFALO volume (DISK_01/FIREHOSE).',
                '',
                'Steps:',
                '1. Read server://card.examples — single source of truth (goldenPath, sampleResolve).',
                '   Bridge fallback: getResourceByUri({ uri: "server://card" }).',
                '2. Golden path from examples.goldenPath:',
                '   - getPrompt(goldenPath.prompt, goldenPath.args).',
                '   - firehose_browse(goldenPath.toolSample.args) — confirm entries.',
                '   - getResourceByUri(goldenPath.resolveUri).',
                '   Error: unknown corpus id returns error; empty corpus returns empty entries.',
                '3. No mutation prompts on this server (read-only disk).',
                '4. Run getPrompt("self-check") for full validation including sampleResolve.',
                '5. Brief report: golden browse OK?, triage/stats readable?, any prompt failures.',
                `6. Optional UI: ${firehoseUiUrl}`
              ].join('\n')
            }
          }
        ]
      };
      }
    },
    {
      name: 'triage-report',
      title: 'firehose-mcp-server triage report',
      description: 'Interpret triage manifest and corpus stats for ONFALO volume.',
      argsSchema: {},
      render: () => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Produce a triage report for the firehose ONFALO volume (DISK_01/FIREHOSE).',
                '',
                'Steps:',
                '1. Read firehose://stats for corpus file counts (candidate, raw, discarded, labeled).',
                '   Bridge fallback: getResourceByUri({ uri: "firehose://stats" }).',
                '2. Read firehose://triage for triage-manifest.json (strategy, criteria, results).',
                '   Bridge fallback: getResourceByUri({ uri: "firehose://triage" }).',
                '3. Summarize: total/good/discarded breakdown, bot and language filters.',
                '4. List top good_handles by count from the triage manifest.',
                '5. Note labeled corpus status (empty vs populated) for CDR workflow.'
              ].join('\n')
            }
          }
        ]
      })
    },
    {
      name: 'browse-corpus',
      title: 'firehose-mcp-server corpus browse',
      description:
        'Browse a firehose corpus (candidate/raw/discarded/labeled) with metadata overview.',
      argsSchema: {
        corpus: z
          .enum(['candidate', 'raw', 'discarded', 'labeled'])
          .describe('Corpus id: candidate, raw, discarded, or labeled.')
      },
      render: ({ corpus }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `Browse firehose corpus "${corpus}" on DISK_01/FIREHOSE.`,
                '',
                'Steps:',
                `1. Read firehose://corpus/${corpus} for corpus metadata (files, path, empty flag).`,
                `   Bridge fallback: getResourceByUri({ uri: "firehose://corpus/${corpus}" }).`,
                `2. Call firehose_browse with { corpus: "${corpus}", limit: 200, offset: 0 } at corpus root.`,
                '   Pagination: increase offset by limit while pagination.hasMore is true (max limit 500).',
                '3. Drill into a batch: firehose_browse({ corpus, path: "<batchDir>", limit: 50, offset: 0 }).',
                '   Error: invalid path returns empty entries or not-found style error.',
                '4. firehose_list_posts on a batch path for micropost previews.',
                '5. Report corpus size, batch count, and sample post handles.'
              ].join('\n')
            }
          }
        ]
      })
    },
    {
      name: 'read-post',
      title: 'firehose-mcp-server read post',
      description: 'Load a single normalized firehose post JSON by corpus-relative path.',
      argsSchema: {
        corpus: z
          .enum(['candidate', 'raw', 'discarded', 'labeled'])
          .describe('Corpus id.'),
        path: z
          .string()
          .describe('Relative path within corpus, e.g. batchDir/filename.json.')
      },
      render: ({ corpus, path }) => {
        const parts = path.split('/');
        const batch = parts[0] ?? '{batch}';
        const filename = parts.slice(1).join('/') || '{filename}';
        const postUri = `firehose://post/${corpus}/${batch}/${filename}`;
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: [
                  `Read a single firehose post from corpus "${corpus}" at path "${path}".`,
                  '',
                  'Steps:',
                  `1. Call firehose_get_post with { path: "${corpus}/${path}" }.`,
                  `   Error: missing file returns structured error (ENOENT / not found).`,
                  `2. Alternatively read ${postUri}.`,
                  `   Bridge fallback: getResourceByUri({ uri: "${postUri}" }).`,
                  '3. Report: handle, text preview, createdAt, uri, filePath.',
                  '4. For batch discovery first, use browse-corpus or firehose_browse with limit/offset.'
                ].join('\n')
              }
            }
          ]
        };
      }
    },
    {
      name: 'self-check',
      title: 'firehose-mcp-server prompt self-check',
      description: 'Validate all firehose prompts: render, URI/tool refs; read-only — no mutation gates.',
      argsSchema: {},
      render: () => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Run a self-check of all firehose-mcp-server MCP prompts (read-only; touches data, zero mutation).',
                '',
                'Steps:',
                '1. Call getPrompts to enumerate prompts.',
                '2. Read server://card.examples — goldenPath, prompts[], sampleResolve.',
                '   Bridge fallback: getResourceByUri({ uri: "server://card" }).',
                '3. For each examples.prompts entry: getPrompt(name, args); assert render references URI/tool.',
                '4. **Touch the data**: resolve each examples.sampleResolve URI via getResourceByUri; assert valid JSON.',
                '5. Golden path: firehose_browse(examples.goldenPath.toolSample.args) — confirm pagination fields.',
                '6. No mutation prompts — gate column N/A.',
                '7. Report table: prompt | render OK? | sample URI OK? | gate? | notes.'
              ].join('\n')
            }
          }
        ]
      })
    }
  ];
}
