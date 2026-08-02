/**
 * importPack — CONTRATO-IMPORT-PACK-v1 (WP-U201).
 * Contract source of truth: plan/CONTRATO-IMPORT-PACK-v1.md (7 steps:
 * VERIFICAR → [NO-OP gate] → STAGING → VALIDAR → FUSIONAR → SELLAR →
 * NO-LINK). Genealogy: CONTRATO-IMPORT-PACK-v0 (nota Z R7) [cita inerte].
 *
 * Hard rules inherited:
 * - U199: volumes.json is sealed; the import pipeline is the ONLY
 *   legitimate writer (via manifest.mjs sealManifest — never a direct
 *   writeFileSync). Import seeds corpora counts in the manifest; live
 *   drift belongs to volumes.state.json.
 * - U200 (◆5): destination = canonical root (ZEUS_VOLUMES_ROOT mandatory;
 *   node_modules refused). An explicit opts.volumesRoot is accepted only
 *   as a consistency ASSERTION against the canonical resolution.
 * - Cerco §10.8: no living anchors — symlinks/junctions in the pack are
 *   REJECTED (never materialized), origin URL is inert metadata only.
 * - U258: step SELLAR also anchors CONTENT, not just provenance —
 *   `source.imported.hashes` = `<relPosix>` → sha256 of every file of the
 *   volume AS IT LANDED (recomputed from the destination after FUSIONAR,
 *   never copied from `pack.hashes`). Rationale and declared scope at the
 *   seal site below.
 * - U259: `source.imported.snapshot` follows the SAME rule — se recomputa del
 *   DESTINO tras FUSIONAR con el `snapshotOf()` del driver de la familia, en
 *   vez de copiarse del PLAN (que se calcula sobre el staging). Y el gate
 *   NO-OP gana una condición de FORMA para que un root sellado antes del
 *   contrato de snapshot no se quede sin él para siempre. Los dos porqués,
 *   con su medida, en sus sitios.
 *
 * ── DÓNDE ESTÁ LA FRONTERA (U268 · lo que esta cabecera puede prometer) ────
 * **Hasta FUSIONAR incluido**: todo fallo deja el root intacto —sello del
 * manifiesto sin tocar, byte a byte— y el staging retirado. Ahí «nothing lands
 * halfway» es una GARANTÍA, y la sostienen U255 (el plan entero antes del
 * primer rename, con deshacer si un rename lanza) y U253b (el asiento se juzga
 * antes de VERIFICAR).
 *
 * **La frontera NO está donde parece.** `sealManifest` escribe en
 * `manifest.mjs:74` y sólo hashea en `:76`, así que «antes de SELLAR» no es un
 * instante sino un tramo con una subventana dentro en la que el sello YA cambió
 * aunque el sellador haya lanzado. Por eso la regla no se enuncia por fases sino
 * por PRUEBA: **se revierte sólo si se comprueba que el sello no se movió**, y
 * «no se puede leer» cae del lado de no revertir. La primera versión de U268 lo
 * daba por hecho y **borraba el corpus del usuario** (medido; ver el bloque de
 * U268 abajo).
 *
 * **Con el sello puesto ya no cabe deshacer**: el manifiesto re-sellado es la
 * nueva verdad del root. Lo que se promete desde ahí es lo otro, y es
 * comprobable:
 *   - **ningún fallo posterior a FUSIONAR sale como excepción** — todos salen
 *     por `{ok:false, step, error}` como el resto del contrato. Lo sostienen
 *     cuatro envoltorios con nombre **y una red de última línea**
 *     (`post_sello_interrumpido`) para lo que no tenga código propio; sin la
 *     red la frase sería más ancha que el código;
 *   - **el medio-aterrizaje se NOMBRA**: `step:'post-fusion'` con
 *     `aterrizado:true`, el sello REAL (`sellado.before`/`after`, medido del
 *     disco), si hay asiento o no, y una `recuperacion` EJECUTABLE;
 *   - **entre el sello y el asiento no queda nada que pueda escaparse**: el
 *     parte de `sellar` se anota DETRÁS del asiento y lo demás vive dentro de la
 *     red. (No es que no corra nada en medio — eso era prosa; es que nada de lo
 *     que corre puede salirse.)
 *   - **la limpieza del staging no puede cambiar el desenlace**: viaja como
 *     dato en `staging`, nunca como excepción.
 * Staging vive DENTRO del root destino (mismo dispositivo) y la fusión es
 * rename-only.
 *
 * ── ZONA SIN RED, Y HAY QUE SABERLO ANTES DE METER CÓDIGO AHÍ ─────────────
 * La red de última línea cubre lo que va DESPUÉS del sello. **El `catch` de
 * SELLAR queda fuera de ella**: si algo de lo que hay dentro de ese `catch`
 * lanzara, la excepción se escaparía de `importPack`.
 *
 * Hoy no lo hace, y no por una guarda: **esa región no está protegida por red,
 * está protegida por CONSTRUCCIÓN** — se revisó pieza a pieza que nada de lo que
 * hay ahí puede lanzar solo (`manifiestoVivo` ya atrapa lo suyo y devuelve
 * `null`, `deshacerFusion` no lanza por contrato, y el resto son literales y
 * `.map` sobre arrays propios). **Eso es más débil que una red** y no tiene
 * vector conocido a día de hoy: es una propiedad del código actual, no una
 * garantía del contrato.
 *
 * Quien añada una llamada dentro de ese `catch` —una lectura, un borrado, un
 * log que toque disco— **entra en zona sin red** y rompe la promesa de arriba
 * sin que ninguna prueba lo cace. Si hace falta meter algo ahí, lo que
 * corresponde es envolverlo, no confiar en que siga sin lanzar.
 *
 * ── U255 · «NOTHING LANDS HALFWAY» ERA UNA FRASE, NO UNA GARANTÍA ─────────
 * Las dos líneas de arriba y el paso 4 del contrato («pase 1 (dry): TODA
 * colisión se detecta ANTES de mover nada … root intacto») eran falsas para
 * SIETE vectores medidos sobre la base, en las cuatro familias y también en el
 * volumen sin familia. En los siete `importPack` **LANZABA** —no devolvía
 * `{ok:false, step, error}`, que es lo que el contrato promete en TODO fallo— y
 * en cinco de ellos el volumen quedaba **A MEDIAS**: ficheros aterrizados, sin
 * sellar, sin asiento en el ledger y sin nadie que lo dijera. El inventario, con
 * su medida antes y después, en `plan/REPORTES/WP-U255-import-a-medias.md`.
 *
 * La causa no era un descuido de un driver: era que **nadie miraba el plan
 * entero**. Cada driver comprueba lo suyo (y los cuatro lo hacen ya), pero el
 * volumen sin familia no pasa por driver, el movimiento de corpus tampoco, y
 * dos volúmenes ANIDADOS del mismo pack chocan en el bucle por volumen de esta
 * misma función — caso que `driver-firehose.mjs` declaraba «fuera del alcance de
 * cualquier driver». Desde U255 la fase de fusión tiene tres capas:
 *   1. el pase dry, envuelto: una lectura del destino que lance ya no se
 *      escapa como excepción, se devuelve como `plan_no_calculable`;
 *   2. `inspectFusionPlan` sobre la lista ENTERA de renombrados, antes del
 *      primero: destino ocupado, ancestro que es fichero, rutas del plan que se
 *      contienen entre sí, origen ausente → aborta con nombre y CERO renames;
 *   3. `applyFusion`, que para lo que no se puede prever (permiso, bloqueo de
 *      otro proceso, EXDEV, carrera) DESHACE los renombrados hechos y declara
 *      `fusion_interrumpida` con el inventario de lo que no pudo deshacer.
 * Todo ello en `src/fusion-guard.mjs`, con su alcance honesto escrito.
 *
 * ── U253b · LA MISMA FRASE SE ROMPÍA POR EL FINAL: EL ASIENTO ─────────────
 * U255 cerró la fase de fusión. El asiento del ledger quedó fuera: la llamada
 * a `appendOpsLedger` era la ÚLTIMA operación de la función y estaba **sin
 * envolver**, después de FUSIONAR y de SELLAR. Como el cerco de la ruta del
 * ledger (U253a, `ledger-cerco.mjs`) falla cerrado LANZANDO, cualquier
 * `ledger.ledgerPath` denegada producía exactamente lo que las dos frases de
 * arriba niegan: corpus aterrizado, manifiesto re-sellado, estado escrito,
 * CERO asiento, y una excepción en vez de `{ok:false, step, error}`. Medido en
 * ocho entradas denegadas —las ocho con el árbol del root distinto antes y
 * después— que entre todas ejercitan los SEIS códigos que el cerco sabe emitir,
 * en `plan/REPORTES/WP-U253b-import-atomico.md` §2. (Las seis primeras sólo
 * ejercitaban cuatro códigos: `es_directorio` y `flujo_alterno` no se alcanzan
 * por los vectores obvios y necesitaron entrada propia.)
 *
 * El arreglo no es de rutas (el cerco de U253a no se toca ni un carácter): es
 * de ORDEN. La ruta del ledger se juzga **antes de VERIFICAR**, cuando todavía
 * no se ha tocado nada, y una propuesta denegada sale por el contrato como
 * `precondicion-ledger`. Con eso el estrechamiento del cerco deja de necesitar
 * ser configurable: lo que denegaba tarde, deniega temprano.
 *
 * Tres residuos MEDIDOS que la precondición de ruta sola no cubría, y que se
 * cierran aquí por ser la misma clase («muta y luego lanza»), no por sonar mal:
 *   - un ledger existente con una línea ilegible hace reventar la RELECTURA que
 *     `appendOpsLedger` hace para numerar el asiento — y ocurre incluso sin
 *     proponer ruta, sobre la de por defecto. Se lee una vez en la precondición
 *     (`ledger_ilegible`); coste: una lectura más del mismo JSONL que el apéndice
 *     ya lee entero;
 *   - una ruta de ledger **admisible al entrar** sobre la que la PROPIA fusión
 *     aterriza después. Se caza sobre el plan de fusión, antes del primer rename
 *     (`ledger_en_ruta_de_fusion`), en sus TRES formas (ver la guarda);
 *   - `ledger` con campos inutilizables (`{volumesRoot: 42}`) →
 *     `ledger_opts_invalidas`, en vez de un `TypeError` tardío.
 *
 * ── U268 · LA DECISIÓN APLAZADA: QUÉ HACER DESPUÉS DE FUSIONAR ────────────
 * U253b dejó SEIS puntos que sólo se conocen después de FUSIONAR, y los seis
 * se midieron de nuevo antes de tocar nada (reporte §2, con la huella del árbol
 * entero antes/después). En los cinco posteriores al sello el resultado era
 * idéntico: **corpus aterrizado, manifiesto re-sellado, CERO asiento** — y
 * cuatro de ellos ni siquiera salían por el contrato, salían LANZANDO.
 *
 * La decisión, con su argumento, es **declarar el medio-aterrizaje**, no
 * revertirlo — salvo en el único tramo donde revertir es honesto. El porqué,
 * en tres hechos MEDIDOS y no en una preferencia:
 *  1. **Revertir después del sello exige ESCRIBIR**, y la clase entera de
 *     fallos es «no se puede escribir en el root». Un rollback que falla en las
 *     mismas condiciones que el fallo que repara no es atomicidad: es una
 *     segunda oportunidad. Y como puede fallar, HABRÍA QUE DECLARAR EL
 *     MEDIO-ATERRIZAJE IGUAL — (a) no ahorra (b), le añade un paso frágil.
 *  2. **`deshacerFusion` (U255) declara en su propio contrato que no vale
 *     después de SELLAR** («a partir de ahí los datos son la verdad y
 *     deshacerlos dejaría el manifiesto mintiendo»). Estirarlo hasta aquí sería
 *     ensanchar una frase por encima de su evidencia.
 *  3. **En dos de los cinco no hay NADA que revertir**: el `rmSync` del
 *     `finally` cae sobre un import COMPLETADO (con asiento incluido, medido), y
 *     `symlink_en_resultado` describe un ancla viva que ya estaba en el destino
 *     — deshacer borraría datos correctos y dejaría el ancla.
 * Donde SÍ se revierte: **SELLAR lanzando CON EL SELLO COMPROBADAMENTE
 * INTACTO**, que es exactamente lo que `deshacerFusion` declara cubrir. Ahí el
 * root vuelve a su estado previo y el import se puede REPETIR — sin revertir no
 * se podía, porque el corpus ya en destino hace que la segunda pasada muera con
 * `slot_ocupado` (medido). La mezcla es intencional y está dicha: **revertir
 * mientras se pueda PROBAR que el sello no se ha movido; declarar en cuanto se
 * haya movido o no se pueda probar.**
 *
 * La primera versión de este WP escribía esa condición como «antes de SELLAR» y
 * la daba por cierta sin mirar. Con la escritura hecha y el sellador lanzando
 * —disco lleno, o cualquier fallo entre el `write` y el hash— revertía igual:
 * devolvía el corpus al staging, el `finally` lo borraba, y el resultado decía
 * `aterrizado:false, sellado:null` mientras el manifiesto declaraba el import.
 * **Convertía un medio-aterrizaje recuperable en pérdida de datos permanente y
 * lo declaraba al revés.** Ahora se pregunta al disco; el detalle, en el `catch`.
 *
 * Lo que cambia, en concreto:
 *  - **entre el sello y el asiento no queda nada que pueda ESCAPARSE.** Ésta es
 *    la raíz del defecto y no se arregla con guardas: entre `sealManifest` y
 *    `appendOpsLedger` corrían `syncVolumeCounters` y el walk de NO-LINK, y
 *    cualquiera de los dos lanzando dejaba un manifiesto que declara
 *    `source.imported` sin asiento que lo respalde. Eso es `ledger_ausente` en
 *    `verify.mjs` §2: **el root deja de arrancar**. Y no se repara re-importando
 *    —la segunda pasada responde `noop:true` y no escribe asiento (medido)—, así
 *    que el daño era PERMANENTE. Ahora los contadores y NO-LINK van DESPUÉS del
 *    asiento, el parte de `sellar` también, y lo que quede en medio lo recoge la
 *    red;
 *  - **cuatro tramos envueltos y una red de última línea**, y con eso ninguna
 *    excepción escapa de la zona posterior a FUSIONAR: SELLAR (→ revierte o
 *    declara, según la prueba del sello), asiento, contadores, NO-LINK (→
 *    declaran) y `post_sello_interrumpido` para el resto;
 *  - **el `finally` deja de poder sustituir al `return`.** `limpiarStaging` no
 *    lanza nunca; su desenlace viaja por REFERENCIA en el campo `staging` de
 *    toda salida posterior a STAGING, así que un import completado ya no es
 *    indistinguible de uno fallido.
 * Node-only.
 */

import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync
} from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { assertIntentRole, resolveIntentRole } from '@zeus/protocol';
import { validate as validateSchema } from '@zeus/linea-kit/validate';
import { resolveVolumesRoot } from '@zeus/presets-sdk/volumes';
import { VOLUMES_OPS_CATALOG } from './catalog.mjs';
import { FAMILY_DRIVERS, detectVolumeFamily } from './drivers.mjs';
import { applyFusion, causaDe, deshacerFusion, inspectFusionPlan } from './fusion-guard.mjs';
import { hashManifest, readManifestRaw, sealManifest } from './manifest.mjs';
import { syncVolumeCounters } from './counters.mjs';
import { measurePath } from './measure.mjs';
import { appendOpsLedger, readOpsLedger, resolveOpsLedgerPath } from './ledger.mjs';
import { LedgerPathDenegada } from './ledger-cerco.mjs';

/**
 * Identity-material denylist (contract §0.5) — basenames, case-insensitive.
 *
 * Exported since WP-U206 **sin cambiar un carácter de la lista**: el cerco
 * del ROOT (src/cerco.mjs) aplica exactamente este criterio al árbol vivo, y
 * una segunda copia de la lista sería una juntura por la que se cuela lo que
 * se añada aquí y allí no.
 */
export const IDENTITY_DENYLIST = [/^\.env/i, /\.pem$/i, /\.key$/i, /^id_rsa/i, /^secret/i];

/**
 * sha256 (hex) de los BYTES de un fichero.
 *
 * Exportado desde WP-U258 **sin cambiar un carácter de su cuerpo**, por el
 * mismo motivo que `IDENTITY_DENYLIST` y que `hashUnitTree`: es la primitiva
 * con la que el paso SELLAR anota `source.imported.hashes`, y el verificador
 * de integridad (src/verify.mjs, leg `ficheros`) tiene que recomputarla con la
 * MISMA primitiva. Una segunda copia de esta línea es una juntura por la que
 * se cuela cualquier divergencia futura (encoding, normalización, algoritmo).
 * @param {string} absFile
 */
export function sha256File(absFile) {
  return createHash('sha256').update(readFileSync(absFile)).digest('hex');
}

/**
 * Walk a tree; return { files: rel posix paths, symlinks: rel posix paths }.
 * Symlinks/junctions are detected via lstat and NOT followed.
 * @param {string} rootDir
 */
function walkTree(rootDir) {
  /** @type {string[]} */
  const files = [];
  /** @type {string[]} */
  const symlinks = [];
  /** @param {string} dir @param {string} rel */
  function walk(dir, rel) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      const st = lstatSync(abs);
      if (st.isSymbolicLink()) {
        symlinks.push(childRel);
        continue;
      }
      if (st.isDirectory()) {
        walk(abs, childRel);
      } else if (st.isFile()) {
        files.push(childRel);
      }
    }
  }
  if (existsSync(rootDir)) walk(rootDir, '');
  return { files: files.sort(), symlinks: symlinks.sort() };
}

/**
 * Content hash of a directory tree: sha256 over sorted `relPath:fileSha` lines.
 * @param {string} rootDir
 */
function hashTree(rootDir) {
  const { files } = walkTree(rootDir);
  const h = createHash('sha256');
  for (const rel of files) {
    h.update(`${rel}:${sha256File(join(rootDir, rel.split('/').join(sep)))}\n`);
  }
  return h.digest('hex');
}

/**
 * Deterministic pack identity: sha256 over name/version + sorted hashes map.
 * @param {{ name: string, version: string, hashes: Record<string, string> }} m
 */
function computePackHash(m) {
  const h = createHash('sha256');
  h.update(`${m.name}@${m.version}\n`);
  for (const rel of Object.keys(m.hashes).sort()) {
    h.update(`${rel}:${m.hashes[rel]}\n`);
  }
  return h.digest('hex');
}

/**
 * Retira el staging SIN PODER CAMBIAR EL DESENLACE (WP-U268).
 *
 * El `rmSync` del `finally` era la peor de las seis entradas medidas y no por
 * ser la más probable, sino por lo que HACE: una excepción en un `finally`
 * **sustituye al `return`**, así que un `EBUSY` al retirar un directorio
 * temporal borraba el resultado de un import COMPLETO —corpus aterrizado,
 * manifiesto re-sellado y asiento escrito— y lo entregaba al llamante como una
 * excepción indistinguible de un fallo real (medido: §2·E4 del reporte). Un
 * conserje no puede decidir si la obra salió bien.
 *
 * Así que la limpieza no lanza: devuelve su desenlace, y `importPack` lo publica
 * en el campo `staging` de toda salida posterior a STAGING. Dos consecuencias
 * declaradas:
 *  - `maxRetries` existe porque el bloqueo típico (otro proceso con un handle
 *    abierto un instante) es TRANSITORIO y el contrato §1 dice que el staging
 *    nunca sobrevive; cuesta como mucho ~0,3 s y SÓLO en el camino que ya iba a
 *    fallar. No convierte en éxito un bloqueo persistente: el de la prueba
 *    (cwd dentro del staging) sigue devolviendo `eliminado:false`;
 *  - cuando falla de verdad, el staging **sobrevive dentro del root** y lo ve el
 *    cerco de arranque (`cerco.mjs` recorre el root entero). No se calla: sale
 *    en `staging.causa` con syscall y ruta.
 * @param {string} dir
 * @returns {{ dir: string, eliminado: boolean, causa: object|null }}
 */
export function limpiarStaging(dir) {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    return { dir, eliminado: true, causa: null };
  } catch (err) {
    return { dir, eliminado: false, causa: causaDe(err) };
  }
}

/**
 * Import a Release pack (already expanded on disk) into the canonical
 * volumes root. See module header + plan/CONTRATO-IMPORT-PACK-v1.md.
 *
 * @param {object} opts
 * @param {string} opts.packRoot — expanded pack directory (manifest.json + volumes/)
 * @param {string} [opts.volumesRoot] — consistency assertion only; must equal the canonical resolution
 * @param {string} [opts.role] — intent role; omitted resolves to player → denied (hostile-omit)
 * @param {string} [opts.actorId]
 * @param {string} [opts.origin] — inert provenance metadata (cerco §10.8)
 * @param {{ volumesRoot?: string, ledgerPath?: string }} [opts.ledger]
 * @returns {object} { ok, noop, steps[], … } — failures: { ok:false, step, error, steps[] }
 */
export function importPack(opts) {
  const { packRoot, actorId = 'ops', origin = null, ledger: ledgerOpts = {} } = opts || {};
  /** @type {object[]} */
  const steps = [];
  // U268 · el desenlace de la limpieza viaja por REFERENCIA: el `finally` lo
  // rellena DESPUÉS de que cada `return` haya construido su objeto, y como es el
  // mismo objeto el llamante lo ve relleno. Es lo que permite que la limpieza
  // informe sin poder sustituir al resultado. `dir` sigue en `null` mientras no
  // haya staging, y ése es el interruptor de si el campo aparece o no: una
  // precondición denegada no puede hablar de un directorio que nunca existió.
  /** @type {{ dir: string|null, eliminado: boolean|null, causa: object|null }} */
  const limpieza = { dir: null, eliminado: null, causa: null };
  const fail = (step, error, extra = {}) => ({
    ok: false,
    step,
    error,
    steps,
    ...(limpieza.dir ? { staging: limpieza } : {}),
    ...extra
  });

  // Precondition (contract §0.6): operator-only intent; omitted role → player → denied.
  const role = resolveIntentRole({ role: opts?.role });
  const auth = assertIntentRole(
    { actorId, intent: 'import_pack', role },
    VOLUMES_OPS_CATALOG
  );
  if (!auth.ok) {
    return fail('precondicion-rol', auth.error, { role });
  }

  // ── Precondición (WP-U253b): el ASIENTO se juzga ANTES de VERIFICAR ─────
  // El cerco del ledger (U253a) falla cerrado LANZANDO, y hasta este WP la
  // única llamada que lo ejercía era la última línea de la función: la
  // denegación llegaba con el corpus ya aterrizado y el manifiesto ya
  // re-sellado. Aquí no se ha tocado nada todavía, así que una propuesta
  // inadmisible sale por el contrato y el root queda como estaba, byte a byte.
  //
  // COPIA ÚNICA, y por el mismo motivo que `ledger.mjs:28-31`: `opts.ledger`
  // puede traer getters, y leer un campo dos veces deja que devuelva un valor
  // para la guarda y otro para el uso. `ledger.mjs` cierra ese hueco DENTRO de
  // la resolución; entregar el objeto VIVO hasta el asiento lo reabría un nivel
  // más arriba — medido: un getter de `ledgerPath` que devuelve una ruta
  // inocente la primera vez y el manifiesto la segunda pasaba la precondición y
  // hacía lanzar al apéndice con el corpus ya aterrizado. Un solo `spread` lee
  // cada campo UNA vez; a partir de aquí nadie vuelve a tocar `ledgerOpts`.
  const ledgerFijo = { ...(ledgerOpts ?? {}) };
  /** @type {string|null} */
  let ledgerPath = null;
  try {
    ledgerPath = resolveOpsLedgerPath(ledgerFijo);
  } catch (err) {
    // Si el ROOT CANÓNICO no resuelve (U200), ese fallo tiene su propio paso y
    // en la base ocurría antes que nada del ledger: la precondición no juzga y
    // deja hablar a VERIFICAR. Se le PREGUNTA al resolvedor en vez de adivinarlo
    // por el mensaje, que es lo único que distingue «el entorno está mal» de
    // «lo que trajo el llamante está mal».
    let rootCanonicoResuelve = true;
    try {
      resolveVolumesRoot();
    } catch {
      rootCanonicoResuelve = false;
    }
    if (rootCanonicoResuelve) {
      if (err instanceof LedgerPathDenegada) {
        return fail('precondicion-ledger', err.code, {
          ledger: { detail: err.detail ?? null, message: err.message }
        });
      }
      // Ni cerco ni entorno: `ledger` trae algo que no es utilizable. El campo
      // `volumesRoot` está en el contrato (@param de arriba) y hasta este WP no
      // lo tocaba ninguna prueba del repo; con `{volumesRoot: 42}` la resolución
      // revienta con `TypeError`, y tragárselo aquí dejaba además `ledgerPath`
      // en `null`, lo que desactivaba de paso la guarda de fusión de abajo.
      return fail('precondicion-ledger', 'ledger_opts_invalidas', {
        ledger: { causa: causaDe(err) }
      });
    }
  }
  if (ledgerPath !== null) {
    // Un ledger existente con una línea ilegible revienta la RELECTURA con la
    // que `appendOpsLedger` numera el asiento. Medido: ocurre también sobre la
    // ruta POR DEFECTO, sin que nadie proponga nada, y dejaba el import a
    // medias igual que una ruta denegada. Se lee una vez aquí; el apéndice ya
    // lee el fichero entero, así que no se introduce un orden de magnitud nuevo.
    //
    // Lo que esta lectura NO comprueba es que el fichero se pueda ESCRIBIR. Es
    // deliberado y está declarado: una sonda de escribibilidad tendría que
    // tocar el root antes de VERIFICAR, que es exactamente lo que la CA-2 de
    // este WP prohíbe. Un ledger legible pero no escribible sigue haciendo
    // lanzar al apéndice con todo aterrizado — es la familia «sólo conocible
    // DESPUÉS de fusionar», enrutada a WP-U268 (ver §4 del reporte).
    try {
      readOpsLedger({ volumesRoot: ledgerFijo.volumesRoot, ledgerPath });
    } catch (err) {
      return fail('precondicion-ledger', 'ledger_ilegible', {
        ledger: { path: ledgerPath, causa: causaDe(err) }
      });
    }
  }

  // ── 1 · VERIFICAR ──────────────────────────────────────────────────────
  if (!packRoot || !existsSync(packRoot)) {
    return fail('verificar', 'pack_no_encontrado');
  }
  const packManifestPath = join(packRoot, 'manifest.json');
  if (!existsSync(packManifestPath)) {
    return fail('verificar', 'pack_sin_manifest');
  }
  /** @type {any} */
  let pack;
  try {
    pack = JSON.parse(readFileSync(packManifestPath, 'utf8'));
  } catch {
    return fail('verificar', 'pack_manifest_ilegible');
  }
  if (
    typeof pack.name !== 'string' ||
    typeof pack.version !== 'string' ||
    !pack.volumes ||
    typeof pack.volumes !== 'object' ||
    Object.keys(pack.volumes).length === 0 ||
    !pack.hashes ||
    typeof pack.hashes !== 'object'
  ) {
    return fail('verificar', 'pack_manifest_incompleto');
  }

  const dataRoot = join(packRoot, 'volumes');
  const tree = walkTree(dataRoot);
  if (tree.symlinks.length > 0) {
    // Contract §0.4: a link inside a pack IS a living anchor — reject.
    return fail('verificar', 'symlink_en_pack', { symlinks: tree.symlinks });
  }
  const identityHits = tree.files.filter((rel) =>
    IDENTITY_DENYLIST.some((re) => re.test(basename(rel)))
  );
  if (identityHits.length > 0) {
    return fail('verificar', 'material_de_identidad', { files: identityHits });
  }
  const declared = Object.keys(pack.hashes).sort();
  const unlisted = tree.files.filter((rel) => !pack.hashes[rel]);
  if (unlisted.length > 0) {
    return fail('verificar', 'fichero_sin_enumerar', { files: unlisted });
  }
  for (const rel of declared) {
    const abs = join(dataRoot, rel.split('/').join(sep));
    if (!existsSync(abs)) {
      return fail('verificar', 'fichero_declarado_ausente', { file: rel });
    }
    const actual = sha256File(abs);
    if (actual !== pack.hashes[rel]) {
      return fail('verificar', 'hash_no_coincide', {
        file: rel,
        declared: pack.hashes[rel],
        actual
      });
    }
  }
  // Destination: canonical root (U200 — env mandatory, node_modules refused).
  let volumesRoot;
  try {
    volumesRoot = resolveVolumesRoot();
  } catch (err) {
    return fail('verificar', err instanceof Error ? err.message : String(err));
  }
  if (opts?.volumesRoot && resolve(opts.volumesRoot) !== volumesRoot) {
    return fail('verificar', 'root_inconsistente', {
      given: resolve(opts.volumesRoot),
      canonical: volumesRoot
    });
  }
  // Destination manifest must exist (U199: no manifest → not operable).
  let sealBefore;
  try {
    sealBefore = hashManifest();
  } catch (err) {
    return fail('verificar', err instanceof Error ? err.message : String(err));
  }
  /** @type {any} */
  const destConfig = JSON.parse(readFileSync(sealBefore.path, 'utf8'));
  destConfig.volumes = destConfig.volumes || {};
  const packHash = computePackHash(pack);
  steps.push({
    step: 'verificar',
    ok: true,
    files: tree.files.length,
    packHash,
    manifestSha256: sealBefore.sha256
  });

  // ── FAMILIA (driver seed U202 → U242): detect per volume ───────────────
  // Declared unknown family = abort (H-01 §③: sin driver no se importa).
  /** @type {Record<string, string|null>} */
  const families = {};
  /** @type {Record<string, string[]>} */
  const volumeFilesById = {};
  for (const [volId, vol] of Object.entries(pack.volumes)) {
    const prefix = `${vol.path}/`;
    volumeFilesById[volId] = tree.files
      .filter((rel) => rel.startsWith(prefix))
      .map((rel) => rel.slice(prefix.length));
    const detected = detectVolumeFamily(
      vol,
      volumeFilesById[volId],
      join(dataRoot, String(vol.path).split('/').join(sep))
    );
    if (detected.error) {
      return fail('familia', detected.error, {
        volume: volId,
        family: detected.family
      });
    }
    families[volId] = detected.family;
    // Generic (family-less) volumes with declared corpora: every file must
    // live under a corpus path — family volumes own their layout via the
    // driver (e.g. FORCES keeps registry.json at the volume root).
    if (!detected.family && Array.isArray(vol.corpora) && vol.corpora.length > 0) {
      const corpusPrefixes = vol.corpora.map((c) => `${c.path || c.id}/`);
      const strays = volumeFilesById[volId].filter(
        (rel) => !corpusPrefixes.some((p) => rel.startsWith(p))
      );
      if (strays.length > 0) {
        return fail('familia', 'fichero_fuera_de_corpus', {
          volume: volId,
          files: strays
        });
      }
    }
  }
  steps.push({ step: 'familia', ok: true, families });

  // ── 6 · NO-OP (decided after VERIFICAR, before STAGING) ────────────────
  //
  // U259 · el NO-OP tiene una segunda condición, y hace falta. «Ya sellado con
  // este contenido» se decidía sólo por `packHash`, así que un root sellado por
  // una versión ANTERIOR al contrato de snapshot se quedaba para siempre sin
  // él: el import respondía `noop:true` («ya está») y el tramo de snapshot
  // seguía en «omitido honesto». Medido sobre el root de referencia, que es
  // exactamente ese caso: su volumen LINEAS no llevaba snapshot y ninguna
  // re-ejecución del sellador se lo iba a poner.
  //
  // La condición añadida es de FORMA, no de VALOR — a propósito. Comparar el
  // snapshot sellado con el recomputado abriría una vía de blanqueo: un volumen
  // CORROMPIDO dejaría de ser NO-OP, el import correría y volvería a sellar la
  // corrupción como si fuera legítima. Lo que se comprueba es sólo que el
  // registro sellado NO CAREZCA de un snapshot que la familia sí sabe sellar; y
  // eso una corrupción de datos no lo puede provocar (no borra campos del
  // manifiesto, y si los borrara el sello se rompería y `sello_vs_ledger` lo
  // cazaría antes).
  const faltaSnapshotDeContrato = (id) => {
    const dest = destConfig.volumes[id];
    if (dest?.source?.imported?.snapshot) return false;
    const fam = families[id];
    return Boolean(fam && FAMILY_DRIVERS[fam]?.snapshotOf);
  };
  const allSealed = Object.keys(pack.volumes).every((id) => {
    const dest = destConfig.volumes[id];
    return (
      dest?.source?.imported?.name === pack.name &&
      dest?.source?.imported?.packHash === packHash &&
      !faltaSnapshotDeContrato(id)
    );
  });
  if (allSealed) {
    steps.push({ step: 'no-op', ok: true, manifestSha256: sealBefore.sha256 });
    return {
      ok: true,
      noop: true,
      volumesRoot,
      packHash,
      manifestSha256: sealBefore.sha256,
      steps
    };
  }

  // ── 2 · STAGING (inside the destination root — same device) ────────────
  const stagingDir = join(
    volumesRoot,
    `.import-staging-${pack.name.replace(/[^a-z0-9-]/gi, '_')}-${process.pid}-${Date.now()}`
  );
  limpieza.dir = stagingDir;
  try {
    for (const rel of tree.files) {
      const from = join(dataRoot, rel.split('/').join(sep));
      const to = join(stagingDir, rel.split('/').join(sep));
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to); // materializes: copies bytes, never links
    }
    steps.push({ step: 'staging', ok: true, dir: stagingDir, files: tree.files.length });

    // ── 3 · VALIDAR ──────────────────────────────────────────────────────
    // Candidate manifest (merge in memory) against the linea-kit U80 gate.
    const candidate = structuredClone(destConfig);
    for (const [volId, vol] of Object.entries(pack.volumes)) {
      candidate.volumes[volId] = {
        disk: vol.disk,
        path: vol.path,
        readonly: vol.readonly ?? true,
        label: vol.label || volId,
        corpora: (vol.corpora || []).map((c) => ({
          id: c.id,
          path: c.path || c.id,
          label: c.label || c.id
        }))
      };
    }
    const schema = validateSchema('volumes', candidate);
    if (!schema.ok) {
      return fail('validar', 'schema_invalido', { errors: schema.errors });
    }
    // Re-hash of the staged copies must still match the pack declaration.
    for (const rel of declared) {
      const staged = join(stagingDir, rel.split('/').join(sep));
      if (sha256File(staged) !== pack.hashes[rel]) {
        return fail('validar', 'staging_corrupto', { file: rel });
      }
    }
    // Family gate (U202): staged tree against the REAL family validators.
    for (const [volId, vol] of Object.entries(pack.volumes)) {
      if (!families[volId]) continue;
      const driver = FAMILY_DRIVERS[families[volId]];
      const fam = driver.validate({
        stagedDir: join(stagingDir, vol.path.split('/').join(sep))
      });
      if (!fam.ok) {
        return fail('validar', 'familia_invalida', {
          volume: volId,
          family: families[volId],
          results: fam.results.filter((r) => !r.ok)
        });
      }
    }
    steps.push({ step: 'validar', ok: true, schema: 'volumes', files: declared.length });

    // ── 4 · FUSIONAR ─────────────────────────────────────────────────────
    // Dry pass: EVERY collision is detected before the first rename.
    /** @type {{ kind: 'volume'|'corpus'|'file', volId: string, corpus?: object, from: string, to: string }[]} */
    const moves = [];
    /** @type {{ volId: string, corpusId: string }[]} */
    const noopCorpora = [];
    /** @type {object[]} */
    const familyReports = [];
    // U255 · el pase dry LEE el destino (hash de un fichero, walk de una
    // unidad, índice por clave) y esas lecturas LANZAN cuando el destino no
    // tiene la forma que el driver supone — medido: `EISDIR` en LINEAS con un
    // directorio donde el pack trae un fichero, `ENOTDIR` en FORCES con un
    // fichero en la ruta de una unidad. Los dos casos concretos los cierran
    // ahora los drivers con su propio código de error; esto es la red para lo
    // que quede: el contrato promete `{ok:false, step, error}` en TODO fallo, y
    // una excepción que se escapa de `importPack` deja al llamador (ruta REST,
    // herramienta MCP) con un 500 sin paso ni diagnóstico. Aquí no se ha movido
    // nada todavía, así que el destino está intacto por construcción.
    try {
      for (const [volId, vol] of Object.entries(pack.volumes)) {
        const dest = destConfig.volumes[volId];
        const volDestAbs = join(volumesRoot, vol.path.split('/').join(sep));
        if (families[volId]) {
          // Family volume (U202): the driver returns the merge PLAN; the
          // family rules (escribe-lo-que-falta, divergencia-reportada,
          // curación intocable) replace the generic corpus collision.
          if (!dest) {
            const clash = Object.entries(destConfig.volumes).find(
              ([, v]) => v.path === vol.path && v.disk === vol.disk
            );
            if (clash) {
              return fail('fusionar', 'slot_en_conflicto', {
                volume: volId,
                claimedBy: clash[0]
              });
            }
            if (existsSync(volDestAbs) && walkTree(volDestAbs).files.length > 0) {
              return fail('fusionar', 'slot_ocupado', { volume: volId, path: vol.path });
            }
          }
          const driver = FAMILY_DRIVERS[families[volId]];
          const plan = driver.merge({
            stagedDir: join(stagingDir, vol.path.split('/').join(sep)),
            destDir: volDestAbs,
            volumeFiles: volumeFilesById[volId]
          });
          if (plan.error) {
            // Driver collision (e.g. FORCES RO-immutable): abort in dry pass.
            return fail('fusionar', plan.error.code, {
              volume: volId,
              ...(plan.error.detail || {})
            });
          }
          // U255 · `overwrites` = las rutas que el driver reemplaza A PROPÓSITO
          // sobre un fichero ya existente. Hoy sólo FORCES lo usa, y sólo para
          // su `registry.json`. Viaja en el movimiento para que la guarda del
          // plan sepa distinguir un reemplazo DECLARADO de una sobrescritura
          // accidental —que es pérdida de dato en silencio, porque `renameSync`
          // no avisa— y para que el deshacer pueda apartar el fichero pisado.
          const overwrites = new Set(plan.overwrites ?? []);
          for (const rel of plan.moves) {
            const relFull = `${vol.path}/${rel}`;
            moves.push({
              kind: 'file',
              volId,
              ...(overwrites.has(rel) ? { sobrescribe: true } : {}),
              from: join(stagingDir, relFull.split('/').join(sep)),
              to: join(volumesRoot, relFull.split('/').join(sep))
            });
          }
          familyReports.push({
            id: volId,
            family: families[volId],
            moved: plan.moves.length,
            skipped: plan.skips?.length ?? 0,
            divergences: plan.divergences ?? [],
            protectedSidecars: plan.protectedSidecars ?? [],
            // U204: unión aditiva por clave — lo deduplicado se REPORTA con la
            // ruta donde la clave ya vivía (no-op observable, nada pisado).
            dedup: plan.dedup ?? [],
            snapshot: plan.snapshot ?? null
          });
          continue;
        }
        if (!dest) {
          // New volume: its disk/path must not be claimed by another volume.
          const clash = Object.entries(destConfig.volumes).find(
            ([, v]) => v.path === vol.path && v.disk === vol.disk
          );
          if (clash) {
            return fail('fusionar', 'slot_en_conflicto', {
              volume: volId,
              claimedBy: clash[0]
            });
          }
          if (existsSync(volDestAbs) && walkTree(volDestAbs).files.length > 0) {
            return fail('fusionar', 'slot_ocupado', { volume: volId, path: vol.path });
          }
          moves.push({
            kind: 'volume',
            volId,
            from: join(stagingDir, vol.path.split('/').join(sep)),
            to: volDestAbs
          });
          continue;
        }
        // Existing volume: per-corpus fusion. Corpus id collision with
        // different content = ERROR, no merge (v0 paso 4, kept in v1).
        const destCorpora = new Map((dest.corpora || []).map((c) => [c.id, c]));
        for (const corpus of vol.corpora || []) {
          const corpusRel = `${vol.path}/${corpus.path || corpus.id}`;
          const from = join(stagingDir, corpusRel.split('/').join(sep));
          const to = join(volumesRoot, corpusRel.split('/').join(sep));
          const existsInDest = destCorpora.has(corpus.id) || existsSync(to);
          if (existsInDest) {
            const same = existsSync(to) && hashTree(to) === hashTree(from);
            if (!same) {
              return fail('fusionar', 'colision_corpus', {
                volume: volId,
                corpus: corpus.id
              });
            }
            noopCorpora.push({ volId, corpusId: corpus.id });
            continue;
          }
          moves.push({ kind: 'corpus', volId, corpus, from, to });
        }
      }
    } catch (err) {
      return fail('fusionar', 'plan_no_calculable', { causa: causaDe(err) });
    }

    // ── U255 · GUARDA ESTRUCTURAL DEL PLAN ENTERO ────────────────────────
    // El contrato dice «pase 1 (dry): TODA colisión se detecta ANTES de mover
    // nada». Cada driver comprueba lo SUYO —y los cuatro lo hacen ya—, pero
    // ninguno ve el plan completo: el volumen sin familia y el movimiento de
    // corpus no pasan por driver, y dos volúmenes ANIDADOS del mismo pack
    // ocurren en el bucle de arriba, fuera del alcance de cualquiera de ellos
    // (deuda de U201, citada por `driver-firehose.mjs`). La guarda se aplica
    // aquí, sobre la lista entera, justo antes del primer `rename`.
    const guarda = inspectFusionPlan(moves, volumesRoot);
    if (guarda.error) {
      return fail('fusionar', guarda.error.code, guarda.error.detail);
    }

    // ── U253b · LA FUSIÓN NO PUEDE SEPULTAR EL SITIO DEL ASIENTO ─────────
    // La precondición juzga la ruta del ledger contra el root TAL COMO ESTÁ al
    // entrar. Un pack puede traer un directorio que aterrice exactamente sobre
    // esa ruta: entonces la propuesta era admisible al principio y el cerco la
    // deniega al final (`ledger_path_es_directorio`), con todo ya movido —
    // medido en §4 (vector C1) del reporte de este WP. Se decide aquí, sobre el
    // plan completo y antes del primer rename, que es donde el dato existe.
    //
    // Se deniegan TRES formas: que un FICHERO aterrice EN la ruta del ledger
    // (le apendaríamos JSONL a un fichero del pack), que aterrice DEBAJO de
    // ella (la convierte en directorio → `ledger_path_es_directorio`), y que
    // aterrice COMO ANCESTRO de ella (el `mkdirSync` del apéndice choca contra
    // un fichero → `ENOTDIR`/`ENOENT`). La tercera faltaba en la primera
    // versión de esta guarda, y el comentario declaraba cerrado el conjunto en
    // «dos formas y ninguna más»: era una frase más ancha que el código. El
    // vector —`<vol>/raw/a.json/ops.jsonl` cuando el pack trae el FICHERO
    // `raw/a.json`— vive además dentro de la zona que el control de abajo
    // bendice como legítima, así que la frase tapaba justo su propio hueco.
    //
    // Lo que sigue permitido, y hay control que lo vigila: un ledger que viva
    // dentro de un volumen que el pack trae sin que ningún fichero caiga en su
    // ruta, ni debajo, ni por encima (`<vol>/ops.jsonl`). Estrechar eso sería
    // convertir en rojo un caso que hoy es verde.
    //
    // La comparación es contra los FICHEROS que van a aterrizar, no contra los
    // `to` del plan: un volumen nuevo viaja como UN solo movimiento de
    // directorio, así que mirar los `to` no ve las hojas — medido, el vector C1
    // se escapaba entero por ahí. El staging todavía está intacto y es el mismo
    // árbol que va a aterrizar, así que enumerarlo aquí es exacto y barato.
    if (ledgerPath !== null) {
      const ledgerAbs = resolve(ledgerPath);
      /** ¿`abajo` cuelga estrictamente de `arriba`? Por segmentos, no por prefijo. */
      const cuelgaDe = (arriba, abajo) => {
        const rel = relative(arriba, abajo);
        return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
      };
      /** @type {{ volId: string, kind: string, destino: string }[]} */
      const aterrizan = [];
      for (const m of moves) {
        if (existsSync(m.from) && lstatSync(m.from).isDirectory()) {
          for (const rel of walkTree(m.from).files) {
            aterrizan.push({
              volId: m.volId,
              kind: m.kind,
              destino: join(m.to, rel.split('/').join(sep))
            });
          }
        } else {
          aterrizan.push({ volId: m.volId, kind: m.kind, destino: m.to });
        }
      }
      const choque = aterrizan.find(({ destino }) => {
        const d = resolve(destino);
        return d === ledgerAbs || cuelgaDe(ledgerAbs, d) || cuelgaDe(d, ledgerAbs);
      });
      if (choque) {
        return fail('fusionar', 'ledger_en_ruta_de_fusion', {
          volume: choque.volId,
          kind: choque.kind,
          ledgerPath: ledgerAbs,
          destino: resolve(choque.destino)
        });
      }
    }

    // Apply pass: rename-only (same device — staging lives inside the root).
    // Con red (U255): lo que no se puede comprobar por adelantado —permiso
    // denegado, fichero tomado por otro proceso, montaje que rinde EXDEV, una
    // carrera contra el operador— ya no deja el volumen a medias: se deshacen
    // los renombrados hechos y el fallo se declara con su inventario.
    const aplicacion = applyFusion(moves, guarda.slotsVacios);
    if (aplicacion.error) {
      return fail('fusionar', aplicacion.error.code, aplicacion.error.detail);
    }

    /**
     * El asiento del ledger, construido en UN solo sitio (U268·devolución B1).
     * Se necesita en TRES: el apéndice normal, la recuperación cuando el
     * apéndice falla, y la recuperación cuando `sealManifest` lanza CON EL SELLO
     * YA PUESTO — ahí el `after` no es el que devolvió el sellador (no llegó a
     * devolver nada) sino el que hay VIVO en disco. Por eso el sello entra por
     * parámetro en vez de leerse de una variable.
     * @param {string} after — sha256 del manifiesto tal como está en disco
     */
    const construyeAsiento = (after) => ({
      kind: 'import_pack',
      intent: 'import_pack',
      role,
      actorId,
      pack: { name: pack.name, version: pack.version, packHash },
      volumes: Object.keys(pack.volumes),
      manifestSha256: { before: sealBefore.sha256, after },
      noopCorpora,
      families: familyReports.map((f) => ({
        id: f.id,
        family: f.family,
        divergences: f.divergences.length,
        protectedSidecars: f.protectedSidecars.length,
        dedup: f.dedup.length
      }))
    });

    /**
     * El manifiesto TAL COMO ESTÁ EN DISCO ahora mismo. `null` si no se puede
     * leer. No se cachea y no se supone: es la pregunta que faltaba en el
     * `catch` de SELLAR (ver ahí).
     * @returns {{ sha256: string, config: any|null }|null}
     */
    const manifiestoVivo = () => {
      try {
        const { raw } = readManifestRaw();
        let config = null;
        try {
          config = JSON.parse(raw.toString('utf8'));
        } catch {
          config = null; // truncado o corrupto: es un DATO, no un fallo de aquí
        }
        return { sha256: createHash('sha256').update(raw).digest('hex'), config };
      } catch {
        return null;
      }
    };

    // ── 5 · SELLAR ───────────────────────────────────────────────────────
    // Rewrite the manifest via manifest.mjs (the ONE legitimate writer):
    // volume entries + corpora seeded with MEASURED files/bytes (contract
    // §0.3 — «import pobla corpora») + inert provenance.
    //
    // ── U268 · REVERTIR SÓLO CON EL SELLO PROBADAMENTE INTACTO ────────────
    // La primera versión de este WP revertía en cuanto `sealManifest` lanzaba,
    // apoyándose en que «el manifiesto todavía está intacto». **Era una
    // suposición, y era falsa**: `manifest.mjs:72-77` ESCRIBE en (b) y sólo
    // hashea en (d), así que existe una subventana —del `open` que trunca hasta
    // el hash— en la que el sello YA cambió. Revertir ahí no restaura nada:
    // devuelve el corpus al staging, el `finally` lo borra, y el manifiesto se
    // queda declarando un import cuyos ficheros ya no existen.
    //
    // Medido con inyección que reproduce el estado en disco (reporte §6):
    //   - escritura COMPLETA y fallo posterior → la base dejaba `ledger_ausente`
    //     con los ficheros EN DESTINO (reparable apendando el asiento); aquella
    //     versión devolvía `aterrizado:false`, `sellado:null` y **borraba el
    //     corpus** → `ledger_ausente` + `volumen_ausente`;
    //   - escritura TRUNCADA (disco lleno: `writeFileSync` trunca al abrir) →
    //     `manifiesto_ilegible` con el corpus borrado.
    // Convertía un medio-aterrizaje recuperable en pérdida de datos permanente,
    // y lo declaraba al revés. La regla, ahora, es una y se comprueba:
    //
    //          **se revierte SÓLO si se PRUEBA que el sello no se movió.**
    //
    // «No se puede leer el manifiesto» NO es prueba: cae del lado de no
    // revertir, que es el lado que no destruye. Y con el sello movido no hay
    // nada que deshacer —el manifiesto ya declara el import—, así que se sale
    // por la misma puerta que el resto de la zona posterior al sello.
    //
    // El envoltorio cubre el CÓMPUTO además de la escritura a propósito. El
    // vector natural medido es `volumes.json` no escribible (EPERM en
    // `writeFileSync`, con el sello intacto); el cómputo —`sha256File` de lo
    // aterrizado, `snapshotOf` del driver, `measurePath`— lee el destino y no
    // tengo vector natural para hacerlo lanzar. Va dentro igualmente porque
    // ninguna excepción debe escapar de la zona posterior a FUSIONAR. Un solo
    // código (`sellar_interrumpido`) para no inventar taxonomía sin vector: la
    // `causa` lleva syscall, código y ruta reales.
    /** @type {{ path: string, sha256: string }} */
    let sealAfter;
    /** @type {object[]} */
    const importedReport = [];
    try {
      // El parte de FUSIONAR se anota AQUÍ DENTRO (devolución B2): estaba fuera
      // de todo envoltorio y ya es zona posterior a la fusión, así que un fallo
      // suyo se escapaba como excepción. Aquí queda cubierto por la misma regla
      // —y por el revert, porque el sello todavía no está puesto.
      steps.push({
        step: 'fusionar',
        ok: true,
        moved: moves.length,
        noopCorpora: noopCorpora.length,
        families: familyReports.map((f) => ({
          id: f.id,
          family: f.family,
          moved: f.moved,
          skipped: f.skipped,
          divergences: f.divergences.length,
          protectedSidecars: f.protectedSidecars.length,
          dedup: f.dedup.length
        }))
      });
      const sealed = structuredClone(destConfig);
      for (const [volId, vol] of Object.entries(pack.volumes)) {
        const prev = sealed.volumes[volId] || {};
        // ── SELLO POR FICHERO (WP-U258) ────────────────────────────────────
        // `pack.hashes` describe el PACK, no el destino: la familia LINEAS deja
        // el fichero del destino intacto cuando diverge (driver-lineas.mjs:184)
        // y NUNCA pisa un `.md` curado (:169). Sellar el hash del pack sería
        // sellar una mentira en cuanto un import diverge, y el root dejaría de
        // arrancar por su propia anotación. Así que se recomputa del DESTINO,
        // después de FUSIONAR: se sella lo que ATERRIZÓ.
        //
        // Alcance declarado: el conjunto de rutas es el que el pack trajo para
        // este volumen. Un fichero que ya viviera en el destino y que el pack no
        // enumere NO entra en el sello — y es deliberado: el árbol vivo puede
        // recibir material lateral que el repo no controla, y una igualdad de
        // CONJUNTO convertiría eso en un arranque denegado. Lo que este sello
        // garantiza es exacto: **cada fichero sellado sigue byte a byte igual, o
        // el arranque se niega**. Las ALTAS no las cubre este leg (las cubren el
        // snapshot de unidad, donde la familia lo sella, y el leg de corpora
        // cuando el import sembró files/bytes).
        //
        // Coste declarado: el manifiesto crece una línea por fichero sellado. Es
        // la misma escala que el `hashes` del manifiesto de pack (§0.2), que ya
        // enumera fichero a fichero; no se introduce un orden de magnitud nuevo.
        /** @type {Record<string, string>} */
        const landedHashes = {};
        /** @type {string[]} */
        const noAterrizados = [];
        for (const rel of volumeFilesById[volId] || []) {
          const abs = join(volumesRoot, `${vol.path}/${rel}`.split('/').join(sep));
          if (existsSync(abs)) landedHashes[rel] = sha256File(abs);
          else noAterrizados.push(rel);
        }
        // Snapshot recomputado del DESTINO (ver el bloque de abajo). `null` si el
        // volumen no es de familia o si su driver no sella snapshot.
        const famDriver = families[volId] ? FAMILY_DRIVERS[families[volId]] : null;
        const landedSnapshot = famDriver?.snapshotOf
          ? famDriver.snapshotOf(join(volumesRoot, vol.path.split('/').join(sep)))
          : null;
        const corpora = (vol.corpora || []).map((c) => {
          const corpusAbs = join(
            volumesRoot,
            `${vol.path}/${c.path || c.id}`.split('/').join(sep)
          );
          const m = measurePath(corpusAbs);
          return {
            id: c.id,
            path: c.path || c.id,
            label: c.label || c.id,
            files: m.files,
            bytes: m.bytes
          };
        });
        sealed.volumes[volId] = {
          ...prev,
          disk: vol.disk,
          path: vol.path,
          readonly: vol.readonly ?? true,
          label: vol.label || prev.label || volId,
          ...(families[volId] ? { family: families[volId] } : {}),
          source: {
            ...(prev.source || {}),
            imported: {
              name: pack.name,
              version: pack.version,
              packHash,
              importedAt: new Date().toISOString(),
              ...(origin ? { origin } : {}), // inert metadata (cerco §10.8)
              // Sello por fichero (U258): `<relPosix>` → sha256 de lo aterrizado.
              ...(Object.keys(landedHashes).length > 0 ? { hashes: landedHashes } : {}),
              // ── SNAPSHOT DE UNIDAD (U203 · recomputado del DESTINO en U259) ─
              // Antes se copiaba del PLAN del driver, que se calcula sobre el
              // STAGING. En FORCES daba igual (una unidad que difiera aborta el
              // import), pero en LINEAS **no**: el driver conserva el fichero del
              // destino cuando diverge y jamás pisa un `.md` curado, así que el
              // árbol que queda tras fusionar NO es el del pack. Sellar el
              // staging anotaría un árbol que el volumen no tiene y el root
              // dejaría de arrancar POR HABER IMPORTADO BIEN — el defecto exacto
              // que U258 cerró para el sello por fichero, aquí para el de unidad.
              // Misma regla para las cuatro familias, un solo momento: **después
              // de FUSIONAR, desde el destino**, con el `snapshotOf()` del propio
              // driver que verifica.
              ...(landedSnapshot ? { snapshot: landedSnapshot } : {})
            }
          },
          ...(corpora.length > 0 ? { corpora } : {})
        };
        importedReport.push({
          id: volId,
          corpora,
          hashes: Object.keys(landedHashes).length,
          snapshot: landedSnapshot,
          // Cero en todo camino de los drivers actuales; se REPORTA en vez de
          // callarse para que un plan de fusión que deje un fichero sin
          // aterrizar sea observable en la salida del import, no invisible.
          unsealed: noAterrizados
        });
      }
      sealAfter = sealManifest(sealed);
    } catch (err) {
      // ⚠ ZONA SIN RED. Este `catch` está FUERA de la red de última línea (que
      // sólo cubre lo posterior al sello): lo que lance aquí dentro se escapa de
      // `importPack`. Hoy nada lo hace, pero **por construcción, no por guarda**
      // —revisado pieza a pieza—, y eso es más débil que una red. Antes de
      // añadir aquí cualquier llamada que toque disco, envolverla. Ver la
      // cabecera del módulo.
      //
      // Se PREGUNTA por el sello antes de decidir. Ver el bloque de arriba.
      const vivo = manifiestoVivo();
      const selloIntacto = vivo !== null && vivo.sha256 === sealBefore.sha256;

      if (!selloIntacto) {
        // ── El sello YA se movió (o no se puede leer). NO se revierte. ─────
        // Deshacer aquí sería sacar de destino unos ficheros que el manifiesto
        // ya está declarando, y el `finally` los borraría con el staging.
        const sellado = { before: sealBefore.sha256, after: vivo?.sha256 ?? null };
        // ¿El manifiesto que hay en disco DICE lo que este import quería
        // sellar? Se le pregunta a él, no se re-serializa: una escritura
        // completa parsea y declara el `packHash` de todos los volúmenes; una
        // truncada (disco lleno) ni siquiera parsea.
        const completo =
          Boolean(vivo?.config) &&
          Object.keys(pack.volumes).every(
            (id) => vivo.config.volumes?.[id]?.source?.imported?.packHash === packHash
          );
        return fail('post-fusion', completo ? 'sello_sin_confirmar' : 'manifiesto_a_medias', {
          aterrizado: true,
          volumes: Object.keys(pack.volumes),
          sellado,
          asiento: false,
          causa: causaDe(err),
          recuperacion: completo
            ? {
                // Mismo estado que `asiento_no_escribible`, misma cura: el
                // manifiesto quedó escrito y sólo falta el asiento que lo
                // respalde. El `after` es el sello VIVO, no el que el sellador
                // iba a devolver.
                via: 'appendOpsLedger',
                ledgerPath,
                entrada: construyeAsiento(vivo.sha256),
                nota:
                  'el manifiesto quedó ESCRITO pero el sellador no llegó a confirmarlo; el root ' +
                  'no arranca sin asiento (verify.mjs · ledger_ausente) y repetir el import ' +
                  'responde noop:true sin escribirlo'
              }
            : {
                via: 'operador',
                nota:
                  'volumes.json quedó a medias (p. ej. disco lleno: writeFileSync trunca al ' +
                  'abrir): NO se revirtió la fusión a propósito, el corpus sigue en destino. ' +
                  'Restaurar el manifiesto y volver a importar; revertir habría borrado datos',
                volumenesEnDestino: Object.entries(pack.volumes).map(([id, v]) => ({
                  id,
                  path: v.path
                }))
              }
        });
      }

      // ── Sello PROBADAMENTE intacto ⇒ revertir es lo honesto (y hace falta:
      // sin deshacer, el corpus queda en destino sin entrada en el manifiesto y
      // la segunda pasada muere con `slot_ocupado`). El inventario de lo que NO
      // se pudo deshacer viaja entero: un rollback que dice «todo restaurado»
      // sin comprobarlo no vale (U255), y si queda algo sin deshacer entonces SÍ
      // hubo medio-aterrizaje y se declara.
      const vuelta = deshacerFusion(aplicacion.movimientos);
      return fail('sellar', 'sellar_interrumpido', {
        causa: causaDe(err),
        aterrizado: vuelta.sinDeshacer.length > 0,
        sellado: null,
        asiento: false,
        revertido: {
          renombradosHechos: aplicacion.movimientos.length,
          renombradosDeshechos: vuelta.deshechos.length,
          sinDeshacer: vuelta.sinDeshacer
        },
        recuperacion:
          vuelta.sinDeshacer.length === 0
            ? {
                via: 'importPack',
                nota:
                  'el root volvió a su estado previo: corregir la causa (p. ej. permiso de ' +
                  'escritura sobre volumes.json) y repetir el mismo import'
              }
            : {
                via: 'operador',
                nota:
                  'quedaron renombrados sin deshacer: retirar a mano las rutas de `sinDeshacer` ' +
                  'antes de repetir el import, o el slot aparecerá ocupado',
                rutas: vuelta.sinDeshacer.map((s) => s.to)
              }
      });
    }
    // ── U268 · A PARTIR DE AQUÍ EL SELLO ESTÁ PUESTO: SE DECLARA ──────────
    // Molde único de las salidas de esta zona, para que ninguna se olvide de
    // decir lo mismo: aterrizó, con qué sello, con o sin asiento, y cómo se
    // repara. `step:'post-fusion'` es el nombre del medio-aterrizaje.
    const trasFusion = (error, extra) =>
      fail('post-fusion', error, {
        aterrizado: true,
        volumes: Object.keys(pack.volumes),
        sellado: { before: sealBefore.sha256, after: sealAfter.sha256 },
        ...extra
      });

    /** @type {object|null} */
    let seat = null;
    /** @type {object|null} */
    let entradaAsiento = null;
    // ── LA RED DE ÚLTIMA LÍNEA (devolución B2) ────────────────────────────
    // La primera versión decía «el sello y el asiento son un PAR sin nada en
    // medio». Era prosa: entre los dos corrían el `steps.push` de `sellar` (con
    // sus `.map`/`.filter`) y el literal del asiento, **sin envolver**. La
    // región era más corta, no protegida — y ahí reaparecía el defecto entero:
    // excepción escapada, sello puesto, cero asiento, root que no arranca.
    //
    // Lo que se promete ahora es lo que el código hace: **entre el sello y el
    // asiento no queda nada que pueda ESCAPARSE**. El parte de `sellar` se anota
    // DETRÁS del asiento (es contabilidad, no depende de nadie), y todo lo que
    // sigue vive dentro de esta red, que da nombre y `causa` a cualquier fallo
    // sin código propio en vez de dejarlo salir como excepción.
    try {
      // ── 6 · ASIENTO — lo primero tras el sello ──────────────────────────
      // Ésta es la corrección de fondo de U268, y es de ORDEN, no de guardas.
      // Desde que `sealManifest` escribe, el manifiesto declara
      // `source.imported` y `verify.mjs` §2 EXIGE un asiento `import_pack` que
      // lo respalde: sin él devuelve `ledger_ausente` y
      // `assertVolumesRootBootable` **niega el arranque**. Antes corrían aquí
      // `syncVolumeCounters` y el walk de NO-LINK; cualquiera de los dos
      // lanzando dejaba el root sin arrancar y sin vuelta atrás — re-importar
      // responde `noop:true` sin escribir asiento (medido, §2·E1). Los dos
      // tramos pasan a ir DESPUÉS.
      try {
        entradaAsiento = construyeAsiento(sealAfter.sha256);
        seat = appendOpsLedger(
          entradaAsiento,
          // La ruta YA RESUELTA por la precondición, no la propuesta cruda: es lo
          // que hace que `ledgerPath` se lea una sola vez en toda la función. Ver
          // el bloque de la precondición.
          { ...ledgerFijo, ledgerPath }
        );
      } catch (err) {
        // `entradaAsiento` puede seguir en `null` si lo que falló fue
        // construirla; entonces no hay nada que ofrecer y se dice, en vez de
        // prometer una recuperación con `undefined` dentro.
        // La ÚNICA de las seis que no se puede arreglar reordenando: el asiento es
        // el último eslabón y su sitio ya no puede ser más temprano. Así que la
        // recuperación tiene que ser EJECUTABLE, no un consejo: la entrada exacta
        // que no se pudo escribir viaja en la respuesta, y apendarla sobre la
        // misma ruta cuando vuelva a ser escribible devuelve el root a `ok:true`
        // en `verifyRootIntegrity` (probado en el CA, no razonado aquí).
        return trasFusion('asiento_no_escribible', {
          asiento: false,
          causa: causaDe(err),
          recuperacion: {
            via: entradaAsiento ? 'appendOpsLedger' : 'operador',
            ledgerPath,
            ...(entradaAsiento ? { entrada: entradaAsiento } : {}),
            nota:
              'el manifiesto ya declara este import y sin asiento el root NO arranca ' +
              '(verify.mjs · sello_vs_ledger → ledger_ausente); repetir el import NO lo repara ' +
              '(el gate NO-OP responde noop:true y no escribe asiento)' +
              (entradaAsiento ? '' : '; la entrada del asiento no se llegó a construir')
          }
        });
      }

      // El parte de SELLAR se anota DETRÁS del asiento (devolución B2): es
      // contabilidad y nadie depende de él, así que ponerlo aquí quita del
      // hueco sello↔asiento lo último que corría sin envolver. El ORDEN del
      // array `steps` no cambia — `sellar` sigue entre `fusionar` y `no-link`.
      steps.push({
        step: 'sellar',
        ok: true,
        manifestSha256: sealAfter.sha256,
        volumes: importedReport.map((v) => v.id),
        hashes: importedReport.map((v) => ({
          id: v.id,
          files: v.hashes,
          unsealed: v.unsealed.length
        })),
        // U259 · qué ancló el snapshot de cada volumen, para que el sello sea
        // observable en la salida del import y no sólo en el manifiesto.
        snapshots: importedReport
          .filter((v) => v.snapshot)
          .map((v) => ({
            id: v.id,
            unit: typeof v.snapshot.unit === 'string' ? v.snapshot.unit : 'arbol-por-unidad',
            units:
              typeof v.snapshot.units === 'number'
                ? v.snapshot.units
                : Object.keys(v.snapshot).length
          }))
      });

      // ── 7 · ESTADO VIVO (U199) — después del asiento ──────────────────────
      // `volumes.state.json` es REGENERABLE MIDIENDO (state.mjs), así que su
      // fallo no cuestiona lo aterrizado; pero tampoco se calla, porque el
      // contrato §0.3 dice que el import siembra contadores. Sale por el contrato
      // con su recuperación, que aquí es literalmente re-medir.
      try {
        for (const volId of Object.keys(pack.volumes)) {
          syncVolumeCounters(volId);
        }
      } catch (err) {
        return trasFusion('estado_no_escribible', {
          asiento: seat,
          causa: causaDe(err),
          recuperacion: {
            via: 'syncVolumeCounters',
            volumenes: Object.keys(pack.volumes),
            nota:
              'el estado vivo es regenerable midiendo y no entra en el sello: el root arranca ' +
              '(sello y asiento están puestos); volver a llamar cuando el fichero sea escribible'
          }
        });
      }

      // ── 8 · NO-LINK (result tree) ────────────────────────────────────────
      // Dos desenlaces distintos y por eso dos códigos: el árbol NO SE PUDO
      // RECORRER (un subdirectorio sin permiso de listado hace lanzar a
      // `readdirSync` — medido, EPERM en scandir) no es lo mismo que recorrerlo y
      // ENCONTRAR un ancla viva. El segundo ya salía por el contrato desde U201,
      // pero callaba que el corpus estaba aterrizado y el manifiesto re-sellado:
      // cumplía la letra y rompía la frase. Ahora lo dice.
      let entriesChecked = 0;
      /** @type {string[]} */
      const anclas = [];
      try {
        for (const vol of Object.values(pack.volumes)) {
          const landed = walkTree(join(volumesRoot, vol.path.split('/').join(sep)));
          entriesChecked += landed.files.length;
          anclas.push(...landed.symlinks);
        }
      } catch (err) {
        return trasFusion('resultado_no_inspeccionable', {
          asiento: seat,
          causa: causaDe(err),
          recuperacion: {
            via: 'assertVolumesRootBootable',
            nota:
              'el import no pudo COMPROBAR el árbol resultante (no que esté mal): el guardián de ' +
              'arranque recorre el root entero y vuelve a hacer esta pregunta cuando la ruta sea ' +
              'legible; hasta entonces el root no está verificado'
          }
        });
      }
      if (anclas.length > 0) {
        return trasFusion('symlink_en_resultado', {
          asiento: seat,
          symlinks: anclas,
          recuperacion: {
            via: 'operador',
            rutas: anclas,
            nota:
              'ancla viva en el destino (cerco §10.8): el pack no la trajo —VERIFICAR las rechaza— ' +
              'así que estaba ya en el root o la puso una carrera; retirarla a mano, el cerco de ' +
              'arranque la sigue viendo como enlace_vivo'
          }
        });
      }
      steps.push({ step: 'no-link', ok: true, entriesChecked });

      return {
        ok: true,
        noop: false,
        volumesRoot,
        packHash,
        manifestSha256: sealAfter.sha256,
        manifestSha256Before: sealBefore.sha256,
        imported: importedReport,
        noopCorpora,
        families: familyReports,
        steps,
        ledger: seat,
        // U268 · lo rellena el `finally` sobre ESTE mismo objeto. Un import
        // completado cuyo staging no se pudo retirar sigue siendo `ok:true` y lo
        // dice aquí; antes desaparecía entero detrás de un `EBUSY`.
        staging: limpieza
      };
    } catch (err) {
      // Red de última línea: lo que no tiene código propio en esta zona. No
      // inventa diagnóstico —`causa` lleva el error entero— y dice si el asiento
      // llegó a escribirse, que es lo que decide si el root arranca. Sin ella,
      // «ninguna excepción escapa de la zona posterior a FUSIONAR» sería una
      // frase más ancha que el código, que es justo lo que este carril caza.
      return trasFusion('post_sello_interrumpido', {
        asiento: seat ?? false,
        causa: causaDe(err),
        recuperacion: {
          via: seat ? 'operador' : 'appendOpsLedger',
          ...(seat ? {} : { ledgerPath, ...(entradaAsiento ? { entrada: entradaAsiento } : {}) }),
          nota: seat
            ? 'sello y asiento están puestos (el root arranca); revisar `causa` y re-verificar ' +
              'con assertVolumesRootBootable'
            : 'el sello está puesto y el asiento NO: sin él el root no arranca'
        }
      });
    }
  } finally {
    // Staging never survives — success or failure (contract §1). U268: y si no
    // se puede retirar, se DICE; jamás se lanza desde aquí (ver `limpiarStaging`).
    const r = limpiarStaging(stagingDir);
    limpieza.eliminado = r.eliminado;
    limpieza.causa = r.causa;
  }
}
