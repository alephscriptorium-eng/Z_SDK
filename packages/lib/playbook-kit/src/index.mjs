/**
 * @zeus/playbook-kit — método CASOS como producto.
 * Sin nombres de juego (D-8 / PRACTICAS §1.11).
 */

export { listCasoIds, extractCaso } from './casos-md.mjs';
export {
  parseCasoSection,
  parseCaso,
  parseMcpSteps,
  listCaseDeps
} from './parse-caso.mjs';
export { checkPlaybookCoherence, assertPlaybookCoherence } from './coherence.mjs';
export { readActaTemplate, fillActa, renderActa } from './acta.mjs';
export { createMcpHttpClient } from './mcp-client.mjs';
export { runMcpCases, evaluateMcpSuccess } from './runner.mjs';
