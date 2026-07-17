import test from 'node:test';
import assert from 'node:assert/strict';
import { fillActa, readActaTemplate, renderActa } from '../src/acta.mjs';

test('fillActa sustituye placeholders y evidencia MCP', () => {
  const md = fillActa(readActaTemplate(), {
    game: 'demo',
    fecha: '2026-07-17',
    agente: 'test',
    comando: 'npm test',
    commit: 'abc',
    cases: [
      {
        id: 'C-01',
        title: 'join',
        role: 'case',
        ok: true,
        humanObservation: 'monigote',
        steps: [{ tool: 'player_join', args: {}, result: { ok: true, evidencia: { actor: { nodeId: 'plaza' } } } }]
      }
    ]
  });
  assert.match(md, /# demo — Acta/);
  assert.match(md, /2026-07-17/);
  assert.match(md, /### C-01 — join/);
  assert.match(md, /player_join/);
  assert.match(md, /Observación humana: ⏳/);
  assert.match(md, /nodeId":"plaza"/);
});

test('renderActa atajo', () => {
  const md = renderActa({ game: 'x', cases: [] });
  assert.match(md, /Ningún caso ejecutado/);
});
