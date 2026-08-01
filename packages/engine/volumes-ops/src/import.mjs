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
 * Every failure leaves the root intact (manifest seal unchanged) and the
 * staging directory removed. Nothing lands halfway: staging lives INSIDE
 * the destination root (same device) and fusion is rename-only.
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
import { basename, dirname, join, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { assertIntentRole, resolveIntentRole } from '@zeus/protocol';
import { validate as validateSchema } from '@zeus/linea-kit/validate';
import { resolveVolumesRoot } from '@zeus/presets-sdk/volumes';
import { VOLUMES_OPS_CATALOG } from './catalog.mjs';
import { FAMILY_DRIVERS, detectVolumeFamily } from './drivers.mjs';
import { applyFusion, causaDe, inspectFusionPlan } from './fusion-guard.mjs';
import { hashManifest, sealManifest } from './manifest.mjs';
import { syncVolumeCounters } from './counters.mjs';
import { measurePath } from './measure.mjs';
import { appendOpsLedger } from './ledger.mjs';

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
  const fail = (step, error, extra = {}) => ({ ok: false, step, error, steps, ...extra });

  // Precondition (contract §0.6): operator-only intent; omitted role → player → denied.
  const role = resolveIntentRole({ role: opts?.role });
  const auth = assertIntentRole(
    { actorId, intent: 'import_pack', role },
    VOLUMES_OPS_CATALOG
  );
  if (!auth.ok) {
    return fail('precondicion-rol', auth.error, { role });
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

    // Apply pass: rename-only (same device — staging lives inside the root).
    // Con red (U255): lo que no se puede comprobar por adelantado —permiso
    // denegado, fichero tomado por otro proceso, montaje que rinde EXDEV, una
    // carrera contra el operador— ya no deja el volumen a medias: se deshacen
    // los renombrados hechos y el fallo se declara con su inventario.
    const aplicacion = applyFusion(moves, guarda.slotsVacios);
    if (aplicacion.error) {
      return fail('fusionar', aplicacion.error.code, aplicacion.error.detail);
    }
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

    // ── 5 · SELLAR ───────────────────────────────────────────────────────
    // Rewrite the manifest via manifest.mjs (the ONE legitimate writer):
    // volume entries + corpora seeded with MEASURED files/bytes (contract
    // §0.3 — «import pobla corpora») + inert provenance.
    const sealed = structuredClone(destConfig);
    const importedReport = [];
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
    const sealAfter = sealManifest(sealed);
    // Live state tied to the new seal (U199 machinery).
    for (const volId of Object.keys(pack.volumes)) {
      syncVolumeCounters(volId);
    }
    steps.push({
      step: 'sellar',
      ok: true,
      manifestSha256: sealAfter.sha256,
      volumes: importedReport.map((v) => v.id),
      hashes: importedReport.map((v) => ({ id: v.id, files: v.hashes, unsealed: v.unsealed.length })),
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

    // ── 7 · NO-LINK (result tree) ────────────────────────────────────────
    let entriesChecked = 0;
    for (const vol of Object.values(pack.volumes)) {
      const landed = walkTree(join(volumesRoot, vol.path.split('/').join(sep)));
      entriesChecked += landed.files.length;
      if (landed.symlinks.length > 0) {
        return fail('no-link', 'symlink_en_resultado', { symlinks: landed.symlinks });
      }
    }
    steps.push({ step: 'no-link', ok: true, entriesChecked });

    const seat = appendOpsLedger(
      {
        kind: 'import_pack',
        intent: 'import_pack',
        role,
        actorId,
        pack: { name: pack.name, version: pack.version, packHash },
        volumes: Object.keys(pack.volumes),
        manifestSha256: { before: sealBefore.sha256, after: sealAfter.sha256 },
        noopCorpora,
        families: familyReports.map((f) => ({
          id: f.id,
          family: f.family,
          divergences: f.divergences.length,
          protectedSidecars: f.protectedSidecars.length,
          dedup: f.dedup.length
        }))
      },
      ledgerOpts
    );

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
      ledger: seat
    };
  } finally {
    // Staging never survives — success or failure (contract §1).
    rmSync(stagingDir, { recursive: true, force: true });
  }
}
