/**
 * Verificador de INTEGRIDAD de un volumes root (WP-U206 · paso 6 del CA
 * local-first · decisión ⑧-bis.2 del custodio en `plan/DECISIONES.md`).
 *
 * Por qué vive aquí y no en `e2e/`: si el verificador vive en el runner, el
 * CA pasa y **el producto sigue desprotegido**. Aquí lo hereda además la
 * generalización de drivers.
 *
 * Qué agujero tapa. El fail-closed que había era de **AUSENCIA**, no de
 * **CORRUPCIÓN**:
 * - `validateVolumesTree` (@zeus/linea-kit/validate:187-213) valida contra
 *   SCHEMAS: recorre `volumes.json`, el registro y los `*.json` declarados.
 *   Un `.md` de escena corrompido byte a byte **pasa sin una queja**, porque
 *   ningún schema lo mira.
 * - El sello del manifiesto (`hashManifest`) identifica los bytes de
 *   `volumes.json`, no el contenido de los volúmenes.
 * - Y el sello anotado en `volumes.state.json` **se re-anota en silencio**:
 *   por la vía de medición (counters.mjs:39-40 → state.mjs:128-130) y por la
 *   vía de sync (state.mjs:99 + :106). O sea que una edición a mano de
 *   `volumes.json` deja de ser detectable en el estado en cuanto alguien
 *   mide. Por eso la comparación fuerte se hace contra el **ledger**
 *   (`.ops-ledger.jsonl`), que sólo escribe el import y que ninguna medición
 *   toca.
 *
 * Legs (cada uno reporta `{ check, ok, ... }`; `findings[]` son los ok:false):
 *  1. `manifiesto`      — sin manifiesto el root no es operable (U199).
 *  2. `sello_vs_ledger` — el sello vivo == `manifestSha256.after` del último
 *                         asiento `import_pack`. Sobrevive a remedir.
 *  3. `sello_vs_estado` — el sello vivo == `manifest.sha256` del estado.
 *                         Informativo: se re-anota al medir (ver arriba).
 *  4. `volumen`         — el directorio del volumen existe.
 *  5. `ficheros`        — (U258) recomputa el sha256 de cada fichero sellado en
 *                         `source.imported.hashes` con la MISMA primitiva que
 *                         lo selló (`sha256File`, importada de import.mjs).
 *  6. `snapshot`        — recomputa el árbol de cada unidad sellada en
 *                         `source.imported.snapshot` con el MISMO algoritmo
 *                         del driver que lo selló (hashUnitTree).
 *  7. `familia`         — corre el `validate()` REAL del driver de familia
 *                         contra el árbol VIVO (no contra el staging).
 *  8. `corpora`         — remide y compara con los `files`/`bytes` que el
 *                         import selló en el manifiesto (import.mjs:539-552).
 *
 * Fronteras declaradas (lo que este verificador NO garantiza):
 * - `source.imported.snapshot` sólo tiene forma «árbol por unidad» en la
 *   familia FORCES. FIREHOSE sella otra cosa (`{unit,units,unitsSha256}`) y
 *   LINEAS no sella nada. Con familia sin verificador de snapshot el leg se
 *   reporta `omitido` con motivo — **nunca se adivina el algoritmo**. Con
 *   `strictSnapshot:true` ese omitido pasa a ser hallazgo.
 * - (U258 estrecha esta frontera, no la cierra.) Los ficheros que no caen bajo
 *   ninguna unidad del snapshot ni bajo ningún corpus declarado —en FORCES,
 *   `registry.json`— ya no dependen SÓLO del leg de familia: si el import los
 *   trajo, están en `source.imported.hashes` y el leg `ficheros` los ata byte
 *   a byte. Lo que sigue sin cubrirse es el fichero que NUNCA pasó por un
 *   import: material lateral que apareció en el árbol vivo por otra vía. El
 *   leg `ficheros` comprueba PERTENENCIA de lo sellado, no IGUALDAD DE
 *   CONJUNTO, y es deliberado (import.mjs · bloque «SELLO POR FICHERO»): las
 *   altas las cubren el snapshot de unidad y el leg de corpora, cada uno en
 *   su alcance.
 * - El ledger es append-only por convención, no a prueba de manipulación:
 *   protege contra deriva y corrupción accidental, no contra un adversario
 *   con escritura en el root.
 * Node-only.
 */

import { existsSync } from 'node:fs';
import { join, sep } from 'node:path';
import {
  loadVolumesConfig,
  resetVolumesCache,
  resolveVolume,
  resolveVolumesRoot
} from '@zeus/presets-sdk/volumes';
import { FAMILY_DRIVERS } from './drivers.mjs';
import { hashUnitTree } from './driver-forces.mjs';
import { sha256File } from './import.mjs';
import { hashManifest } from './manifest.mjs';
import { loadVolumesState } from './state.mjs';
import { readOpsLedger } from './ledger.mjs';
import { measurePath } from './measure.mjs';

/** ¿sha256 hex? */
const isSha256 = (v) => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);

/**
 * Verificadores de snapshot por familia. Sólo entra aquí la familia cuyo
 * driver sella un mapa `{ <dirDeUnidad>: <sha256 del árbol> }`.
 * @type {Record<string, (volumeAbsPath: string, snapshot: object) => object[]>}
 */
const SNAPSHOT_VERIFIERS = {
  forces: verifyUnitTreeSnapshot
};

/**
 * Snapshot con forma «árbol por unidad»: recomputa cada unidad.
 * @param {string} volumeAbsPath
 * @param {Record<string,string>} snapshot
 * @returns {object[]} hallazgos (vacío = íntegro)
 */
function verifyUnitTreeSnapshot(volumeAbsPath, snapshot) {
  /** @type {object[]} */
  const findings = [];
  for (const [unitDir, sealed] of Object.entries(snapshot)) {
    const abs = join(volumeAbsPath, unitDir.split('/').join(sep));
    if (!existsSync(abs)) {
      findings.push({ error: 'unidad_ausente', unit: unitDir, sealed });
      continue;
    }
    const actual = hashUnitTree(abs);
    if (actual !== sealed) {
      findings.push({ error: 'unidad_corrupta', unit: unitDir, sealed, actual });
    }
  }
  return findings;
}

/**
 * ¿El snapshot tiene forma «árbol por unidad»?
 * @param {unknown} snapshot
 */
function isUnitTreeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return false;
  const entries = Object.entries(snapshot);
  return entries.length > 0 && entries.every(([, v]) => isSha256(v));
}

/**
 * Verifica la integridad del volumes root canónico.
 *
 * Relee el manifiesto de disco (`resetVolumesCache()`) porque es un gate de
 * ARRANQUE: la caché de `loadVolumesConfig` haría que se validara un
 * manifiesto que ya no está en disco.
 *
 * @param {{ volumeIds?: string[], strictSnapshot?: boolean }} [opts]
 * @returns {{ ok: boolean, volumesRoot: string|null, manifestSha256: string|null,
 *             checks: object[], findings: object[], skipped: object[] }}
 */
export function verifyRootIntegrity(opts = {}) {
  const { volumeIds = null, strictSnapshot = false } = opts;
  /** @type {object[]} */
  const checks = [];
  /** @type {object[]} */
  const skipped = [];
  const push = (c) => {
    checks.push(c);
    return c;
  };

  resetVolumesCache();

  // ── 1 · manifiesto ─────────────────────────────────────────────────────
  /** @type {{ path: string, sha256: string }} */
  let seal;
  let volumesRoot = null;
  try {
    volumesRoot = resolveVolumesRoot();
    seal = hashManifest();
  } catch (err) {
    push({
      check: 'manifiesto',
      ok: false,
      error: 'manifiesto_ausente',
      detail: err instanceof Error ? err.message : String(err)
    });
    return {
      ok: false,
      volumesRoot,
      manifestSha256: null,
      checks,
      findings: checks.filter((c) => !c.ok),
      skipped
    };
  }
  push({ check: 'manifiesto', ok: true, path: seal.path, sha256: seal.sha256 });

  /** @type {any} */
  let config;
  try {
    config = loadVolumesConfig();
  } catch (err) {
    push({
      check: 'manifiesto',
      ok: false,
      error: 'manifiesto_ilegible',
      detail: err instanceof Error ? err.message : String(err)
    });
    return {
      ok: false,
      volumesRoot,
      manifestSha256: seal.sha256,
      checks,
      findings: checks.filter((c) => !c.ok),
      skipped
    };
  }

  // ── 2 · sello vs ledger (sobrevive a remedir) ──────────────────────────
  const seats = readOpsLedger({ volumesRoot }).filter((e) => e.kind === 'import_pack');
  const lastSeat = seats.length > 0 ? seats[seats.length - 1] : null;
  // U206·m6 — «no hay asiento» NO significa lo mismo en los dos casos, y
  // tratarlo igual convertía el leg en su propio interruptor de apagado:
  // BORRAR el ledger degradaba el caso «volumes.json editado a mano» de ROJO a
  // verde. Lo declarado es que el ledger no protege contra MANIPULACIÓN de
  // asientos; su AUSENCIA, en un root que el manifiesto dice haber importado,
  // es en sí misma la prueba de que falta evidencia obligatoria.
  const algunImportado = Object.values(config.volumes || {}).some((v) => v?.source?.imported);
  if (!lastSeat) {
    if (algunImportado) {
      push({
        check: 'sello_vs_ledger',
        ok: false,
        error: 'ledger_ausente',
        note:
          'el manifiesto declara volúmenes importados pero no hay asiento `import_pack`: ' +
          'el ledger falta o fue truncado, y sin él el sello vivo no tiene contra qué contrastarse'
      });
    } else {
      skipped.push({
        check: 'sello_vs_ledger',
        reason: 'sin_asiento_de_import',
        note: 'root nunca importado: no hay sello anterior con el que contrastar'
      });
    }
  } else {
    const sealed = lastSeat.manifestSha256?.after ?? null;
    push({
      check: 'sello_vs_ledger',
      ok: sealed === seal.sha256,
      ...(sealed === seal.sha256
        ? { sha256: seal.sha256, seq: lastSeat.seq }
        : {
            error: 'sello_roto',
            seq: lastSeat.seq,
            sealed,
            actual: seal.sha256,
            note: 'volumes.json cambió fuera del pipeline de import (único escritor legítimo, U199/U201)'
          })
    });
  }

  // ── 3 · sello vs estado (informativo: se re-anota al medir) ────────────
  const state = loadVolumesState();
  const stateSeal = state?.manifest?.sha256 ?? null;
  if (!stateSeal) {
    skipped.push({
      check: 'sello_vs_estado',
      reason: 'sin_estado',
      note: 'volumes.state.json ausente o sin sello: nace en la primera medición'
    });
  } else {
    push({
      check: 'sello_vs_estado',
      ok: stateSeal === seal.sha256,
      ...(stateSeal === seal.sha256
        ? { sha256: seal.sha256 }
        : {
            error: 'estado_desfasado',
            sealed: stateSeal,
            actual: seal.sha256,
            note:
              'el estado apunta a otro manifiesto; ojo: una medición posterior lo re-anota ' +
              'en silencio (counters.mjs:39-40 → state.mjs:128-130), por eso este leg es informativo'
          })
    });
  }

  // ── 4-7 · por volumen ──────────────────────────────────────────────────
  const ids = volumeIds ?? Object.keys(config.volumes || {});
  for (const id of ids) {
    const entry = config.volumes?.[id];
    if (!entry) {
      push({ check: 'volumen', ok: false, volume: id, error: 'volumen_no_declarado' });
      continue;
    }
    const imported = entry.source?.imported ?? null;
    if (!imported) {
      skipped.push({
        check: 'volumen',
        volume: id,
        reason: 'sin_procedencia_de_import',
        note: 'volumen no sellado por importPack: no hay nada sellado contra lo que contrastar'
      });
      continue;
    }

    /** @type {string} */
    let absPath;
    try {
      absPath = resolveVolume(id).absPath;
    } catch (err) {
      push({
        check: 'volumen',
        ok: false,
        volume: id,
        error: 'volumen_irresoluble',
        detail: err instanceof Error ? err.message : String(err)
      });
      continue;
    }
    if (!existsSync(absPath)) {
      push({ check: 'volumen', ok: false, volume: id, error: 'volumen_ausente', absPath });
      continue;
    }
    push({ check: 'volumen', ok: true, volume: id, absPath });

    // 5 · ficheros sellados (U258) — sha256 por fichero, recomputado con la
    // MISMA primitiva que lo selló. Es el leg que ata el material que ninguna
    // familia mira por hash: los índices (`registry.json`, `registry.yaml`) y
    // todo volumen cuya familia no sella snapshot (LINEAS).
    const sealedHashes = imported.hashes ?? null;
    const relsSellados = sealedHashes && typeof sealedHashes === 'object'
      ? Object.keys(sealedHashes)
      : [];
    if (relsSellados.length === 0) {
      // Omitido HONESTO, con el mismo estatuto que los demás: sin sello no hay
      // contra qué comparar. Es el hueco que WP-U258 cerró para el root de
      // referencia sellándolo, no ensanchando la puerta.
      skipped.push({
        check: 'ficheros',
        volume: id,
        reason: 'sin_hashes_sellados',
        note:
          'el manifiesto no lleva `source.imported.hashes` para este volumen: ' +
          'root anterior al contrato de sello por fichero (U258), o volumen no importado'
      });
    } else {
      /** @type {object[]} */
      const rotos = [];
      for (const rel of relsSellados) {
        const abs = join(absPath, rel.split('/').join(sep));
        if (!existsSync(abs)) {
          rotos.push({ error: 'fichero_ausente', file: rel, sealed: sealedHashes[rel] });
          continue;
        }
        const actual = sha256File(abs);
        if (actual !== sealedHashes[rel]) {
          rotos.push({ error: 'fichero_corrupto', file: rel, sealed: sealedHashes[rel], actual });
        }
      }
      if (rotos.length === 0) {
        push({ check: 'ficheros', ok: true, volume: id, files: relsSellados.length });
      } else {
        for (const r of rotos) push({ check: 'ficheros', ok: false, volume: id, ...r });
      }
    }

    // 6 · snapshot
    const snapshot = imported.snapshot ?? null;
    const family = entry.family ?? null;
    if (!snapshot) {
      skipped.push({
        check: 'snapshot',
        volume: id,
        reason: 'sin_snapshot_sellado',
        family,
        note: 'el driver de esta familia no sella snapshot (LINEAS) o el volumen es genérico'
      });
    } else {
      const verifier = family ? SNAPSHOT_VERIFIERS[family] : null;
      if (!verifier) {
        const skip = {
          check: 'snapshot',
          volume: id,
          reason: 'sin_verificador_de_snapshot',
          family,
          note: 'la forma del snapshot de esta familia no es «árbol por unidad»; no se adivina el algoritmo'
        };
        if (strictSnapshot) {
          push({ check: 'snapshot', ok: false, volume: id, error: 'snapshot_no_verificable', family });
        } else {
          skipped.push(skip);
        }
      } else if (!isUnitTreeSnapshot(snapshot)) {
        push({
          check: 'snapshot',
          ok: false,
          volume: id,
          family,
          error: 'snapshot_ilegible',
          note: 'la familia declara verificador de árbol por unidad pero el snapshot sellado no tiene esa forma'
        });
      } else {
        const found = verifier(absPath, snapshot);
        if (found.length === 0) {
          push({ check: 'snapshot', ok: true, volume: id, family, units: Object.keys(snapshot).length });
        } else {
          for (const f of found) {
            push({ check: 'snapshot', ok: false, volume: id, family, ...f });
          }
        }
      }
    }

    // 7 · familia (validador REAL del driver contra el árbol vivo)
    if (!family) {
      skipped.push({ check: 'familia', volume: id, reason: 'volumen_sin_familia' });
    } else if (!FAMILY_DRIVERS[family]) {
      push({ check: 'familia', ok: false, volume: id, family, error: 'familia_desconocida' });
    } else {
      /** @type {{ ok: boolean, results: object[] }} */
      let famResult;
      try {
        famResult = FAMILY_DRIVERS[family].validate({ stagedDir: absPath });
      } catch (err) {
        famResult = {
          ok: false,
          results: [{ ok: false, errors: [{ message: err instanceof Error ? err.message : String(err) }] }]
        };
      }
      if (famResult.ok) {
        push({ check: 'familia', ok: true, volume: id, family, results: famResult.results.length });
      } else {
        push({
          check: 'familia',
          ok: false,
          volume: id,
          family,
          error: 'familia_invalida',
          results: famResult.results.filter((r) => !r.ok)
        });
      }
    }

    // 8 · corpora sellados (files/bytes medidos por el import)
    const corpora = Array.isArray(entry.corpora) ? entry.corpora : [];
    const sealedCorpora = corpora.filter(
      (c) => Number.isFinite(c.files) && Number.isFinite(c.bytes)
    );
    if (sealedCorpora.length === 0) {
      skipped.push({
        check: 'corpora',
        volume: id,
        reason: 'sin_corpora_sellados',
        note: 'el manifiesto no declara corpora con files/bytes: nada medido que contrastar'
      });
    } else {
      for (const c of sealedCorpora) {
        const corpusAbs = join(absPath, String(c.path || c.id).split('/').join(sep));
        const m = measurePath(corpusAbs);
        const same = m.files === c.files && m.bytes === c.bytes;
        push({
          check: 'corpora',
          ok: same,
          volume: id,
          corpus: c.id,
          ...(same
            ? { files: m.files, bytes: m.bytes }
            : {
                error: 'corpus_desviado',
                sealed: { files: c.files, bytes: c.bytes },
                actual: { files: m.files, bytes: m.bytes }
              })
        });
      }
    }
  }

  const findings = checks.filter((c) => !c.ok);
  return {
    ok: findings.length === 0,
    volumesRoot,
    manifestSha256: seal.sha256,
    checks,
    findings,
    skipped
  };
}

/**
 * Gate de arranque: verifica y ABORTA si el root no está íntegro. Existe para
 * que un servicio no pueda «arrancar a medias» sobre un root corrupto — el
 * fallo tiene que ser ruidoso, no una degradación silenciosa.
 * @param {{ volumeIds?: string[], strictSnapshot?: boolean }} [opts]
 * @returns {object} el reporte, cuando ok
 * @throws {Error} con `.report` adjunto cuando no
 */
export function assertRootIntegrity(opts = {}) {
  const report = verifyRootIntegrity(opts);
  if (!report.ok) {
    const summary = report.findings
      .map((f) => `${f.check}${f.volume ? `[${f.volume}]` : ''}: ${f.error}`)
      .join(' · ');
    const err = new Error(
      `El volumes root no está íntegro — arranque abortado (${report.findings.length} hallazgo(s)): ${summary}`
    );
    // @ts-ignore — evidencia adjunta para el llamador
    err.report = report;
    throw err;
  }
  return report;
}
