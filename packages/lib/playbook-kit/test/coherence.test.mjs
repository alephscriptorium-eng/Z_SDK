import test from 'node:test';
import assert from 'node:assert/strict';
import { checkPlaybookCoherence, assertPlaybookCoherence } from '../src/coherence.mjs';

const GOOD = `# Playbook

## C-01 — join

- **Precondición**: demo up.
- **Pasos del agente (uno)**:
  1. \`player_join {}\`
- **Qué observa el humano**: monigote en plaza.
- **Criterio de éxito**: \`ok:true\`.
- **Errores esperados**: ninguno.

## C-02 — move

- **Precondición**: C-01.
- **Pasos del agente (uno)**:
  1. \`player_move {"nodeId":"a"}\`
- **Qué observa el humano**: camina.
- **Criterio de éxito**: \`ok:true\`.
- **Errores esperados**: ninguno.
`;

test('checkPlaybookCoherence ok con expectedIds', () => {
  const r = checkPlaybookCoherence(GOOD, {
    expectedIds: ['C-01', 'C-02'],
    toolPattern: /`player_\w+\s*\{/
  });
  assert.equal(r.ok, true, r.errors.join('\n'));
  assert.deepEqual(r.ids, ['C-01', 'C-02']);
});

test('checkPlaybookCoherence falla sin criterio', () => {
  const bad = GOOD.replace('- **Criterio de éxito**: `ok:true`.', '');
  const r = checkPlaybookCoherence(bad, { expectedIds: ['C-01', 'C-02'] });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /Criterio/.test(e)));
});

test('assertPlaybookCoherence lanza', () => {
  assert.throws(() => assertPlaybookCoherence('## sin casos\n'));
});
