/**
 * WP-U253 · Cerco de la ruta del ledger.
 *
 * Por qué esta pieza vive SOLA y no dentro de `ledger.mjs`:
 * el censo estático del repo (WP-U205, `packages/mesh/ssb-system/test/
 * export.test.mjs`) marca como «escritor del manifiesto» cualquier fichero en
 * el que CO-OCURRAN una primitiva de escritura y el token del manifiesto. Si
 * la lista de vedados se importara dentro de `ledger.mjs` —que sí apenda—, el
 * censo marcaría `ledger.mjs` y exigiría una entrada de allowlist en un
 * paquete que este WP tiene prohibido tocar. Separar el cerco (que NO escribe)
 * del apendador (que NO nombra el artefacto) mantiene el censo verde sin
 * relajarlo. Que esa separación sea *necesaria* es, en sí, una medida de que
 * el censo ancla NOTACIÓN y no operación: el mismo motivo por el que existe
 * este WP. La sonda por operación vive en
 * `test/u253-escritura-sobre-manifiesto.test.mjs`.
 *
 * Regla: el ledger es un JSONL que vive DENTRO del root de volúmenes y jamás
 * ocupa un artefacto de máquina del root. Falla cerrado: deniega lanzando.
 * Node-only.
 */

import { existsSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { MANIFEST_FILE_NAME } from './manifest.mjs';
import { STATE_FILE_NAME } from './state.mjs';

/** Extensión exigida: el contrato del ledger es JSONL append-only. */
export const LEDGER_EXT = '.jsonl';

/**
 * Artefactos de máquina en la raíz del root que el ledger NUNCA puede ocupar.
 * El primero es el manifiesto sellado (su sha256 ES su identidad); el segundo
 * es el estado, propiedad exclusiva del runtime.
 */
export const ARTEFACTOS_VEDADOS = Object.freeze([MANIFEST_FILE_NAME, STATE_FILE_NAME]);

/** Denegación del cerco del ledger. Lleva `code` estable para las pruebas. */
export class LedgerPathDenegada extends Error {
  constructor(code, message, detail = {}) {
    super(message);
    this.name = 'LedgerPathDenegada';
    this.code = code;
    this.detail = detail;
  }
}

/** win32 compara rutas sin distinguir mayúsculas; POSIX sí distingue. */
function normaliza(p) {
  return process.platform === 'win32' ? p.toLowerCase() : p;
}

/**
 * realpath tolerante a inexistencia: resuelve el ancestro existente más
 * cercano y le vuelve a colgar la cola. Sin esto, un enlace simbólico ya
 * colocado (`<root>/inocente.jsonl` → el manifiesto) burlaría un chequeo
 * puramente léxico.
 * @param {string} p
 * @returns {string}
 */
function realAproximado(p) {
  let actual = resolve(p);
  const cola = [];
  for (;;) {
    if (existsSync(actual)) {
      const real = realpathSync(actual);
      return cola.length > 0 ? join(real, ...cola.reverse()) : real;
    }
    const padre = dirname(actual);
    if (padre === actual) return resolve(p);
    cola.push(basename(actual));
    actual = padre;
  }
}

/**
 * Identidad física del fichero (`dev:ino`), o null si no existe o el sistema
 * no la da. Es la ÚNICA evidencia que sobrevive a un enlace duro: medido en
 * este WP sobre win32/NTFS, `realpath` de un enlace duro devuelve la ruta del
 * propio enlace, no la del original.
 * @param {string} p
 * @returns {string|null}
 */
function identidadFisica(p) {
  try {
    const s = statSync(p, { bigint: true });
    return s.ino === 0n ? null : `${s.dev}:${s.ino}`;
  } catch {
    return null;
  }
}

/**
 * Valida una ruta de ledger propuesta contra el cerco del root. Devuelve la
 * ruta absoluta ya resuelta, o LANZA (falla cerrado). Las rutas relativas se
 * anclan al ROOT, nunca al cwd del proceso.
 *
 * @param {unknown} candidata — valor propuesto por el llamante
 * @param {string} volumesRoot — root de volúmenes que impone el cerco
 * @returns {string} ruta absoluta permitida
 * @throws {LedgerPathDenegada}
 */
export function assertLedgerPathPermitida(candidata, volumesRoot) {
  if (typeof candidata !== 'string' || candidata.trim() === '') {
    throw new LedgerPathDenegada(
      'ledger_path_no_es_cadena',
      `ledgerPath debe ser una ruta no vacía; recibido: ${typeof candidata}`,
      { candidata: String(candidata) }
    );
  }
  const rootReal = realAproximado(volumesRoot);
  const destino = realAproximado(resolve(rootReal, candidata));

  const rel = relative(normaliza(rootReal), normaliza(destino));
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
    throw new LedgerPathDenegada(
      'ledger_path_fuera_del_cerco',
      `ledgerPath resuelve fuera del root de volúmenes: ${destino}`,
      { destino, root: rootReal }
    );
  }
  for (const nombre of ARTEFACTOS_VEDADOS) {
    if (normaliza(destino) === normaliza(join(rootReal, nombre))) {
      throw new LedgerPathDenegada(
        'ledger_path_artefacto_sellado',
        `ledgerPath apunta a un artefacto de máquina del root (${nombre}); denegado`,
        { destino, artefacto: nombre }
      );
    }
  }
  // Enlace duro con nombre inocente: pasa el chequeo léxico Y el de realpath,
  // pero comparte inodo con el artefacto y apendar sobre él lo corrompe.
  const idDestino = identidadFisica(destino);
  if (idDestino !== null) {
    for (const nombre of ARTEFACTOS_VEDADOS) {
      if (identidadFisica(join(rootReal, nombre)) === idDestino) {
        throw new LedgerPathDenegada(
          'ledger_path_artefacto_sellado',
          `ledgerPath comparte identidad física (enlace duro) con ${nombre}; denegado`,
          { destino, artefacto: nombre, identidad: idDestino }
        );
      }
    }
  }
  if (!normaliza(destino).endsWith(LEDGER_EXT)) {
    throw new LedgerPathDenegada(
      'ledger_path_extension_no_jsonl',
      `ledgerPath debe terminar en ${LEDGER_EXT}; recibido: ${destino}`,
      { destino }
    );
  }
  return destino;
}
