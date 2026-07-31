/**
 * WP-U227 · CA de regeneración del env de la demo.
 *
 * - Añadir un servicio al mapa env → el fichero generado lo incluye sin
 *   edición manual (CA 4).
 * - Byte-reproducible: regenerar sobre la propia salida no cambia un byte
 *   (CA 2).
 * - Cobertura dura: ninguna clave del contenido anterior se pierde; las no
 *   cubiertas por la fuente única se preservan tal cual (CA 3).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderEnvExample,
  missingKeys,
  extractEnvKeys,
  GENERATED_HEADER,
  NO_GENERATED_MARKER
} from '../src/env/generate-env.mjs';
import { DEFAULT_ZEUS_MCP, MCP_PORT_ENV } from '../src/env/index.mjs';

test('genera desde la fuente única: cabecera + slot ciudad-lifecycle', () => {
  const out = renderEnvExample();
  assert.ok(out.startsWith(GENERATED_HEADER));
  assert.match(out, /^ZEUS_MCP_CIUDAD_LIFECYCLE=3051\b.*# ciudadLifecycle\.disk$/m);
  assert.ok(out.includes(NO_GENERATED_MARKER));
});

test('CA 4: añadir un servicio al mapa env aparece sin edición manual', () => {
  const mcp = structuredClone(DEFAULT_ZEUS_MCP);
  mcp.sintetico = { disk: 9999 };
  const mcpEnv = { ...MCP_PORT_ENV, 'sintetico.disk': 'ZEUS_MCP_SINTETICO' };

  const sin = renderEnvExample();
  assert.ok(!sin.includes('ZEUS_MCP_SINTETICO'));

  // Sin fichero previo: entra activo con su default y su procedencia.
  const out = renderEnvExample({ mcp, mcpEnv });
  assert.match(out, /^ZEUS_MCP_SINTETICO=9999\b.*# sintetico\.disk$/m);

  // Sobre un fichero previo que no lo tenía: entra comentado (no altera el
  // contrato de cobertura del .env del operador), pero entra — sin editar
  // nada a mano.
  const conPrevio = renderEnvExample({ mcp, mcpEnv, previousContent: sin });
  assert.match(conPrevio, /^# ZEUS_MCP_SINTETICO=9999\b.*# sintetico\.disk$/m);

  // Si el operador ya lo activó, la regeneración lo respeta activo.
  const activado = renderEnvExample({
    mcp,
    mcpEnv,
    previousContent: conPrevio.replace('# ZEUS_MCP_SINTETICO=9999', 'ZEUS_MCP_SINTETICO=9999')
  });
  assert.match(activado, /^ZEUS_MCP_SINTETICO=9999\b/m);
});

test('mapa env sin default en la fuente única = error honesto', () => {
  const mcpEnv = { ...MCP_PORT_ENV, 'fantasma.disk': 'ZEUS_MCP_FANTASMA' };
  assert.throws(() => renderEnvExample({ mcpEnv }), /fantasma\.disk/);
});

test('CA 2: byte-reproducible — regenerar sobre la salida es identidad', () => {
  const run1 = renderEnvExample({ previousContent: 'ZEUS_HOST=localhost\n' });
  const run2 = renderEnvExample({ previousContent: run1 });
  const run3 = renderEnvExample({ previousContent: run2 });
  assert.equal(run2, run1);
  assert.equal(run3, run2);
});

test('CA 3: cobertura dura — claves no cubiertas se preservan tal cual', () => {
  const previo = [
    '# contexto del operador',
    'ZEUS_HOST=localhost',
    '',
    '# Secretos del despliegue (no puertos)',
    'ZEUS_SECRETO_OPERADOR=cambia-esto',
    '# ZEUS_FLAG_OPCIONAL=1  # opt-in',
    ''
  ].join('\n');

  const out = renderEnvExample({ previousContent: previo });
  assert.deepEqual(missingKeys(previo, out), []);

  const marker = out.indexOf(NO_GENERATED_MARKER);
  assert.ok(marker !== -1);
  const preservada = out.slice(marker);
  assert.ok(preservada.includes('# Secretos del despliegue (no puertos)'));
  assert.ok(preservada.includes('ZEUS_SECRETO_OPERADOR=cambia-esto'));
  assert.ok(preservada.includes('# ZEUS_FLAG_OPCIONAL=1  # opt-in'));

  // CRLF de entrada no rompe ni la cobertura ni la reproducibilidad.
  const outCrlf = renderEnvExample({ previousContent: previo.replace(/\n/g, '\r\n') });
  assert.equal(outCrlf, out);

  // Sin duplicados: la clave generada no reaparece en la sección preservada.
  assert.equal(out.match(/^#? ?ZEUS_HOST=/gm).length, 1);
});

test('estado activo/comentado se hereda del fichero anterior', () => {
  const previo = 'ZEUS_PORT_EDITOR=3012\n# ZEUS_PORT_PLAYER=3013\n';
  const out = renderEnvExample({ previousContent: previo });
  assert.match(out, /^ZEUS_PORT_EDITOR=3012\b/m);
  assert.match(out, /^# ZEUS_PORT_PLAYER=3013\b/m);
  // Clave generada nunca vista antes → comentada (no altera el contrato
  // de cobertura del .env del operador).
  assert.match(out, /^# ZEUS_MCP_CIUDAD_LIFECYCLE=3051\b/m);
  assert.equal(extractEnvKeys(out).includes('ZEUS_MCP_CIUDAD_LIFECYCLE'), true);
});
