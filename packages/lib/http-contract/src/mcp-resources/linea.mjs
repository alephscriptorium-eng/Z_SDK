import { z } from 'zod';
import { McpResourceError, LoosePayload } from './descriptor.mjs';

export const LineaInfo = z.looseObject({
  name: z.string().optional(),
  kind: z.string().optional(),
  lineaId: z.string().optional()
}).describe('linea://info');

export const LineaCacheStats = z.looseObject({
  registro_count: z.number().optional(),
  cached_oldids: z.array(z.number()).optional(),
  coverage_pct: z.number().optional()
}).describe('linea://cache/stats');

export const LineaNodo = z.union([
  z.looseObject({ year: z.number().optional(), nodo: z.unknown().optional() }),
  McpResourceError
]).describe('linea://nodo/{year}');

export const LineaParte = z.union([
  z.looseObject({ id: z.string().optional(), title: z.string().optional() }),
  McpResourceError
]).describe('linea://parte/{id}');

export const LineaOldid = z.union([
  z.looseObject({ oldid: z.number().optional(), timestamp: z.string().optional() }),
  McpResourceError
]).describe('linea://oldid/{year}');

export const LineaWikitext = z.union([
  z.looseObject({ oldid: z.number().optional(), wikitext: z.string().optional() }),
  McpResourceError
]).describe('linea://wikitext/{oldid}');

export const LineaRegistro = z.union([
  z.looseObject({ registro_id: z.string().optional() }),
  McpResourceError
]).describe('linea://registro/{id}');

export const LineaRegistrosNodo = z.union([
  z.looseObject({ nodo_id: z.string().optional(), registros: z.array(z.unknown()).optional() }),
  McpResourceError
]).describe('linea://registros/nodo/{nodo_id}');

export const LineaRegistrosYear = z.union([
  z.looseObject({ year: z.number().optional(), registros: z.array(z.unknown()).optional() }),
  McpResourceError
]).describe('linea://registros/year/{year}');

export const LINEA_PAYLOADS = new Map([
  ['linea://info', LineaInfo],
  ['linea://cache/stats', LineaCacheStats],
  ['linea://nodo/{year}', LineaNodo],
  ['linea://parte/{id}', LineaParte],
  ['linea://oldid/{year}', LineaOldid],
  ['linea://wikitext/{oldid}', LineaWikitext],
  ['linea://registro/{id}', LineaRegistro],
  ['linea://registros/nodo/{nodo_id}', LineaRegistrosNodo],
  ['linea://registros/year/{year}', LineaRegistrosYear]
]);

export { LoosePayload };
