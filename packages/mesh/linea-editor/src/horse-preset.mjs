/**
 * Curated horse preset for linea-editor (refs/URIs only on the wire).
 */

import {
  resolvePresetOffer,
  broadcastPresetOffer
} from '@zeus/presets-sdk/horse';
import {
  HORSE_SERVER_NAME,
  PRESET_ID,
  SERVER_NAME
} from './config.mjs';
import {
  MUTATION_TOOL_CREAR_LINEA,
  TOOL_EXPORT_STORY_BOARD
} from './tools.mjs';

/**
 * @returns {object} curated preset declaration
 */
export function buildLineaEditorPreset() {
  return {
    id: PRESET_ID,
    name: PRESET_ID,
    description:
      'Gated line authorship + story-board export (horse refs only)',
    category: 'editor',
    prompt:
      'You author lines via crear_linea / export_story_board. ' +
      'Mutations require the exact approval token. Prefer URIs (linea://, preset://); never ship corpus on horse.',
    items: [
      {
        serverName: HORSE_SERVER_NAME,
        type: 'tool',
        name: MUTATION_TOOL_CREAR_LINEA
      },
      {
        serverName: HORSE_SERVER_NAME,
        type: 'tool',
        name: TOOL_EXPORT_STORY_BOARD
      }
    ]
  };
}

/**
 * Catalog entry shape expected by resolvePresetOffer.
 * @param {{ tools?: object[] }} [opts]
 */
export function buildLineaEditorCatalogEntry(opts = {}) {
  return {
    serverName: HORSE_SERVER_NAME,
    serverInfo: { name: SERVER_NAME },
    isConnected: true,
    tools: opts.tools ?? [
      {
        name: MUTATION_TOOL_CREAR_LINEA,
        description: 'Scaffold a trunk line under LINEAS (gated)',
        parameters: { type: 'object' },
        type: 'tool'
      },
      {
        name: TOOL_EXPORT_STORY_BOARD,
        description: 'Export story-board.json from a line (gated, refs on horse)',
        parameters: { type: 'object' },
        type: 'tool'
      }
    ],
    resources: [
      {
        name: 'editor-info',
        description: 'linea-editor fact card',
        uri: 'editor://info',
        mimeType: 'application/json',
        type: 'resource'
      }
    ],
    resourceTemplates: [],
    prompts: []
  };
}

/**
 * Resolve curated offer for room broadcast.
 */
export function resolveLineaEditorOffer() {
  return resolvePresetOffer(buildLineaEditorPreset(), [
    buildLineaEditorCatalogEntry()
  ]);
}

/**
 * Broadcast offer on a rooms client (thin wrap).
 * @param {object} client
 * @param {string} room
 * @param {string} selfId
 * @param {ReturnType<typeof resolveLineaEditorOffer>} [resolved]
 */
export function broadcastLineaEditorOffer(client, room, selfId, resolved) {
  const offer = resolved ?? resolveLineaEditorOffer();
  return broadcastPresetOffer(client, room, selfId, offer);
}

export { PRESET_ID, HORSE_SERVER_NAME };
