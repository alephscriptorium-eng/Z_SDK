import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CURATION_STATUSES,
  normalizeCurationStatus,
  readCurationStatus,
  curationStatusFromCorpus,
  isCanonStatus
} from '../src/curation.mjs';
import { parseWpTimestamp, resolveNodo } from '../src/resolve.mjs';

describe('curation chain', () => {
  it('exposes a frozen unified enum', () => {
    assert.ok(CURATION_STATUSES.includes('raw'));
    assert.ok(CURATION_STATUSES.includes('pending'));
    assert.ok(CURATION_STATUSES.includes('labeled'));
    assert.ok(CURATION_STATUSES.includes('canon'));
    assert.equal(normalizeCurationStatus('pending'), 'pending');
    assert.equal(normalizeCurationStatus('curated'), 'curated');
    assert.equal(normalizeCurationStatus('TRIAGED'), 'triaged');
    assert.equal(normalizeCurationStatus('nope'), null);
  });

  it('reads aliases from records and corpora', () => {
    assert.equal(readCurationStatus({ delta_status: 'draft' }), 'draft');
    assert.equal(readCurationStatus({ editorialStatus: 'canon' }), 'canon');
    assert.equal(curationStatusFromCorpus('labeled'), 'labeled');
    assert.equal(curationStatusFromCorpus('candidate'), 'candidate');
    assert.equal(isCanonStatus('curated'), true);
    assert.equal(isCanonStatus('raw'), false);
  });
});

describe('resolve (browser-safe)', () => {
  it('parses wiki-ES timestamps and resolves nodo by year', () => {
    assert.equal(parseWpTimestamp('20:30 24 jun 2026'), Date.UTC(2026, 5, 24, 20, 30, 0));
    assert.equal(parseWpTimestamp('28 sep 2007'), Date.UTC(2007, 8, 28, 0, 0, 0));

    const lineData = {
      coverage: { min: 1900, max: 2000 },
      nodos: {
        N01: {
          id: 'N01',
          parte: 'I',
          etiqueta: 'Demo',
          tesis: 'T',
          articulos_wp: ['X'],
          año_ini: 1900,
          año_fin: 2000
        }
      }
    };
    const hit = resolveNodo(lineData, 1950);
    assert.equal(hit.nodo.id, 'N01');
    assert.equal(hit.nodo.tesis, 'T');
    const miss = resolveNodo(lineData, 1800);
    assert.match(miss.error, /outside coverage/);
  });
});
