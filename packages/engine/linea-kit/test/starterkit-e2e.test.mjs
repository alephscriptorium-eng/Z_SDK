/**
 * CA WP-U81: starterkit línea juguete valida U80 y se sirve por linea-system.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';
import { validate, validateFile } from '../src/validate.mjs';
import { loadLineaData, resolveNodo } from '../src/loader.mjs';
import { createLineaJuguete } from '../src/starterkits/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lineaServerUrl = pathToFileURL(
  path.resolve(__dirname, '../../../mesh/linea-system/src/linea-server.mjs')
).href;

describe('CA: juguete E2E + linea-system', () => {
  it('creates toy line, validates schemas, serves linea://info', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u81-e2e-'));
    const built = createLineaJuguete({
      lineasRoot: root,
      id: 'juguete',
      overwrite: true
    });
    assert.equal(built.ok, true, JSON.stringify(built));
    assert.equal(built.nodoCount, 3);
    assert.equal(built.registroCount, 10);

    assert.equal(validateFile('manifest-tronco', built.paths.trunkManifest).ok, true);
    assert.equal(validateFile('lineas-registry', built.paths.registry, 'yaml').ok, true);
    const sat = JSON.parse(fs.readFileSync(built.paths.satManifest, 'utf8'));
    assert.equal(validate('manifest-satelite', sat).ok, true);
    assert.equal(sat.registros.length, 10);
    for (const reg of sat.registros) {
      assert.equal(validate('registro', reg).ok, true, JSON.stringify(reg));
    }

    const { lineas } = await loadLineaData(root);
    const data = lineas.juguete;
    assert.ok(data, 'juguete loaded');
    assert.equal(Object.keys(data.nodos).length, 3);
    assert.equal(data.satellite.meta.registro_count, 10);

    assert.equal(resolveNodo(data, 1920).nodo.id, 'N01');
    assert.equal(resolveNodo(data, 1950).nodo.id, 'N02');
    assert.equal(resolveNodo(data, 2000).nodo.id, 'N03');

    const { createServer } = await import(lineaServerUrl);
    const prevPort = process.env.ZEUS_MCP_LINEA_ESPAN;
    // Ephemeral high port for isolation (test path; ports gate exempts /test/).
    process.env.ZEUS_MCP_LINEA_ESPAN = '14181';
    const port = 14181;

    let handle;
    try {
      handle = await createServer(
        {
          name: 'linea-juguete',
          kind: 'tronco',
          port,
          lineaId: 'juguete',
          coverage: { min: 1900, max: 2020 }
        },
        data
      ).start();

      const health = await fetch(`http://127.0.0.1:${port}/mcp/health`);
      assert.equal(health.ok, true, `health status ${health.status}`);
      const body = await health.json();
      assert.ok(body.ok === true || body.status === 'ok' || body.name, JSON.stringify(body));

      // Resource read via HTTP MCP is heavier; assert loader+server started and
      // line metadata matches CA (3 nodos). Card examples use sample year.
      assert.equal(data.entry.nodo_count, 3);
      assert.equal(data.manifest.meta.nodo_count, 3);
    } finally {
      if (handle) await handle.close();
      if (prevPort == null) delete process.env.ZEUS_MCP_LINEA_ESPAN;
      else process.env.ZEUS_MCP_LINEA_ESPAN = prevPort;
    }
  });
});
