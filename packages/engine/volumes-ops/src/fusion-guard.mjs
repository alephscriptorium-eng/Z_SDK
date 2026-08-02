/**
 * Guardián de la FASE DE APLICACIÓN de `importPack` (WP-U255).
 *
 * ── QUÉ PROMETE EL CONTRATO Y DÓNDE SE ROMPÍA ─────────────────────────────
 * `CONTRATO-IMPORT-PACK-v1.md` §1, paso 4: «pase 1 (dry): TODA colisión se
 * detecta ANTES de mover nada … root intacto (el pase 1 aborta antes del
 * primer rename)». Y §1, cabecera: «Todo fallo: `{ ok:false, step, error }`».
 *
 * Medido sobre la base, siete vectores rompían las dos frases a la vez —
 * `importPack` **LANZABA** (no devolvía) y cinco de los siete dejaban el
 * volumen A MEDIAS. El inventario completo, con su medida, está en
 * `plan/REPORTES/WP-U255-import-a-medias.md` §2. El resumen:
 *
 * | vector | lanzaba | destino tras el fallo |
 * |---|---|---|
 * | LINEAS · fichero del destino donde el pack trae un directorio | `EEXIST` (mkdir) | **1 fichero aterrizado** |
 * | FORCES · el mismo hueco | `ENOTDIR` (mkdir) | **2 ficheros aterrizados** |
 * | genérico · slot de volumen = directorio VACÍO | `EPERM` (rename) | **1 fichero aterrizado** |
 * | genérico · corpus con ancestro FICHERO | `EEXIST` (mkdir) | **1 fichero aterrizado** |
 * | dos volúmenes ANIDADOS en el mismo pack | `ENOENT` (rename) | **2 ficheros aterrizados** |
 * | LINEAS · directorio del destino donde el pack trae un fichero | `EISDIR` (read) | intacto (revienta en el dry) |
 * | FORCES · fichero del destino en la ruta de una unidad | `ENOTDIR` (scandir) | intacto (revienta en el dry) |
 *
 * ── POR QUÉ AQUÍ Y NO SÓLO EN LOS DRIVERS ─────────────────────────────────
 * FIREHOSE (U204·D3) y SSB (U205) ya llevaban `blockingAncestor` en su
 * `merge`; LINEAS y FORCES no. Copiar la guarda dos veces más habría cerrado
 * dos de los siete vectores y dejado los otros cinco vivos, porque **tres de
 * ellos no los puede ver ningún driver**: el volumen genérico (sin familia) no
 * pasa por driver, el movimiento de corpus tampoco, y el caso de dos volúmenes
 * anidados ocurre en el bucle POR VOLUMEN de `import.mjs` — lo dice la propia
 * cabecera de `driver-firehose.mjs`, que declaraba ese caso «fuera del alcance
 * de cualquier driver … deuda de U201».
 *
 * Así que la guarda estructural vive donde vive la operación: sobre la LISTA
 * ENTERA de renombrados, justo antes del primero. Las guardas de driver **se
 * mantienen y se completan** (LINEAS y FORCES ganan las suyas en este WP): son
 * anteriores, dan el diagnóstico de la FAMILIA, y quitar una para «no
 * duplicar» sería debilitar una guarda existente.
 *
 * ── DOS CAPAS, Y LA SEGUNDA DICE LO QUE NO CUBRE ──────────────────────────
 * 1. `inspectFusionPlan` — todo lo COMPROBABLE sin tocar el disco: destino
 *    ocupado, ancestro que es fichero, rutas del plan que se contienen entre
 *    sí, origen ausente. Aborta con nombre y **cero renombrados**.
 * 2. `applyFusion` — la red para lo que NO se puede comprobar por adelantado
 *    (permisos, un fichero que otro proceso tiene abierto sin compartir el
 *    borrado, un montaje que rinde EXDEV, una carrera contra el propio
 *    operador). Si un renombrado lanza, **se deshacen en orden inverso los ya
 *    hechos** y se devuelve `fusion_interrumpida` con el inventario de lo
 *    deshecho y —esto es lo que cuenta— de lo que NO se pudo deshacer.
 *    El alcance honesto del deshacer está en `deshacerFusion`.
 * Node-only.
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmdirSync
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

/**
 * ¿Algún ancestro del destino de `rel` existe como FICHERO?
 *
 * Cuerpo VERBATIM de `driver-firehose.mjs` (D3 de U204) y `driver-ssb.mjs`.
 * Vive aquí desde U255 porque pasó de dos consumidores a cuatro y una tercera
 * copia era la juntura por la que se cuela la divergencia — misma decisión, y
 * por el mismo motivo, que `unit-tree.mjs` en U259. Los dos drivers que ya la
 * tenían la IMPORTAN ahora en vez de declararla; su comportamiento no cambia
 * (hay probe de equivalencia sobre los cuatro drivers en
 * `test/fusion-guard.test.mjs`).
 *
 * Si lo hay, `mkdirSync`/`renameSync` lanzarían `EEXIST`/`ENOTDIR` a mitad de
 * la fusión — los dos códigos están medidos: `EEXIST` cuando el fichero ocupa
 * exactamente la ruta que `mkdirSync` va a crear, `ENOTDIR` cuando queda por
 * encima.
 * @param {string} destDir @param {string} rel — rel posix
 * @returns {string|null} el ancestro bloqueante (rel posix), o null
 */
export function blockingAncestor(destDir, rel) {
  const parts = rel.split('/');
  let acc = '';
  for (let i = 0; i < parts.length - 1; i += 1) {
    acc = acc ? `${acc}/${parts[i]}` : parts[i];
    const abs = join(destDir, acc.split('/').join(sep));
    if (existsSync(abs) && lstatSync(abs).isFile()) return acc;
  }
  return null;
}

/**
 * Causa de una excepción, en forma serializable. Se conserva ENTERA (código,
 * syscall, ruta y mensaje): convertir un throw en `{ok:false}` sólo es
 * cumplimiento del contrato si el diagnóstico viaja; si se pierde, es tapar.
 * @param {any} err
 */
export function causaDe(err) {
  if (!err || typeof err !== 'object') return { message: String(err) };
  return {
    name: err.name,
    ...(err.code ? { code: err.code } : {}),
    ...(err.syscall ? { syscall: err.syscall } : {}),
    ...(err.path ? { path: err.path } : {}),
    ...(err.dest ? { dest: err.dest } : {}),
    message: err.message
  };
}

/** rel posix respecto del root, para que el error se lea como el resto del carril. */
function relPosix(raiz, abs) {
  const rel = relative(raiz, abs);
  if (rel === '') return '.';
  if (rel.startsWith('..') || isAbsolute(rel)) return abs;
  return rel.split(sep).join('/');
}

/** ¿`abs` cuelga de `raiz` (o es `raiz`)? Por segmentos, nunca por prefijo de cadena. */
function bajoRaiz(raiz, abs) {
  const rel = relative(raiz, abs);
  return !rel.startsWith('..') && !isAbsolute(rel);
}

/**
 * Ancestros de `abs` DENTRO de `raiz`, del más alto al más bajo (sin incluir
 * `raiz` ni `abs`). El ascenso está acotado por el root: nunca se pregunta por
 * rutas de fuera del destino.
 * @param {string} raiz @param {string} abs — absolutos resueltos
 * @returns {string[]}
 */
function ancestrosBajoRaiz(raiz, abs) {
  const rel = relative(raiz, abs);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return [];
  const parts = rel.split(sep);
  /** @type {string[]} */
  const out = [];
  let acc = raiz;
  for (let i = 0; i < parts.length - 1; i += 1) {
    acc = join(acc, parts[i]);
    out.push(acc);
  }
  return out;
}

/** Directorio existente y VACÍO (el único «destino ocupado» que no es ocupación). */
function esDirectorioVacio(abs) {
  return existsSync(abs) && lstatSync(abs).isDirectory() && readdirSync(abs).length === 0;
}

/** @param {string} abs */
function tipoDe(abs) {
  try {
    const st = lstatSync(abs);
    if (st.isSymbolicLink()) return 'enlace';
    if (st.isDirectory()) return readdirSync(abs).length === 0 ? 'directorio_vacio' : 'directorio';
    if (st.isFile()) return 'fichero';
    return 'otro';
  } catch {
    return 'ilegible';
  }
}

/** Serializa un movimiento para el detalle del error. */
const retrato = (m) => ({ volume: m.volId, kind: m.kind, from: m.from, to: m.to });

/**
 * Dos movimientos del plan cuyo campo `campo` es la MISMA ruta o una cuelga de
 * la otra, o `null`. Coste: O(n · profundidad) — un plan de familia trae un
 * movimiento POR FICHERO, así que la comparación por pares (O(n²)) no era
 * opción.
 * @param {object[]} moves @param {'to'|'from'} campo @param {string} raiz
 */
function solapados(moves, campo, raiz) {
  /** @type {Map<string, object>} */
  const porRuta = new Map();
  for (const m of moves) {
    const p = resolve(m[campo]);
    const previo = porRuta.get(p);
    if (previo) return [previo, m];
    porRuta.set(p, m);
  }
  for (const [p, m] of porRuta) {
    for (const ancestro of ancestrosBajoRaiz(raiz, p)) {
      const otro = porRuta.get(ancestro);
      if (otro && otro !== m) return [otro, m];
    }
  }
  return null;
}

/**
 * Pase estructural sobre el plan ENTERO de renombrados, antes del primero.
 *
 * Comprueba, por este orden (del defecto más caro al más raro):
 * - `origen_de_fusion_ausente` — el `from` no existe. Guardián de última línea:
 *   con el plan bien calculado no se alcanza, pero un `from` ausente es
 *   exactamente lo que produce el caso de volúmenes anidados si la comprobación
 *   de anidamiento se retirara.
 * - `plan_con_destinos_anidados` / `plan_con_origenes_anidados` — dos
 *   movimientos del mismo plan cuyas rutas se contienen. Es el caso de dos
 *   volúmenes ANIDADOS en el mismo pack (`DISK_01/V` y `DISK_01/V/sub`): el
 *   primero se lleva el subárbol entero y el segundo renombra un origen que ya
 *   no existe, con el volumen a medias. **Deuda declarada de U201 y citada por
 *   `driver-firehose.mjs` como «fuera del alcance de cualquier driver»**; se
 *   cierra aquí, que es donde ocurre.
 * - `sobrescritura_imposible` — el destino ya existe. Importa porque
 *   `renameSync` sobre un fichero existente **NO lanza: PISA en silencio**
 *   (medido), así que sin esta comprobación la pérdida de dato no deja ni
 *   traza.
 * - `ruta_bloqueada_por_fichero` — un ancestro del destino existe como fichero.
 *   Es el vector del enunciado de este WP.
 *
 * **La única ocupación que NO es ocupación**: un movimiento de DIRECTORIO
 * (volumen entero) cuyo destino existe y está VACÍO. El contrato ya lo trata
 * como slot libre (`slot_ocupado` sólo salta si el directorio TIENE ficheros,
 * `import.mjs`), y `rename(dir → dir vacío)` es legal en POSIX
 * (`rename(2)`: «newpath must either not exist, or refer to an empty
 * directory») pero da **EPERM en Windows** (medido en este carril). Se declara
 * aquí como `slotsVacios` para que `applyFusion` lo vacíe antes de renombrar:
 * el comportamiento pasa a ser el mismo en las dos plataformas, y es el que el
 * contrato ya decía. **No se ensancha nada**: un directorio con un solo fichero
 * sigue siendo `slot_ocupado`, que ya aborta antes.
 *
 * @param {{kind:string, volId:string, from:string, to:string}[]} moves
 * @param {string} volumesRoot — tope del ascenso por ancestros
 * @returns {{ error: {code:string, detail:object} } | { ok: true, slotsVacios: string[] }}
 */
export function inspectFusionPlan(moves, volumesRoot) {
  const raiz = resolve(volumesRoot);

  for (const move of moves) {
    if (!existsSync(move.from)) {
      return { error: { code: 'origen_de_fusion_ausente', detail: retrato(move) } };
    }
  }

  for (const [campo, code] of /** @type {const} */ ([
    ['to', 'plan_con_destinos_anidados'],
    ['from', 'plan_con_origenes_anidados']
  ])) {
    const par = solapados(moves, campo, raiz);
    if (par) {
      return {
        error: {
          code,
          detail: {
            volumes: [par[0].volId, par[1].volId],
            movimientos: [retrato(par[0]), retrato(par[1])]
          }
        }
      };
    }
  }

  /** @type {string[]} */
  const slotsVacios = [];
  for (const move of moves) {
    const destino = resolve(move.to);
    if (!bajoRaiz(raiz, destino)) {
      return {
        error: {
          code: 'destino_fuera_del_root',
          detail: { ...retrato(move), volumesRoot: raiz }
        }
      };
    }
    if (existsSync(destino)) {
      // (a) REEMPLAZO DECLARADO por el driver (`plan.overwrites`). Hoy es un
      // solo caso en todo el carril —el `registry.json` de FORCES, que la
      // familia reemplaza a propósito tras comprobar superconjunto y cero
      // colisiones de unidad— y antes de U255 se apoyaba en que `renameSync`
      // pisa en silencio. Se tolera SÓLO si las dos puntas son ficheros:
      // `rename(fichero → directorio)` da EPERM (medido) y `rename(dir → dir no
      // vacío)` también, así que un destino con otra forma sigue abortando.
      if (move.sobrescribe && lstatSync(destino).isFile() && lstatSync(move.from).isFile()) {
        continue;
      }
      // (b) Movimiento de DIRECTORIO sobre slot existente y VACÍO: el contrato
      // ya lo considera libre; se vacía en la aplicación (ver cabecera).
      if (move.kind !== 'file' && esDirectorioVacio(destino) && lstatSync(move.from).isDirectory()) {
        slotsVacios.push(destino);
        continue;
      }
      return {
        error: {
          code: 'sobrescritura_imposible',
          detail: {
            volume: move.volId,
            kind: move.kind,
            file: relPosix(raiz, destino),
            ocupadoPor: tipoDe(destino)
          }
        }
      };
    }
    for (const ancestro of ancestrosBajoRaiz(raiz, destino)) {
      if (existsSync(ancestro) && lstatSync(ancestro).isFile()) {
        return {
          error: {
            code: 'ruta_bloqueada_por_fichero',
            detail: {
              volume: move.volId,
              kind: move.kind,
              file: relPosix(raiz, destino),
              blockedBy: relPosix(raiz, ancestro)
            }
          }
        };
      }
    }
  }

  return { ok: true, slotsVacios };
}

/**
 * Deshace los renombrados YA HECHOS, en orden inverso.
 *
 * ── ALCANCE HONESTO (esto es lo que vale el rollback) ─────────────────────
 * **Deshace**: cada `rename(from → to)` aplicado, devolviéndolo a su ruta de
 * staging; el `rmdir` del slot vacío que `applyFusion` hubiera hecho; y los
 * DIRECTORIOS que la fusión creó en el destino, **sólo si quedan vacíos**
 * (`rmdirSync`, jamás `rm -r`: un directorio que no quede vacío se conserva,
 * porque lo que hay dentro no lo puso este import).
 *
 * **No deshace, y por eso se declara**:
 * - lo que el propio deshacer no consiga mover (permiso denegado, fichero
 *   tomado por otro proceso entre ida y vuelta): sale enumerado en
 *   `sinDeshacer`, ruta a ruta, y quien llama lo reporta. Un inventario que
 *   dice «no pude con éstos» vale; uno que dice «todo restaurado» sin haberlo
 *   comprobado, no;
 * - marcas de tiempo y atributos: `rename` conserva el inodo, así que el
 *   CONTENIDO vuelve byte a byte, pero el `mtime` del directorio destino ya
 *   cambió y no se restaura;
 * - nada posterior a SELLAR: quien llama no debe invocar esto una vez el
 *   manifiesto está re-sellado (a partir de ahí los datos son la verdad y
 *   deshacerlos dejaría el manifiesto mintiendo). `applyFusion` corre ANTES de
 *   SELLAR, por construcción. **U268 añade el SEGUNDO y último llamante, y cae
 *   del mismo lado de esa frontera**: `import.mjs` deshace cuando SELLAR lanza,
 *   con la fusión aplicada y el manifiesto todavía sin escribir. Todo lo que
 *   ocurre con el sello YA puesto se DECLARA (`step:'post-fusion'`), no se
 *   deshace — el porqué, con su medida, en la cabecera de `import.mjs`.
 *
 * @param {{from:string,to:string,slotVaciado:boolean,apartado:string|null,dirCreado:string|undefined}[]} aplicados
 * @returns {{ deshechos: string[], sinDeshacer: object[] }}
 */
export function deshacerFusion(aplicados) {
  /** @type {string[]} */
  const deshechos = [];
  /** @type {object[]} */
  const sinDeshacer = [];
  for (let i = aplicados.length - 1; i >= 0; i -= 1) {
    const m = aplicados[i];
    try {
      renameSync(m.to, m.from);
      // El fichero que un reemplazo declarado había apartado vuelve a su sitio.
      // Sin esto el deshacer sería una promesa a medias: `renameSync` pisa en
      // silencio, así que un reemplazo aplicado y luego «deshecho» habría
      // dejado el destino SIN el fichero que tenía.
      if (m.apartado) renameSync(m.apartado, m.to);
      if (m.slotVaciado) mkdirSync(m.to);
      if (m.dirCreado) borrarDirectoriosVacios(m.dirCreado);
      deshechos.push(m.to);
    } catch (err) {
      sinDeshacer.push({ to: m.to, from: m.from, causa: causaDe(err) });
    }
  }
  return { deshechos, sinDeshacer };
}

/**
 * Borra un subárbol de directorios **vacíos**, de abajo arriba. Nunca borra un
 * fichero y nunca borra un directorio que contenga algo: se comprueba que esté
 * vacío antes de cada `rmdirSync`. Es el único borrado que este módulo hace y
 * está acotado a los directorios que la propia fusión creó (los que
 * `mkdirSync(…,{recursive:true})` REPORTA como creados; si no creó ninguno
 * devuelve `undefined` y aquí no se llama).
 * @param {string} abs
 */
function borrarDirectoriosVacios(abs) {
  if (!existsSync(abs) || !lstatSync(abs).isDirectory()) return;
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    if (entry.isDirectory()) borrarDirectoriosVacios(join(abs, entry.name));
  }
  if (readdirSync(abs).length === 0) rmdirSync(abs);
}

/**
 * Fase de aplicación: `rename` puro, con red.
 *
 * Se separa de `import.mjs` para que el deshacer tenga prueba DIRECTA con un
 * fallo inyectado — el vector real (permiso, bloqueo de otro proceso) no es
 * reproducible en una suite portable, y un rollback sin prueba es una promesa.
 *
 * ── U268 · POR QUÉ EL ÉXITO DEVUELVE TAMBIÉN LA LISTA ─────────────────────
 * `movimientos` es el MISMO inventario que este módulo ya construía para poder
 * deshacer cuando un rename lanza; hasta U268 se descartaba al salir bien y sólo
 * viajaba el número. Lo necesita `import.mjs` para el único rollback que sigue
 * siendo legítimo después de FUSIONAR: **SELLAR lanzando**, que ocurre con la
 * fusión ya aplicada y el manifiesto todavía intacto — exactamente el tramo que
 * `deshacerFusion` declara cubrir («nada posterior a SELLAR»). Es aditivo:
 * `aplicados` sigue siendo el número y nadie que lo use cambia.
 *
 * @param {{kind:string, volId:string, from:string, to:string}[]} moves
 * @param {string[]} slotsVacios — destinos a vaciar antes de renombrar
 * @returns {{ ok: true, aplicados: number, movimientos: object[] } | { error: {code:string, detail:object} }}
 */
export function applyFusion(moves, slotsVacios = []) {
  const vaciar = new Set(slotsVacios.map((p) => resolve(p)));
  /** @type {{from:string,to:string,slotVaciado:boolean,apartado:string|null,dirCreado:string|undefined}[]} */
  const aplicados = [];
  for (const move of moves) {
    const slotVaciado = vaciar.has(resolve(move.to));
    try {
      const dirCreado = mkdirSync(dirname(move.to), { recursive: true });
      if (slotVaciado) rmdirSync(move.to);
      // Reemplazo declarado: el fichero pisado se APARTA al staging antes de
      // renombrar, en vez de dejar que `renameSync` lo borre. Cuesta un rename
      // más y es lo que hace reversible el único caso del carril en el que se
      // sobrescribe a propósito. El apartado muere con el staging (§1 del
      // contrato: el staging nunca sobrevive).
      let apartado = null;
      if (move.sobrescribe && existsSync(move.to)) {
        apartado = `${move.from}.u255-reemplazado`;
        renameSync(move.to, apartado);
      }
      renameSync(move.from, move.to);
      aplicados.push({ from: move.from, to: move.to, slotVaciado, apartado, dirCreado });
    } catch (err) {
      const vuelta = deshacerFusion(aplicados);
      return {
        error: {
          code: 'fusion_interrumpida',
          detail: {
            volume: move.volId,
            kind: move.kind,
            file: move.to,
            causa: causaDe(err),
            renombradosHechos: aplicados.length,
            renombradosDeshechos: vuelta.deshechos.length,
            sinDeshacer: vuelta.sinDeshacer
          }
        }
      };
    }
  }
  return { ok: true, aplicados: aplicados.length, movimientos: aplicados };
}
