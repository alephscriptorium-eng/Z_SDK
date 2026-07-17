import { z } from 'zod';
import { McpResourceError } from './descriptor.mjs';

export const FirehoseStats = z.looseObject({
  corpora: z.array(z.unknown()).optional(),
  totalFiles: z.number().optional()
}).describe('firehose://stats');

export const FirehoseTriage = z.looseObject({
  version: z.number().optional(),
  entries: z.array(z.unknown()).optional()
}).describe('firehose://triage');

export const FirehoseCorpus = z.union([
  z.looseObject({ corpusId: z.string().optional(), entries: z.array(z.unknown()).optional() }),
  McpResourceError
]).describe('firehose://corpus/{corpusId}');

export const FirehosePost = z.union([
  z.looseObject({ corpusId: z.string().optional(), content: z.unknown().optional() }),
  McpResourceError
]).describe('firehose://post/{corpusId}/{batch}/{filename}');

export const FIREHOSE_PAYLOADS = new Map([
  ['firehose://stats', FirehoseStats],
  ['firehose://triage', FirehoseTriage],
  ['firehose://corpus/{corpusId}', FirehoseCorpus],
  ['firehose://post/{corpusId}/{batch}/{filename}', FirehosePost]
]);
