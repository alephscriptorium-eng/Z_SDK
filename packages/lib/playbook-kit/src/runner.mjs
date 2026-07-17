/**
 * Runner e2e: ejecuta la mitad MCP-verificable de casos de un playbook.
 * La mitad visual queda para el humano (G-ARG.1).
 */

import { extractCaso } from './casos-md.mjs';
import { parseCasoSection } from './parse-caso.mjs';
import { renderActa } from './acta.mjs';

/**
 * @typedef {(tool: string, args: Record<string, unknown>) => Promise<unknown>} CallTool
 *
 * @typedef {{
 *   markdown: string,
 *   casoIds: string[],
 *   callTool: CallTool,
 *   resolveDeps?: boolean,
 *   game?: string,
 *   comando?: string,
 *   commit?: string,
 *   agente?: string
 * }} RunMcpCasesOptions
 */

/**
 * Ejecuta casos en orden. Si `resolveDeps`, corre deps de precondición que
 * aún no se hayan ejecutado (p.ej. C-04 antes de C-05) como setup.
 *
 * @param {RunMcpCasesOptions} opts
 * @returns {Promise<{ ok: boolean, results: object[], acta: string }>}
 */
export async function runMcpCases(opts) {
  const {
    markdown,
    casoIds,
    callTool,
    resolveDeps = true,
    game = 'juego',
    comando = 'playbook-kit runner',
    commit = '⏳',
    agente = 'playbook-kit runner'
  } = opts;

  if (typeof callTool !== 'function') {
    throw new Error('runMcpCases: callTool requerido');
  }

  const completed = new Set();
  const results = [];

  for (const id of casoIds) {
    await runOne(id, 'case');
  }

  const ok = results.every((r) => r.ok === true);
  const acta = renderActa({
    game,
    agente,
    comando,
    commit,
    cases: results.map((r) => ({
      id: r.id,
      title: r.title,
      role: r.role,
      ok: r.ok,
      steps: r.steps,
      humanObservation: r.humanObservation,
      error: r.error
    }))
  });

  return { ok, results, acta };

  /**
   * @param {string} casoId
   * @param {'case'|'setup'} role
   */
  async function runOne(casoId, role) {
    const key = String(casoId).toLowerCase();
    if (completed.has(key)) return;

    const section = extractCaso(markdown, casoId);
    const parsed = parseCasoSection(section);
    if (!parsed) {
      results.push({
        id: casoId,
        role,
        ok: false,
        error: 'caso no encontrado o ilegible',
        steps: []
      });
      completed.add(key);
      return;
    }

    if (resolveDeps) {
      for (const dep of parsed.dependsOn) {
        if (!completed.has(String(dep).toLowerCase())) {
          await runOne(dep, 'setup');
        }
      }
    }

    const steps = [];
    let caseOk = true;
    let caseError;

    try {
      if (parsed.mcpSteps.length === 0) {
        caseOk = false;
        caseError = 'sin pasos MCP parseables';
      }
      for (const step of parsed.mcpSteps) {
        if (step.args?.__parseError) {
          caseOk = false;
          caseError = `JSON inválido en ${step.tool}`;
          steps.push({ tool: step.tool, args: step.args, result: { ok: false, error: caseError } });
          continue;
        }
        const result = await callTool(step.tool, step.args);
        steps.push({ tool: step.tool, args: step.args, result });
        if (result && typeof result === 'object' && 'ok' in result && result.ok === false) {
          // Rechazo esperado: el caso decide vía criterio; no marcamos fail
          // automático aquí — el caller/CA valida evidencia. Solo fallamos si
          // el tool lanza.
        }
      }
    } catch (err) {
      caseOk = false;
      caseError = err instanceof Error ? err.message : String(err);
    }

    // Heurística ligera de ok: si el criterio pide ok:false, el último paso
    // con ok:false cuenta como éxito MCP; si pide ok:true, hace falta al menos
    // un ok:true (o ausencia de throw).
    if (caseOk && !caseError) {
      caseOk = evaluateMcpSuccess(parsed.successCriteria, steps);
    }

    results.push({
      id: parsed.id,
      title: parsed.title,
      role,
      ok: caseOk,
      error: caseError,
      steps,
      humanObservation: parsed.humanObservation,
      successCriteria: parsed.successCriteria
    });
    completed.add(key);
  }
}

/**
 * @param {string} criteria
 * @param {Array<{ result: unknown }>} steps
 * @returns {boolean}
 */
export function evaluateMcpSuccess(criteria, steps) {
  const text = String(criteria);
  const wantsFalse = /ok\s*:\s*false/i.test(text);
  const wantsTrue = /ok\s*:\s*true/i.test(text);
  const results = steps.map((s) => s.result).filter((r) => r && typeof r === 'object');

  if (wantsFalse) {
    const expectedError = text.match(/error\s*:\s*["']([^"']+)["']/i)?.[1];
    return results.some(
      (r) => r.ok === false && (!expectedError || r.error === expectedError)
    );
  }
  if (wantsTrue) {
    return results.some((r) => r.ok === true);
  }
  // Sin mención explícita: no fallar solo por forma.
  return true;
}
