import { z } from 'zod';
import { defineRoutes } from '@zeus/http-contract';
import { THEME_ROUTES } from '@zeus/ui-kit/theme-contract';
import { LineaRegistrosYear } from '@zeus/http-contract/mcp-resources';
import { McpResourceError } from '@zeus/http-contract';

const Health = z.object({
  status: z.literal('ok'),
  service: z.string().optional(),
  timestamp: z.string().optional()
});

const PresetSummary = z.array(z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional()
}));

const AlephConfig = z.looseObject({});
const ViewLinks = z.looseObject({ linea: z.string().optional(), items: z.array(z.unknown()) });
const FirehoseLinks = z.looseObject({});
const LineasRegistry = z.union([z.looseObject({ lineas: z.array(z.unknown()) }), McpResourceError]);
const AnchorsResponse = z.looseObject({ linea: z.string().optional(), grid: z.unknown().optional() });
const Medicion = z.union([z.looseObject({}), McpResourceError]);
const RegistrosYear = z.union([LineaRegistrosYear, McpResourceError]);
const Topology = z.looseObject({});
const ServersList = z.array(z.unknown());

const DebugDegraded = z.object({
  available: z.literal(false),
  reason: z.string().optional()
});

const DebugAvailable = z.union([
  z.looseObject({ available: z.literal(true) }),
  DebugDegraded
]);

export const PLAYER_ROUTES = defineRoutes('player-ui', [
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
    id: 'presets.list',
    method: 'GET',
    path: '/api/presets',
    summary: 'Preset summaries (flat array)',
    tags: ['presets'],
    responses: { 200: PresetSummary },
    envelope: 'plain',
    xStatus: 'frozen'
  },
  {
    id: 'aleph.config',
    method: 'GET',
    path: '/api/aleph/config',
    summary: 'ALEPH tablero configuration',
    tags: ['aleph'],
    responses: { 200: AlephConfig },
    envelope: 'plain'
  },
  {
    id: 'aleph.view-links',
    method: 'GET',
    path: '/api/aleph/view-links',
    summary: 'View links for deck A or B',
    tags: ['aleph'],
    request: { query: z.object({ deckId: z.enum(['A', 'B']).optional() }) },
    responses: { 200: ViewLinks },
    envelope: 'plain'
  },
  {
    id: 'aleph.firehose-links',
    method: 'GET',
    path: '/api/aleph/firehose-links',
    summary: 'Firehose explorer links from deck context',
    tags: ['aleph'],
    request: {
      query: z.object({
        corpus: z.string().optional(),
        path: z.string().optional(),
        file: z.string().optional()
      })
    },
    responses: { 200: FirehoseLinks },
    envelope: 'plain'
  },
  {
    id: 'aleph.lineas',
    method: 'GET',
    path: '/api/aleph/lineas',
    summary: 'Linea registry from volume',
    tags: ['aleph'],
    responses: { 200: LineasRegistry },
    envelope: 'raw-bridge'
  },
  {
    id: 'aleph.anchors',
    method: 'GET',
    path: '/api/aleph/anchors',
    summary: 'Anchor grid with MCP cache stats',
    tags: ['aleph'],
    request: { query: z.object({ linea: z.string().optional() }) },
    responses: { 200: AnchorsResponse },
    envelope: 'raw-bridge',
    xMcpResource: 'linea://cache/stats'
  },
  {
    id: 'aleph.medicion',
    method: 'GET',
    path: '/api/aleph/medicion/:casoId',
    summary: 'Medicion case data',
    tags: ['aleph'],
    responses: { 200: Medicion },
    envelope: 'raw-bridge'
  },
  {
    id: 'aleph.registros',
    method: 'GET',
    path: '/api/aleph/registros/:year',
    summary: 'WP registros for historical year (MCP passthrough)',
    tags: ['aleph'],
    request: { params: z.object({ year: z.coerce.number() }) },
    responses: { 200: RegistrosYear },
    envelope: 'raw-bridge',
    xMcpResource: 'linea://registros/year/{year}'
  },
  {
    id: 'aleph.topology',
    method: 'GET',
    path: '/api/aleph/topology',
    summary: 'MCP server cards topology',
    tags: ['aleph'],
    responses: { 200: Topology },
    envelope: 'raw-bridge',
    xMcpResource: 'server://card'
  },
  {
    id: 'servers.list',
    method: 'GET',
    path: '/api/servers',
    summary: 'Discovered MCP servers',
    tags: ['mcp'],
    responses: { 200: ServersList },
    envelope: 'plain'
  },
  {
    id: 'debug.health',
    method: 'GET',
    path: '/api/debug/health',
    summary: 'Debug monitor health (degraded when disabled)',
    tags: ['debug'],
    responses: { 200: DebugAvailable, 503: DebugDegraded },
    envelope: 'plain',
    xDegradedMode: 'returns 200 {available:false} when monitor disabled'
  },
  {
    id: 'debug.snapshot',
    method: 'GET',
    path: '/api/debug/snapshot',
    summary: 'Debug monitor full snapshot',
    tags: ['debug'],
    responses: { 200: DebugAvailable },
    envelope: 'plain',
    xDegradedMode: 'returns 200 {available:false} on proxy failure'
  },
  {
    id: 'debug.at',
    method: 'GET',
    path: '/api/debug/at',
    summary: 'Debug monitor snapshot at JSON path',
    tags: ['debug'],
    request: { query: z.object({ path: z.string().optional() }) },
    responses: { 200: DebugAvailable },
    envelope: 'plain',
    xDegradedMode: 'returns 200 {available:false} on proxy failure'
  }
]);
