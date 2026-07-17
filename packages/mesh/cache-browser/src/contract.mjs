import { z } from 'zod';
import { defineRoutes } from '@zeus/http-contract';
import { THEME_ROUTES } from '@zeus/ui-kit/theme-contract';
import { McpResourceError } from '@zeus/http-contract';

const Health = z.object({
  status: z.literal('ok'),
  service: z.string().optional(),
  timestamp: z.string().optional()
});

const ViewConfig = z.object({
  theme: z.unknown(),
  discovery: z.unknown().optional(),
  defaultLinea: z.string().optional(),
  viewers: z.unknown().optional(),
  branding: z.unknown().optional(),
  player: z.unknown().optional(),
  editor: z.unknown().optional()
});

const LineasList = z.union([z.looseObject({ lineas: z.array(z.unknown()) }), McpResourceError]);
const BrowseResult = z.union([z.looseObject({}), McpResourceError]);
const FileResult = z.union([z.looseObject({}), McpResourceError]);
const StatsResult = z.looseObject({});
const AnchorsGrid = z.union([z.looseObject({}), McpResourceError]);
const FocusSnapshot = z.looseObject({});
const ViewInfo = z.looseObject({});
const WikitextPath = z.union([z.looseObject({ path: z.string().optional() }), McpResourceError]);

export const VIEW_ROUTES = defineRoutes('view-ui', [
  {
    id: 'health',
    method: 'GET',
    path: '/health',
    summary: 'Service health',
    tags: ['system'],
    responses: { 200: Health },
    envelope: 'plain'
  },
  {
    id: 'config',
    method: 'GET',
    path: '/api/config',
    summary: 'Extended app config (view-ui shape)',
    tags: ['config'],
    responses: { 200: ViewConfig },
    envelope: 'plain'
  },
  ...THEME_ROUTES({ prefix: '/api', includeConfig: false }),
  {
    id: 'lineas.list',
    method: 'GET',
    path: '/api/lineas',
    summary: 'List lineas from volume',
    tags: ['browse'],
    responses: { 200: LineasList },
    envelope: 'plain'
  },
  {
    id: 'browse',
    method: 'GET',
    path: '/api/browse',
    summary: 'Browse directory in linea',
    tags: ['browse'],
    request: {
      query: z.object({
        linea: z.string(),
        path: z.string().optional(),
        offset: z.coerce.number().optional(),
        limit: z.coerce.number().optional()
      })
    },
    responses: { 200: BrowseResult },
    envelope: 'plain'
  },
  {
    id: 'file',
    method: 'GET',
    path: '/api/file',
    summary: 'Read file and set focus',
    tags: ['browse'],
    request: {
      query: z.object({
        linea: z.string(),
        path: z.string()
      })
    },
    responses: { 200: FileResult },
    envelope: 'plain'
  },
  {
    id: 'stats',
    method: 'GET',
    path: '/api/stats',
    summary: 'Cache stats (MCP + filesystem)',
    tags: ['browse'],
    request: { query: z.object({ linea: z.string().optional() }) },
    responses: { 200: StatsResult },
    envelope: 'plain',
    xMcpResource: 'linea://cache/stats'
  },
  {
    id: 'anchors',
    method: 'GET',
    path: '/api/anchors',
    summary: 'Anchor grid for linea',
    tags: ['browse'],
    request: { query: z.object({ linea: z.string().optional() }) },
    responses: { 200: AnchorsGrid },
    envelope: 'plain'
  },
  {
    id: 'focus',
    method: 'GET',
    path: '/api/focus',
    summary: 'Current focus snapshot',
    tags: ['browse'],
    responses: { 200: FocusSnapshot },
    envelope: 'plain'
  },
  {
    id: 'view.info',
    method: 'GET',
    path: '/api/view/info',
    summary: 'Service metadata',
    tags: ['browse'],
    responses: { 200: ViewInfo },
    envelope: 'plain'
  },
  {
    id: 'view.wikitext-path',
    method: 'GET',
    path: '/api/view/wikitext-path',
    summary: 'Resolve wikitext path for oldid',
    tags: ['browse'],
    request: {
      query: z.object({
        linea: z.string(),
        oldid: z.coerce.number()
      })
    },
    responses: { 200: WikitextPath },
    envelope: 'plain'
  }
]);
