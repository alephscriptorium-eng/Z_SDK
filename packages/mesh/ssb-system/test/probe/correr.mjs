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
 *   modo `listas`      args: (ninguno) — sólo declara qué envolvió cada mitad
 *
 * El parte es JSON: { ok, error, modo, destinos: [{ origen, prim, destino }],
 * envueltos: { esm, cjs } }. `envueltos` se mide EN EJECUCIÓN, no leyendo el
 * código: es lo que permite exigir que las dos mitades envuelvan lo mismo.
 * `destino` va resuelto a absoluto cuando es una ruta; si la primitiva recibió
 * algo que no es una ruta (un descriptor, una URL), se anota su `String(...)`
 * tal cual y se declara ahí mismo — falsear una ruta sería peor que no tenerla.
 */

import { createRequire } from 'node:module';
import { register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import nodePath from 'node:path';
// FUENTE ÚNICA de la lista. Antes había aquí una copia con 8 nombres frente a
// los 15 de los hooks: las dos mitades de la sonda vigilaban cosas distintas,
// justo lo que la cabecera de `hooks-fs.mjs` advierte que no debe pasar.
import { PRIMITIVAS } from './hooks-fs.mjs';

const require = createRequire(import.meta.url);
const fsReal = require('fs');
// Paso 1 · originales, ANTES de tocar nada.
const escribeParte = fsReal.writeFileSync.bind(fsReal);
const leeDir = fsReal.readdirSync.bind(fsReal);

const [modo, ficheroParte, ...resto] = process.argv.slice(2);
const AQUI = nodePath.dirname(fileURLToPath(import.meta.url));

/** @type {{ origen: string, prim: string, destino: string }[]} */
const destinos = [];
/** Lo que cada mitad declaró haber envuelto. Lo exige `U253c-3e`. */
const envueltos = { esm: {}, cjs: { fs: [], 'fs.promises': [] } };
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
  },
  declara(origen, lista, enPromises) {
    envueltos.esm[origen] = lista;
    if (enPromises && enPromises.length) envueltos.esm[`${origen}.promises`] = enPromises;
  }
};

// Paso 3 · hooks ESM.
register('./hooks-fs.mjs', import.meta.url);

// Paso 4 · el objeto CJS, que los hooks ESM no gobiernan. Se registra con la
// primitiva ORIGINAL, no con la envuelta: si llamara a la envuelta, el propio
// registro se anotaría en bucle. La lista es LA MISMA que la de los hooks —
// importada, no copiada — y cubre también `require('fs').promises`.
const parchea = (obj, nombre, etiqueta, registro) => {
  const original = obj[nombre];
  if (typeof original !== 'function') return;
  obj[nombre] = function (...args) {
    globalThis.__ZEUS_SONDA_FS.anota(etiqueta, nombre, args[0]);
    return original.apply(this, args);
  };
  registro.push(nombre);
};
for (const nombre of PRIMITIVAS) parchea(fsReal, nombre, 'cjs', envueltos.cjs.fs);
// `fsReal.promises` es un getter perezoso; leerlo una vez fija el objeto que
// devolverá siempre, así que parchearlo aquí alcanza a todo el proceso.
const promesasCjs = fsReal.promises;
if (promesasCjs && typeof promesasCjs === 'object') {
  for (const nombre of PRIMITIVAS) {
    parchea(promesasCjs, nombre, 'cjs.promises', envueltos.cjs['fs.promises']);
  }
}

let ok = true;
let error = null;
let volcado = false;
/**
 * Volcar es idempotente y se hace SIEMPRE, incluso si el objetivo llama a
 * `process.exit()`: sin esto el hijo salía con status 0 sin parte, y el
 * llamante reventaba con un `ENOENT` crudo dejando además su temporal
 * huérfano. Se reprodujo; por eso hay `finally` aquí y en `correSonda`.
 */
function vuelca() {
  if (volcado) return;
  volcado = true;
  escribeParte(
    ficheroParte,
    JSON.stringify({ ok, error, modo, destinos, envueltos }, null, 2),
    'utf8'
  );
}
process.on('exit', () => {
  if (!volcado) {
    ok = false;
    error = error ?? 'el objetivo terminó el proceso antes de que la sonda volcara su parte';
    vuelca();
  }
});

try {
  if (modo === 'listas') {
    // Fuerza la síntesis de los dos módulos para que declaren lo que envuelven.
    await import('node:fs');
    await import('node:fs/promises');
  } else if (modo === 'export') {
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
} finally {
  // Paso 6 · volcado con la primitiva original: no aparece en `destinos`.
  vuelca();
}
