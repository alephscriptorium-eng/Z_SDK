/**
 * Static identity for the linea-editor MCP server.
 */

export const SERVER_NAME = 'linea-editor';
export const SERVER_VERSION = '0.1.0';

/** Catalog / horse serverName (stable). */
export const HORSE_SERVER_NAME = 'linea-editor';

/** Curated preset id offered on horse (refs only). */
export const PRESET_ID = 'linea-editor';

/**
 * Env var (server-side deploy policy, junto a `ZEUS_LINEAS_ROOT`) que EXIGE
 * reparto para toda mutación gateada. Quien despliega decide la política, no
 * quien llama: con el flag activo, `crear_linea`/`export_story_board` sin
 * `reparto` se DENIEGAN (`reparto_requerido`) antes de escribir. Default OFF.
 */
export const REQUIRE_REPARTO_ENV = 'ZEUS_LINEA_EDITOR_REQUIRE_REPARTO';

/** Truthy tokens for the require-reparto flag (case-insensitive). */
const TRUTHY = new Set(['1', 'true', 'yes', 'on', 'si', 'sí']);

/**
 * Resolve the server-side require-reparto policy from the environment.
 * Read fresh each call (no cache) so deploys/tests reflect the live env.
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {boolean}
 */
export function resolveRequireReparto(env = process.env) {
  const raw = env[REQUIRE_REPARTO_ENV];
  if (raw == null) return false;
  return TRUTHY.has(String(raw).trim().toLowerCase());
}
