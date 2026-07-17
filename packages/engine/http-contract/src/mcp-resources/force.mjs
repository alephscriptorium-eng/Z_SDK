import { z } from 'zod';
import { McpResourceError } from './descriptor.mjs';

export const ForceRegistry = z
  .looseObject({
    session_budget: z
      .looseObject({
        max_active_forces: z.number().optional(),
        boot_always_on: z.boolean().optional()
      })
      .optional(),
    force_ids: z.array(z.string()).optional(),
    cota_ids: z.array(z.string()).optional()
  })
  .describe('force://registry');

export const ForceInfo = z
  .looseObject({
    name: z.string().optional(),
    volume: z.string().optional(),
    session_budget: z.unknown().optional()
  })
  .describe('force://info');

export const ForceCard = z
  .union([
    z.looseObject({
      id: z.string().optional(),
      kind: z.string().optional(),
      anchor_scene: z.string().optional(),
      pending_refs: z.array(z.unknown()).optional()
    }),
    McpResourceError
  ])
  .describe('force://{id}');

export const ForceScene = z
  .union([
    z.looseObject({
      force_id: z.string().optional(),
      scene_key: z.string().optional(),
      layers: z.unknown().optional(),
      is_anchor: z.boolean().optional()
    }),
    McpResourceError
  ])
  .describe('force://{id}/scene/{session}/{slug}');

export const FORCE_PAYLOADS = new Map([
  ['force://registry', ForceRegistry],
  ['force://info', ForceInfo],
  ['force://{id}', ForceCard],
  ['force://{id}/scene/{session}/{slug}', ForceScene]
]);
