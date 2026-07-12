import { z } from 'zod';
import { defineRoutes } from '@zeus/http-contract';

const CatalogResponse = z.object({
  success: z.literal(true),
  timestamp: z.string(),
  catalog: z.array(z.unknown()),
  serversCount: z.number(),
  totalTools: z.number(),
  totalResources: z.number(),
  totalResourceTemplates: z.number().optional(),
  totalPrompts: z.number()
});

const PresetSetBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  prompt: z.string().optional(),
  items: z.array(z.unknown()).optional()
});

const PresetSetResponse = z.object({
  success: z.literal(true),
  preset: z.object({
    id: z.string(),
    name: z.string(),
    itemsCount: z.number(),
    createdAt: z.string().optional()
  }),
  timestamp: z.string()
});

const PresetListResponse = z.object({
  success: z.literal(true),
  presets: z.array(z.unknown()),
  totalPresets: z.number(),
  timestamp: z.string()
});

const PresetByNameResponse = z.object({
  success: z.literal(true),
  preset: z.unknown(),
  timestamp: z.string()
});

const PresetDeleteResponse = z.object({
  success: z.literal(true),
  timestamp: z.string()
});

const SdkError = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.unknown().optional(),
  timestamp: z.string().optional()
});

/**
 * @param {{ prefix?: string }} [opts]
 */
export function presetRoutesContract(opts = {}) {
  const p = opts.prefix ?? '/api/mcp';
  return defineRoutes('presets-sdk', [
    {
      id: 'mcp.list',
      method: 'GET',
      path: `${p}/list`,
      summary: 'Full MCP server catalog',
      tags: ['mcp', 'presets'],
      responses: { 200: CatalogResponse },
      envelope: 'success-sdk',
      xStatus: 'sdk-compat'
    },
    {
      id: 'mcp.set',
      method: 'POST',
      path: `${p}/set`,
      summary: 'Create or update preset by name',
      tags: ['mcp', 'presets'],
      request: { body: PresetSetBody },
      responses: { 200: PresetSetResponse },
      envelope: 'success-sdk',
      xStatus: 'sdk-compat'
    },
    {
      id: 'mcp.presets',
      method: 'GET',
      path: `${p}/presets`,
      summary: 'List preset summaries',
      tags: ['mcp', 'presets'],
      responses: { 200: PresetListResponse },
      envelope: 'success-sdk',
      xStatus: 'sdk-compat'
    },
    {
      id: 'mcp.preset-by-name',
      method: 'GET',
      path: `${p}/preset/:name`,
      summary: 'Get full preset by name',
      tags: ['mcp', 'presets'],
      responses: { 200: PresetByNameResponse },
      envelope: 'success-sdk',
      xStatus: 'sdk-compat'
    },
    {
      id: 'mcp.preset-delete',
      method: 'DELETE',
      path: `${p}/preset/:id`,
      summary: 'Delete preset by id',
      tags: ['mcp', 'presets'],
      responses: { 200: PresetDeleteResponse },
      envelope: 'success-sdk',
      xStatus: 'sdk-compat'
    }
  ]);
}

export const PresetContractSchemas = {
  CatalogResponse,
  PresetSetBody,
  PresetSetResponse,
  PresetListResponse,
  PresetByNameResponse,
  PresetDeleteResponse,
  SdkError
};
