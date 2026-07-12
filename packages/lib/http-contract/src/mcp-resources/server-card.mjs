import { z } from 'zod';

export const ServerCard = z.looseObject({
  name: z.string().optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  capabilities: z.unknown().optional()
}).describe('server://card');

export const SERVER_CARD_PAYLOADS = new Map([
  ['server://card', ServerCard]
]);
