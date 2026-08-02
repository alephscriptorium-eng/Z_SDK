/**
 * WP-U266 · El catalogo no anuncia un puerto donde no escucha nadie.
 *
 * Probar `readEnvPort` no prueba el camino: la validacion vive en
 * `@zeus/presets-sdk`, pero el catalogo tenia dos `catch` mudos
 * (`syncEnvPorts` / `syncUiPorts`) que se comian el error y devolvian los
 * puertos POR DEFECTO. Medido antes del arreglo, con `ZEUS_MCP_SUN=0`:
 *
 *     resolveCatalog() -> solar-sun port = 4101   (el 0 desaparecia)
 *
 * Eso es peor que el defecto original, porque el original fallaba ruidosamente
 * y esto arrancaba verde escuchando en otro sitio. De ahi que la guarda este en
 * los dos sitios y que este fichero ejerza el camino, no la funcion.
 *
 * Cada caso corre en un PROCESO HIJO a proposito: con la configuracion mal
 * formada, `catalog.mjs` revienta ya en el import (`PORT_TABLE` se construye a
 * nivel de modulo), asi que no se puede observar desde dentro del mismo
 * proceso. El hijo tambien nos da el codigo de salida, que es lo que de verdad
 * significa "falla al arrancar".
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
// `import()` dentro del hijo necesita una URL file://: en Windows una ruta
// absoluta "C:\..." da ERR_UNSUPPORTED_ESM_URL_SCHEME y el hijo muere ANTES de
// llegar al catalogo — con codigo 1, que es el mismo que esperamos del fallo
// bueno. Por eso los asertos miran el mensaje y no solo el codigo de salida.
const CATALOGO = pathToFileURL(path.join(AQUI, '..', 'src', 'catalog.mjs')).href;

/**
 * Resuelve una entrada del catalogo en un proceso hijo.
 * @param {Record<string,string>} env
 * @param {string} id
 * @returns {{ rc: number, salida: string }}
 */
function resolverEnHijo(env, id) {
  const guion = `
    import(${JSON.stringify(CATALOGO)}).then((m) => {
      const e = m.resolveCatalog().find((x) => x.id === ${JSON.stringify(id)});
      console.log('ANUNCIA ' + e.port + ' ' + e.healthUrl);
      process.exit(0);
    }).catch((err) => {
      console.log('ABORTA ' + (err && err.code ? err.code : 'sin-code'));
      process.exit(1);
    });
  `;
  try {
    const salida = execFileSync(process.execPath, ['--input-type=module', '-e', guion], {
      env: { ...process.env, ...env },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { rc: 0, salida: salida.trim() };
  } catch (err) {
    return { rc: err.status ?? -1, salida: String(err.stdout || '').trim() };
  }
}

/** Los siete medidos, por la familia UI (ZEUS_PORT_*). */
const SIETE = ['0', '-1', '65536', '3.5', '0x10', '  ', '03012'];

test('U266 · los siete valores abortan el catalogo y no anuncian nada (familia UI)', () => {
  for (const raw of SIETE) {
    const { rc, salida } = resolverEnHijo({ ZEUS_PORT_EDITOR: raw }, 'editor-ui');
    assert.equal(rc, 1, `${JSON.stringify(raw)}: codigo de salida`);
    assert.match(salida, /^ABORTA ZEUS_PUERTO_MAL_FORMADO$/m, `${JSON.stringify(raw)}: motivo`);
    assert.doesNotMatch(salida, /ANUNCIA/, `${JSON.stringify(raw)}: no debe anunciar`);
  }
});

test('U266 · los siete valores abortan tambien por la familia MCP (la que se tragaba el error)', () => {
  // Esta es la que importa: antes del arreglo, `syncEnvPorts` capturaba y
  // devolvia FALLBACK_MCP_PORTS, asi que el catalogo anunciaba 4101 en verde.
  for (const raw of SIETE) {
    const { rc, salida } = resolverEnHijo({ ZEUS_MCP_SUN: raw }, 'solar-sun');
    assert.equal(rc, 1, `${JSON.stringify(raw)}: codigo de salida`);
    assert.match(salida, /^ABORTA ZEUS_PUERTO_MAL_FORMADO$/m, `${JSON.stringify(raw)}: motivo`);
    assert.doesNotMatch(salida, /4101/, `${JSON.stringify(raw)}: no debe caer al defecto`);
  }
});

test('U266 · un override legitimo sigue anunciandose, en las dos familias', () => {
  const ui = resolverEnHijo({ ZEUS_PORT_EDITOR: '14012' }, 'editor-ui');
  assert.equal(ui.rc, 0, 'UI: codigo de salida');
  assert.match(ui.salida, /^ANUNCIA 14012 http:\/\/localhost:14012\//m);

  const mcp = resolverEnHijo({ ZEUS_MCP_SUN: '4999' }, 'solar-sun');
  assert.equal(mcp.rc, 0, 'MCP: codigo de salida');
  assert.match(mcp.salida, /^ANUNCIA 4999 /m);
});

test('U266 · sin override, el catalogo anuncia los defectos de siempre', () => {
  const ui = resolverEnHijo({ ZEUS_PORT_EDITOR: '' }, 'editor-ui');
  assert.equal(ui.rc, 0);
  assert.match(ui.salida, /^ANUNCIA 3012 /m);

  const mcp = resolverEnHijo({ ZEUS_MCP_SUN: '' }, 'solar-sun');
  assert.equal(mcp.rc, 0);
  assert.match(mcp.salida, /^ANUNCIA 4101 /m);
});

test('U266 · el puerto anunciado nunca es 0 ni sale de 1..65535', () => {
  // Barrido sobre TODO el catalogo con la configuracion por defecto: el
  // denominador es el numero de entradas, no una muestra.
  const guion = `
    import(${JSON.stringify(CATALOGO)}).then((m) => {
      const c = m.resolveCatalog();
      console.log(JSON.stringify(c.map((e) => [e.id, e.port])));
      process.exit(0);
    });
  `;
  const salida = execFileSync(process.execPath, ['--input-type=module', '-e', guion], {
    encoding: 'utf8'
  });
  const entradas = JSON.parse(salida.trim());
  assert.ok(entradas.length > 0, 'el catalogo no puede estar vacio');
  for (const [id, port] of entradas) {
    assert.ok(Number.isInteger(port), `${id}: ${port} no es entero`);
    assert.ok(port >= 1 && port <= 65535, `${id}: ${port} fuera de 1..65535`);
  }
  console.log(`      (entradas comprobadas: ${entradas.length})`);
});
