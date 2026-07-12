import { z } from 'zod';
import { ERROR_CODES } from '../errors.mjs';

export const sessionStateSchema = z.looseObject({}).passthrough();

export const deckResolvedSchema = z.looseObject({}).passthrough();

export const catalogServersSchema = z.array(z.looseObject({}).passthrough());

export const wikitextCacheResultSchema = z.looseObject({}).passthrough();

export const wikitextPollResultSchema = z.looseObject({}).passthrough();

export const debugStatsSchema = z.looseObject({}).passthrough();

export const debugResolveTimingSchema = z.looseObject({}).passthrough();

export const sessionErrorSchema = z.object({
  event: z.string(),
  code: z.enum(Object.values(ERROR_CODES)),
  message: z.string(),
  details: z.unknown().optional()
});

/** @type {Map<string, import('zod').ZodTypeAny>} */
export const OUTBOUND_SCHEMAS = new Map([
  ['session:state', sessionStateSchema],
  ['deck:resolved', deckResolvedSchema],
  ['catalog:servers', catalogServersSchema],
  ['wikitext:cache-result', wikitextCacheResultSchema],
  ['wikitext:poll-result', wikitextPollResultSchema],
  ['debug:stats', debugStatsSchema],
  ['debug:resolve-timing', debugResolveTimingSchema],
  ['session:error', sessionErrorSchema]
]);
