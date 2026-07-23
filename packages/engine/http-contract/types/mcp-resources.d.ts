/** Types for `@zeus/http-contract/mcp-resources` (WP-U157). */

import type { ZodTypeAny } from './index.js';

export const RESOURCE_PAYLOADS: Map<string, ZodTypeAny>;
export const LINEA_PAYLOADS: Map<string, ZodTypeAny>;
export const FIREHOSE_PAYLOADS: Map<string, ZodTypeAny>;
export const SOLAR_PAYLOADS: Map<string, ZodTypeAny>;
export const FORCE_PAYLOADS: Map<string, ZodTypeAny>;
export const SERVER_CARD_PAYLOADS: Map<string, ZodTypeAny>;

export const ResourceDescriptor: ZodTypeAny;
export const McpResourceError: ZodTypeAny;
export const LoosePayload: ZodTypeAny;

export const LineaInfo: ZodTypeAny;
export const LineaCacheStats: ZodTypeAny;
export const LineaNodo: ZodTypeAny;
export const LineaParte: ZodTypeAny;
export const LineaOldid: ZodTypeAny;
export const LineaWikitext: ZodTypeAny;
export const LineaRegistro: ZodTypeAny;
export const LineaRegistrosNodo: ZodTypeAny;
export const LineaRegistrosYear: ZodTypeAny;

export const FirehoseStats: ZodTypeAny;
export const FirehoseTriage: ZodTypeAny;
export const FirehoseCorpus: ZodTypeAny;
export const FirehosePost: ZodTypeAny;

export const BodyInfo: ZodTypeAny;
export const BodyPosition: ZodTypeAny;
export const BodyRotation: ZodTypeAny;

export const ForceRegistry: ZodTypeAny;
export const ForceInfo: ZodTypeAny;
export const ForceCard: ZodTypeAny;
export const ForceScene: ZodTypeAny;

export const ServerCard: ZodTypeAny;

export function validateResourcePayload(
  uriOrTemplate: string,
  payload: unknown
): { ok: boolean; skipped?: boolean; data?: unknown; error?: unknown };
