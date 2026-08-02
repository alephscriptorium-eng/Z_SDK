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
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
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

const ES_WIN32 = process.platform === 'win32';

/** win32 compara rutas sin distinguir mayúsculas; POSIX sí distingue. */
function normaliza(p) {
  return ES_WIN32 ? p.toLowerCase() : p;
}

/**
 * NTFS · FLUJO DE DATOS ALTERNO. `fichero:flujo` no nombra un fichero llamado
 * «fichero:flujo»: nombra un flujo DENTRO de `fichero`. Escribir en
 * `volumes.json:oculto.jsonl` escribe dentro del manifiesto sellado.
 *
 * Sin despegarlo, las tres barreras fallan a la vez y en silencio: el nombre
 * completo ya no es el del artefacto, la ruta sí termina en `.jsonl`, y el
 * canal del inodo no ve nada porque el flujo AÚN NO EXISTE — sólo cazaba a
 * partir de la segunda escritura, cuando el daño ya estaba hecho.
 *
 * Sólo aplica en win32: en POSIX `:` es un carácter legítimo de nombre y
 * recortarlo denegaría ficheros válidos.
 * @param {string} p
 * @returns {{ ruta: string, flujo: string|null }}
 */
function despegaFlujoAlterno(p) {
  if (!ES_WIN32) return { ruta: p, flujo: null };
  const base = basename(p);
  const i = base.indexOf(':');
  if (i === -1) return { ruta: p, flujo: null };
  return { ruta: join(dirname(p), base.slice(0, i)), flujo: base.slice(i + 1) };
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
    // `realpathSync` puede reventar con errores crudos ajenos a «no existe»
    // (p.ej. `EISDIR ... lstat 'C:'` ante un prefijo `\\?\`). Degradar a la
    // resolución léxica mantiene la promesa de `index.mjs`: quien llama
    // distingue «denegado por el cerco» de un fallo de E/S, y nunca recibe
    // un error de sistema en bruto desde aquí.
    if (existsSync(actual)) {
      try {
        const real = realpathSync(actual);
        return cola.length > 0 ? join(real, ...cola.reverse()) : real;
      } catch {
        return resolve(p);
      }
    }
    const padre = dirname(actual);
    if (padre === actual) return resolve(p);
    cola.push(basename(actual));
    actual = padre;
  }
}

/**
 * Un solo `stat` para las tres preguntas: si existe, si es directorio y cuál
 * es su identidad física (`dev:ino`).
 *
 * La identidad es la ÚNICA evidencia que sobrevive a un enlace duro: medido
 * en este WP sobre win32/NTFS, `realpath` de un enlace duro devuelve la ruta
 * del propio enlace, no la del original.
 *
 * FALLO ABIERTO DECLARADO: si el sistema de ficheros no da inodo (`ino === 0`,
 * plausible en SMB — un sitio verosímil para un catálogo de volúmenes) o el
 * `stat` falla, `id` es `null` y el canal del inodo **desaparece sin aviso**.
 * Las demás barreras (léxica, artefacto, extensión, flujo) siguen en pie; la
 * que cae es sólo la del enlace duro. El código está vigilado por el censo de
 * mutación; el entorno no puede estarlo desde aquí.
 * @param {string} p
 * @returns {{ existe: boolean, esDirectorio: boolean, id: string|null }}
 */
function inspecciona(p) {
  try {
    const s = statSync(p, { bigint: true });
    return {
      existe: true,
      esDirectorio: s.isDirectory(),
      id: s.ino === 0n ? null : `${s.dev}:${s.ino}`
    };
  } catch {
    return { existe: false, esDirectorio: false, id: null };
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
  // El flujo se despega ANTES de comparar nada: lo que hay que juzgar es el
  // FICHERO sobre el que se acaba escribiendo, no la cadena que lo nombra.
  const { ruta: fichero, flujo } = despegaFlujoAlterno(destino);

  const rel = relative(normaliza(rootReal), normaliza(fichero));
  // `..` sólo escapa cuando es el segmento COMPLETO. `..raro.jsonl` es un
  // nombre legítimo dentro del root y denegarlo por «fuera del cerco» era
  // una respuesta engañosa: ni escapaba, ni el código lo describía.
  if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new LedgerPathDenegada(
      'ledger_path_fuera_del_cerco',
      `ledgerPath resuelve fuera del root de volúmenes: ${fichero}`,
      { destino: fichero, root: rootReal }
    );
  }
  for (const nombre of ARTEFACTOS_VEDADOS) {
    if (normaliza(fichero) === normaliza(join(rootReal, nombre))) {
      throw new LedgerPathDenegada(
        'ledger_path_artefacto_sellado',
        `ledgerPath apunta a un artefacto de máquina del root (${nombre}); denegado`,
        { destino: fichero, artefacto: nombre, flujo }
      );
    }
  }
  // Enlace duro con nombre inocente: pasa el chequeo léxico Y el de realpath,
  // pero comparte inodo con el artefacto y apendar sobre él lo corrompe.
  const datos = inspecciona(fichero);
  if (datos.id !== null) {
    for (const nombre of ARTEFACTOS_VEDADOS) {
      if (inspecciona(join(rootReal, nombre)).id === datos.id) {
        throw new LedgerPathDenegada(
          'ledger_path_artefacto_sellado',
          `ledgerPath comparte identidad física (enlace duro) con ${nombre}; denegado`,
          { destino: fichero, artefacto: nombre, identidad: datos.id }
        );
      }
    }
  }
  if (!normaliza(fichero).endsWith(LEDGER_EXT)) {
    throw new LedgerPathDenegada(
      'ledger_path_extension_no_jsonl',
      `ledgerPath debe terminar en ${LEDGER_EXT}; recibido: ${fichero}`,
      { destino: fichero }
    );
  }
  if (datos.esDirectorio) {
    throw new LedgerPathDenegada(
      'ledger_path_es_directorio',
      `ledgerPath es un directorio, no un fichero JSONL: ${fichero}`,
      { destino: fichero }
    );
  }
  // Residual: el flujo cuyo fichero base SÍ era admisible. Un ledger dentro de
  // un flujo alterno es invisible para quien lea la ruta normal — deja de ser
  // un asiento de auditoría y pasa a ser un escondite.
  if (flujo !== null) {
    throw new LedgerPathDenegada(
      'ledger_path_flujo_alterno',
      `ledgerPath nombra un flujo de datos alterno (${flujo}) dentro de ${fichero}; denegado`,
      { destino: fichero, flujo }
    );
  }
  return fichero;
}
