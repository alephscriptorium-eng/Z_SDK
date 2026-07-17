/**
 * Unit tests for WP-U81 segmentation tools.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { validate, validateFile } from '../src/validate.mjs';
import {
  applyMilestoneRules,
  crearLinea,
  segmentar,
  conectarSatelite,
  fetchSnapshot,
  segmentarForce,
  crearCotas,
  computeCoverage
} from '../src/tools/index.mjs';
import { createLineaJuguete, createForceJuguete } from '../src/starterkits/index.mjs';

function tmpRoot(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('milestone rules', () => {
  it('marks large byte_delta and keywords', () => {
    const a = applyMilestoneRules({ byte_delta: 600, summary: 'x' });
    assert.equal(a.milestone, true);
    assert.ok(a.milestone_reasons.includes('byte_delta'));

    const b = applyMilestoneRules({ byte_delta: 1, summary: 'fusión de stubs' });
    assert.equal(b.milestone, true);
    assert.ok(b.milestone_reasons.includes('keyword'));

    const c = applyMilestoneRules({ byte_delta: 1, summary: 'typo' });
    assert.equal(c.milestone, false);
  });
});

describe('crear-linea + segmentar + fetch gate', () => {
  it('scaffolds trunk and refuses fetch without approve', () => {
    const root = tmpRoot('zeus-u81-linea-');
    const created = crearLinea({
      id: 'demo',
      lineasRoot: root,
      overwrite: true
    });
    assert.equal(created.ok, true, JSON.stringify(created));
    assert.equal(validateFile('manifest-tronco', path.join(created.lineDir, 'manifest.json')).ok, true);
    assert.equal(validateFile('nodos-document', path.join(created.lineDir, 'nodos.yaml'), 'yaml').ok, true);

    const refused = fetchSnapshot({
      satDir: created.satDir,
      oldid: 1,
      wikitext: 'x',
      approve: false
    });
    assert.equal(refused.ok, false);
    assert.equal(refused.rule, 'fetch.approval_required');

    const okFetch = fetchSnapshot({
      satDir: created.satDir,
      oldid: 1,
      wikitext: 'body',
      approve: true
    });
    assert.equal(okFetch.ok, true, JSON.stringify(okFetch));
    assert.ok(fs.existsSync(okFetch.wikitextPath));
  });

  it('segments historial into validating sat manifest', () => {
    const root = tmpRoot('zeus-u81-seg-');
    const created = crearLinea({ id: 'seg', lineasRoot: root, overwrite: true });
    const result = segmentar({
      satDir: created.satDir,
      registros: [
        { oldid: 1, byte_delta: 10, summary: 'a', timestamp: 't1' },
        { oldid: 2, byte_delta: 900, summary: 'big', timestamp: 't2' }
      ],
      corpus: 'linea-seg',
      nodoIds: ['N01', 'N02', 'N03']
    });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.registroCount, 2);
    assert.ok(result.milestoneCount >= 1);
    assert.equal(validate('manifest-satelite', result.manifest).ok, true);

    const linked = conectarSatelite({ lineDir: created.lineDir, lineaId: 'seg' });
    assert.equal(linked.ok, true);
    assert.ok(fs.existsSync(linked.mcpPath));
  });
});

describe('segmentar-force + crear-cotas', () => {
  it('drops trace and reports coverage', () => {
    const raw = ['p', 'TRACE', 'th', 'out'].join('\n');
    const cov = computeCoverage(
      [{ id: 's', slug: '01', lines: [1, 4], prompt: 1, trace: [2], think: 3, output: 4 }],
      4
    );
    assert.equal(cov.ok, true);
    assert.deepEqual(cov.layers_dropped, ['trace']);

    const out = tmpRoot('zeus-u81-force-');
    const forceDir = path.join(out, 'force-x');
    const result = segmentarForce({
      outDir: forceDir,
      forceId: 'force-x',
      rawText: raw,
      overwrite: true,
      scenes: [
        {
          id: 's01-01',
          slug: '01-a',
          lines: [1, 4],
          prompt: 1,
          trace: [2],
          think: 3,
          output: 4,
          anchor: true
        }
      ]
    });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.coverage.ok, true);
    assert.ok(!fs.existsSync(path.join(forceDir, 'escenas/sesion-01/01-a/trace.md')));
    assert.equal(validateFile('force', path.join(forceDir, 'force.json')).ok, true);
    assert.equal(validateFile('force-manifest', path.join(forceDir, 'manifest.json')).ok, true);
  });

  it('creates sima/cima cotas', () => {
    const root = tmpRoot('zeus-u81-cota-');
    const sima = crearCotas({
      outDir: path.join(root, 'sima'),
      id: 'sima',
      overwrite: true
    });
    assert.equal(sima.ok, true, JSON.stringify(sima));
    assert.equal(sima.bound, 'lower');
    assert.equal(sima.pole, 'colapso');
    assert.equal(validateFile('cota', path.join(sima.cotaDir, 'cota.json')).ok, true);

    const cima = crearCotas({
      outDir: path.join(root, 'cima'),
      id: 'cima',
      overwrite: true
    });
    assert.equal(cima.ok, true);
    assert.equal(cima.bound, 'upper');
    assert.equal(cima.pole, 'victoria');
  });
});

describe('starterkits', () => {
  it('linea juguete has 3 nodos and 10 registros validating U80', () => {
    const root = tmpRoot('zeus-u81-sk-linea-');
    const result = createLineaJuguete({ lineasRoot: root, overwrite: true });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.nodoCount, 3);
    assert.equal(result.registroCount, 10);
  });

  it('force juguete validates registry', () => {
    const root = tmpRoot('zeus-u81-sk-force-');
    const result = createForceJuguete({ forcesRoot: root, overwrite: true });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(validateFile('force-registry', result.registryPath).ok, true);
    assert.equal(result.coverage.ok, true);
  });
});
