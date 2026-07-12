/**
 * Shared factory for a linea-poder MCP server over Streamable HTTP.
 *
 * Transport contract (mirrors solar-system body-server): POST {base}/mcp for MCP
 * traffic, GET {base}/mcp/health for discovery. Stateless HTTP: one persistent
 * McpServer per process; each POST gets an ephemeral transport.
 */

import { z } from 'zod';
import { promptMessages, resolveMcpApprovalToken, mcpApprovalGateLine } from '@zeus/presets-sdk';
import { createStandardMcpServer } from '@zeus/presets-sdk/mcp';
import { resolveNodo, resolveOldid, resolveParte, readWikitext, readRegistro, resolveRegistrosForNodo, resolveRegistrosForYear } from './loader.mjs';
import { SERVER_VERSION } from './lineas.mjs';
import * as logic from './logic.mjs';

function buildLineaInfo(config, lineData) {
  const coverage = config.kind === 'satelite' ? lineData.satellite.coverage : lineData.coverage;
  return {
    name: config.name,
    kind: config.kind,
    lineaId: config.lineaId,
    etiqueta: lineData.entry.etiqueta,
    autor_tronco: lineData.entry.autor_tronco ?? lineData.manifest.meta?.autor_tronco,
    coverage,
    nodo_count: lineData.entry.nodo_count ?? Object.keys(lineData.nodos).length,
    ...(config.kind === 'satelite'
      ? {
          satellite: lineData.satellite.meta?.title,
          registro_count: lineData.satellite.meta?.registro_count
        }
      : {})
  };
}

function parseYear(value) {
  const y = Number(value);
  if (!Number.isFinite(y)) {
    return { error: `Invalid year "${value}": must be a number` };
  }
  return { year: y };
}

function sampleNodoYear(lineData) {
  const nodos = Object.values(lineData.nodos || {});
  const sample = nodos.find((n) => n?.año_ini != null) ?? nodos[0];
  return sample?.año_ini ?? lineData.coverage?.min ?? 450;
}

function buildLineaCardExamples(config, lineData) {
  const sampleYear = sampleNodoYear(lineData);
  const examples = {
    approvalToken: resolveMcpApprovalToken(),
    goldenPath: {
      prompt: 'report-nodo',
      args: { year: String(sampleYear) },
      resolveUri: `linea://nodo/${sampleYear}`
    },
    sampleResolve: [
      { uri: 'linea://info', expect: 'object with coverage and nodo_count' },
      { uri: `linea://nodo/${sampleYear}`, expect: 'object with nodo.id' }
    ],
    prompts: [
      { name: 'report-nodo', args: { year: String(sampleYear) } },
      { name: 'report-parte', args: { id: 'I' } },
      { name: 'self-check', args: {} }
    ]
  };
  if (config.kind === 'satelite' && lineData.satellite?.cacheStats) {
    const oldids = lineData.satellite.cacheStats.cached_oldids || [];
    const wpYear = String(Math.min(lineData.satellite.coverage?.max ?? 2010, 2026));
    examples.sampleResolve.push({
      uri: 'linea://cache/stats',
      expect: 'object with coverage_pct and cached_oldids'
    });
    if (oldids.length > 0) {
      examples.sampleResolve.push({
        uri: `linea://wikitext/${oldids[0]}`,
        expect: 'cached wikitext object or structured not-cached error'
      });
    }
    examples.prompts.push({ name: 'report-oldid', args: { year: wpYear } });
    examples.prompts.push({ name: 'report-registros-nodo', args: { year: String(sampleYear) } });
    examples.mutationPrompts = ['execute-viaje'];
    examples.goldenPathSatelite = {
      prompt: 'report-registros-nodo',
      args: { year: String(sampleYear) },
      resolveUri: `linea://registros/year/${sampleYear}`
    };
    examples.sampleResolve.push({
      uri: `linea://registros/year/${sampleYear}`,
      expect: 'object with nodo and registros[]'
    });
  }
  return examples;
}

function getResourceRegistry(config, lineData) {
  const resources = [
    {
      name: 'linea-info',
      uri: 'linea://info',
      title: `${config.name} info`,
      mimeType: 'application/json',
      description: `Static fact card for the "${config.name}" linea-poder server: coverage, nodos and metadata.`,
      read: () => buildLineaInfo(config, lineData)
    }
  ];

  if (config.kind === 'satelite' && lineData.satellite) {
    resources.push({
      name: 'linea-cache-stats',
      uri: 'linea://cache/stats',
      title: `${config.name} cache stats`,
      mimeType: 'application/json',
      description: `Cache coverage statistics: registro_count, curated_registros, cached_wikitexts, cached_oldids, milestones_sin_cuerpo and coverage_pct.`,
      read: () => lineData.satellite.cacheStats
    });
  }

  return resources;
}

function getTemplateRegistry(config, lineData) {
  const templates = [
    {
      name: 'linea-nodo',
      uriTemplate: 'linea://nodo/{year}',
      title: `Nodo at year`,
      mimeType: 'application/json',
      description: `Resolves the Villacañas nodo (Px), tesis and articulos_wp for a historical year on the trunk.`,
      read: (variables) => {
        const parsed = parseYear(variables.year);
        if (parsed.error) return parsed;
        return resolveNodo(lineData, parsed.year, config.coverage);
      }
    },
    {
      name: 'linea-parte',
      uriTemplate: 'linea://parte/{id}',
      title: `Parte I a IV`,
      mimeType: 'application/json',
      description: `Returns metadata for a parte (I, II, III or IV): title, year range and nodos.`,
      read: (variables) => resolveParte(lineData, variables.id)
    }
  ];

  if (config.kind === 'satelite' && lineData.satellite) {
    templates.push(
      {
        name: 'linea-oldid',
        uriTemplate: 'linea://oldid/{year}',
        title: `WP oldid at year`,
        mimeType: 'application/json',
        description: `Wikipedia revision (oldid + timestamp) whose **calendar edit year** is at or before the end of the given year. Coverage 2001–2026 only. Distinct from linea://registros/year/{year}, which lists thematic edits for the Villacañas nodo at that historical year.`,
        read: (variables) => {
          const parsed = parseYear(variables.year);
          if (parsed.error) return parsed;
          return resolveOldid(lineData.satellite, parsed.year);
        }
      },
      {
        name: 'linea-wikitext',
        uriTemplate: 'linea://wikitext/{oldid}',
        title: `WP wikitext snapshot`,
        mimeType: 'application/json',
        description: `Cached wikitext body for a specific Wikipedia oldid. Returns error if not cached. Use linea://cache/stats to see cached_oldids.`,
        read: async (variables) => readWikitext(lineData.satellite, variables.oldid)
      },
      {
        name: 'linea-registro',
        uriTemplate: 'linea://registro/{id}',
        title: `Curated registro annotations`,
        mimeType: 'application/json',
        description: `Curated annotations (registro.md and delta.md) for a specific registro_id. Returns error if not curated. Use linea://cache/stats to see curated_registros count.`,
        read: async (variables) => readRegistro(lineData.satellite, variables.id)
      },
      {
        name: 'linea-registros-nodo',
        uriTemplate: 'linea://registros/nodo/{nodo_id}',
        title: `Thematic WP registros for nodo`,
        mimeType: 'application/json',
        description: `Lists Wikipedia revision registros that edited sections mapped to a Villacañas nodo (P01–P24). Includes wave-A anchor when available.`,
        read: (variables) => resolveRegistrosForNodo(lineData, variables.nodo_id)
      },
      {
        name: 'linea-registros-year',
        uriTemplate: 'linea://registros/year/{year}',
        title: `Thematic WP registros for historical year`,
        mimeType: 'application/json',
        description: `Resolves the Villacañas nodo at a historical year, then lists thematic WP registros for that nodo's mapped sections. Works outside WP calendar coverage (e.g. year 1000 → P03).`,
        read: (variables) => {
          const parsed = parseYear(variables.year);
          if (parsed.error) return parsed;
          return resolveRegistrosForYear(lineData, parsed.year);
        }
      }
    );
  }

  return templates;
}

function getPromptRegistry(config, _lineData) {
  const commonPrompts = [
    {
      name: 'explore-server',
      title: `${config.name} server exploration`,
      description: `Onboarding: read linea://info and server://card, exercise a golden path, verify mutation gates.`,
      argsSchema: {},
      kinds: ['tronco', 'satelite'],
      render: () => {
        const mutationStep =
          config.kind === 'satelite'
            ? `5. Mutation prompt execute-viaje: render with getPrompt; verify gate requires exact token \`${resolveMcpApprovalToken()}\` — do NOT call cache_wikitext.`
            : '5. Tronco has no mutation prompts; skip gate verification.';
        const steps = [
          `Explore the ${config.name} MCP server capabilities.`,
          '',
          'Steps:',
          '1. Read server://card — **single source of truth** for examples (goldenPath, sampleResolve, approvalToken).',
          '   Bridge fallback: getResourceByUri({ uri: "server://card" }).',
          '2. Read linea://info for coverage context only.',
          '   Bridge fallback: getResourceByUri({ uri: "linea://info" }).',
          '3. List resource templates with getResourceTemplates.',
          '4. Golden path from server://card.examples.goldenPath:',
          '   - getPrompt(goldenPath.prompt, goldenPath.args).',
          '   - Resolve goldenPath.resolveUri via getResourceByUri; confirm valid JSON.',
          '   Error: invalid year returns { error }; year outside coverage returns explicit error.',
          mutationStep,
          '6. Run getPrompt("self-check") for full validation including sampleResolve (recommended).',
          '7. Brief report: golden path OK?, mutation gates OK?, any prompt failures.'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'report-nodo',
      title: `${config.name} nodo report`,
      description: `Instructions for an agent to produce a nodo report for a given historical year.`,
      argsSchema: {
        year: z
          .string()
          .optional()
          .describe('Historical year as a string. If omitted, the agent should ask or pick a year in coverage.')
      },
      kinds: ['tronco', 'satelite'],
      render: ({ year }) => {
        const at = year ? `year ${year}` : 'a year within coverage';
        const nodoUri = year ? `linea://nodo/${year}` : 'linea://nodo/{year}';
        const oldidUri =
          config.kind === 'satelite' && year
            ? `linea://oldid/${year}`
            : config.kind === 'satelite'
              ? 'linea://oldid/{year}'
              : null;
        const steps = [
          `Produce a nodo report for ${config.name} at ${at}.`,
          '',
          'Steps:',
          '1. Read linea://info for coverage and metadata.',
          '   Bridge fallback: getResourceByUri({ uri: "linea://info" }).',
          `2. Resolve the Villacañas nodo at ${at}:`,
          `   - Preferred: read ${nodoUri}.`,
          `   - Alternative: call get_nodo with { "year": ${year ?? '<year>'} }.`,
          `   - Bridge fallback: getResourceByUri({ uri: "${year ? `linea://nodo/${year}` : 'linea://nodo/<year>'}" }).`
        ];
        if (oldidUri) {
          steps.push(
            `3. List thematic WP registros for the nodo at ${at}:`,
            `   - Preferred: read linea://registros/year/${year ?? '{year}'}.`,
            `   - Alternative: call get_registros_for_year with { "year": ${year ?? '<year>'} }.`,
            `4. (Optional) For calendar WP snapshot at edit year, read ${oldidUri}.`,
            `   - Alternative: call get_oldid with { "year": ${year ?? '<year>'} }.`,
            '   Note: oldid by calendar year only works 2001–2026; use registros/year for thematic bridge.',
            '5. (Optional) If you want the wikitext body, read linea://wikitext/{oldid}.',
            '   If not cached, propose a viaje: read linea://cache/stats and negotiate budget.',
            '6. Write a concise report combining nodo (id, etiqueta, tesis), registros list and optional oldid/wikitext.'
          );
        } else {
          steps.push('3. Write a concise report with nodo id, etiqueta, parte and tesis_villacañas.');
        }
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'report-parte',
      title: `${config.name} parte report`,
      description: `Instructions to produce a report for a parte (I, II, III or IV).`,
      argsSchema: {
        id: z.string().describe('Parte id: I, II, III or IV.')
      },
      kinds: ['tronco', 'satelite'],
      render: ({ id }) => {
        const steps = [
          `Produce a parte report for ${config.name}, parte ${id}.`,
          '',
          'Steps:',
          `1. Read linea://parte/${id}.`,
          `   Bridge fallback: getResourceByUri({ uri: "linea://parte/${id}" }).`,
          '2. For each nodo in the parte, read linea://nodo/{year} (using año_ini or a representative year).',
          '3. Synthesize a report with parte metadata (title, year range) and a summary of its nodos.'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'timeline-nodos',
      title: `${config.name} nodos timeline`,
      description: `Instructions to produce a chronological timeline of nodos for a year range.`,
      argsSchema: {
        from: z.string().optional().describe('Starting year (optional).'),
        to: z.string().optional().describe('Ending year (optional).')
      },
      kinds: ['tronco', 'satelite'],
      render: ({ from, to }) => {
        const fromY = from ? `year ${from}` : 'coverage.min';
        const toY = to ? `year ${to}` : 'coverage.max';
        const steps = [
          `Produce a chronological timeline of nodos for ${config.name} from ${fromY} to ${toY}.`,
          '',
          'Steps:',
          '1. Read linea://info to get coverage and nodo list.',
          '2. Identify key years for each nodo (año_ini, año_fin) within the range.',
          '3. For each nodo, read linea://nodo/{year} for a representative year.',
          '4. Produce a chronology: year → nodo (id, etiqueta, tesis).'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'self-check',
      title: `${config.name} prompt self-check`,
      description:
        'Validate all prompts: render with derived args, URI/tool references, and approval gates on mutation prompts.',
      argsSchema: {},
      kinds: ['tronco', 'satelite'],
      render: () => {
        const mutationList =
          config.kind === 'satelite' ? 'execute-viaje' : '(none on tronco)';
        const steps = [
          `Run a self-check of all ${config.name} MCP prompts (read-only; touches live data, zero mutation).`,
          '',
          'Steps:',
          '1. Call getPrompts to enumerate every registered prompt.',
          '2. Read server://card.examples — **single source of truth** for goldenPath, prompts[], sampleResolve, approvalToken.',
          '   Bridge fallback: getResourceByUri({ uri: "server://card" }).',
          '3. For each entry in examples.prompts: getPrompt(name, args); assert render references target URI/tool.',
          '4. **Touch the data**: for each examples.sampleResolve entry, getResourceByUri(uri).',
          '   Assert valid JSON object matching expect hint (error object OK only when documented, e.g. uncached wikitext).',
          '5. Golden path: resolve examples.goldenPath.resolveUri; confirm JSON.',
          `6. Mutation prompts on this server: ${mutationList}.`,
          `   Render each; assert gate requires exact token \`${resolveMcpApprovalToken()}\`.`,
          '   Do NOT call cache_wikitext or any fetch.',
          '7. Report table: prompt | render OK? | sample URI OK? | gate? | notes.'
        ];
        return promptMessages(steps.join('\n'));
      }
    }
  ];

  const satelitePrompts = [
    {
      name: 'report-oldid',
      title: `${config.name} oldid report`,
      description: `Instructions to produce an oldid report for a given year, including wikitext if cached.`,
      argsSchema: {
        year: z.string().describe('Historical year (2001-2026).')
      },
      kinds: ['satelite'],
      render: ({ year }) => {
        const steps = [
          `Produce an oldid report for ${config.name} at year ${year}.`,
          '',
          'Steps:',
          `1. Resolve linea://oldid/${year} to get the oldid and timestamp.`,
          `   Bridge fallback: getResourceByUri({ uri: "linea://oldid/${year}" }).`,
          `2. Read linea://wikitext/{oldid} to get the cached wikitext body.`,
          `   If not cached, the error will explain the viaje protocol (read linea://cache/stats).`,
          '3. Write a report with oldid, timestamp, and wikitext_length (or error if not cached).'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'cache-status',
      title: `${config.name} cache status`,
      description: `Instructions to read cache coverage stats and explain the viaje protocol.`,
      argsSchema: {},
      kinds: ['satelite'],
      render: () => {
        const steps = [
          `Read cache coverage statistics for ${config.name}.`,
          '',
          'Steps:',
          '1. Read linea://cache/stats.',
          '   Bridge fallback: getResourceByUri({ uri: "linea://cache/stats" }).',
          '2. Report coverage: cached_wikitexts / registro_count, coverage_pct, milestones_sin_cuerpo.',
          '3. Explain the viaje protocol: propose waves (A: nodo anchors, B: milestones, C: parte sampling).',
          '4. Suggest a budget N; user sends `' + resolveMcpApprovalToken() + '` before execute-viaje (use propose-viaje for dry-run).'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'propose-viaje',
      title: `${config.name} viaje proposal`,
      description: `Guide agent to draft a viaje proposal: read stats, choose wave, estimate queries, request user approval.`,
      argsSchema: {
        goal: z.string().optional().describe('Viaje goal: A (nodo anchors), B (milestones), C (parte sampling), or custom.')
      },
      kinds: ['satelite'],
      render: ({ goal }) => {
        const targetGoal = goal ?? 'to be determined (A, B, or C)';
        const steps = [
          `Draft a viaje proposal for ${config.name} with goal: ${targetGoal}.`,
          '',
          'Steps:',
          '1. Read linea://cache/stats to understand current coverage.',
          '2. Choose a wave strategy:',
          '   - A: nodo anchors (año_ini for each nodo P01→P24).',
          '   - B: milestones without body (milestones_sin_cuerpo).',
          '   - C: parte sampling (e.g., 5 years per parte).',
          '3. Estimate queries N needed (count of oldids to fetch).',
          '4. Draft proposal: goal, wave, estimated queries, expected coverage gain.',
          `5. DO NOT fetch anything. Present the proposal; user must send \`${resolveMcpApprovalToken()}\` before a separate execute-viaje run.`
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'execute-viaje',
      title: `${config.name} viaje execution`,
      description:
        'Workflow to fetch Wikipedia oldids into cache after explicit user approval (complement to propose-viaje).',
      argsSchema: {
        goal: z
          .string()
          .optional()
          .describe('Viaje goal or wave (A/B/C) to scope which oldids to fetch.')
      },
      kinds: ['satelite'],
      render: ({ goal }) => {
        const targetGoal = goal ?? 'as scoped below';
        const gateLine = mcpApprovalGateLine('cache_wikitext');
        const steps = [
          `Execute a viaje (Wikipedia fetch) for ${config.name} with goal: ${targetGoal}.`,
          '',
          'Steps:',
          '1. Read server://card.examples and linea://cache/stats (never skip stats).',
          '   Bridge fallback: getResourceByUri({ uri: "linea://cache/stats" }).',
          '2. Draft a concrete execution plan:',
          '   - List each oldid to fetch (wave A: nodo anchors; B: milestones_sin_cuerpo; C: parte sampling).',
          '   - State estimated query count N and expected coverage gain.',
          `   - ${gateLine}`,
          `3. Only after token \`${resolveMcpApprovalToken()}\`: for each oldid, call cache_wikitext({ oldid }).`,
          '4. Poll linea://wikitext/{oldid} until cached or timeout.',
          '   Bridge fallback: getResourceByUri({ uri: "linea://wikitext/{oldid}" }).',
          '5. Re-read linea://cache/stats and report delta: new cached_oldids, updated coverage_pct.',
          `6. If any fetch fails, report missing oldids; do not retry without a new \`${resolveMcpApprovalToken()}\`.`
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'report-registros-nodo',
      title: `${config.name} registros nodo report`,
      description: `Instructions to list thematic WP registros for a Villacañas nodo or historical year.`,
      argsSchema: {
        year: z.string().optional().describe('Historical year (any tronco coverage year).'),
        nodo_id: z.string().optional().describe('Nodo id P01–P24. If omitted, derive from year.')
      },
      kinds: ['satelite'],
      render: ({ year, nodo_id }) => {
        const target = nodo_id
          ? `nodo ${nodo_id}`
          : year
            ? `year ${year}`
            : 'a year or nodo within coverage';
        const uri = nodo_id
          ? `linea://registros/nodo/${nodo_id}`
          : year
            ? `linea://registros/year/${year}`
            : 'linea://registros/year/{year}';
        const steps = [
          `Produce a thematic registros report for ${config.name} at ${target}.`,
          '',
          'Steps:',
          `1. Read ${uri} to get nodo, sections, anchor and registros list.`,
          `   Bridge fallback: getResourceByUri({ uri: "${uri}" }).`,
          '2. Highlight the wave-A anchor (is_anchor) if present.',
          '3. Note cached vs curated counts; propose viaje for missing anchor wikitext.',
          '4. (Optional) Read linea://wikitext/{oldid} for selected registros.',
          '5. Write a concise report: nodo, sections, top registros, anchor status.'
        ];
        return promptMessages(steps.join('\n'));
      }
    },
    {
      name: 'report-registro-curado',
      title: `${config.name} curated registro report`,
      description:
        'Instructions to read curated annotations (registro.md and delta.md) for a registro_id.',
      argsSchema: {
        id: z.string().describe('Registro id, e.g. r2810.')
      },
      kinds: ['satelite'],
      render: ({ id }) => {
        const steps = [
          `Produce a curated registro report for ${config.name}, registro ${id}.`,
          '',
          'Steps:',
          `1. Read linea://registro/${id} for curated annotations (registro.md and delta.md).`,
          `   Bridge fallback: getResourceByUri({ uri: "linea://registro/${id}" }).`,
          '2. If error (not curated), read linea://cache/stats for curated_registros count.',
          '   Bridge fallback: getResourceByUri({ uri: "linea://cache/stats" }).',
          '3. Report registro metadata, annotation excerpts, and delta summary if present.',
          '4. (Optional) Read linea://wikitext/{oldid} for the registro wikitext body if cached.'
        ];
        return promptMessages(steps.join('\n'));
      }
    }
  ];

  const allPrompts = [...commonPrompts, ...satelitePrompts];
  return allPrompts.filter((p) => p.kinds.includes(config.kind));
}

export function createServer(config, lineData) {
  return createStandardMcpServer({
    name: config.name,
    version: SERVER_VERSION,
    port: config.port,
    registry: getResourceRegistry(config, lineData),
    templateRegistry: getTemplateRegistry(config, lineData),
    promptRegistry: getPromptRegistry(config, lineData),
    buildMcp: (server) => logic.buildMcp(server, { config, lineData }),
    logLabel: config.name,
    getCardExamples: () => buildLineaCardExamples(config, lineData)
  });
}
