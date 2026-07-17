/**
 * Formato de caso CASOS: precondición / pasos MCP / observación humana /
 * criterio / errores. Sin nombres de juego (D-8).
 */

import { extractCaso } from './casos-md.mjs';

/** Llamada MCP literal en backticks: `tool_name {…json…}` */
const TOOL_CALL_RE = /`([a-z][a-z0-9_]*)\s+(\{[\s\S]*?\})`/gi;

/**
 * @typedef {{ tool: string, args: Record<string, unknown>, raw: string }} McpStep
 * @typedef {{
 *   id: string,
 *   title: string,
 *   precondition: string,
 *   agentStepsText: string,
 *   humanObservation: string,
 *   successCriteria: string,
 *   expectedErrors: string,
 *   mcpSteps: McpStep[],
 *   dependsOn: string[]
 * }} ParsedCaso
 */

/**
 * Parsea una sección de caso ya extraída (o null).
 * @param {string} section
 * @returns {ParsedCaso|null}
 */
export function parseCasoSection(section) {
  if (!section) return null;
  const header = section.match(/^## (C-\d+[a-z]?)\s*[—–-]\s*(.+)$/m);
  if (!header) return null;

  const fields = {
    Precondición: '',
    'Pasos del agente': '',
    'Qué observa el humano': '',
    'Criterio de éxito': '',
    'Errores esperados': ''
  };

  const lines = String(section).split(/\r?\n/);
  let current = null;
  const buffers = Object.fromEntries(Object.keys(fields).map((k) => [k, []]));

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    const fieldMatch = line.match(
      /^-\s+\*\*(Precondición|Pasos del agente(?:\s*\([^)]+\))?|Qué observa el humano|Criterio de éxito|Errores esperados)\*\*\s*:\s*(.*)$/
    );
    if (fieldMatch) {
      const label = fieldMatch[1].startsWith('Pasos del agente')
        ? 'Pasos del agente'
        : fieldMatch[1];
      current = label;
      const rest = fieldMatch[2].trim();
      if (rest) buffers[label].push(rest);
      continue;
    }
    if (current && (/^\s+\d+\.\s+/.test(line) || /^\s+-/.test(line) || line.trim() === '')) {
      if (line.trim()) buffers[current].push(line.trim());
      continue;
    }
    if (current && line.startsWith('## ')) break;
    if (current && line.trim() && !line.startsWith('- **')) {
      buffers[current].push(line.trim());
    }
  }

  const agentStepsText = buffers['Pasos del agente'].join('\n');
  const precondition = buffers.Precondición.join(' ').trim();

  return {
    id: header[1],
    title: header[2].trim(),
    precondition,
    agentStepsText,
    humanObservation: buffers['Qué observa el humano'].join(' ').trim(),
    successCriteria: buffers['Criterio de éxito'].join(' ').trim(),
    expectedErrors: buffers['Errores esperados'].join(' ').trim(),
    mcpSteps: parseMcpSteps(agentStepsText),
    dependsOn: listCaseDeps(precondition, header[1])
  };
}

/**
 * @param {string} markdown
 * @param {string} casoId
 * @returns {ParsedCaso|null}
 */
export function parseCaso(markdown, casoId) {
  return parseCasoSection(extractCaso(markdown, casoId));
}

/**
 * Extrae llamadas MCP literales de un bloque de pasos.
 * @param {string} text
 * @returns {McpStep[]}
 */
export function parseMcpSteps(text) {
  const steps = [];
  for (const match of String(text).matchAll(TOOL_CALL_RE)) {
    const tool = match[1];
    const rawArgs = match[2];
    let args = {};
    try {
      args = JSON.parse(rawArgs);
    } catch {
      args = { __parseError: rawArgs };
    }
    steps.push({ tool, args, raw: match[0] });
  }
  return steps;
}

/**
 * IDs de caso citados como prerequisito en la precondición.
 * Patrones: empieza por `C-xx`, `C-xx (…)` o `(C-xx)`.
 * Menciones condicionales (`si C-04 lo abrió`) no cuentan.
 * @param {string} precondition
 * @param {string} selfId
 * @returns {string[]}
 */
export function listCaseDeps(precondition, selfId) {
  const self = String(selfId).toLowerCase();
  const seen = new Set();
  const deps = [];
  const add = (id) => {
    const key = String(id).toLowerCase();
    if (!id || key === self || seen.has(key)) return;
    seen.add(key);
    deps.push(id);
  };
  const text = String(precondition).trim();
  const atStart = text.match(/^(C-\d+[a-z]?)\b/i);
  if (atStart) add(atStart[1]);
  for (const match of text.matchAll(/\b(C-\d+[a-z]?)\s*\(|\((C-\d+[a-z]?)\)/gi)) {
    add(match[1] || match[2]);
  }
  return deps;
}
