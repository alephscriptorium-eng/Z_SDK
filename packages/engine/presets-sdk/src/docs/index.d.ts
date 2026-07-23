/** Types for `@zeus/presets-sdk/docs` (WP-U156). */

export function mountSpecRoutes(
  app: unknown,
  options: { specs: Record<string, () => string> }
): void;

export function mountSwaggerUi(
  app: unknown,
  options?: { path?: string; specUrl?: string; title?: string }
): void;
