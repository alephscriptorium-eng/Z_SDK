import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCasoSection, parseMcpSteps, listCaseDeps } from '../src/parse-caso.mjs';

const C04B = `## C-04b — tap_set SIN contacto ⇒ rechazado

- **Precondición**: SIN contacto abierto con \`grifo-a\` (si C-04 lo abrió, \`player_contact_close {}\` primero).
- **Pasos del agente (uno)**:
  1. \`player_tap_set {"tapId":"grifo-a","aperture":0.75}\`
- **Qué observa el humano**: la válvula NO gira.
- **Criterio de éxito**: \`ok:false\`, \`error:"sin_contacto"\`.
- **Errores esperados**: \`sin_contacto\`.
`;

const C05 = `## C-05 — tap_set 0.75 con contacto

- **Precondición**: C-04 (contacto \`open\` con \`grifo-a\`), uno en \`cima-a\`.
- **Pasos del agente (uno)**:
  1. \`player_tap_set {"tapId":"grifo-a","aperture":0.75}\`
  2. \`player_observe {"what":"taps"}\`
- **Qué observa el humano**: la válvula gira.
- **Criterio de éxito**: paso 1 \`ok:true\` con aperture 0.75.
- **Errores esperados**: \`apertura_invalida\`.
`;

test('parseCasoSection campos + mcpSteps', () => {
  const parsed = parseCasoSection(C04B);
  assert.equal(parsed.id, 'C-04b');
  assert.match(parsed.title, /tap_set/);
  assert.match(parsed.precondition, /SIN contacto/);
  assert.equal(parsed.mcpSteps.length, 1);
  assert.equal(parsed.mcpSteps[0].tool, 'player_tap_set');
  assert.deepEqual(parsed.mcpSteps[0].args, { tapId: 'grifo-a', aperture: 0.75 });
  assert.match(parsed.humanObservation, /válvula/);
  assert.match(parsed.successCriteria, /sin_contacto/);
});

test('listCaseDeps: C-04b no depende de C-04 condicional', () => {
  const parsed = parseCasoSection(C04B);
  assert.deepEqual(parsed.dependsOn, []);
});

test('listCaseDeps: C-05 depende de C-04', () => {
  assert.deepEqual(listCaseDeps('C-04 (contacto open)', 'C-05'), ['C-04']);
  const parsed = parseCasoSection(C05);
  assert.deepEqual(parsed.dependsOn, ['C-04']);
  assert.equal(parsed.mcpSteps.length, 2);
});

test('parseMcpSteps ignora prosa sin backticks de tool', () => {
  assert.deepEqual(parseMcpSteps('Repetir observe cada 5 s'), []);
});
