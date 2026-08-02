/**
 * WP-U253c · Entrada del proceso HIJO de la sonda por hooks.
 *
 * Vive en un proceso aparte por una razón dura: `module.register()` sólo
 * gobierna lo que se resuelve DESPUÉS de registrarse, y `export.test.mjs`
 * importa `../src/export.mjs` de forma estática, es decir antes de que ninguna
 * línea de su cuerpo corra. Registrar los hooks dentro de la suite llegaría
 * tarde. Aquí no: el objetivo entra por `import()` dinámico al final.
 *
 * Orden, y ninguna pieza es opcional:
 *   1. capturar las primitivas ORIGINALES (para poder volcar el resultado sin
 *      que el volcado se anote a sí mismo);
 *   2. instalar el canal en `globalThis`;
 *   3. `register()` los hooks ESM  → cubre named / namespace / default / promises;
 *   4. parchear el objeto CJS `fs` → cubre `createRequire(...)('fs')`, que los
 *      hooks ESM NO ven;
 *   5. importar y ejecutar el objetivo;
 *   6. volcar el parte con las primitivas originales del paso 1.
 *
 * Uso:  node correr.mjs <modo> <ficheroParte> [args…]
 *   modo `export`      args: <volumesRoot> <logPath>
 *   modo `notaciones`  args: <dirVictimas> <dirDestino>
 *
 * El parte es JSON: { ok, error, destinos: [{ origen, prim, destino }] }.
 * `destino` va resuelto a absoluto cuando es una ruta; si la primitiva recibió
 * algo que no es una ruta (un descriptor, una URL), se anota su `String(...)`
 * tal cual y se declara ahí mismo — falsear una ruta sería peor que no tenerla.
 */

import { createRequire } from 'node:module';
import { register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import nodePath from 'node:path';

const require = createRequire(import.meta.url);
const fsReal = require('fs');
// Paso 1 · originales, ANTES de tocar nada.
const escribeParte = fsReal.writeFileSync.bind(fsReal);
const leeDir = fsReal.readdirSync.bind(fsReal);

const [modo, ficheroParte, ...resto] = process.argv.slice(2);
const AQUI = nodePath.dirname(fileURLToPath(import.meta.url));

/** @type {{ origen: string, prim: string, destino: string }[]} */
const destinos = [];
const aResoluble = (v) =>
  typeof v === 'string' || v instanceof URL || Buffer.isBuffer(v) ? String(v) : null;

// Paso 2 · el canal. Los hooks sintetizan código que llama exactamente a esto.
globalThis.__ZEUS_SONDA_FS = {
  anota(origen, prim, objetivo) {
    const crudo = aResoluble(objetivo);
    destinos.push({
      origen,
      prim,
      destino: crudo === null ? `<no-ruta:${typeof objetivo}>` : nodePath.resolve(crudo)
    });
  }
};

// Paso 3 · hooks ESM.
register('./hooks-fs.mjs', import.meta.url);

// Paso 4 · el objeto CJS, que los hooks ESM no gobiernan. Se registra con la
// primitiva ORIGINAL, no con la envuelta: si llamara a la envuelta, el propio
// registro se anotaría en bucle.
const PRIMITIVAS_CJS = [
  'writeFileSync',
  'appendFileSync',
  'createWriteStream',
  'rmSync',
  'unlinkSync',
  'renameSync',
  'copyFileSync',
  'truncateSync'
];
for (const nombre of PRIMITIVAS_CJS) {
  const original = fsReal[nombre];
  if (typeof original !== 'function') continue;
  fsReal[nombre] = function (...args) {
    globalThis.__ZEUS_SONDA_FS.anota('cjs', nombre, args[0]);
    return original.apply(this, args);
  };
}

let ok = true;
let error = null;
try {
  if (modo === 'export') {
    // Paso 5 · el objetivo entra AHORA, ya bajo los hooks.
    const [volumesRoot, logPath] = resto;
    const { exportSsbLogFile } = await import(
      pathToFileURL(nodePath.join(AQUI, '..', '..', 'src', 'export.mjs')).href
    );
    const r = exportSsbLogFile({ logPath, volumesRoot, provenance: { fixture: true } });
    ok = r.ok !== false;
    if (!ok) error = String(r.error);
  } else if (modo === 'notaciones') {
    const [dirVictimas, dirDestino] = resto;
    const victimas = leeDir(dirVictimas)
      .filter((n) => /^victima-.+\.mjs$/.test(n))
      .sort();
    for (const v of victimas) {
      const mod = await import(pathToFileURL(nodePath.join(dirVictimas, v)).href);
      await mod.escribe(nodePath.join(dirDestino, `${v.replace(/\.mjs$/, '')}.txt`));
    }
  } else {
    throw new Error(`modo desconocido: ${modo}`);
  }
} catch (e) {
  ok = false;
  error = e && e.stack ? e.stack : String(e);
}

// Paso 6 · volcado con la primitiva original: no aparece en `destinos`.
escribeParte(ficheroParte, JSON.stringify({ ok, error, destinos }, null, 2), 'utf8');
