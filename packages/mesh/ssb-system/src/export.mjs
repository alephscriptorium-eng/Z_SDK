/**
 * Files-first SSB log → DISK_04/SSB exporter (sync process, not a mesh daemon).
 *
 * ── WP-U205 · LAS DOS DEMOLICIONES ─────────────────────────────────────────
 *
 * (1) EL ESCRITOR LEGADO DEL MANIFIESTO, MUERTO.
 * Este fichero era el ÚLTIMO escritor no declarado de `<root>/volumes.json`
 * del repo. `upsertVolumesJsonEntry` (antiguo :173-208) lo abría, y si no
 * existía lo INVENTABA (`let config = { root:'.', volumes:{} }`, antiguo :176)
 * y lo escribía entero con `fs.writeFileSync` (antiguo :207), metiendo además
 * `source.syncedAt` DENTRO del manifiesto: un campo temporal que movía el
 * sello sha256 (U199) en CADA sync. Está eliminado, sin sustituto y sin
 * reencaminar — el precedente de U204 fue MATAR el escritor legado, no
 * mudarlo. En su lugar, `requireDeclaredSsbVolume` exige que el manifiesto YA
 * declare el volumen y ABORTA si no: un root sin manifiesto no es operable, y
 * un sync vivo no crea topología. La topología la siembra `importPack`
 * (CONTRATO-IMPORT-PACK-v1) y la sella `sealManifest`
 * (volumes-ops/src/manifest.mjs:72-77), el ÚNICO escritor legítimo.
 *
 * DESVÍO DECLARADO respecto de FIREHOSE (que sí tuvo sustituto): U204 mudó su
 * marca de sync a `volumes.state.json` vía `recordVolumeSync`
 * (volumes-ops/src/state.mjs:98-116, cuyo docstring :76-78 ya nombra a «SSB
 * export»). Aquí NO se puede: `packages/mesh/ssb-system/package.json` declara
 * linea-kit, presets-sdk, MCP sdk, cors, express y zod — no `@zeus/volumes-ops`
 * — y los 48 manifests están congelados en esta ola (GOBIERNO-EJECUCION-F2 §2,
 * owner U237); importarlo sería una dep fantasma. La entrada de `volumes.json`
 * se deja caer SIN sustituto en state porque la marca de sync del volumen SSB
 * ya sobrevive donde le toca: `syncedAt` es campo REQUIRED del schema real
 * `ssb-manifest` (linea-kit/schemas/ssb-manifest.json:7,15) y vive en el
 * sidecar propio del volumen, `DISK_04/SSB/manifest.json`. Cuando volumes-ops
 * sea dependencia declarable, este exportador puede llamar a `recordVolumeSync`
 * como hace feed-kit.
 *
 * OJO — SON DOS MANIFIESTOS, y solo uno muere:
 * - `<root>/volumes.json` — manifiesto SELLADO del root. **Ya no se escribe.**
 * - `DISK_04/SSB/manifest.json` — sidecar propio del volumen, valida contra el
 *   schema REAL `ssb-manifest` y lo exige `loader.mjs:21-27`
 *   (`ssb_manifest_missing`). **Se sigue escribiendo**, intacto.
 *
 * (2) EL BORRADO DESTRUCTIVO, MUERTO.
 * El export borraba TODOS los `.json` de cada corpus antes de escribir
 * (antiguo :93-96, «sync replaces snapshot»). Eso es incompatible con el
 * contrato que hereda el volumen: unión aditiva append-only (driver SSB,
 * volumes-ops/src/driver-ssb.mjs). Decisión: **deja de borrar**, y por tres
 * razones medidas, no por comodidad:
 * - un feed SSB es una cadena append-only de mensajes inmutables: un
 *   snapshot-replace solo puede BORRAR material que este volcado concreto no
 *   trajo — pérdida de dato por diseño;
 * - sobre el MISMO árbol, un `importPack` que aterrizó mensajes de forma
 *   aditiva quedaría arrasado por el siguiente `npm run sync`, y el sello
 *   (`source.imported.snapshot.units`) pasaría a mentir en silencio;
 * - precedente del carril: el productor FIREHOSE escribe en el volumen SIN
 *   borrar (`writeJetstreamPost`, feed-kit/src/jetstream-sync.mjs:145-159) y
 *   deja el manifiesto sellado (U204). Aquí se aplica la misma doctrina.
 * A cambio, el export aplica la MISMA regla de unión que el driver: índice por
 * clave sobre TODO el volumen (cross-corpus, como resuelve el lector en
 * loader.mjs:133-139), clave repetida con el mismo `value` = no-op, clave
 * repetida con `value` DISTINTO = **aborto en pase dry, antes de escribir un
 * solo byte** (es el defecto D1 de U204 en su versión de exportador: dos
 * mensajes distintos bajo la misma clave se pisaban en silencio en el antiguo
 * :99-113).
 *
 * (3) EL DESCARTE, REPORTADO. `partitionExportable` ya no devuelve solo cuántos
 * se saltó: devuelve POR QUÉ (`skippedReasons`, `skippedDetail`). Ver
 * `types.mjs` `SKIP_REASONS`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  CORPUS_BY_TYPE,
  SSB_CORPORA,
  MANIFEST_NAME,
  SSB_VOLUME_ID,
  SSB_DISK,
  SSB_VOLUME_PATH,
  SKIP_REASONS,
  classifyContent,
  messageFileName
} from './types.mjs';

/**
 * @param {unknown} raw
 * @returns {object[]}
 */
export function normalizeSsbLog(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = /** @type {Record<string, unknown>} */ (raw);
    if (Array.isArray(obj.messages)) return obj.messages;
    if (Array.isArray(obj.log)) return obj.log;
  }
  throw new Error('SSB log must be an array or { messages|log: [] }');
}

/**
 * Serialización estable (claves ordenadas) para comparar dos mensajes con la
 * MISMA clave. Se compara `value`, no los bytes del fichero: `type` y `corpus`
 * son anotaciones derivadas que cambian legítimamente entre corpus.
 * @param {unknown} value
 * @returns {string}
 */
export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

/** @param {unknown} value */
function valueSha256(value) {
  return createHash('sha256').update(stableStringify(value), 'utf8').digest('hex');
}

/**
 * Clasificación CON MOTIVO. `classifyMessage` es su mitad muda y conserva su
 * contrato anterior (objeto o `null`).
 * @param {object} msg
 * @returns {{ ok: true, key: string, value: object, content: unknown, corpus: string }
 *   | { ok: false, reason: string, key: string|null }}
 */
export function classifyMessageDetailed(msg) {
  if (!msg || typeof msg !== 'object') {
    return { ok: false, reason: SKIP_REASONS.MENSAJE_NO_OBJETO, key: null };
  }
  const key = typeof msg.key === 'string' && msg.key.length > 0 ? msg.key : null;
  if (!key) return { ok: false, reason: SKIP_REASONS.CLAVE_AUSENTE, key: null };
  const value = msg.value && typeof msg.value === 'object' ? msg.value : null;
  if (!value) return { ok: false, reason: SKIP_REASONS.VALUE_AUSENTE, key };
  const content = value.content;
  const { corpus, reason } = classifyContent(content);
  if (!corpus) return { ok: false, reason, key };
  return { ok: true, key, value, content, corpus };
}

/**
 * @param {object} msg
 * @returns {{ key: string, value: object, content: object, corpus: string }|null}
 */
export function classifyMessage(msg) {
  const detailed = classifyMessageDetailed(msg);
  if (!detailed.ok) return null;
  return {
    key: detailed.key,
    value: detailed.value,
    content: detailed.content,
    corpus: detailed.corpus
  };
}

/**
 * Particiona el log en corpus, DECLARANDO cada descarte y cada clave repetida.
 *
 * Una clave repetida en el MISMO volcado con `value` distinto no se resuelve
 * aquí (no es este el sitio que aborta): se DEVUELVE en `duplicateKeys` con
 * `kind:'divergente'`, y `exportSsbLogToVolumes` aborta antes de escribir. Con
 * el mismo `value` es `kind:'identico'` y se exporta una sola vez.
 * @param {object[]} messages
 */
export function partitionExportable(messages) {
  /** @type {Record<string, object[]>} */
  const byCorpus = { tribes: [], parliament: [], votes: [] };
  /** @type {Record<string, number>} */
  const skippedReasons = {};
  /** @type {{ index: number, key: string|null, reason: string }[]} */
  const skippedDetail = [];
  /** @type {{ key: string, corpus: string, kind: string }[]} */
  const duplicateKeys = [];
  /** @type {Map<string, { corpus: string, sha: string }>} */
  const seen = new Map();
  let skipped = 0;

  for (let index = 0; index < messages.length; index += 1) {
    const classified = classifyMessageDetailed(messages[index]);
    if (!classified.ok) {
      skipped += 1;
      skippedReasons[classified.reason] = (skippedReasons[classified.reason] ?? 0) + 1;
      skippedDetail.push({ index, key: classified.key, reason: classified.reason });
      continue;
    }
    const sha = valueSha256(classified.value);
    const before = seen.get(classified.key);
    if (before) {
      duplicateKeys.push({
        key: classified.key,
        corpus: classified.corpus,
        kind: before.sha === sha ? 'identico' : 'divergente'
      });
      continue;
    }
    seen.set(classified.key, { corpus: classified.corpus, sha });
    byCorpus[classified.corpus].push({
      key: classified.key,
      value: classified.value,
      content: classified.content,
      valueSha256: sha,
      type:
        typeof classified.content?.type === 'string' ? classified.content.type : 'unknown'
    });
  }
  return { byCorpus, skipped, total: messages.length, skippedReasons, skippedDetail, duplicateKeys };
}

/**
 * El root DEBE traer manifiesto y DEBE declarar el volumen `ssb`. Fallo
 * cerrado, sin scaffolding: réplica declarada del contrato de
 * `readManifestRaw` (volumes-ops/src/manifest.mjs:43-51) y de
 * `resolveFirehoseVolumeRoot` (feed-kit/src/jetstream-sync.mjs:104-122), que
 * no se pueden importar aquí (dep no declarada, manifests congelados).
 *
 * `pathOverride` NO se honra a propósito: este exportador escribe en la
 * constante `DISK_04/SSB` y no sabe resolver un override (resolve.mjs:109-111).
 * Antes que escribir en un sitio que el manifiesto no declara, aborta.
 * @param {string} volumesRoot
 * @returns {object} la entrada declarada del volumen
 */
export function requireDeclaredSsbVolume(volumesRoot) {
  const configPath = path.join(volumesRoot, 'volumes.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `volumes.json not found at ${configPath} — a volumes root without a manifest is not operable; aborting (U199). ` +
        'El export SSB no siembra topología: importa el pack primero (importPack · CONTRATO-IMPORT-PACK-v1).'
    );
  }
  /** @type {any} */
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    throw new Error(
      `volumes.json ilegible en ${configPath}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  const entry = config?.volumes?.[SSB_VOLUME_ID];
  if (!entry || typeof entry !== 'object') {
    throw new Error(
      `el manifiesto ${configPath} no declara el volumen '${SSB_VOLUME_ID}' — un sync vivo NO inventa entradas de manifiesto (U199/U204); importa el pack primero.`
    );
  }
  if (entry.pathOverride) {
    throw new Error(
      `el manifiesto ${configPath} declara '${SSB_VOLUME_ID}' con pathOverride='${entry.pathOverride}' y este exportador solo escribe en '${SSB_VOLUME_PATH}' bajo el root — abortando en vez de escribir donde el manifiesto no declara.`
    );
  }
  if (entry.path !== SSB_VOLUME_PATH) {
    throw new Error(
      `el manifiesto ${configPath} declara '${SSB_VOLUME_ID}' en path='${entry.path}' y este exportador escribe en '${SSB_VOLUME_PATH}' — abortando en vez de escribir donde el manifiesto no declara.`
    );
  }
  if (entry.disk !== SSB_DISK) {
    throw new Error(
      `el manifiesto ${configPath} declara '${SSB_VOLUME_ID}' en disk='${entry.disk}' y el schema real ssb-manifest fija disk='${SSB_DISK}' (const) — abortando.`
    );
  }
  return entry;
}

/**
 * Índice por clave de TODO el volumen aterrizado: clave → { rel, valueSha256 }.
 * Cross-corpus a propósito — el lector resuelve así (loader.mjs:133-139), y
 * plantar la misma clave en dos corpus produciría un mensaje duplicado con
 * resolución dependiente del orden de `SSB_CORPORA`.
 * @param {string} ssbRoot
 */
function indexLandedByKey(ssbRoot) {
  /** @type {Map<string, { rel: string, valueSha256: string }>} */
  const byKey = new Map();
  for (const corpus of SSB_CORPORA) {
    const dir = path.join(ssbRoot, corpus.path);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json')) continue;
      const abs = path.join(dir, name);
      /** @type {any} */
      let row;
      try {
        row = JSON.parse(fs.readFileSync(abs, 'utf8'));
      } catch {
        continue; // material ilegible del destino: el export no lo repara ni lo cuenta
      }
      if (typeof row?.key !== 'string' || !row.key || !row.value) continue;
      if (!byKey.has(row.key)) {
        byKey.set(row.key, {
          rel: `${corpus.path}/${name}`,
          valueSha256: valueSha256(row.value)
        });
      }
    }
  }
  return byKey;
}

/**
 * @param {{
 *   log: unknown,
 *   volumesRoot: string,
 *   provenance?: object,
 *   syncedAt?: string
 * }} opts
 */
export function exportSsbLogToVolumes(opts) {
  const volumesRoot = path.resolve(opts.volumesRoot);
  // Fallo cerrado ANTES de tocar disco: root sin manifiesto o sin la entrada
  // declarada = no operable. Nada se inventa (U199).
  requireDeclaredSsbVolume(volumesRoot);

  const messages = normalizeSsbLog(opts.log);
  const { byCorpus, skipped, total, skippedReasons, skippedDetail, duplicateKeys } =
    partitionExportable(messages);

  const divergentInLog = duplicateKeys.filter((d) => d.kind === 'divergente');
  if (divergentInLog.length > 0) {
    throw new Error(
      `clave_duplicada_en_log: el volcado trae ${divergentInLog.length} clave(s) repetida(s) con contenido DISTINTO ` +
        `(${divergentInLog.map((d) => d.key).join(', ')}) — dos mensajes distintos bajo la misma clave se pisarían en silencio; abortando sin escribir.`
    );
  }

  const ssbRoot = path.join(volumesRoot, ...SSB_VOLUME_PATH.split('/'));
  fs.mkdirSync(ssbRoot, { recursive: true });
  for (const corpus of SSB_CORPORA) {
    fs.mkdirSync(path.join(ssbRoot, corpus.path), { recursive: true });
  }

  // ── PASE DRY: se planifica entero antes de escribir un solo byte ──────────
  const landed = indexLandedByKey(ssbRoot);
  /** @type {{ abs: string, payload: string }[]} */
  const writes = [];
  /** @type {{ key: string, at: string, corpus: string }[]} */
  const conflicts = [];
  /** @type {{ key: string, at: string }[]} */
  const unchanged = [];
  for (const corpus of SSB_CORPORA) {
    const dir = path.join(ssbRoot, corpus.path);
    for (const row of byCorpus[corpus.id] || []) {
      const rel = `${corpus.path}/${messageFileName(row.key)}`;
      const before = landed.get(row.key);
      if (before) {
        if (before.valueSha256 === row.valueSha256) unchanged.push({ key: row.key, at: before.rel });
        else conflicts.push({ key: row.key, at: before.rel, corpus: corpus.id });
        continue;
      }
      writes.push({
        abs: path.join(dir, messageFileName(row.key)),
        payload: `${JSON.stringify(
          { key: row.key, value: row.value, type: row.type, corpus: corpus.id },
          null,
          2
        )}`
      });
      landed.set(row.key, { rel, valueSha256: row.valueSha256 });
    }
  }
  if (conflicts.length > 0) {
    throw new Error(
      `clave_divergente: ${conflicts.length} clave(s) del volcado ya viven en el volumen con contenido DISTINTO ` +
        `(${conflicts.map((c) => `${c.key} @ ${c.at}`).join('; ')}) — sobrescribirlas sería pérdida de dato; abortando sin escribir.`
    );
  }

  // ── APLICAR ───────────────────────────────────────────────────────────────
  for (const write of writes) fs.writeFileSync(write.abs, write.payload, 'utf8');

  /** @type {Record<string, number>} */
  const counts = {};
  for (const corpus of SSB_CORPORA) {
    const dir = path.join(ssbRoot, corpus.path);
    counts[corpus.id] = fs.readdirSync(dir).filter((n) => n.endsWith('.json')).length;
  }

  const syncedAt = opts.syncedAt ?? new Date().toISOString();
  const manifest = {
    schema: 'ssb-manifest',
    version: 1,
    volume: SSB_VOLUME_ID,
    disk: SSB_DISK,
    path: SSB_VOLUME_PATH,
    syncedAt,
    source: {
      kind: 'ssb-log-export',
      ...(opts.provenance && typeof opts.provenance === 'object' ? opts.provenance : {})
    },
    totals: {
      input: total,
      exported: writes.length + unchanged.length,
      skipped,
      added: writes.length,
      unchanged: unchanged.length
    },
    corpora: SSB_CORPORA.map((c) => ({
      id: c.id,
      path: c.path,
      label: c.label,
      files: counts[c.id] ?? 0
    })),
    typesKnown: Object.keys(CORPUS_BY_TYPE).sort()
  };

  // El sidecar PROPIO del volumen (schema real `ssb-manifest`), no el
  // manifiesto sellado del root: ese ya no se toca.
  fs.writeFileSync(path.join(ssbRoot, MANIFEST_NAME), JSON.stringify(manifest, null, 2), 'utf8');

  return {
    ok: true,
    volumesRoot,
    ssbRoot,
    manifest,
    counts,
    skipped,
    total,
    added: writes.length,
    unchanged: unchanged.length,
    skippedReasons,
    skippedDetail,
    duplicateKeys
  };
}

/**
 * Read a JSON log file from disk and export.
 * @param {{
 *   logPath: string,
 *   volumesRoot: string,
 *   provenance?: object
 * }} opts
 */
export function exportSsbLogFile(opts) {
  const raw = JSON.parse(fs.readFileSync(opts.logPath, 'utf8'));
  return exportSsbLogToVolumes({
    log: raw,
    volumesRoot: opts.volumesRoot,
    provenance: {
      logPath: path.resolve(opts.logPath),
      ...(opts.provenance && typeof opts.provenance === 'object' ? opts.provenance : {})
    }
  });
}
