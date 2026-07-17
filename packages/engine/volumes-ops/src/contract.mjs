/**
 * RouteEntry contract for volumes-ops (REST → MCP via U40).
 * GET measure → MCP resource; POST empty stays HTTP (mutation).
 */

import { z } from 'zod';
import { defineRoutes } from '@zeus/http-contract';

const MeasureVolume = z.looseObject({
  volumeId: z.string(),
  files: z.number(),
  bytes: z.number()
});

const MeasureCorpus = z.union([
  z.looseObject({
    ok: z.literal(true),
    volumeId: z.string(),
    corpusId: z.string(),
    files: z.number(),
    bytes: z.number()
  }),
  z.object({
    ok: z.literal(false),
    error: z.string(),
    volumeId: z.string().optional(),
    corpusId: z.string().optional()
  })
]);

const MeasureAll = z.looseObject({
  volumesRoot: z.string(),
  files: z.number(),
  bytes: z.number(),
  volumes: z.array(z.unknown())
});

const EmptyBody = z.object({
  role: z.enum(['player', 'dj', 'operator']),
  actorId: z.string().optional(),
  corpusId: z.string().optional(),
  intent: z.enum(['empty_volume', 'empty_playable']).optional(),
  forceCurated: z.boolean().optional()
});

const EmptyResult = z.looseObject({
  ok: z.boolean()
});

const Health = z.object({
  status: z.literal('ok'),
  service: z.string().optional(),
  timestamp: z.string().optional()
});

export const VOLUMES_OPS_ROUTES = defineRoutes('volumes-ops', [
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
    id: 'volumes.measure.all',
    method: 'GET',
    path: '/api/volumes/measure',
    summary: 'Measure all volumes (files + bytes)',
    tags: ['volumes'],
    responses: { 200: MeasureAll },
    envelope: 'plain',
    xMcpResource: 'volumes://measure'
  },
  {
    id: 'volumes.measure',
    method: 'GET',
    path: '/api/volumes/:volumeId/measure',
    summary: 'Measure one volume (and corpora)',
    tags: ['volumes'],
    request: {
      params: z.object({ volumeId: z.string() }),
      query: z.object({ linePath: z.string().optional() })
    },
    responses: { 200: MeasureVolume },
    envelope: 'plain',
    xMcpResource: 'volumes://measure/{volumeId}'
  },
  {
    id: 'volumes.measure.corpus',
    method: 'GET',
    path: '/api/volumes/:volumeId/corpora/:corpusId/measure',
    summary: 'Measure one corpus inside a volume',
    tags: ['volumes'],
    request: {
      params: z.object({
        volumeId: z.string(),
        corpusId: z.string()
      })
    },
    responses: { 200: MeasureCorpus },
    envelope: 'plain',
    xMcpResource: 'volumes://measure/{volumeId}/{corpusId}'
  },
  {
    id: 'volumes.empty',
    method: 'POST',
    path: '/api/volumes/:volumeId/empty',
    summary: 'Empty volume/corpus (role-gated; ledger seat)',
    tags: ['volumes'],
    request: {
      params: z.object({ volumeId: z.string() }),
      body: EmptyBody
    },
    responses: { 200: EmptyResult },
    envelope: 'plain'
  }
]);
