import { z } from 'zod';
import { McpResourceError } from '../envelope.mjs';

export const ResourceDescriptor = z.object({
  name: z.string(),
  uri: z.string().optional(),
  uriTemplate: z.string().optional(),
  title: z.string(),
  mimeType: z.string(),
  description: z.string()
});

export const LoosePayload = z.looseObject({}).describe('opaque passthrough');

export { McpResourceError };
