/**
 * WP-U266 · `socket-server` resuelve su puerto por la fuente unica.
 *
 * Este fichero existe porque la contrarrevision encontro el hueco: la
 * validacion vivia en `readEnvPort` y este servidor **no la llamaba**. Hacia
 * `Number(process.env.ZEUS_PORT_SCRIPTORIUM ?? …)` a mano, asi que los siete
 * vectores de la ficha seguian intactos aqui. Medido por su entrypoint
 * documentado antes del arreglo:
 *
 *     ZEUS_PORT_SCRIPTORIUM=0 node src/index.mjs
 *     -> Scriptorium server on http://localhost:55519/runtime   ·  rc=0, VERDE
 *
 * Y `ZEUS_PORT_SCRIPTORIUM` esta en `.env.example`, bajo la cabecera que
 * promete que un valor mal formado aborta el arranque. Documentacion que miente
 * es peor que el silencio anterior.
 *
 * La distincion que este fichero fija —y que NO es una inconsistencia— es entre
 * el puerto que viene del ENTORNO (configuracion: se valida) y el que viene por
 * `options.port` (codigo pidiendo un puerto efimero: no se valida). Seis
 * llamadas de esta misma suite usan `{ port: 0 }` a proposito.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveConfig } from '../src/config.mjs';
import { DEFAULT_ZEUS_UI_MESH, resetZeusEnvLoader } from '@zeus/presets-sdk/env';

/** Los siete valores medidos por la contrarrevision de U181. */
const SIETE = ['0', '-1', '65536', '3.5', '0x10', '  ', '03012'];

const CLAVES = ['ZEUS_PORT_SCRIPTORIUM', 'ZEUS_SCRIPTORIUM_PORT'];

/**
 * @param {Record<string, string|undefined>} vars
 * @param {() => void} fn
 */
function conEntorno(vars, fn) {
  const prev = {};
  for (const k of CLAVES) prev[k] = process.env[k];
  resetZeusEnvLoader();
  try {
    for (const k of CLAVES) delete process.env[k];
    for (const [k, v] of Object.entries(vars)) {
      if (v !== undefined) process.env[k] = v;
    }
    fn();
  } finally {
    for (const k of CLAVES) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
    resetZeusEnvLoader();
  }
}

test('U266 · los siete valores abortan la resolucion del puerto', () => {
  for (const raw of SIETE) {
    conEntorno({ ZEUS_PORT_SCRIPTORIUM: raw }, () => {
      assert.throws(
        () => resolveConfig(),
        { code: 'ZEUS_PUERTO_MAL_FORMADO' },
        `${JSON.stringify(raw)} deberia abortar`
      );
    });
  }
});

test('U266 · el alias legado ZEUS_SCRIPTORIUM_PORT tambien se valida', () => {
  for (const raw of SIETE) {
    conEntorno({ ZEUS_SCRIPTORIUM_PORT: raw }, () => {
      assert.throws(() => resolveConfig(), { code: 'ZEUS_PUERTO_MAL_FORMADO' }, JSON.stringify(raw));
    });
  }
});

test('U266 · gana la clave canonica, y solo se valida la que gana', () => {
  // La canonica buena tapa a un alias legado mal escrito: un alias que NO se
  // lee no debe tumbar un arranque.
  conEntorno({ ZEUS_PORT_SCRIPTORIUM: '13017', ZEUS_SCRIPTORIUM_PORT: 'basura' }, () => {
    assert.equal(resolveConfig().port, 13017);
  });
  // Y al reves: si la que gana esta mal, no se tapa con el alias bueno.
  conEntorno({ ZEUS_PORT_SCRIPTORIUM: '0', ZEUS_SCRIPTORIUM_PORT: '13017' }, () => {
    assert.throws(() => resolveConfig(), { code: 'ZEUS_PUERTO_MAL_FORMADO' });
  });
});

test('U266 · los legitimos y el "sin configurar" siguen igual', () => {
  for (const raw of ['1', '3017', '13017', '65535']) {
    conEntorno({ ZEUS_PORT_SCRIPTORIUM: raw }, () => {
      assert.equal(resolveConfig().port, Number(raw), JSON.stringify(raw));
    });
  }
  conEntorno({}, () => {
    assert.equal(resolveConfig().port, DEFAULT_ZEUS_UI_MESH.scriptorium.port);
  });
  conEntorno({ ZEUS_PORT_SCRIPTORIUM: '' }, () => {
    assert.equal(resolveConfig().port, DEFAULT_ZEUS_UI_MESH.scriptorium.port);
  });
});

test('U266 · `{ port: 0 }` explicito SIGUE siendo puerto efimero', () => {
  // No es una excepcion a la regla: es la otra cara. `0` en codigo es "dame un
  // efimero" (seis llamadas de esta suite lo usan); `ZEUS_PORT_SCRIPTORIUM=0`
  // es configuracion mal formada. Si esto se rompiera, la suite entera caeria.
  conEntorno({}, () => {
    assert.equal(resolveConfig({ port: 0 }).port, 0);
  });
  // Y el explicito gana incluso con el entorno mal formado: no llega a leerse.
  conEntorno({ ZEUS_PORT_SCRIPTORIUM: '0x10' }, () => {
    assert.equal(resolveConfig({ port: 0 }).port, 0);
  });
});
