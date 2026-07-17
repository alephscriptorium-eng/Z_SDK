import { z } from 'zod';

/** Plain `{ error: string }` — player, view, firehose legacy. */
export const ErrorPlain = z.object({
  error: z.string(),
  success: z.literal(false).optional(),
  code: z.string().optional()
});

/** Editor API `{ success, error, message?, details? }`. */
export const ErrorEnvelopeEditor = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  details: z.unknown().optional()
});

/** presets-sdk `{ success, error, details?, timestamp }`. */
export const ErrorEnvelopeSdk = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.unknown().optional(),
  timestamp: z.string().optional()
});

/** Target v1 shape (documented, not enforced in v0). */
export const ErrorV1 = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional()
  })
});

/** Validation middleware 400 body (superset-compatible). */
export const ValidationErrorBody = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.literal('VALIDATION_ERROR'),
  details: z.unknown()
});

/** Common `{ error: string }` for MCP resource read failures. */
export const McpResourceError = z.object({ error: z.string() });

/**
 * Pick error schema for OpenAPI components by envelope kind.
 * @param {import('./route.mjs').EnvelopeKind | undefined} kind
 */
export function errorSchemaForEnvelope(kind) {
  switch (kind) {
    case 'success-editor':
      return ErrorEnvelopeEditor;
    case 'success-sdk':
      return ErrorEnvelopeSdk;
    case 'plain':
    case 'raw-bridge':
    default:
      return ErrorPlain;
  }
}

export const Envelopes = {
  ErrorPlain,
  ErrorEnvelopeEditor,
  ErrorEnvelopeSdk,
  ErrorV1,
  ValidationErrorBody,
  McpResourceError
};
