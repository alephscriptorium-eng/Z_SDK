import { z } from 'zod';
import { defineRoutes } from '@zeus/http-contract';
import { THEME_ROUTES } from '@zeus/ui-kit/theme-contract';

const Health = z.object({
  status: z.literal('ok'),
  service: z.string().optional(),
  timestamp: z.string().optional()
});

const FirehoseConfig = z.object({
  theme: z.unknown(),
  discovery: z.unknown().optional(),
  defaultCorpus: z.string().optional(),
  branding: z.unknown().optional(),
  volume: z.unknown().optional()
});

const CorporaList = z.object({ corpora: z.array(z.unknown()) });
const BrowseResult = z.looseObject({});
const FileResult = z.union([z.looseObject({}), z.object({ error: z.string() })]);
const PostsList = z.looseObject({});
const TriageManifest = z.object({ manifest: z.unknown() });
const FirehoseStats = z.looseObject({});
const FocusSnapshot = z.looseObject({});
const ViewInfo = z.looseObject({});

export const FIREHOSE_ROUTES = defineRoutes('firehose-view-ui', [
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
    summary: 'Extended app config (firehose shape)',
    tags: ['config'],
    responses: { 200: FirehoseConfig },
    envelope: 'plain'
  },
  ...THEME_ROUTES({ prefix: '/api', includeConfig: false }),
  {
    id: 'corpora.list',
    method: 'GET',
    path: '/api/corpora',
    summary: 'List firehose corpora',
    tags: ['browse'],
    responses: { 200: CorporaList },
    envelope: 'plain'
  },
  {
    id: 'browse',
    method: 'GET',
    path: '/api/browse',
    summary: 'Browse corpus directory',
    tags: ['browse'],
    request: {
      query: z.object({
        corpus: z.string(),
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
    summary: 'Read corpus file and set focus',
    tags: ['browse'],
    request: {
      query: z.object({
        corpus: z.string(),
        path: z.string()
      })
    },
    responses: { 200: FileResult },
    envelope: 'plain'
  },
  {
    id: 'posts',
    method: 'GET',
    path: '/api/posts',
    summary: 'Micropost preview list',
    tags: ['browse'],
    request: {
      query: z.object({
        corpus: z.string(),
        path: z.string().optional(),
        recursive: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional()
      })
    },
    responses: { 200: PostsList },
    envelope: 'plain'
  },
  {
    id: 'triage',
    method: 'GET',
    path: '/api/triage',
    summary: 'Triage manifest',
    tags: ['browse'],
    responses: { 200: TriageManifest },
    envelope: 'plain',
    xMcpResource: 'firehose://triage'
  },
  {
    id: 'stats',
    method: 'GET',
    path: '/api/stats',
    summary: 'Firehose volume stats',
    tags: ['browse'],
    responses: { 200: FirehoseStats },
    envelope: 'plain',
    xMcpResource: 'firehose://stats'
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
  }
]);
