/**
 * Viaje CA: synthetic line e2e + wiki short path with fetchSnapshot gate + gamemap acceptWalks.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { createLineaJuguete } from '../src/starterkits/index.mjs';
import { validate, validateFile } from '../src/validate.mjs';
import { fetchSnapshot } from '../src/tools/fetch.mjs';
import {
  createLineaGraphSource,
  createWikiGraphSource,
  createGamemapGraphSource,
  nodoIdsFromTrunk,
  runViaje,
  materializeRecorrido,
  normalizeTreeJson,
  segmentarViaje,
  viajeToWalkIntents,
  acceptWalks,
  planPath
} from '../src/viaje/index.mjs';

describe('viaje · línea sintética e2e', () => {
  it('plans N01→N03, materializes cache validating viaje-recorrido + trunk schemas untouched', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-viaje-linea-'));
    const built = createLineaJuguete({
      lineasRoot: root,
      id: 'juguete',
      overwrite: true
    });
    assert.equal(built.ok, true, JSON.stringify(built));

    // Existing kit schemas still green (eje II: wrap, do not break).
    assert.equal(validateFile('manifest-tronco', built.paths.trunkManifest).ok, true);
    assert.equal(validateFile('lineas-registry', built.paths.registry, 'yaml').ok, true);

    const trunk = JSON.parse(fs.readFileSync(built.paths.trunkManifest, 'utf8'));
    const nodoIds = nodoIdsFromTrunk(trunk);
    assert.deepEqual(nodoIds, ['N01', 'N02', 'N03']);

    const source = createLineaGraphSource({ nodoIds });
    const result = await runViaje({
      id: 'juguete-N01-N03',
      origin: 'N01',
      destination: 'N03',
      source,
      cacheDir: built.lineDir,
      curation_status: 'candidate',
      segment: { everyNHops: 1 }
    });

    assert.equal(result.ok, true, JSON.stringify(result));
    assert.deepEqual(result.path, ['N01', 'N02', 'N03']);
    assert.equal(result.hops, 2);
    assert.equal(result.recorrido.etapa, 'completed');
    assert.equal(result.recorrido.curation_status, 'candidate');
    assert.equal(validate('viaje-recorrido', result.recorrido).ok, true);
    assert.ok(fs.existsSync(result.cachePath));
    assert.ok(result.recorrido.milestones.length >= 1);

    // Trunk schemas unchanged on disk (same validation as starterkit).
    assert.equal(validateFile('manifest-tronco', built.paths.trunkManifest).ok, true);
  });
});

describe('viaje · wiki corto + fetchSnapshot gate', () => {
  it('refuses materialize without approve, then completes 2–3 hops with snapshots', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-viaje-wiki-'));
    const satDir = path.join(root, 'wp', 'historia');
    fs.mkdirSync(satDir, { recursive: true });

    const links = {
      Alpha: ['Beta', 'Noise'],
      Beta: ['Gamma'],
      Gamma: []
    };
    const wikitextByNode = {
      Alpha: { oldid: 1001, wikitext: '== Alpha ==\n[[Beta]]', title: 'Alpha' },
      Beta: { oldid: 1002, wikitext: '== Beta ==\n[[Gamma]]', title: 'Beta' },
      Gamma: { oldid: 1003, wikitext: '== Gamma ==\nend', title: 'Gamma' }
    };

    const denied = createWikiGraphSource({
      links,
      satDir,
      wikitextByNode,
      approve: false
    });
    const deniedSnap = denied.materializeNode('Alpha');
    assert.equal(deniedSnap.ok, false);
    assert.equal(deniedSnap.rule, 'fetch.approval_required');

    // Direct kit gate parity.
    const gate = fetchSnapshot({
      satDir,
      oldid: 1001,
      wikitext: 'x',
      approve: false
    });
    assert.equal(gate.ok, false);
    assert.equal(gate.rule, 'fetch.approval_required');

    const source = createWikiGraphSource({
      links,
      satDir,
      wikitextByNode,
      approve: true
    });

    const result = await runViaje({
      id: 'wiki-alpha-gamma',
      origin: 'Alpha',
      destination: 'Gamma',
      source,
      cacheDir: root,
      prune: ['Noise'],
      materializeNode: (id) => source.materializeNode(id),
      curation_status: 'labeled'
    });

    assert.equal(result.ok, true, JSON.stringify(result));
    assert.deepEqual(result.path, ['Alpha', 'Beta', 'Gamma']);
    assert.equal(result.hops, 2);
    assert.equal(result.snapshots.length, 3);
    for (const snap of result.snapshots) {
      assert.ok(fs.existsSync(snap.wikitext_path), snap.wikitext_path);
      assert.ok(fs.existsSync(snap.meta_path), snap.meta_path);
      const meta = JSON.parse(fs.readFileSync(snap.meta_path, 'utf8'));
      assert.equal(validate('cache-sidecar-meta', meta).ok, true);
    }
    assert.equal(validate('viaje-recorrido', result.recorrido).ok, true);
    assert.deepEqual(result.recorrido.candidatos_podados, ['Noise']);
  });

  it('normalizes a tree.json-like shape without adopting it as target', () => {
    const normalized = normalizeTreeJson({
      root: 'A',
      path: ['A', 'B', 'C'],
      nodes: {
        A: { links: ['B', 'X'] },
        B: { links: ['C'] }
      }
    });
    assert.equal(normalized.ok, true, JSON.stringify(normalized));
    assert.equal(normalized.recorrido.tree_normalized_from, 'tree.json');
    assert.equal(validate('viaje-recorrido', normalized.recorrido).ok, true);
  });
});

describe('viaje · gamemap walks (pendingAuthority)', () => {
  it('reproduces path as walk intents accepted locally (room authority pending)', async () => {
    const source = createGamemapGraphSource({
      streets: {
        anchor_a: ['anchor_b'],
        anchor_b: ['anchor_c'],
        anchor_c: []
      }
    });
    const planned = await planPath(source, 'anchor_a', 'anchor_c');
    assert.equal(planned.ok, true, JSON.stringify(planned));

    const built = materializeRecorrido({
      cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-viaje-gm-')),
      recorrido: {
        id: 'gm-demo',
        origin: 'anchor_a',
        destination: 'anchor_c',
        source_kind: 'gamemap',
        etapa: 'completed',
        pasos: planned.pasos,
        curation_status: 'candidate'
      }
    });
    assert.equal(built.ok, true, JSON.stringify(built));

    const walks = viajeToWalkIntents(built.recorrido, {
      anchors: ['anchor_a', 'anchor_b', 'anchor_c'],
      streetForHop: (from, to) => `${from}__${to}`
    });
    assert.equal(walks.ok, true, JSON.stringify(walks));
    assert.equal(walks.walks.length, 2);
    assert.equal(walks.walks[0].kind, 'walk');

    const accepted = acceptWalks(walks.walks);
    assert.equal(accepted.ok, true, JSON.stringify(accepted));
  });
});

describe('viaje · segmentar', () => {
  it('marks milestones via kit milestone rules', () => {
    const seg = segmentarViaje(
      {
        id: 'seg',
        origin: 'A',
        destination: 'C',
        etapa: 'completed',
        pasos: [
          { from: 'A', to: 'B', byte_delta: 10, summary: 'tiny' },
          { from: 'B', to: 'C', byte_delta: 900, summary: 'ampliada sección' }
        ],
        curation_status: 'raw'
      },
      { byteDeltaThreshold: 500, keywords: ['ampliada'] }
    );
    assert.equal(seg.ok, true, JSON.stringify(seg));
    assert.equal(seg.recorrido.pasos[1].milestone, true);
    assert.ok(seg.recorrido.milestones.includes('B->C'));
  });
});
