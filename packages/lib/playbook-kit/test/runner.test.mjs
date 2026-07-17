import test from 'node:test';
import assert from 'node:assert/strict';
import { runMcpCases, evaluateMcpSuccess } from '../src/runner.mjs';

const PLAYBOOK = `# P

## C-01 — join

- **Precondición**: demo.
- **Pasos del agente (uno)**:
  1. \`player_join {}\`
- **Qué observa el humano**: spawn.
- **Criterio de éxito**: \`ok:true\` con nodeId plaza.
- **Errores esperados**: ninguno.

## C-04 — contact

- **Precondición**: C-01.
- **Pasos del agente (uno)**:
  1. \`player_contact {"targetId":"g"}\`
- **Qué observa el humano**: anillo.
- **Criterio de éxito**: \`ok:true\`.
- **Errores esperados**: ninguno.

## C-04b — reject

- **Precondición**: SIN contacto (si C-04 lo abrió, cierra).
- **Pasos del agente (uno)**:
  1. \`player_tap_set {"tapId":"g","aperture":0.75}\`
- **Qué observa el humano**: nada.
- **Criterio de éxito**: \`ok:false\`, \`error:"sin_contacto"\`.
- **Errores esperados**: \`sin_contacto\`.

## C-05 — set

- **Precondición**: C-04 (contacto open).
- **Pasos del agente (uno)**:
  1. \`player_tap_set {"tapId":"g","aperture":0.75}\`
- **Qué observa el humano**: válvula.
- **Criterio de éxito**: \`ok:true\`.
- **Errores esperados**: ninguno.
`;

test('evaluateMcpSuccess respeta ok:false + error', () => {
  assert.equal(
    evaluateMcpSuccess('ok:false, error:"sin_contacto"', [
      { result: { ok: false, error: 'sin_contacto' } }
    ]),
    true
  );
  assert.equal(
    evaluateMcpSuccess('ok:true', [{ result: { ok: false, error: 'x' } }]),
    false
  );
});

test('runMcpCases ejecuta deps setup para C-05 y no para C-04b', async () => {
  const calls = [];
  const { ok, results, acta } = await runMcpCases({
    markdown: PLAYBOOK,
    casoIds: ['C-01', 'C-04b', 'C-05'],
    callTool: async (tool, args) => {
      calls.push({ tool, args });
      if (tool === 'player_tap_set' && calls.filter((c) => c.tool === 'player_contact').length === 0) {
        return { ok: false, error: 'sin_contacto' };
      }
      return { ok: true, evidencia: {} };
    },
    game: 'fixture',
    resolveDeps: true
  });

  assert.equal(ok, true, results.map((r) => `${r.id}:${r.ok}:${r.error}`).join(' | '));
  const ids = results.map((r) => `${r.id}/${r.role}`);
  assert.deepEqual(ids, ['C-01/case', 'C-04b/case', 'C-04/setup', 'C-05/case']);
  assert.match(acta, /C-04b/);
  assert.match(acta, /sin_contacto|player_tap_set/);
  assert.match(acta, /Observación humana: ⏳/);
});
