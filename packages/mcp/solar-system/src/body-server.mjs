/**
 * Shared factory for a celestial-body MCP server over Streamable HTTP.
 *
 * Transport contract (mirrors the edge-mcp contract used by the catalog
 * extractor): POST {base}/mcp for MCP traffic, GET {base}/mcp/health for
 * discovery. Stateless HTTP: one persistent McpServer per process; each POST
 * gets an ephemeral transport.
 */

import { z } from 'zod';
import { createStandardMcpServer } from '@zeus/presets-sdk/mcp';
import { resolveZeusHost, resolveZeusMcpPorts } from '@zeus/presets-sdk/env';
import { SERVER_VERSION } from './bodies.mjs';
import * as logic from './logic.mjs';

export { computePosition, computeRotation } from './logic.mjs';

const SAMPLE_TIMESTAMP = 1_700_000_000_000;

function buildSolarConstellation() {
  const host = resolveZeusHost();
  const ports = resolveZeusMcpPorts().solar;
  return Object.fromEntries(
    Object.entries(ports).map(([key, port]) => [
      key,
      { port, endpoint: `http://${host}:${port}/mcp` }
    ])
  );
}

function buildSolarCardExamples(body) {
  const constellation = buildSolarConstellation();
  const examples = {
    constellation,
    goldenPath: {
      prompt: 'position-report',
      args: { timestamp: String(SAMPLE_TIMESTAMP) },
      resolveUri: `body://position/${SAMPLE_TIMESTAMP}`
    },
    sampleResolve: [
      { uri: 'body://info', expect: 'object with name, type, orbitRadiusAU' },
      {
        uri: `body://position/${SAMPLE_TIMESTAMP}`,
        expect: 'object with position.xAU, position.yAU and body'
      }
    ],
    prompts: [
      { name: 'explore-server', args: {} },
      { name: 'position-report', args: { timestamp: String(SAMPLE_TIMESTAMP) } },
      {
        name: 'compare-with',
        args: { other: 'sun', timestamp: String(SAMPLE_TIMESTAMP) }
      },
      { name: 'self-check', args: {} }
    ],
    mutationPrompts: []
  };
  return examples;
}

function buildBodyInfo(body) {
  return {
    name: body.name,
    type: body.type,
    orbitRadiusAU: body.orbitRadiusAU,
    orbitalPeriodDays: body.orbitalPeriodDays ?? null,
    rotationPeriodDays: body.rotationPeriodDays,
    radiusKm: body.radiusKm,
    massKg: body.massKg,
    ...(body.parent ? { orbits: body.parent.name } : {}),
    description: body.description
  };
}

function getResourceRegistry(body) {
  return [
    {
      name: 'body-info',
      uri: 'body://info',
      title: `${body.name} info`,
      mimeType: 'application/json',
      description: `Static fact card for the ${body.type} "${body.name}": physical constants and description.`,
      read: () => buildBodyInfo(body)
    }
  ];
}

function getTemplateRegistry(body) {
  return [
    {
      name: 'body-position',
      uriTemplate: 'body://position/{timestamp}',
      title: `${body.name} position at timestamp`,
      mimeType: 'application/json',
      description: `Heliocentric position of ${body.name} at a specific epoch-ms. Each resolved URI is a stable, cacheable document.`,
      read: (variables) => {
        const parsed = parseTimestamp(variables.timestamp);
        if (parsed.error) return parsed;
        return logic.computePosition(body, parsed.timestamp);
      }
    },
    {
      name: 'body-rotation',
      uriTemplate: 'body://rotation/{timestamp}',
      title: `${body.name} rotation at timestamp`,
      mimeType: 'application/json',
      description: `Rotation angle of ${body.name} at a specific epoch-ms. Each resolved URI is a stable, cacheable document.`,
      read: (variables) => {
        const parsed = parseTimestamp(variables.timestamp);
        if (parsed.error) return parsed;
        return logic.computeRotation(body, parsed.timestamp);
      }
    }
  ];
}

function getPromptRegistry(body) {
  const constellation = buildSolarConstellation();

  return [
    {
      name: 'explore-server',
      title: `Explore ${body.name} server`,
      description: `Menu of available capabilities for the ${body.name} MCP server.`,
      argsSchema: {},
      render: () => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `Explore what the ${body.type} "${body.name}" MCP server offers.`,
                '',
                'Steps:',
                '1. Read server://card.examples — goldenPath, constellation peers, sampleResolve.',
                '   Bridge fallback: getResourceByUri({ uri: "server://card" }).',
                '2. Read body://info for physical constants and description.',
                '   Bridge fallback: getResourceByUri({ uri: "body://info" }).',
                '3. List resource templates (body://position/{timestamp}, body://rotation/{timestamp}).',
                '   Bridge fallback: getResourceTemplates().',
                '4. List tools: get_position(timestamp?) and get_rotation(timestamp?).',
                '5. Run getPrompt("self-check") for full validation.',
                '6. Summarize what queries this server and its constellation peers support.'
              ].join('\n')
            }
          }
        ]
      })
    },
    {
      name: 'report-status',
      title: `${body.name} status report`,
      description: `Instructions for an agent to produce a status report for ${body.name} at a given timestamp.`,
      argsSchema: {
        timestamp: z
          .string()
          .optional()
          .describe('Epoch milliseconds as a string. If omitted, the agent should use the current time.')
      },
      render: ({ timestamp }) => {
        const at = timestamp ? `timestamp ${timestamp} (epoch ms)` : 'the current time (Date.now())';
        const tsArg = timestamp ? `{ "timestamp": ${timestamp} }` : 'no arguments (defaults to now)';
        const resolvedPositionUri = timestamp ? `body://position/${timestamp}` : 'body://position/{timestamp} with the chosen epoch ms';
        const resolvedRotationUri = timestamp ? `body://rotation/${timestamp}` : 'body://rotation/{timestamp} with the chosen epoch ms';
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: [
                  `Produce a status report for the ${body.type} "${body.name}" at ${at}.`,
                  '',
                  'Steps:',
                  '1. Read the resource body://info to get the physical constants and description of the body.',
                  '   If the client cannot attach MCP resources directly, call getResourceByUri({ uri: "body://info" }).',
                  `2. Obtain the heliocentric position at ${at}:`,
                  `   - Preferred: read the resource template ${resolvedPositionUri}.`,
                  `   - Alternative: call get_position with ${tsArg}.`,
                  `   - Bridge fallback: getResourceByUri({ uri: "${timestamp ? `body://position/${timestamp}` : 'body://position/<epoch-ms>'}" }).`,
                  `3. Obtain the rotation state at ${at}:`,
                  `   - Preferred: read the resource template ${resolvedRotationUri}.`,
                  `   - Alternative: call get_rotation with ${tsArg}.`,
                  `   - Bridge fallback: getResourceByUri({ uri: "${timestamp ? `body://rotation/${timestamp}` : 'body://rotation/<epoch-ms>'}" }).`,
                  '4. Write a concise status report combining the fact card, the position (angle and x/y in AU) and the rotation state at that instant.'
                ].join('\n')
              }
            }
          ]
        };
      }
    },
    {
      name: 'position-report',
      title: `${body.name} position report`,
      description: `Direct trigger to read ${body.name} position at a given timestamp and explain it.`,
      argsSchema: {
        timestamp: z
          .string()
          .optional()
          .describe('Epoch milliseconds as a string. If omitted, the agent should use the current time.')
      },
      render: ({ timestamp }) => {
        const at = timestamp ? `timestamp ${timestamp} (epoch ms)` : 'the current time (Date.now())';
        const tsArg = timestamp ? `{ "timestamp": ${timestamp} }` : 'no arguments (defaults to now)';
        const resolvedPositionUri = timestamp ? `body://position/${timestamp}` : 'body://position/{timestamp} with the chosen epoch ms';
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: [
                  `Report the heliocentric position of ${body.name} at ${at}.`,
                  '',
                  'Steps:',
                  `1. Read the resource template ${resolvedPositionUri}.`,
                  `   Alternative: call get_position with ${tsArg}.`,
                  `   Bridge fallback: getResourceByUri({ uri: "${timestamp ? `body://position/${timestamp}` : 'body://position/<epoch-ms>'}" }).`,
                  '2. Explain the position in AU coordinates (xAU, yAU) and the orbital angle in radians.'
                ].join('\n')
              }
            }
          ]
        };
      }
    },
    {
      name: 'compare-with',
      title: `Compare ${body.name} position with another body`,
      description: `Multi-server guidance: obtain ${body.name} position and compare with another celestial body.`,
      argsSchema: {
        other: z
          .enum(['sun', 'moon', 'earth'])
          .describe('The other body to compare with (sun, moon, or earth).'),
        timestamp: z
          .string()
          .optional()
          .describe('Epoch milliseconds as a string. If omitted, the agent should use the current time.')
      },
      render: ({ other, timestamp }) => {
        const at = timestamp ? `timestamp ${timestamp} (epoch ms)` : 'the current time (Date.now())';
        const tsArg = timestamp ? `{ "timestamp": ${timestamp} }` : 'no arguments (defaults to now)';
        const peer = constellation[other];
        const otherUrl = peer?.endpoint ?? `http://${resolveZeusHost()}:${peer?.port ?? '?'}/mcp`;
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: [
                  `Compare the position of ${body.name} with ${other} at ${at}.`,
                  '',
                  'Steps:',
                  `1. Obtain the position of ${body.name}:`,
                  `   - Call get_position with ${tsArg}.`,
                  `   - Bridge fallback: getResourceByUri({ uri: "body://position/<epoch-ms>" }).`,
                  `2. Consult the ${other} body-server to get its position:`,
                  `   - The ${other} server is available at ${otherUrl}.`,
                  '   - All peer endpoints are listed in server://card.examples.constellation.',
                  `   - Call get_position on the ${other} server with the same timestamp.`,
                  '3. Calculate the distance between the two bodies using the Euclidean distance in AU.',
                  '4. Report the distance and relative positions in a concise summary.'
                ].join('\n')
              }
            }
          ]
        };
      }
    },
    {
      name: 'self-check',
      title: `${body.name} prompt self-check`,
      description:
        'Validate all solar prompts: render, URI/tool refs, constellation peers; read-only — no mutation gates.',
      argsSchema: {},
      render: () => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `Run a self-check of all ${body.name} MCP prompts (read-only; touches data, zero mutation).`,
                '',
                'Steps:',
                '1. Call getPrompts to enumerate prompts.',
                '2. Read server://card.examples — goldenPath, constellation, prompts[], sampleResolve.',
                '   Bridge fallback: getResourceByUri({ uri: "server://card" }).',
                '3. For each examples.prompts entry: getPrompt(name, args); assert render references URI/tool.',
                '4. **Touch the data**: resolve each examples.sampleResolve URI via getResourceByUri; assert valid JSON.',
                '5. Golden path: resolve examples.goldenPath.resolveUri; confirm position JSON.',
                '6. No mutation prompts on this server — gate column N/A.',
                '7. Report table: prompt | render OK? | sample URI OK? | gate? | notes.'
              ].join('\n')
            }
          }
        ]
      })
    }
  ];
}

function parseTimestamp(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { error: `Invalid timestamp "${value}": must be an integer epoch milliseconds` };
  }
  return { timestamp: n };
}

export function createBodyServer(body) {
  const host = resolveZeusHost();
  return createStandardMcpServer({
    name: body.name,
    version: SERVER_VERSION,
    port: body.port,
    host,
    registry: getResourceRegistry(body),
    templateRegistry: getTemplateRegistry(body),
    promptRegistry: getPromptRegistry(body),
    buildMcp: (server) => logic.buildMcp(server, body),
    logLabel: body.name,
    getCardExamples: () => buildSolarCardExamples(body)
  });
}
