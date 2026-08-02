/**
 * WP-U269 — LA LEY DE CONSERVACIÓN, y por qué vive en su propio módulo.
 *
 * Es el instrumento con el que este WP demuestra que ningún trozo de la entrada
 * se pierde sin que alguien lo mire. Está aquí y no dentro del fichero de test
 * por una razón concreta: la DEMOSTRACIÓN de que la ley caza de verdad —revertir
 * cada arreglo del WP y ver la ley enrojecer— corre fuera de la suite, y si esa
 * demostración usara una copia de la ley, la copia y la ley podrían divergir sin
 * que nadie lo notase. Una medición que mide otra cosa es peor que ninguna.
 *
 * QUÉ NO ES. No demuestra que los analizadores sean CORRECTOS: un valor mal
 * leído pero contabilizado satisface la ley. Demuestra que nada se pierde.
 *
 * DÓNDE NO LLEGA, dicho aquí porque es su límite real y ya costó una devolución:
 * la ley 1 no se aplica a CÓDIGO —allí un token suelto es un identificador, no
 * un dato—, así que en código la cobertura la da sólo la ley 2, que inspecciona
 * VALORES DE CAMPOS. **Lo que en código no llega a ser campo no lo mira nadie.**
 * Eso fue exactamente B7: una expresión regular consumía su texto sin emitir
 * campo, y la ley pasaba. Se cerró marcándola opaca, pero el hueco de la ley
 * sigue ahí y lo cubre el canario de literales, comentarios y regex.
 */

import { NoEntiendo, camposDe } from '../../scripts/gates/formatos.mjs';
import { hallazgosEnTexto } from '../../scripts/gates/claves.mjs';

/** Un token candidato: lo bastante largo para poder ser material. */
export const TOKEN_LEY = /[A-Za-z0-9_@.+/=:~-]{8,}/g;

/**
 * Violaciones de la ley de conservación. Lista vacía = conserva.
 * @param {string} texto @param {string} formato
 * @returns {string[]}
 */
export function violacionesDeConservacion(texto, formato, analizar = camposDe) {
  let campos;
  try {
    campos = analizar(formato, texto);
  } catch (e) {
    if (e instanceof NoEntiendo) return []; // retirada = conserva
    throw e;
  }
  /** @type {string[]} */
  const out = [];
  const heno = campos.flatMap((c) => [c.nombre, c.valor]).filter(Boolean).join('\n');
  const opacos = campos.filter((c) => c.opaco).map((c) => c.valor);

  // LEY 1 — sólo formatos de DATOS. En CÓDIGO un token suelto es un
  // identificador (`defineConfig`, `console.log`), no un dato: allí un secreto
  // vive siempre dentro de un literal o de un comentario, y de eso se ocupan la
  // ley 2 y el canario de B3.
  if (formato !== 'codigo') {
    texto.split('\n').forEach((l, i) => {
      for (const bruto of l.match(TOKEN_LEY) ?? []) {
        const t = bruto.replace(/^[:=,.]+/, '').replace(/[:=,.]+$/, '');
        if (t.length < 8) continue;
        if (heno.includes(t)) continue;
        out.push(`L1 línea ${i + 1}: el token ${JSON.stringify(t.slice(0, 40))} no lo mira nadie`);
      }
    });
  }

  // LEY 2 — un valor juzgado como átomo que en realidad lleva estructura.
  for (const c of campos) {
    if (c.opaco || typeof c.valor !== 'string') continue;
    if (hallazgosEnTexto(c.valor).length === 0) continue;
    if (opacos.some((o) => o.includes(c.valor))) continue;
    out.push(`L2 línea ${c.line}: el valor de \`${c.nombre}\` lleva estructura con material y nadie lo barre`);
  }
  return out;
}
