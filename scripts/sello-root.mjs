#!/usr/bin/env node
/**
 * Sella el volumes root canónico por la vía legítima (WP-U258) — ops.
 *
 * ── EL HUECO QUE CIERRA ──────────────────────────────────────────────────
 * `assertVolumesRootBootable` está cableado en los CUATRO puntos de arranque
 * reales (force-system/src/start.mjs:19 · linea-system/src/start.mjs:35 ·
 * firehose-browser/src/server.mjs:68 · ssb-system/src/start.mjs:17). Pero
 * VOLUMES/volumes.json —el root que el producto usa de verdad— era anterior
 * al contrato de import: sus claves eran `root, policy, note, volumes`, sin
 * `source.imported`. Sin sello no hay contra qué comparar, así que la guarda
 * dejaba TODOS los legs de volumen en «omitido honesto» y pasaba de largo.
 * Medido antes de esta obra, con el camino del producto: alterar un fichero de
 * datos ARRANCA; editar el manifiesto a mano ARRANCA. Lo único que negaba el
 * arranque era el manifiesto AUSENTE — la protección VIEJA (U199), no la nueva.
 *
 * La dirección del arreglo es que **el root merezca pasar**, no que la puerta
 * se ensanche: este fichero NO toca el verificador. Sella el root por la vía
 * del import, que desde U199/U201 es el único escritor legítimo del manifiesto
 * (volumes-ops/src/manifest.mjs · `sealManifest`), y no escribe nada por su
 * cuenta: construye el pack y llama a `importPack`.
 *
 * ── QUÉ SELLA, EXACTAMENTE ───────────────────────────────────────────────
 * · Sólo los volúmenes que el manifiesto DECLARA y que además tienen árbol en
 *   disco. Un volumen declarado sin directorio (en el monorepo: `firehose` y
 *   `ssb`, cuyos datos vivos están fuera por WP-U62) NO se sella y se dice por
 *   qué. Sellarlo sería peor que no hacerlo: el leg `volumen` del verificador
 *   exige que el directorio del volumen sellado exista (verify.mjs, error
 *   `volumen_ausente`), así que un sello vacío convertiría a los dos servicios
 *   que los usan en servicios que no arrancan.
 * · La topología (id, disk, path, label) sale del manifiesto que ya está en
 *   disco. La FAMILIA la deciden los drivers por su firma (`detectVolumeFamily`),
 *   no este script. Nada se adivina.
 *
 * Idempotente: un root ya sellado con el mismo contenido cae en el NO-OP del
 * contrato (CONTRATO-IMPORT-PACK-v1 §6) y no reescribe ni el manifiesto ni el
 * ledger.
 *
 * La vigilancia (verde + ROJO) NO vive aquí: vive en
 * `packages/engine/volumes-ops/test/sello-root-referencia.test.mjs`, que CI ya
 * ejecuta, más el job `sello-root` de `.github/workflows/ci.yml`, que comprueba
 * lo único que sólo un checkout limpio puede demostrar: que la evidencia del
 * sello viaja RASTREADA.
 *
 * Node-only. Uso: ZEUS_VOLUMES_ROOT=./VOLUMES node scripts/sello-root.mjs
 */

import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { basename, dirname, join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { buildPackFromStartpack, importPack } from '@zeus/volumes-ops';
import { loadVolumesConfig, resolveVolumesRoot } from '@zeus/presets-sdk/volumes';

const log = (...a) => console.log(...a);

/** @param {string} dir @returns {number} ficheros del árbol */
function contarFicheros(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += contarFicheros(join(dir, e.name));
    else if (e.isFile()) n += 1;
  }
  return n;
}

/**
 * Volúmenes del manifiesto que tienen árbol en disco, y los que no (con motivo).
 * @param {string} root @param {any} cfg
 */
function clasificarVolumenes(root, cfg) {
  /** @type {Record<string, object>} */
  const conArbol = {};
  /** @type {object[]} */
  const sinArbol = [];
  for (const [id, entry] of Object.entries(cfg.volumes || {})) {
    if (entry?.pathOverride || !entry?.path) {
      sinArbol.push({ id, reason: 'sin_path_en_el_root' });
      continue;
    }
    const abs = join(root, String(entry.path).split('/').join(sep));
    if (contarFicheros(abs) === 0) {
      sinArbol.push({
        id,
        reason: existsSync(abs) ? 'directorio_vacio' : 'directorio_ausente',
        path: entry.path
      });
      continue;
    }
    conArbol[id] = {
      disk: entry.disk,
      path: entry.path,
      readonly: entry.readonly ?? true,
      label: entry.label || id
    };
  }
  return { conArbol, sinArbol };
}

function sellar() {
  const root = resolveVolumesRoot();
  const cfg = loadVolumesConfig();
  const { conArbol, sinArbol } = clasificarVolumenes(root, cfg);

  log(`root canónico: ${root}`);
  for (const s of sinArbol) {
    log(`  · ${s.id}: NO se sella — ${s.reason}${s.path ? ` (${s.path})` : ''}`);
  }
  if (Object.keys(conArbol).length === 0) {
    console.error('ningún volumen declarado tiene árbol en disco: no hay nada que sellar');
    process.exit(1);
  }

  // El adaptador exige `outDir` FUERA de la fuente, y la fuente aquí es el
  // directorio que contiene el root. Por eso el pack se materializa en tmp: la
  // frontera «la fuente es SÓLO LECTURA» del adaptador se aplica al root vivo.
  const outDir = mkdtempSync(join(tmpdir(), 'zeus-sello-root-'));
  try {
    const pack = buildPackFromStartpack({
      startpackRoot: dirname(root),
      dataDir: basename(root),
      outDir: join(outDir, 'pack'),
      name: 'volumes-root-referencia',
      version: '1.0.0',
      volumes: conArbol
    });
    log(`pack construido: ${pack.files.length} fichero(s), ${Object.keys(conArbol).length} volumen(es)`);
    for (const s of pack.skipped) log(`  · descartado del pack: ${s.path} (${s.reason})`);

    const res = importPack({ packRoot: pack.packRoot, role: 'operator', actorId: 'sello-root' });
    if (!res.ok) {
      console.error(`import FALLÓ en el paso «${res.step}»: ${res.error}`);
      console.error(JSON.stringify(res, null, 2));
      process.exit(1);
    }
    if (res.noop) {
      log(`NO-OP: el root ya estaba sellado con este contenido (sello ${res.manifestSha256.slice(0, 12)}…)`);
      return;
    }
    const fusionar = res.steps.find((s) => s.step === 'fusionar');
    const paso = res.steps.find((s) => s.step === 'sellar');
    log(`FUSIONAR: ${fusionar?.moved ?? '?'} fichero(s) movido(s) — un sello no mueve datos, anota`);
    log(`SELLAR:   ${res.manifestSha256Before.slice(0, 12)}… → ${res.manifestSha256.slice(0, 12)}…`);
    for (const h of paso?.hashes ?? []) {
      log(`  · ${h.id}: ${h.files} hash(es) sellado(s)${h.unsealed ? ` · ${h.unsealed} SIN sellar` : ''}`);
    }
    log(`ledger: asiento #${res.ledger.seq} en ${join(root, '.ops-ledger.jsonl')}`);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

sellar();
