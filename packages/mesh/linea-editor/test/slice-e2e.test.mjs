/**
 * Slice e2e (bloqueante): horse tools/call → gated crear_linea → volumen → kit validate.
 * Simula cadena rabbit→horse (Z04) con PresetHorseProxy + upstream real.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveMcpApprovalToken } from '@zeus/presets-sdk';
import {
  resolvePresetOffer,
  createPresetHorseProxy
} from '@zeus/presets-sdk/horse';
import { crearLinea } from '@zeus/linea-kit/tools';
import {
  buildLineaEditorPreset,
  buildLineaEditorCatalogEntry
} from '../src/horse-preset.mjs';
import {
  MUTATION_TOOL_CREAR_LINEA,
  runCrearLineaGated,
  runExportStoryBoardGated
} from '../src/tools.mjs';
import { HORSE_SERVER_NAME } from '../src/config.mjs';

function tmpLineas() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'linea-editor-e2e-'));
}

test('slice e2e: horse tools/call crear_linea gated → volume + kit schemas', async () => {
  const lineasRoot = tmpLineas();
  const token = resolveMcpApprovalToken();
  const id = 'slice-juguete';

  const refused = runCrearLineaGated({
    id,
    lineasRoot,
    approve: false,
    approvalToken: token
  });
  assert.equal(refused.ok, false);
  assert.equal(refused.rule, 'linea-editor.approval_required');
  assert.ok(refused.gate?.gate_line);
  assert.ok(!fs.existsSync(path.join(lineasRoot, id)));

  const offer = resolvePresetOffer(buildLineaEditorPreset(), [
    buildLineaEditorCatalogEntry()
  ]);

  const proxy = createPresetHorseProxy({
    offer,
    upstream: {
      async callTool(serverName, name, args = {}) {
        assert.equal(serverName, HORSE_SERVER_NAME);
        assert.equal(name, MUTATION_TOOL_CREAR_LINEA);
        const result = runCrearLineaGated({
          ...args,
          lineasRoot
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }]
        };
      }
    }
  });

  // Rabbit-shaped JSON-RPC tools/call over horse
  const horseMsg = {
    jsonrpc: '2.0',
    id: 42,
    method: 'tools/call',
    params: {
      name: MUTATION_TOOL_CREAR_LINEA,
      arguments: {
        id,
        approve: true,
        approvalToken: token,
        overwrite: true
      }
    }
  };

  // Evidence: approve token present in call args (auditable)
  assert.equal(horseMsg.params.arguments.approve, true);
  assert.equal(horseMsg.params.arguments.approvalToken, token);

  const res = await proxy.handleMessage(horseMsg);
  assert.ok(res.result?.content?.[0]?.text);
  const body = JSON.parse(res.result.content[0].text);
  assert.equal(body.ok, true);
  assert.equal(body.approved, true);
  assert.equal(body.approvalToken_evidenced, token);
  assert.ok(body.gate?.gate_line);
  assert.equal(body.validation.manifest_tronco.ok, true);
  assert.equal(body.validation.nodos_document.ok, true);
  assert.ok(fs.existsSync(path.join(lineasRoot, id, 'manifest.json')));
  assert.equal(body.refs.linea, `linea://${id}`);
  assert.equal(body.refs.preset, 'preset://linea-editor');

  // Export story-board (eje I) — horse payload refs only
  const exported = runExportStoryBoardGated({
    lineDir: body.lineDir,
    approve: true,
    approvalToken: token
  });
  assert.equal(exported.ok, true);
  assert.ok(fs.existsSync(exported.outPath));
  assert.equal(exported.validation.ok, true);
  assert.ok(exported.refs.linea.startsWith('linea://'));
  assert.ok(exported.refs.story_board.startsWith('file://'));
  // No corpus field on horse-facing refs object
  assert.equal(exported.refs.wikitext, undefined);
  assert.equal(exported.refs.body, undefined);

  const horseJson = JSON.stringify(exported.refs);
  assert.equal(/wikitext|== Toy|corpus/i.test(horseJson), false);
});

test('eje IV: CLI crearLinea same contract as gated tool (second client)', () => {
  const lineasRoot = tmpLineas();
  const token = resolveMcpApprovalToken();
  const id = 'cli-twin';

  const viaEditor = runCrearLineaGated({
    id: `${id}-mcp`,
    lineasRoot,
    approve: true,
    approvalToken: token,
    overwrite: true
  });
  assert.equal(viaEditor.ok, true);

  const viaCli = crearLinea({
    id: `${id}-cli`,
    lineasRoot,
    overwrite: true,
    updateRegistry: true
  });
  assert.equal(viaCli.ok, true);
  assert.equal(viaCli.nodoCount, viaEditor.nodoCount);
  assert.ok(fs.existsSync(path.join(viaCli.lineDir, 'manifest.json')));
  assert.ok(fs.existsSync(path.join(viaEditor.lineDir, 'manifest.json')));
});
