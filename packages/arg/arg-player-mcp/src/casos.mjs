/**
 * Lectura del playbook packages/arg/spec/CASOS.md.
 * Parseo genérico (listCasoIds / extractCaso) vive en @zeus/player-mcp-kit.
 */

import fs from 'node:fs';
import { listCasoIds, extractCaso } from '@zeus/player-mcp-kit';
import { CASOS_PATH } from './config.mjs';

export function readCasosMarkdown(casosPath = CASOS_PATH) {
  return fs.readFileSync(casosPath, 'utf8');
}

export { listCasoIds, extractCaso };
