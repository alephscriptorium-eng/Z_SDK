/**
 * WP-U266 · Un puerto mal formado falla al resolver, no al escuchar.
 *
 * Los siete valores de la tabla son los MEDIDOS punta a punta por la
 * contrarrevision de U181 sobre el codigo anterior, donde `Number.isFinite`
 * los dejaba pasar a todos. Cada fila lleva al lado lo que devolvia entonces,
 * para que se vea que el test no es decorativo.
 *
 * Este fichero prueba la FUNCION. Que el catalogo deje de anunciar se prueba
 * aparte, en `@zeus/mcp-launcher` (`catalogo-puerto-mal-formado.test.mjs`),
 * porque probar la funcion no es probar el camino.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  readEnvPort,
  validarPuerto,
  ZeusPortConfigError,
  ZEUS_PORT_ERROR_CODE,
  loadZeusEnv,
  resetZeusEnvLoader,
  resolveZeusUiPorts,
  resolveSpecToolPorts
} from '../src/env/index.mjs';

const VAR = 'ZEUS_PORT_EDITOR';

/** Los siete medidos, con lo que devolvia el codigo anterior. */
const MAL_FORMADOS = [
  { raw: '0', antes: 0, motivo: /fuera de rango/ },
  { raw: '-1', antes: -1, motivo: /entero decimal/ },
  { raw: '65536', antes: 65536, motivo: /fuera de rango/ },
  { raw: '3.5', antes: 3.5, motivo: /entero decimal/ },
  { raw: '0x10', antes: 16, motivo: /entero decimal/ },
  { raw: '  ', antes: 0, motivo: /entero decimal/ },
  { raw: '03012', antes: 3012, motivo: /ceros a la izquierda/ }
];

/** Los legitimos, que deben seguir pasando exactamente igual que antes. */
const LEGITIMOS = [
  { raw: '1', esperado: 1 },
  { raw: '80', esperado: 80 },
  { raw: '3012', esperado: 3012 },
  { raw: '14012', esperado: 14012 },
  { raw: '65535', esperado: 65535 }
];

/**
 * Corre `fn` con `VAR` puesto a `raw` y restaura el entorno despues.
 * @param {string|undefined} raw
 * @param {() => void} fn
 */
function conVar(raw, fn) {
  const prev = process.env[VAR];
  try {
    if (raw === undefined) delete process.env[VAR];
    else process.env[VAR] = raw;
    fn();
  } finally {
    if (prev === undefined) delete process.env[VAR];
    else process.env[VAR] = prev;
  }
}

test('U266 · los siete valores medidos lanzan, y no devuelven el defecto', () => {
  for (const { raw, antes, motivo } of MAL_FORMADOS) {
    conVar(raw, () => {
      assert.throws(
        () => readEnvPort(VAR, 3012),
        (err) => {
          assert.ok(err instanceof ZeusPortConfigError, `${JSON.stringify(raw)}: tipo`);
          assert.equal(err.code, ZEUS_PORT_ERROR_CODE, `${JSON.stringify(raw)}: code`);
          assert.equal(err.envVar, VAR);
          assert.equal(err.rawValue, raw);
          assert.match(err.motivo, motivo, `${JSON.stringify(raw)}: motivo`);
          // El mensaje nombra la variable y el valor: sin eso el operador no
          // sabe cual de las 67 claves del .env.example esta mal.
          assert.match(err.message, new RegExp(VAR));
          assert.ok(err.message.includes(JSON.stringify(raw)));
          return true;
        },
        `${JSON.stringify(raw)} deberia lanzar (antes devolvia ${antes})`
      );
    });
  }
});

test('U266 · los legitimos siguen pasando, sin cambio de valor', () => {
  for (const { raw, esperado } of LEGITIMOS) {
    conVar(raw, () => {
      assert.equal(readEnvPort(VAR, 3012), esperado, JSON.stringify(raw));
    });
  }
});

test('U266 · "sin configurar" NO es un error: ausente y cadena vacia dan el defecto', () => {
  conVar(undefined, () => {
    assert.equal(readEnvPort(VAR, 3012), 3012, 'clave ausente');
  });
  conVar('', () => {
    assert.equal(readEnvPort(VAR, 3012), 3012, 'cadena vacia');
  });
});

test('U266 · un valor con espacios NO se recorta al defecto en silencio', () => {
  // Si se hiciera `trim`, "  " caeria en "" y devolveria 3012 tan campante:
  // ese es justo el falso verde que este WP prohibe. Y " 3012 " tampoco pasa.
  for (const raw of ['  ', ' 3012 ', '3012 ', '\t3012']) {
    conVar(raw, () => {
      assert.throws(() => readEnvPort(VAR, 3012), { code: ZEUS_PORT_ERROR_CODE }, JSON.stringify(raw));
    });
  }
});

test('U266 · validarPuerto es puro: no mira el entorno', () => {
  for (const { raw } of MAL_FORMADOS) {
    assert.equal(validarPuerto(raw).ok, false, JSON.stringify(raw));
  }
  for (const { raw, esperado } of LEGITIMOS) {
    assert.deepEqual(validarPuerto(raw), { ok: true, value: esperado }, JSON.stringify(raw));
  }
});

test('U266 · el limite del rango, por los dos lados', () => {
  assert.equal(validarPuerto('1').ok, true);
  assert.equal(validarPuerto('65535').ok, true);
  assert.equal(validarPuerto('0').ok, false);
  assert.equal(validarPuerto('65536').ok, false);
});

test('U266 · el error viaja por `code`, no por `instanceof`', () => {
  // Con copias duplicadas del paquete en el monorepo, `instanceof` falla entre
  // instancias distintas del modulo; el `code` es lo que puede comprobar un
  // consumidor de fuera (lo hace `mcp-launcher/src/catalog.mjs`).
  conVar('0', () => {
    try {
      readEnvPort(VAR, 3012);
      assert.fail('deberia haber lanzado');
    } catch (err) {
      assert.equal(err.code, 'ZEUS_PUERTO_MAL_FORMADO');
    }
  });
});

test('U266 · los resolvers de arriba propagan, no se comen el error', () => {
  // resolveZeusUiPorts -> applyEnvToUis -> readEnvPort
  conVar('0', () => {
    assert.throws(() => resolveZeusUiPorts(), { code: ZEUS_PORT_ERROR_CODE });
  });
  // resolveSpecToolPorts -> readEnvPort (otra familia de claves)
  const prev = process.env.ZEUS_PORT_DOCS;
  try {
    process.env.ZEUS_PORT_DOCS = '65536';
    assert.throws(() => resolveSpecToolPorts(), { code: ZEUS_PORT_ERROR_CODE });
  } finally {
    if (prev === undefined) delete process.env.ZEUS_PORT_DOCS;
    else process.env.ZEUS_PORT_DOCS = prev;
  }
});

test('U266 · precedencia: con .env y variable de proceso a la vez, gana el proceso', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u266-precedencia-'));
  const prev = process.env[VAR];
  try {
    fs.writeFileSync(path.join(tempRoot, '.env'), `${VAR}=14012\n`, 'utf8');

    // 1 · solo .env -> manda el .env
    delete process.env[VAR];
    resetZeusEnvLoader();
    loadZeusEnv(tempRoot);
    assert.equal(readEnvPort(VAR, 3012), 14012, 'solo .env');

    // 2 · .env + proceso -> manda el proceso (dotenv sin `override`)
    delete process.env[VAR];
    resetZeusEnvLoader();
    process.env[VAR] = '15012';
    loadZeusEnv(tempRoot);
    assert.equal(readEnvPort(VAR, 3012), 15012, '.env=14012 + proceso=15012 -> 15012');
  } finally {
    if (prev === undefined) delete process.env[VAR];
    else process.env[VAR] = prev;
    resetZeusEnvLoader();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('U266 · un valor mal formado en el .env tambien aborta', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u266-env-malo-'));
  const prev = process.env[VAR];
  try {
    fs.writeFileSync(path.join(tempRoot, '.env'), `${VAR}=03012\n`, 'utf8');
    delete process.env[VAR];
    resetZeusEnvLoader();
    loadZeusEnv(tempRoot);
    assert.throws(() => readEnvPort(VAR, 3012), { code: ZEUS_PORT_ERROR_CODE });
  } finally {
    if (prev === undefined) delete process.env[VAR];
    else process.env[VAR] = prev;
    resetZeusEnvLoader();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
