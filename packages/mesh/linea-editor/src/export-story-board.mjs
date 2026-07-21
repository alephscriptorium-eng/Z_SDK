/**
 * Export a line as story-board.json (solve dialect) + TransmediaEvent refs.
 * Horse payloads carry URIs only (SPEC-horse-blobs): never corpus bytes.
 */

import fs from 'node:fs';
import path from 'node:path';
import { CURATION_STATUSES } from '@zeus/linea-kit/curation';
import { validateStoryBoard } from '@zeus/story-board-schema';

/**
 * Map trunk nodos → acts (one act per nodo) with generic widgets.
 * @param {{ id: string, etiqueta?: string, nodos?: object[] }} lineMeta
 */
export function lineToStoryBoard(lineMeta) {
  const nodos = Array.isArray(lineMeta.nodos) ? lineMeta.nodos : [];
  const acts =
    nodos.length > 0
      ? nodos.map((n, i) => ({
          id: `act-${i}`,
          blockchain: i,
          title: n.etiqueta || n.id || `nodo-${i}`,
          widgets: ['panel-seed'],
          status: 'ready',
          curation: CURATION_STATUSES.includes('raw') ? 'raw' : 'raw',
          linea_nodo: n.id
        }))
      : [
          {
            id: 'act-0',
            blockchain: 0,
            title: lineMeta.etiqueta || lineMeta.id || 'line',
            widgets: ['panel-seed'],
            status: 'ready'
          }
        ];

  return {
    version: 1,
    generated_at: new Date().toISOString(),
    title: `${lineMeta.etiqueta || lineMeta.id} — story-board`,
    slug: String(lineMeta.id || 'line'),
    acts,
    source: {
      linea: `linea://${lineMeta.id}`,
      curation_chain: ['raw', 'triaged', 'canon'].filter((s) =>
        CURATION_STATUSES.includes(s)
      )
    }
  };
}

/**
 * Build TransmediaEvent stubs (refs only) for horse / mesh handoff.
 * @param {string} lineaId
 * @param {object} board
 */
export function buildTransmediaEvents(lineaId, board) {
  return (board.acts || []).map((act, i) => ({
    id: `te-${lineaId}-${act.id}`,
    source: 'room',
    editorialStatus: i === 0 ? 'raw' : i === board.acts.length - 1 ? 'canon' : 'triaged',
    refs: {
      linea: `linea://${lineaId}`,
      act: act.id,
      story_board: `linea://${lineaId}/story-board.json`
    }
  }));
}

/**
 * @param {{
 *   lineDir: string,
 *   outPath?: string,
 *   approved?: boolean,
 *   approvalToken_evidenced?: string,
 *   gate?: object
 * }} opts
 */
export function exportStoryBoardFromLine(opts) {
  const lineDir = path.resolve(opts.lineDir);
  const manifestPath = path.join(lineDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return {
      ok: false,
      error: `manifest.json not found under ${lineDir}`,
      rule: 'export.line_missing'
    };
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const lineaId =
    manifest?.meta?.id ||
    manifest?.id ||
    path.basename(lineDir);
  const nodos = Array.isArray(manifest.nodos)
    ? manifest.nodos.map((n) => {
        if (typeof n === 'string') return { id: n };
        if (n?.id) {
          const metaPath = path.join(lineDir, n.paths?.meta || `nodos/${n.id}/meta.json`);
          if (fs.existsSync(metaPath)) {
            try {
              const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
              return { id: n.id, etiqueta: meta.etiqueta || meta.title || n.id };
            } catch {
              return { id: n.id };
            }
          }
          return { id: n.id };
        }
        return n;
      })
    : [];

  const board = lineToStoryBoard({
    id: lineaId,
    etiqueta: manifest?.meta?.etiqueta || lineaId,
    nodos
  });

  const validated = validateStoryBoard(board);
  if (!validated.ok) {
    return {
      ok: false,
      error: 'story-board schema validation failed',
      validation: validated,
      rule: 'export.story_board_schema'
    };
  }

  const outPath =
    opts.outPath || path.join(lineDir, 'story-board.json');
  fs.writeFileSync(outPath, JSON.stringify(board, null, 2), 'utf8');

  const events = buildTransmediaEvents(lineaId, board);

  /** Horse / JSON-RPC safe payload: refs only, no corpus. */
  const horsePayload = {
    ok: true,
    refs: {
      linea: `linea://${lineaId}`,
      story_board: `file://${outPath.replace(/\\/g, '/')}`,
      preset: 'preset://linea-editor',
      events: events.map((e) => e.refs)
    },
    curation_chain: board.source.curation_chain,
    act_count: board.acts.length,
    approved: opts.approved === true,
    approvalToken_evidenced: opts.approvalToken_evidenced,
    gate: opts.gate
  };

  return {
    ...horsePayload,
    outPath,
    board,
    events,
    validation: { ok: true, dialect: validated.dialect }
  };
}
