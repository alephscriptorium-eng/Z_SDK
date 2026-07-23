/** Types for `@zeus/http-contract` (WP-U157). */

/** Minimal schema stand-in (avoids pulling zod's TS5.5+ .d.cts into consumers). */
export type ZodTypeAny = object;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type EnvelopeKind = 'plain' | 'success-editor' | 'success-sdk' | 'raw-bridge';
export type RouteStatus = 'canonical' | 'frozen' | 'sdk-compat' | 'deprecated';

export interface RouteEntry {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  tags?: string[];
  request?: { params?: ZodTypeAny; query?: ZodTypeAny; body?: ZodTypeAny };
  responses: Record<string, ZodTypeAny>;
  envelope?: EnvelopeKind;
  xMcpResource?: string;
  deprecated?: boolean;
  xStatus?: RouteStatus;
  xDegradedMode?: string;
}

export function defineRoutes(appId: string, entries: RouteEntry[]): RouteEntry[];
export function routesById(routes: RouteEntry[]): Map<string, RouteEntry>;
export function assertNoRouteCollisions(routes: RouteEntry[]): void;

export const ErrorPlain: ZodTypeAny;
export const ErrorEnvelopeEditor: ZodTypeAny;
export const ErrorEnvelopeSdk: ZodTypeAny;
export const ErrorV1: ZodTypeAny;
export const ValidationErrorBody: ZodTypeAny;
export const McpResourceError: ZodTypeAny;
export function errorSchemaForEnvelope(kind?: EnvelopeKind): ZodTypeAny;
export const Envelopes: Record<string, ZodTypeAny>;

export function expressPathToOpenApi(path: string): string;
export function buildOpenApiDoc(opts: Record<string, unknown>): object;
export function renderRouteIndex(routes: RouteEntry[], opts?: Record<string, unknown>): string;

export function renderMcpResourceCatalog(
  routes: RouteEntry[],
  opts?: Record<string, unknown>
): string;
export function deriveRouteMcpUri(route: RouteEntry, opts?: Record<string, unknown>): string;
export function resolveRouteMcpUri(route: RouteEntry, opts?: Record<string, unknown>): string;
export function projectRoutesToMcp(
  routes: RouteEntry[],
  opts?: Record<string, unknown>
): unknown[];
export function fillExpressPath(
  path: string,
  params: Record<string, string | number>
): string;
export function bindProjectedHttpReaders(
  opts: Record<string, unknown>
): Record<string, unknown>;
export function renderRouteMcpCatalog(
  routes: RouteEntry[],
  opts?: Record<string, unknown>
): string;

export function assertSpecMatches(
  actual: unknown,
  expected: unknown,
  opts?: Record<string, unknown>
): void;
export function collectMountedRoutes(app: unknown): Array<{ method: string; path: string }>;
export function assertRoutesMounted(
  app: unknown,
  routes: RouteEntry[],
  opts?: Record<string, unknown>
): void;

export function validate(
  schemas: { params?: ZodTypeAny; query?: ZodTypeAny; body?: ZodTypeAny },
  opts?: { mode?: 'off' | 'warn' | 'enforce'; routeId?: string }
): (req: unknown, res: unknown, next: (err?: unknown) => void) => void;
export function getValidateMode(): 'off' | 'warn' | 'enforce';

export function zeusOpenApiServers(opts?: Record<string, unknown>): unknown[];
export function readPackageVersion(packageDir: string): string;
