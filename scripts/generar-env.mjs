#!/usr/bin/env node
/**
 * WP-U227 · Genera .env.example desde la fuente única presets-sdk/env.
 *
 * Uso:
 *   node scripts/generar-env.mjs          # regenera .env.example
 *   node scripts/generar-env.mjs --check  # verifica sin escribir (exit 1 si difiere)
 *
 * Regla dura de cobertura: si la salida perdiera alguna clave del
 * .env.example actual, el script aborta sin escribir (exit 1) listándolas.
 * Las claves no cubiertas por la fuente única se preservan tal cual en la
 * sección «no-generada (fuente: operador)». El .env del operador no se lee
 * ni se escribe jamás.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  renderEnvExample,
  missingKeys,
  extractEnvKeys
} from '../packages/engine/presets-sdk/src/env/generate-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(REPO_ROOT, '.env.example');

const check = process.argv.includes('--check');

const previousContent = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, 'utf8') : '';
const next = renderEnvExample({ previousContent });

const lost = missingKeys(previousContent, next);
if (lost.length > 0) {
  console.error('[generar-env] ABORT: la regeneración perdería claves del .env.example:');
  for (const key of lost) console.error(`  - ${key}`);
  process.exit(1);
}

const normalizedPrev = previousContent.replace(/\r\n/g, '\n');

if (check) {
  if (normalizedPrev !== next) {
    console.error('[generar-env] .env.example desactualizado respecto a presets-sdk/env.');
    console.error('[generar-env] Regenerar con: node scripts/generar-env.mjs');
    process.exit(1);
  }
  console.log('[generar-env] --check OK: .env.example al día con la fuente única.');
  process.exit(0);
}

if (normalizedPrev === next) {
  console.log('[generar-env] .env.example ya estaba al día (sin cambios).');
  process.exit(0);
}

fs.writeFileSync(TARGET, next, 'utf8');
console.log(
  `[generar-env] .env.example regenerado: ${extractEnvKeys(next).length} claves ` +
    `(antes ${extractEnvKeys(previousContent).length}); cobertura 0 claves perdidas.`
);
