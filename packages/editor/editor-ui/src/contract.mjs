import { z } from 'zod';
import { defineRoutes } from '@zeus/http-contract';
import { THEME_ROUTES } from '@zeus/ui-kit/theme-contract';
import { presetRoutesContract } from '@zeus/presets-sdk/presets/contract';

const Health = z.object({
  status: z.literal('ok'),
  service: z.string().optional(),
  timestamp: z.string().optional()
});

const EditorSuccess = z.object({
  success: z.literal(true)
}).loose();

const PresetList = z.object({
  success: z.literal(true),
  presets: z.array(z.unknown()),
  pagination: z.unknown().optional()
});

const PresetDetail = z.object({
  success: z.literal(true),
  preset: z.unknown()
});

const McpServers = z.object({
  success: z.literal(true),
  servers: z.array(z.unknown()).optional()
});

const McpContent = z.looseObject({});

const SettingsSection = z.looseObject({});

/**
 * Editor UI REST contract — assembled from api-routes + theme + SDK preset routes.
 */
export const EDITOR_ROUTES = defineRoutes('editor-ui', [
  {
    id: 'health',
    method: 'GET',
    path: '/health',
    summary: 'Service health',
    tags: ['system'],
    responses: { 200: Health },
    envelope: 'plain'
  },
  ...THEME_ROUTES({ prefix: '/api', includeConfig: true }),
  {
    id: 'api.health',
    method: 'GET',
    path: '/api/health',
    summary: 'API health',
    tags: ['system'],
    responses: { 200: Health },
    envelope: 'success-editor'
  },
  {
    id: 'api.settings.get',
    method: 'GET',
    path: '/api/settings',
    summary: 'Read config sections',
    tags: ['settings'],
    responses: { 200: SettingsSection },
    envelope: 'success-editor'
  },
  {
    id: 'api.settings.put',
    method: 'PUT',
    path: '/api/settings/:section',
    summary: 'Update config section',
    tags: ['settings'],
    request: {
      params: z.object({ section: z.string() }),
      body: z.looseObject({})
    },
    responses: { 200: EditorSuccess },
    envelope: 'success-editor',
    xStatus: 'canonical'
  },
  {
    id: 'api.presets.list',
    method: 'GET',
    path: '/api/presets',
    summary: 'List/search presets (canonical CRUD)',
    tags: ['presets'],
    responses: { 200: PresetList },
    envelope: 'success-editor',
    xStatus: 'canonical'
  },
  {
    id: 'api.presets.create',
    method: 'POST',
    path: '/api/presets',
    summary: 'Create preset',
    tags: ['presets'],
    request: { body: z.looseObject({ name: z.string() }) },
    responses: { 201: PresetDetail },
    envelope: 'success-editor',
    xStatus: 'canonical'
  },
  {
    id: 'api.presets.get',
    method: 'GET',
    path: '/api/presets/:id',
    summary: 'Preset detail',
    tags: ['presets'],
    responses: { 200: PresetDetail },
    envelope: 'success-editor',
    xStatus: 'canonical'
  },
  {
    id: 'api.presets.download',
    method: 'GET',
    path: '/api/presets/:id/download',
    summary: 'Download preset ZIP bundle',
    tags: ['presets'],
    responses: { 200: z.string().describe('application/zip') },
    envelope: 'success-editor',
    xStatus: 'canonical'
  },
  {
    id: 'api.presets.update',
    method: 'PUT',
    path: '/api/presets/:id',
    summary: 'Update preset',
    tags: ['presets'],
    request: { body: z.looseObject({}) },
    responses: { 200: PresetDetail },
    envelope: 'success-editor',
    xStatus: 'canonical'
  },
  {
    id: 'api.presets.delete',
    method: 'DELETE',
    path: '/api/presets/:id',
    summary: 'Delete cloak/preset',
    tags: ['presets'],
    responses: { 200: EditorSuccess },
    envelope: 'success-editor',
    xStatus: 'canonical'
  },
  {
    id: 'api.world.materials',
    method: 'GET',
    path: '/api/world/materials',
    summary: 'List selectable world materials (scenes, lines, games, cloaks, dialects)',
    tags: ['world'],
    responses: { 200: z.looseObject({ success: z.literal(true) }) },
    envelope: 'success-editor',
    xStatus: 'canonical'
  },
  {
    id: 'api.world.draft.get',
    method: 'GET',
    path: '/api/world/draft',
    summary: 'Read world draft',
    tags: ['world'],
    responses: { 200: z.looseObject({ success: z.literal(true), draft: z.unknown() }) },
    envelope: 'success-editor',
    xStatus: 'canonical'
  },
  {
    id: 'api.world.draft.put',
    method: 'PUT',
    path: '/api/world/draft',
    summary: 'Update world draft',
    tags: ['world'],
    request: { body: z.looseObject({}) },
    responses: { 200: z.looseObject({ success: z.literal(true), draft: z.unknown() }) },
    envelope: 'success-editor',
    xStatus: 'canonical'
  },
  {
    id: 'api.world.draft.reset',
    method: 'POST',
    path: '/api/world/draft/reset',
    summary: 'Reset world draft to defaults',
    tags: ['world'],
    responses: { 200: z.looseObject({ success: z.literal(true), draft: z.unknown() }) },
    envelope: 'success-editor',
    xStatus: 'canonical'
  },
  {
    id: 'api.world.release',
    method: 'POST',
    path: '/api/world/release',
    summary: 'Materialize startpack + run Notario (U62)',
    tags: ['world'],
    request: { body: z.looseObject({}).optional() },
    responses: { 200: z.looseObject({ success: z.literal(true) }) },
    envelope: 'success-editor',
    xStatus: 'canonical'
  },
  {
    id: 'api.mcp.refresh',
    method: 'POST',
    path: '/api/mcp/refresh',
    summary: 'Re-probe MCP discovery',
    tags: ['mcp'],
    responses: { 200: EditorSuccess },
    envelope: 'success-editor'
  },
  {
    id: 'api.mcp.servers',
    method: 'GET',
    path: '/api/mcp/servers',
    summary: 'List MCP servers',
    tags: ['mcp'],
    responses: { 200: McpServers },
    envelope: 'success-editor'
  },
  {
    id: 'api.mcp.servers.content',
    method: 'GET',
    path: '/api/mcp/servers/:id/content',
    summary: 'Server tools/resources/prompts aggregate',
    tags: ['mcp'],
    responses: { 200: McpContent },
    envelope: 'success-editor'
  },
  {
    id: 'api.mcp.servers.tools',
    method: 'GET',
    path: '/api/mcp/servers/:id/tools',
    summary: 'Server tools (search/category)',
    tags: ['mcp'],
    responses: { 200: McpContent },
    envelope: 'success-editor'
  },
  {
    id: 'api.mcp.servers.resources',
    method: 'GET',
    path: '/api/mcp/servers/:id/resources',
    summary: 'Server resources (search/type)',
    tags: ['mcp'],
    responses: { 200: McpContent },
    envelope: 'success-editor'
  },
  {
    id: 'api.mcp.servers.prompts',
    method: 'GET',
    path: '/api/mcp/servers/:id/prompts',
    summary: 'Server prompts (search/category)',
    tags: ['mcp'],
    responses: { 200: McpContent },
    envelope: 'success-editor'
  },
  {
    id: 'api.mcp.servers.templates',
    method: 'GET',
    path: '/api/mcp/servers/:id/resource-templates',
    summary: 'Server resource templates',
    tags: ['mcp'],
    responses: { 200: McpContent },
    envelope: 'success-editor'
  },
  ...presetRoutesContract({ prefix: '/api/mcp' })
]);
