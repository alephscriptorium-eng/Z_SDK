/**
 * Test de coherencia de un playbook CASOS.md.
 * Generaliza el chequeo que vivía en arg-player-mcp/test/casos.test.mjs.
 */

import { listCasoIds, extractCaso } from './casos-md.mjs';
import { parseCasoSection } from './parse-caso.mjs';

const DEFAULT_TOOL_PATTERN = /`[a-z][a-z0-9_]*\s*\{/;

/**
 * @typedef {{
 *   expectedIds?: string[],
 *   toolPattern?: RegExp,
 *   requireHumanObservation?: boolean,
 *   requireExpectedErrors?: boolean
 * }} CoherenceOptions
 *
 * @typedef {{
 *   ok: boolean,
 *   ids: string[],
 *   errors: string[],
 *   cases: Array<{ id: string, mcpStepCount: number }>
 * }} CoherenceResult
 */

/**
 * Comprueba coherencia del playbook sin lanzar (para tests / runner).
 * @param {string} markdown
 * @param {CoherenceOptions} [options]
 * @returns {CoherenceResult}
 */
export function checkPlaybookCoherence(markdown, options = {}) {
  const {
    expectedIds,
    toolPattern = DEFAULT_TOOL_PATTERN,
    requireHumanObservation = true,
    requireExpectedErrors = true
  } = options;

  const errors = [];
  const ids = listCasoIds(markdown);
  const cases = [];

  if (expectedIds) {
    const got = ids.join(',');
    const want = expectedIds.join(',');
    if (got !== want) {
      errors.push(`ids: esperado [${want}] · obtenido [${got}]`);
    }
  }

  if (ids.length === 0) {
    errors.push('no hay casos ## C-xx en el markdown');
  }

  for (const id of ids) {
    const section = extractCaso(markdown, id);
    if (!section) {
      errors.push(`${id}: no se pudo extraer`);
      continue;
    }
    const parsed = parseCasoSection(section);
    if (!parsed) {
      errors.push(`${id}: cabecera ## C-xx — título ilegible`);
      continue;
    }

    if (!parsed.precondition) {
      errors.push(`${id}: falta Precondición`);
    }
    if (!parsed.agentStepsText) {
      errors.push(`${id}: faltan Pasos del agente`);
    }
    if (!parsed.successCriteria) {
      errors.push(`${id}: falta Criterio de éxito`);
    }
    if (requireHumanObservation && !parsed.humanObservation) {
      errors.push(`${id}: falta Qué observa el humano`);
    }
    if (requireExpectedErrors && !parsed.expectedErrors) {
      errors.push(`${id}: faltan Errores esperados`);
    }

    if (!toolPattern.test(section)) {
      errors.push(`${id}: no cita llamada MCP literal (patrón ${toolPattern})`);
    }

    const mcpStepCount = parsed.mcpSteps.length;
    if (mcpStepCount === 0) {
      errors.push(`${id}: no se parseó ninguna llamada \`tool {args}\``);
    }

    cases.push({ id, mcpStepCount });
  }

  return { ok: errors.length === 0, ids, errors, cases };
}

/**
 * Igual que checkPlaybookCoherence pero lanza AssertionError-like Error.
 * @param {string} markdown
 * @param {CoherenceOptions} [options]
 * @returns {CoherenceResult}
 */
export function assertPlaybookCoherence(markdown, options = {}) {
  const result = checkPlaybookCoherence(markdown, options);
  if (!result.ok) {
    const err = new Error(`playbook incoherente:\n- ${result.errors.join('\n- ')}`);
    err.result = result;
    throw err;
  }
  return result;
}
