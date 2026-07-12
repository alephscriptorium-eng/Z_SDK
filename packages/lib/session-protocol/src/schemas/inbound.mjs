import { z } from 'zod';
import { DeckId, Year, Oldid, CasoId, Corpus } from './common.mjs';

export const deckLoadSchema = z.object({
  deckId: DeckId,
  serverName: z.string().min(1),
  presetId: z.string().optional()
});

export const playheadSetSchema = z.object({
  year: Year
});

export const registroSelectSchema = z.object({
  deckId: DeckId.optional().default('B'),
  oldid: Oldid,
  registro_id: z.unknown().optional()
}).passthrough();

export const micropostSelectSchema = z.object({
  deckId: DeckId.optional().default('C'),
  filePath: z.string(),
  corpus: z.string().optional(),
  path: z.string().optional()
}).passthrough();

export const firehoseCorpusSchema = z.object({
  deckId: DeckId.optional().default('C'),
  corpus: Corpus.or(z.string()),
  path: z.string().optional()
}).passthrough();

export const wikitextCacheSchema = z.object({
  deckId: DeckId.optional().default('B'),
  oldid: Oldid
});

export const wikitextPollSchema = z.object({
  deckId: DeckId.optional().default('B'),
  oldid: Oldid
});

export const emptyPayloadSchema = z.object({}).passthrough();

export const casoSetSchema = z.object({
  casoId: CasoId
});

const NodeId = z.string().min(1);

export const gameIntentSchema = z.object({
  actorId: z.string().min(1),
  intent: z.enum(['sit', 'walk']),
  anchorId: z.string().optional(),
  linkId: z.string().optional(),
  direction: z.enum(['a-to-b', 'b-to-a']).optional()
}).passthrough();

export const materialPinSchema = z.object({
  nodeId: NodeId,
  slot: z.string().min(1),
  serverName: z.string().min(1),
  presetId: z.string().optional()
});

export const materialUnpinSchema = z.object({
  nodeId: NodeId,
  slot: z.string().min(1)
});

const nodeOntologyPatchSchema = z.object({
  registro: z.object({
    oldid: z.union([z.number(), z.string()]),
    label: z.string().optional()
  }).optional(),
  micropost: z.object({
    file: z.string(),
    corpus: z.string().optional()
  }).optional(),
  meta: z.record(z.string(), z.unknown()).optional()
}).passthrough();

export const nodeOntologySetSchema = z.object({
  nodeId: NodeId,
  patch: nodeOntologyPatchSchema
});

export const selectionCastSchema = z.object({
  actorId: z.string().min(1),
  kind: z.string().min(1).default('registro'),
  deckId: z.string().min(1).optional().default('B'),
  nodeId: NodeId.optional(),
  targetId: z.union([z.number(), z.string()]).optional(),
  label: z.string().optional(),
  meta: z.object({}).passthrough().optional()
}).passthrough().superRefine((val, ctx) => {
  if (val.kind === 'registro' && (val.targetId === undefined || val.targetId === null || val.targetId === '')) {
    ctx.addIssue({
      code: 'custom',
      path: ['targetId'],
      message: "targetId is required when kind is 'registro'"
    });
  }
});

/** @type {Map<string, import('zod').ZodTypeAny>} */
export const INBOUND_SCHEMAS = new Map([
  ['domain:deck:load', deckLoadSchema],
  ['domain:playhead:set', playheadSetSchema],
  ['registro:select', registroSelectSchema],
  ['micropost:select', micropostSelectSchema],
  ['firehose:corpus', firehoseCorpusSchema],
  ['wikitext:cache', wikitextCacheSchema],
  ['wikitext:poll', wikitextPollSchema],
  ['sync:toggle', emptyPayloadSchema],
  ['transport:play', emptyPayloadSchema],
  ['transport:pause', emptyPayloadSchema],
  ['caso:set', casoSetSchema],
  ['selection:cast', selectionCastSchema],
  ['game:intent', gameIntentSchema],
  ['material:pin', materialPinSchema],
  ['material:unpin', materialUnpinSchema],
  ['node:ontology:set', nodeOntologySetSchema]
]);
