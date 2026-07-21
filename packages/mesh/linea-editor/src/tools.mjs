/**
 * Thin wraps of @zeus/linea-kit/tools — orchestration only (eje II/III).
 * Mutation definitions stay in linea-kit; this module gates + delegates.
 */

import fs from 'node:fs';
import path from 'node:path';
import { crearLinea, defaultScaffoldNodos } from '@zeus/linea-kit/tools';
import { validate, validateFile } from '@zeus/linea-kit/validate';
import { requireMutationApproval } from './gate.mjs';
import { exportStoryBoardFromLine } from './export-story-board.mjs';

export const MUTATION_TOOL_CREAR_LINEA = 'crear_linea';
export const TOOL_EXPORT_STORY_BOARD = 'export_story_board';

/**
 * Gated crear_linea → volumen LINEAS + validate kit schemas (untouched).
 * @param {{
 *   id: string,
 *   lineasRoot: string,
 *   etiqueta?: string,
 *   autorTronco?: string,
 *   referenciaWp?: string,
 *   overwrite?: boolean,
 *   approve?: boolean,
 *   approvalToken?: string
 * }} input
 */
export function runCrearLineaGated(input) {
  const gate = requireMutationApproval({
    approve: input.approve,
    approvalToken: input.approvalToken,
    toolName: MUTATION_TOOL_CREAR_LINEA
  });
  if (!gate.ok) return gate;

  const result = crearLinea({
    id: input.id,
    lineasRoot: input.lineasRoot,
    etiqueta: input.etiqueta,
    autorTronco: input.autorTronco,
    referenciaWp: input.referenciaWp,
    nodos: defaultScaffoldNodos(),
    overwrite: input.overwrite === true,
    updateRegistry: true
  });

  if (!result.ok) {
    return { ...result, gate: gate.gate, approved: true };
  }

  const manifestPath = path.join(result.lineDir, 'manifest.json');
  const nodosPath = path.join(result.lineDir, 'nodos.yaml');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const schemaChecks = [
    validate('manifest-tronco', manifest),
    validateFile('nodos-document', nodosPath, 'yaml')
  ];
  const failed = schemaChecks.filter((v) => !v.ok);

  return {
    ok: failed.length === 0,
    ...(failed.length
      ? { error: 'kit schema validation failed after crear_linea', failed }
      : {}),
    approved: true,
    approvalToken_evidenced: gate.token,
    gate: gate.gate,
    lineDir: result.lineDir,
    lineaUri: `linea://${input.id}`,
    manifestPath,
    nodoCount: result.nodoCount,
    validation: {
      manifest_tronco: schemaChecks[0],
      nodos_document: schemaChecks[1]
    },
    refs: {
      linea: `linea://${input.id}`,
      preset: 'preset://linea-editor',
      manifest: `file://${manifestPath.replace(/\\/g, '/')}`
    }
  };
}

/**
 * Export story-board from an existing line dir (refs-first horse payload).
 * @param {{
 *   lineDir: string,
 *   outPath?: string,
 *   approve?: boolean,
 *   approvalToken?: string
 * }} input
 */
export function runExportStoryBoardGated(input) {
  const gate = requireMutationApproval({
    approve: input.approve,
    approvalToken: input.approvalToken,
    toolName: TOOL_EXPORT_STORY_BOARD
  });
  if (!gate.ok) return gate;

  return exportStoryBoardFromLine({
    lineDir: input.lineDir,
    outPath: input.outPath,
    approved: true,
    approvalToken_evidenced: gate.token,
    gate: gate.gate
  });
}
