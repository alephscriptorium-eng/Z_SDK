/**
 * WP-U253c · Sonda de escritura INDEPENDIENTE DE LA NOTACIÓN DE IMPORT.
 *
 * POR QUÉ EXISTE. La sonda heredada de U205 (`export.test.mjs`, CA-5a) mide a
 * dónde apunta cada escritura parcheando las propiedades del objeto `fs`. Eso
 * sólo alcanza a quien LEE la propiedad en el momento de la llamada. Medido en
 * este WP, un monkey-patch de `fs` intercepta:
 *
 *     import fs from 'node:fs'                      → SÍ  (lee `fs.x` al llamar)
 *     createRequire(import.meta.url)('node:fs')     → SÍ  (mismo objeto CJS)
 *     import { writeFileSync } from 'node:fs'       → NO  (binding congelado)
 *     import * as fs from 'node:fs'                 → NO  (namespace inmutable)
 *     import { writeFile } from 'node:fs/promises'  → NO  (otro módulo)
 *
 * Estos hooks atacan el problema un nivel más abajo: NO parchean el módulo,
 * lo SUSTITUYEN. `resolve` desvía `node:fs` y `node:fs/promises` a un URL
 * propio y `load` sintetiza ahí un módulo que reexporta el real con las
 * primitivas de escritura envueltas. Como lo que el importador recibe YA es el
 * envoltorio, da igual con qué notación lo importe: named, namespace, default
 * y `fs/promises` quedan cubiertos por igual.
 *
 * ALCANCE DECLARADO — lo que estos hooks NO cubren:
 * - `createRequire(...)('fs')`. Los hooks del cargador ESM no gobiernan la
 *   resolución CJS. Ese vector lo cubre el parche del objeto CJS que aplica
 *   `correr.mjs` ANTES de importar el objetivo; los dos juntos cierran las
 *   cinco notaciones, y ninguno de los dos lo hace solo.
 * - Escritura desde un proceso hijo, un worker, un addon nativo o un `fs`
 *   alcanzado por índice computado (`fs[nombre]` con `nombre` calculado). Un
 *   índice computado SÍ cae si se hace sobre el default/CJS envuelto; NO cae
 *   si se hace sobre el namespace, porque ahí el envoltorio ya es el valor.
 * - Sólo se envuelven las primitivas de `PRIMITIVAS`. `filehandle.write()` y
 *   los métodos de un `WriteStream` ya abierto no pasan por aquí.
 * - Mide la LLAMADA, no la TERMINACIÓN. Registra el destino en el momento en
 *   que se invoca la primitiva; una escritura asíncrona queda anotada aunque
 *   aún no haya llegado al disco. Para «no escribe contra X» eso basta y
 *   sobra (anotar de más nunca pierde un ofensor); para «ya terminó de
 *   escribir» NO sirve, y aquí no se afirma.
 *
 * Node-only. Se registra con `module.register()` desde `correr.mjs`.
 */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** Prefijo de URL propio: lo que `resolve` marca, `load` sintetiza. */
const ESQUEMA = 'zeus-sonda-fs:';

/** Especificador → módulo real. Cubre las cuatro formas de nombrarlos. */
const DESVIADOS = {
  'node:fs': 'fs',
  fs: 'fs',
  'node:fs/promises': 'fs/promises',
  'fs/promises': 'fs/promises'
};

/**
 * Las primitivas que se envuelven. Es la MISMA lista que ancla el censo
 * estático (`export.test.mjs`), incluida la cara `fs/promises`: si una entra
 * en el censo y no aquí, el censo promete una vigilancia que la sonda no da.
 */
const PRIMITIVAS = [
  'writeFileSync',
  'appendFileSync',
  'createWriteStream',
  'rmSync',
  'unlinkSync',
  'renameSync',
  'copyFileSync',
  'truncateSync',
  'writeFile',
  'appendFile',
  'rm',
  'unlink',
  'rename',
  'copyFile',
  'truncate'
];

const NL = String.fromCharCode(10);

/** @type {import('node:module').ResolveHook} */
export async function resolve(especificador, contexto, siguiente) {
  if (Object.prototype.hasOwnProperty.call(DESVIADOS, especificador)) {
    return { url: ESQUEMA + DESVIADOS[especificador], shortCircuit: true };
  }
  return siguiente(especificador, contexto);
}

/** @type {import('node:module').LoadHook} */
export async function load(url, contexto, siguiente) {
  if (!url.startsWith(ESQUEMA)) return siguiente(url, contexto);
  const real = url.slice(ESQUEMA.length);
  const mod = require(real);
  // Sólo se reexportan claves que son identificadores válidos: `Object.keys`
  // de un builtin puede traer nombres que no lo son y romperían la síntesis.
  const nombres = Object.keys(mod).filter(
    (k) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) && k !== 'default'
  );
  const envueltos = nombres.filter((n) => PRIMITIVAS.includes(n) && typeof mod[n] === 'function');

  const lineas = [
    "import { createRequire } from 'node:module';",
    `const require = createRequire(${JSON.stringify(import.meta.url)});`,
    `const real = require(${JSON.stringify(real)});`,
    `const ORIGEN = ${JSON.stringify(real)};`,
    // El canal de salida vive en `globalThis` y lo instala `correr.mjs` ANTES
    // de registrar los hooks. No se escribe a disco desde aquí: hacerlo con un
    // `fs` ya envuelto se anotaría a sí mismo.
    'const anota = (prim, args) => { const c = globalThis.__ZEUS_SONDA_FS; if (c) c.anota(ORIGEN, prim, args[0]); };',
    'const envuelve = (prim, fn) => function (...args) { anota(prim, args); return fn.apply(this, args); };'
  ];
  for (const n of nombres) {
    lineas.push(
      envueltos.includes(n)
        ? `const $${n} = envuelve(${JSON.stringify(n)}, real[${JSON.stringify(n)}]);`
        : `const $${n} = real[${JSON.stringify(n)}];`
    );
  }
  lineas.push(`export { ${nombres.map((n) => `$${n} as ${n}`).join(', ')} };`);
  // El default de un builtin CJS es su `module.exports`. Se replica como objeto
  // plano con las primitivas sustituidas: `import fs from 'node:fs'` y
  // `fs.promises` siguen respondiendo, pero `fs.writeFileSync` ya está envuelta.
  lineas.push(
    `export default Object.assign({}, real, { ${envueltos.map((n) => `${n}: $${n}`).join(', ')} });`
  );

  return { format: 'module', shortCircuit: true, source: lineas.join(NL) };
}

export const ALCANCE = { ESQUEMA, DESVIADOS, PRIMITIVAS };
