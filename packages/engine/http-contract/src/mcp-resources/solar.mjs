import { z } from 'zod';
import { McpResourceError } from './descriptor.mjs';

export const BodyInfo = z.looseObject({
  name: z.string().optional(),
  type: z.string().optional(),
  mass: z.number().optional()
}).describe('body://info');

export const BodyPosition = z.union([
  z.looseObject({ timestamp: z.number().optional(), position: z.unknown().optional() }),
  McpResourceError
]).describe('body://position/{timestamp}');

export const BodyRotation = z.union([
  z.looseObject({ timestamp: z.number().optional(), rotation: z.unknown().optional() }),
  McpResourceError
]).describe('body://rotation/{timestamp}');

export const SOLAR_PAYLOADS = new Map([
  ['body://info', BodyInfo],
  ['body://position/{timestamp}', BodyPosition],
  ['body://rotation/{timestamp}', BodyRotation]
]);
