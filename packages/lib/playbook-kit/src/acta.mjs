/**
 * Plantilla de acta + relleno con evidencia MCP del runner.
 */

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const TEMPLATE_PATH = join(dirname(fileURLToPath(import.meta.url)), 'templates', 'VALIDACION.md');

/**
 * Lee la plantilla canónica del kit (o una ruta aportada por el juego).
 * @param {string} [templatePath]
 * @returns {string}
 */
export function readActaTemplate(templatePath = TEMPLATE_PATH) {
  return fs.readFileSync(templatePath, 'utf8');
}

/**
 * @typedef {{
 *   id: string,
 *   title?: string,
 *   role?: 'case' | 'setup',
 *   ok?: boolean,
 *   steps?: Array<{ tool: string, args: unknown, result: unknown }>,
 *   humanObservation?: string,
 *   error?: string
 * }} ActaCaseEvidence
 *
 * @typedef {{
 *   game?: string,
 *   fecha?: string,
 *   agente?: string,
 *   comando?: string,
 *   navegador?: string,
 *   commit?: string,
 *   cases: ActaCaseEvidence[]
 * }} ActaFillInput
 */

/**
 * Rellena la plantilla con evidencia MCP; checklist humano queda en ⏳.
 * @param {string} template
 * @param {ActaFillInput} input
 * @returns {string}
 */
export function fillActa(template, input) {
  const {
    game = 'juego',
    fecha = new Date().toISOString().slice(0, 10),
    agente = 'playbook-kit runner',
    comando = '⏳',
    navegador = '⏳ sin verificar (mitad visual humana)',
    commit = '⏳',
    cases = []
  } = input;

  const casosBlock = cases.length
    ? cases.map(renderCaseBlock).join('\n\n')
    : '_Ningún caso ejecutado._';

  return String(template)
    .replaceAll('{{game}}', game)
    .replaceAll('{{fecha}}', fecha)
    .replaceAll('{{agente}}', agente)
    .replaceAll('{{comando}}', comando)
    .replaceAll('{{navegador}}', navegador)
    .replaceAll('{{commit}}', commit)
    .replaceAll('{{casos_block}}', casosBlock);
}

/**
 * @param {ActaCaseEvidence} entry
 * @returns {string}
 */
function renderCaseBlock(entry) {
  const role = entry.role === 'setup' ? 'setup (dep)' : 'caso';
  const mark = entry.ok === true ? '✅' : entry.ok === false ? '❌' : '⏳';
  const title = entry.title ? ` — ${entry.title}` : '';
  const lines = [
    `### ${entry.id}${title} · ${role} · MCP ${mark}`,
    '',
    `- Observación humana: ⏳ sin verificar`,
    entry.humanObservation ? `  - (guion) ${entry.humanObservation}` : null,
    `- Evidencia MCP:`
  ].filter((x) => x != null);

  if (entry.error) {
    lines.push(`  - error runner: \`${entry.error}\``);
  }
  if (entry.steps?.length) {
    for (const step of entry.steps) {
      const summary = summarizeResult(step.result);
      lines.push(`  - \`${step.tool}\` ${JSON.stringify(step.args)} → ${summary}`);
    }
  } else if (!entry.error) {
    lines.push('  - ⏳ sin evidencia');
  }
  return lines.join('\n');
}

function summarizeResult(result) {
  if (result == null) return '⏳';
  try {
    const text = JSON.stringify(result);
    if (text.length <= 240) return `\`${text}\``;
    return `\`${text.slice(0, 237)}…\``;
  } catch {
    return String(result);
  }
}

/**
 * Atajo: plantilla del kit + fill.
 * @param {ActaFillInput} input
 * @param {string} [templatePath]
 * @returns {string}
 */
export function renderActa(input, templatePath) {
  return fillActa(readActaTemplate(templatePath), input);
}
