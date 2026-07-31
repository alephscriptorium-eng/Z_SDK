/**
 * WP-U227 · Generación del env de la demo desde la fuente única.
 *
 * `renderEnvExample()` deriva el contenido de `.env.example` de los mapas
 * canónicos de `./index.mjs` (defaults + nombres de override, por familia
 * UI / MCP / spec tooling). Cero transcripción manual: añadir un slot al
 * mapa env actualiza el fichero generado en la siguiente corrida.
 *
 * Reglas:
 * - Puro: no lee process.env ni el filesystem; la salida depende solo de
 *   los mapas y de `previousContent` (byte-reproducible).
 * - Cobertura dura: `missingKeys()` lista claves del contenido anterior
 *   que la nueva salida perdería (el CLI aborta si hay alguna).
 * - Claves fuera de la fuente única: se preservan tal cual desde el
 *   `.env.example` anterior en la sección «no-generada (fuente: operador)»;
 *   jamás se inventan.
 * - Estado activo/comentado: una clave generada se emite activa solo si ya
 *   estaba activa en el contenido anterior (o si no hay contenido previo);
 *   las claves nuevas entran comentadas para no alterar el contrato de
 *   cobertura del `.env` del operador.
 */

import {
  DEFAULT_ZEUS_HOST,
  DEFAULT_ZEUS_MCP,
  DEFAULT_ZEUS_UI_MESH,
  DEFAULT_SPEC_TOOL_PORTS,
  DEFAULT_ZEUS_INSPECTOR_TOKEN,
  DEFAULT_MCP_APPROVAL_TOKEN,
  MCP_PORT_ENV,
  UI_PORT_ENV,
  SPEC_TOOL_PORT_ENV
} from './index.mjs';

/** Cabecera obligatoria del fichero generado (primera línea). */
export const GENERATED_HEADER =
  '# GENERADO por scripts/generar-env.mjs desde presets-sdk/env — no editar a mano';

/** Marcador exacto de la sección preservada (no cubierta por la fuente única). */
export const NO_GENERATED_MARKER =
  '# ── no-generada (fuente: operador) ──────────────────────────────────';

/** Línea de clave env, activa o comentada: `KEY=` / `# KEY=`. */
const KEY_LINE_RE = /^[ \t]*#?[ \t]*([A-Z][A-Z0-9_]*)[ \t]*=/;
/** Solo claves activas (sin `#`). */
const ACTIVE_KEY_LINE_RE = /^[ \t]*([A-Z][A-Z0-9_]*)[ \t]*=/;

const COMMENT_COL = 42;

/** @param {string} content @returns {string} contenido con EOL normalizado a \n */
function normalizeEol(content) {
  return String(content ?? '').replace(/\r\n/g, '\n');
}

/**
 * Nombres de clave (activas + comentadas) presentes en un contenido dotenv.
 * @param {string} content
 * @returns {string[]} únicos, orden ascendente
 */
export function extractEnvKeys(content) {
  const keys = new Set();
  for (const line of normalizeEol(content).split('\n')) {
    const m = KEY_LINE_RE.exec(line);
    if (m) keys.add(m[1]);
  }
  return [...keys].sort();
}

/**
 * Nombres de clave activas (sin comentar) en un contenido dotenv.
 * @param {string} content
 * @returns {Set<string>}
 */
export function extractActiveEnvKeys(content) {
  const keys = new Set();
  for (const line of normalizeEol(content).split('\n')) {
    const m = ACTIVE_KEY_LINE_RE.exec(line);
    if (m) keys.add(m[1]);
  }
  return keys;
}

/** @param {string} text @returns {string[]} párrafos no vacíos */
function splitParagraphs(text) {
  return normalizeEol(text)
    .split(/\n{2,}/)
    .map((p) => p.replace(/^\n+|\n+$/g, ''))
    .filter((p) => p.trim() !== '');
}

/**
 * Párrafos a preservar: los que contienen al menos una clave NO cubierta por
 * la fuente única. Dentro de cada párrafo se eliminan las líneas de claves ya
 * generadas (evita duplicados); los comentarios acompañantes se conservan.
 * Si existe el marcador, solo se considera el contenido posterior a él
 * (idempotencia entre corridas).
 * @param {string} previousContent
 * @param {Set<string>} generatedKeys
 * @returns {string[]}
 */
export function extractPreservedParagraphs(previousContent, generatedKeys) {
  const content = normalizeEol(previousContent);
  const markerIdx = content.indexOf(NO_GENERATED_MARKER);
  const scope =
    markerIdx === -1 ? content : content.slice(markerIdx + NO_GENERATED_MARKER.length);
  const preserved = [];
  for (const paragraph of splitParagraphs(scope)) {
    const lines = paragraph.split('\n');
    const hasForeignKey = lines.some((line) => {
      const m = KEY_LINE_RE.exec(line);
      return m != null && !generatedKeys.has(m[1]);
    });
    if (!hasForeignKey) continue;
    const kept = lines.filter((line) => {
      const m = KEY_LINE_RE.exec(line);
      return m == null || !generatedKeys.has(m[1]);
    });
    preserved.push(kept.join('\n'));
  }
  return preserved;
}

/** @param {string} title @returns {string} línea de sección `# ── titulo ───…` */
function sectionLine(title) {
  const head = `# ── ${title} `;
  const fill = Math.max(2, 70 - head.length);
  return head + '─'.repeat(fill);
}

/**
 * @param {string} name
 * @param {string|number} value
 * @param {string} slot procedencia (comentario al final de línea)
 * @param {boolean} active
 * @returns {string}
 */
function renderEntry(name, value, slot, active) {
  const base = `${active ? '' : '# '}${name}=${value}`;
  const pad = base.length >= COMMENT_COL ? ' ' : ' '.repeat(COMMENT_COL - base.length);
  return `${base}${pad}# ${slot}`;
}

/**
 * Deriva el `.env.example` completo desde los mapas de la fuente única.
 * @param {{
 *   host?: string,
 *   mcp?: Record<string, Record<string, number>>,
 *   mcpEnv?: Record<string, string>,
 *   uis?: Record<string, { port: number, label?: string }>,
 *   uiEnv?: Record<string, string>,
 *   specPorts?: Record<string, number>,
 *   specEnv?: Record<string, string>,
 *   inspectorToken?: string,
 *   approvalToken?: string,
 *   previousContent?: string
 * }} [opts]
 * @returns {string} contenido LF, terminado en \n
 */
export function renderEnvExample(opts = {}) {
  const {
    host = DEFAULT_ZEUS_HOST,
    mcp = DEFAULT_ZEUS_MCP,
    mcpEnv = MCP_PORT_ENV,
    uis = DEFAULT_ZEUS_UI_MESH,
    uiEnv = UI_PORT_ENV,
    specPorts = DEFAULT_SPEC_TOOL_PORTS,
    specEnv = SPEC_TOOL_PORT_ENV,
    inspectorToken = DEFAULT_ZEUS_INSPECTOR_TOKEN,
    approvalToken = DEFAULT_MCP_APPROVAL_TOKEN,
    previousContent = ''
  } = opts;

  /** @type {Array<{ name: string, value: string|number, slot: string, family: 'ui'|'mcp'|'spec' }>} */
  const entries = [];

  for (const [uiId, envName] of Object.entries(uiEnv)) {
    const slot = uis[uiId];
    if (!slot || typeof slot.port !== 'number') {
      throw new Error(`UI_PORT_ENV.${uiId} sin default en DEFAULT_ZEUS_UI_MESH`);
    }
    entries.push({
      name: envName,
      value: slot.port,
      slot: slot.label ? `${uiId} · ${slot.label}` : uiId,
      family: 'ui'
    });
  }

  for (const [mcpPath, envName] of Object.entries(mcpEnv)) {
    const [group, key] = mcpPath.split('.');
    const port = mcp[group]?.[key];
    if (typeof port !== 'number') {
      throw new Error(`MCP_PORT_ENV['${mcpPath}'] sin default en DEFAULT_ZEUS_MCP`);
    }
    entries.push({ name: envName, value: port, slot: mcpPath, family: 'mcp' });
  }

  for (const [toolId, envName] of Object.entries(specEnv)) {
    const port = specPorts[toolId];
    if (typeof port !== 'number') {
      throw new Error(`SPEC_TOOL_PORT_ENV.${toolId} sin default en DEFAULT_SPEC_TOOL_PORTS`);
    }
    entries.push({ name: envName, value: port, slot: toolId, family: 'spec' });
  }

  const generatedKeys = new Set([
    'ZEUS_HOST',
    'ZEUS_INSPECTOR_TOKEN',
    'ZEUS_MCP_APPROVAL_TOKEN',
    ...entries.map((e) => e.name)
  ]);

  const prev = normalizeEol(previousContent);
  const activeKeys = prev === '' ? generatedKeys : extractActiveEnvKeys(prev);
  const isActive = (name) => activeKeys.has(name);

  const lines = [];
  lines.push(GENERATED_HEADER);
  lines.push('# Regenerar: node scripts/generar-env.mjs · comprobar: --check');
  lines.push('# Fuente única: packages/engine/presets-sdk/src/env/index.mjs');
  lines.push('# Uso: copiar a .env y ajustar; el .env del operador nunca se toca.');
  lines.push('# Clave comentada = opcional (rige el default de la fuente única).');
  lines.push('');

  lines.push(sectionLine('host'));
  lines.push(renderEntry('ZEUS_HOST', host, 'DEFAULT_ZEUS_HOST', isActive('ZEUS_HOST')));
  lines.push('');

  lines.push(sectionLine('UI mesh (DEFAULT_ZEUS_UI_MESH · override ZEUS_PORT_*)'));
  for (const e of entries.filter((e) => e.family === 'ui')) {
    lines.push(renderEntry(e.name, e.value, e.slot, isActive(e.name)));
  }
  lines.push('');

  lines.push(sectionLine('MCP servers (DEFAULT_ZEUS_MCP · override ZEUS_MCP_*)'));
  for (const e of entries.filter((e) => e.family === 'mcp')) {
    lines.push(renderEntry(e.name, e.value, e.slot, isActive(e.name)));
  }
  lines.push('');

  lines.push(sectionLine('Spec tooling (DEFAULT_SPEC_TOOL_PORTS)'));
  for (const e of entries.filter((e) => e.family === 'spec')) {
    lines.push(renderEntry(e.name, e.value, e.slot, isActive(e.name)));
  }
  lines.push(
    renderEntry(
      'ZEUS_INSPECTOR_TOKEN',
      inspectorToken,
      'DEFAULT_ZEUS_INSPECTOR_TOKEN',
      isActive('ZEUS_INSPECTOR_TOKEN')
    )
  );
  lines.push('');

  lines.push(sectionLine('MCP mutation prompts (human-in-the-loop)'));
  lines.push(
    renderEntry(
      'ZEUS_MCP_APPROVAL_TOKEN',
      approvalToken,
      'DEFAULT_MCP_APPROVAL_TOKEN',
      isActive('ZEUS_MCP_APPROVAL_TOKEN')
    )
  );
  lines.push('');

  lines.push(NO_GENERATED_MARKER);
  lines.push('# Claves fuera de la fuente única presets-sdk/env: preservadas tal');
  lines.push('# cual del .env.example anterior por el generador; jamás inventadas.');
  const preserved = extractPreservedParagraphs(prev, generatedKeys);
  for (const paragraph of preserved) {
    lines.push('');
    lines.push(paragraph);
  }

  return lines.join('\n') + '\n';
}

/**
 * Claves del contenido anterior ausentes en el nuevo (regla dura de cobertura).
 * @param {string} previousContent
 * @param {string} nextContent
 * @returns {string[]} claves perdidas (vacío = cobertura intacta)
 */
export function missingKeys(previousContent, nextContent) {
  const next = new Set(extractEnvKeys(nextContent));
  return extractEnvKeys(previousContent).filter((k) => !next.has(k));
}
