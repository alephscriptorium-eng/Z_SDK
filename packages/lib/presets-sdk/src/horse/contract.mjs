import { z } from 'zod';
import { defineRoutes } from '@zeus/http-contract';

const PresetSummary = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
  itemsCount: z.number()
});

const PresetManifest = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
  prompt: z.string().optional(),
  items: z.array(z.unknown()),
  itemsCount: z.number()
});

const PresetListResponse = z.object({
  presets: z.array(PresetSummary)
});

const PresetGetResponse = z.object({
  preset: PresetManifest
});

const ToolCallBody = z.object({
  arguments: z.record(z.string(), z.unknown()).optional()
});

const ToolCallResponse = z.looseObject({}).describe('MCP tool call result');

const ResourceReadResponse = z.looseObject({}).describe('MCP resource read result');

const PromptGetResponse = z.looseObject({}).describe('MCP prompt get result');

/**
 * Horse preset control-plane routes (curated preset capability over HORSE).
 */
export const HORSE_PRESET_ROUTES = defineRoutes('horse-preset', [
  {
    id: 'horse.presets.list',
    method: 'GET',
    path: '/horse/presets',
    summary: 'Preset summaries offered by this peer',
    tags: ['horse', 'presets'],
    responses: { 200: PresetListResponse },
    envelope: 'plain',
    xMcpResource: 'horse://presets'
  },
  {
    id: 'horse.preset.get',
    method: 'GET',
    path: '/horse/presets/:presetId',
    summary: 'Full preset metadata and item manifest',
    tags: ['horse', 'presets'],
    responses: { 200: PresetGetResponse },
    envelope: 'plain',
    xMcpResource: 'preset://{presetId}'
  },
  {
    id: 'horse.preset.callTool',
    method: 'POST',
    path: '/horse/presets/:presetId/tools/:toolName',
    summary: 'Invoke a tool within preset scope (proxy upstream)',
    tags: ['horse', 'presets'],
    request: { body: ToolCallBody },
    responses: { 200: ToolCallResponse },
    envelope: 'raw-bridge'
  },
  {
    id: 'horse.preset.readResource',
    method: 'GET',
    path: '/horse/presets/:presetId/resources/:resourceName',
    summary: 'Read a resource within preset scope',
    tags: ['horse', 'presets'],
    responses: { 200: ResourceReadResponse },
    envelope: 'raw-bridge'
  },
  {
    id: 'horse.preset.getPrompt',
    method: 'GET',
    path: '/horse/presets/:presetId/prompt',
    summary: 'Get the preset system prompt',
    tags: ['horse', 'presets'],
    responses: { 200: PromptGetResponse },
    envelope: 'raw-bridge'
  }
]);

export const HorsePresetSchemas = {
  PresetSummary,
  PresetManifest,
  PresetListResponse,
  PresetGetResponse,
  ToolCallBody,
  ToolCallResponse,
  ResourceReadResponse,
  PromptGetResponse
};
