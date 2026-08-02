/**
 * WP-U266 · La ruta de BIND aborta con un puerto mal formado.
 *
 * `app-shell` es por donde pasan las UIs para decidir en que puerto escuchan:
 *   createAppConfig -> resolveRuntimeConfig -> resolveAppPort -> readEnvPort
 *
 * Medido en la ficha: con `ZEUS_PORT_EDITOR=0` el catalogo anunciaba `0` y el
 * bind real caia en un puerto efimero (56206/59282 segun la corrida), asi que
 * `health` daba 200 en el real y `fetch failed` en el anunciado. Aqui se fija
 * el lado del bind: si el valor esta mal formado no se llega a escuchar.
 *
 * Este fichero vive en `@zeus/app-shell` a proposito: es uno de los workspaces
 * de la matriz de CI, asi que este lado del criterio queda con gate. El lado
 * del catalogo se prueba en `@zeus/mcp-launcher`, que hoy NO esta en la matriz
 * (ver el reporte de U266, "limites no cerrados").
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import { createAppConfig } from '../src/create-app-config.mjs';

/** Los siete valores medidos por la contrarrevision de U181. */
const SIETE = ['0', '-1', '65536', '3.5', '0x10', '  ', '03012'];

/**
 * @param {string|undefined} raw
 * @param {() => void} fn
 */
function conPuertoEditor(raw, fn) {
  const prev = process.env.ZEUS_PORT_EDITOR;
  resetZeusEnvLoader();
  try {
    if (raw === undefined) delete process.env.ZEUS_PORT_EDITOR;
    else process.env.ZEUS_PORT_EDITOR = raw;
    fn();
  } finally {
    if (prev === undefined) delete process.env.ZEUS_PORT_EDITOR;
    else process.env.ZEUS_PORT_EDITOR = prev;
    resetZeusEnvLoader();
  }
}

/** Un app-shell minimo con el appId 'editor' (lee ZEUS_PORT_EDITOR). */
function construirConfig() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'u266-bind-'));
  const srcDir = path.join(tempDir, 'src');
  fs.mkdirSync(srcDir);
  const configUrl = pathToFileURL(path.join(srcDir, 'config.mjs')).href;
  try {
    const { getConfig } = createAppConfig({
      appId: 'editor',
      defaultPort: 3012,
      importMetaUrl: configUrl,
      skipConfigFile: true
    });
    return getConfig();
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

test('U266 · los siete valores impiden resolver el puerto de escucha', () => {
  for (const raw of SIETE) {
    conPuertoEditor(raw, () => {
      assert.throws(
        () => construirConfig(),
        { code: 'ZEUS_PUERTO_MAL_FORMADO' },
        `${JSON.stringify(raw)} deberia abortar el bind`
      );
    });
  }
});

test('U266 · un override legitimo sigue dando el puerto de escucha', () => {
  conPuertoEditor('14012', () => {
    assert.equal(construirConfig().server.port, 14012);
  });
});

test('U266 · sin override, el bind cae en el defecto de siempre', () => {
  conPuertoEditor(undefined, () => {
    assert.equal(construirConfig().server.port, 3012);
  });
  conPuertoEditor('', () => {
    assert.equal(construirConfig().server.port, 3012);
  });
});

test('U266/M-b · un puerto mal formado en el config.json de la app tambien aborta', () => {
  // Un fichero de configuracion ES configuracion. Esta via entraba cruda:
  // `{"server":{"port":0}}` daba `server.port = 0` (medido; igual -1 y 70000).
  // Hoy no la alcanza ninguna app real —ninguno de los seis src/config.json
  // declara `server`— pero la puerta estaba abierta y la garantia la nombra.
  for (const malo of [0, -1, 70000, 3.5]) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'u266-cfgjson-'));
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(srcDir);
    fs.writeFileSync(
      path.join(srcDir, 'config.json'),
      JSON.stringify({ server: { port: malo } }),
      'utf8'
    );
    const configUrl = pathToFileURL(path.join(srcDir, 'config.mjs')).href;
    try {
      conPuertoEditor(undefined, () => {
        assert.throws(
          () =>
            createAppConfig({
              appId: 'sinSlotDeMesh',
              importMetaUrl: configUrl
            }).getConfig(),
          { code: 'ZEUS_PUERTO_MAL_FORMADO' },
          `config.json server.port=${malo} deberia abortar`
        );
      });
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('U266/M-b · un config.json con puerto legitimo sigue funcionando', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'u266-cfgjson-ok-'));
  const srcDir = path.join(tempDir, 'src');
  fs.mkdirSync(srcDir);
  fs.writeFileSync(
    path.join(srcDir, 'config.json'),
    JSON.stringify({ server: { port: 4444 } }),
    'utf8'
  );
  const configUrl = pathToFileURL(path.join(srcDir, 'config.mjs')).href;
  try {
    conPuertoEditor(undefined, () => {
      const cfg = createAppConfig({ appId: 'sinSlotDeMesh', importMetaUrl: configUrl }).getConfig();
      assert.equal(cfg.server.port, 4444);
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('U266 · el puerto de escucha resuelto nunca es 0', () => {
  // El 0 es el vector que abrio la ficha: `listen(0)` pide puerto efimero, y
  // ahi es donde el anunciado y el real se separaban.
  conPuertoEditor('0', () => {
    assert.throws(() => construirConfig(), { code: 'ZEUS_PUERTO_MAL_FORMADO' });
  });
  conPuertoEditor(undefined, () => {
    assert.notEqual(construirConfig().server.port, 0);
  });
});
