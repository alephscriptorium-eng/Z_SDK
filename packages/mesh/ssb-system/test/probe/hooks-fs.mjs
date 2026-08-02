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
 *
 * - LA LISTA. `PRIMITIVAS` es una ENUMERACIÓN CERRADA, y por tanto incompleta.
 *   Ésta es la ceguera de fondo y no se cierra ensanchándola:
 *
 *       Mientras el instrumento sea una lista de nombres, el mutante que
 *       evade la lista existirá.
 *
 *   Medido: `openSync`+`writeSync(fd)`, `writevSync`, `ftruncateSync` y
 *   `filehandle.write()` reescriben el manifiesto y NO pasan por aquí. La
 *   lista se declara y se mantiene SINCRONIZADA con la del censo estático
 *   (`export.test.mjs`, invariante medida en `U253c-3e`); no se pretende
 *   completa. Un `WriteStream` ya abierto tampoco: se envuelve
 *   `createWriteStream`, no el `.write()` del stream que devuelve.
 *
 * - `createRequire(...)('fs')`. Los hooks del cargador ESM no gobiernan la
 *   resolución CJS. Ese vector lo cubre el parche del objeto CJS que aplica
 *   `correr.mjs` ANTES de importar el objetivo; los dos juntos cubren las
 *   cinco notaciones de import, y ninguno de los dos lo hace solo.
 *
 * - Escritura desde un proceso hijo, un worker o un addon nativo. Nada de eso
 *   pasa por el cargador de este proceso.
 *
 * - MEDIDO, y al revés de lo que decía la primera versión de esta cabecera:
 *   el ÍNDICE COMPUTADO (`fs[nombre]` con `nombre` calculado) SÍ cae, y cae
 *   por las tres vías —default, namespace y CJS— precisamente porque lo que
 *   el importador recibe ya es el envoltorio. Aquella frase afirmaba que el
 *   namespace se libraba, y además se contradecía a sí misma. Era falsa.
 *
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
 * Las primitivas que se envuelven. FUENTE ÚNICA: `correr.mjs` importa ESTA
 * lista para parchear el objeto CJS, en vez de mantener una copia propia —que
 * es exactamente lo que había y lo que hacía divergir las dos mitades (8
 * frente a 15). La invariante «censo ⊆ sonda» se mide en `U253c-3e`: si una
 * primitiva entra en el censo y no aquí, el censo promete una vigilancia que
 * la sonda no da.
 */
export const PRIMITIVAS = [
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
  // `fs.promises` es OTRO objeto: `Object.assign` copiaba el real y lo dejaba
  // pasar intacto. Medido antes de arreglarlo: `fs.promises.writeFile` escribía
  // por las CUATRO notaciones sin que la sonda anotase nada. Se envuelve aparte.
  const enPromises =
    mod.promises && typeof mod.promises === 'object'
      ? PRIMITIVAS.filter((n) => typeof mod.promises[n] === 'function')
      : [];

  const lineas = [
    "import { createRequire } from 'node:module';",
    `const require = createRequire(${JSON.stringify(import.meta.url)});`,
    `const real = require(${JSON.stringify(real)});`,
    `const ORIGEN = ${JSON.stringify(real)};`,
    // El canal de salida vive en `globalThis` y lo instala `correr.mjs` ANTES
    // de registrar los hooks. No se escribe a disco desde aquí: hacerlo con un
    // `fs` ya envuelto se anotaría a sí mismo.
    'const canal = () => globalThis.__ZEUS_SONDA_FS;',
    'const anota = (prim, args) => { const c = canal(); if (c) c.anota(ORIGEN, prim, args[0]); };',
    'const envuelve = (prim, fn) => function (...args) { anota(prim, args); return fn.apply(this, args); };'
  ];
  for (const n of nombres) {
    if (n === 'promises' && enPromises.length) continue; // se construye abajo
    lineas.push(
      envueltos.includes(n)
        ? `const $${n} = envuelve(${JSON.stringify(n)}, real[${JSON.stringify(n)}]);`
        : `const $${n} = real[${JSON.stringify(n)}];`
    );
  }
  if (enPromises.length) {
    lineas.push(
      `const $promises = Object.assign({}, real.promises, { ${enPromises
        .map((n) => `${n}: envuelve(${JSON.stringify(`promises.${n}`)}, real.promises[${JSON.stringify(n)}])`)
        .join(', ')} });`
    );
  }
  lineas.push(`export { ${nombres.map((n) => `$${n} as ${n}`).join(', ')} };`);
  // El default de un builtin CJS es su `module.exports`. Se replica como objeto
  // plano con las primitivas sustituidas: `import fs from 'node:fs'` y
  // `fs.promises` siguen respondiendo, pero ya envueltas las dos caras.
  const extras = envueltos.map((n) => `${n}: $${n}`);
  if (enPromises.length) extras.push('promises: $promises');
  lineas.push(`export default Object.assign({}, real, { ${extras.join(', ')} });`);
  // Declara lo que REALMENTE envolvió, para que `U253c-3e` pueda exigir que las
  // dos mitades de la sonda envuelvan lo mismo sin leerse el código fuente.
  lineas.push(
    `{ const c = canal(); if (c && c.declara) c.declara(ORIGEN, ${JSON.stringify(
      envueltos
    )}, ${JSON.stringify(enPromises)}); }`
  );

  return { format: 'module', shortCircuit: true, source: lineas.join(NL) };
}

export const ALCANCE = { ESQUEMA, DESVIADOS, PRIMITIVAS };
