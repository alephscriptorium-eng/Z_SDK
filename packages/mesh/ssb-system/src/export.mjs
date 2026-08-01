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
 *
 * ── DÓNDE VIVE LA REGLA (decisión, tras la 1.ª devolución) ─────────────────
 *
 * Al matar el borrado destructivo, este fichero pasó a ser el SEGUNDO escritor
 * de un volumen que también escribe `importPack` con el driver SSB. Dos
 * escritores con reglas distintas es exactamente lo que produjo los tres
 * bloqueantes: el export deduplicaba SOLO por clave, así que podía crear
 * bifurcaciones de feed que el driver prohíbe, aterrizar mensajes sin
 * coordenada que el driver rechaza abortando el volumen ENTERO, y deduplicar
 * contra ficheros mal nombrados que el lector no encuentra.
 *
 * Decisión: **la regla es del VOLUMEN, no de un escritor**, y se parte en dos
 * niveles con consecuencias distintas a propósito. Los dos paquetes NO pueden
 * compartir el código (ninguno declara al otro; los 48 manifests están
 * congelados), así que se REPLICA con nota de sitio y la juntura tiene probe:
 * `volumes-ops/test/import-ssb-driver.test.mjs`, sección JUNTURA, exporta con
 * ESTE fichero y luego importa el resultado con el driver.
 *
 * **Nivel 1 · ADMISIÓN DE LA UNIDAD** — los dos escritores aplican las cinco:
 *   1. clave usable (`key` cadena no vacía + `value` objeto);
 *   2. coordenada de feed (`value.author` + `value.sequence`) — sin ella el
 *      mensaje se DESCARTA con motivo `coordenada_de_feed_ausente`;
 *   3. ruta canónica `<corpus>/messageFileName(key)` — aquí por construcción, y
 *      el volumen entero se verifica antes de escribir (`layout_invalido_en_
 *      volumen`), porque un fichero mal nombrado hace mentir al índice;
 *   4. clave única con `value` coherente (`clave_duplicada_en_log`,
 *      `clave_divergente`);
 *   5. **posición `(author, sequence)` única** (`posicion_duplicada_en_log`,
 *      `posicion_ocupada`) — es lo que el import llama `reescritura_de_feed`.
 * Todo lo que falla en el nivel 1 aborta **en pase dry, sin escribir un byte**,
 * o se descarta con motivo.
 *
 * **Nivel 2 · COHERENCIA DEL CONJUNTO** — la cadena `previous ⟺ sequence`. El
 * import ABORTA (un pack es material curado). Este exportador la **mide y la
 * declara** (`feedIncoherencias`, y el conteo va al sidecar) pero NO tira dato:
 * un volcado de pub llega con lo que llega y descartar gobernanza por una
 * cadena que el productor numeró mal sería peor que aterrizarla. Asimetría
 * DECLARADA con ejemplo medido: `fixtures/ssb-log.json` es exportable y su pack
 * NO es importable (`cadena_rota_en_pack`) — su `sequence` es un contador
 * global y su `previous` cruza de feed cuatro veces.
 *
 * LO QUE SIGUE SIN VERIFICARSE: la AUTORÍA. No hay comprobación de firma en
 * ninguna parte; `value.author` se toma como dicho. Con la posición como única
 * regla inviolable, eso significa que cualquiera puede OCUPAR el feed de
 * cualquiera de forma permanente. Está medido en la suite y anotado como
 * riesgo, no disimulado.
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
  feedCoords,
  foldRel,
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
  // NIVEL 1 de la admisión (ver cabecera): sin coordenada de feed el mensaje no
  // entra en el volumen POR NINGÚN CAMINO. Es la misma exigencia que
  // `ssbFeedCoords` hace en el driver; si esta mitad no la aplicara, el export
  // aterrizaría material que el import rechaza abortando el volumen entero.
  const coords = feedCoords(value);
  if (!coords) return { ok: false, reason: SKIP_REASONS.COORDENADA_DE_FEED_AUSENTE, key };
  return { ok: true, key, value, content, corpus, coords };
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
  /** @type {{ author: string, sequence: number, keys: string[] }[]} */
  const duplicatePositions = [];
  /** @type {{ key: string, author: string, sequence: number, previous: string|null, motivo: string }[]} */
  const feedIncoherencias = [];
  /** @type {Map<string, { corpus: string, sha: string }>} */
  const seen = new Map();
  /** @type {Map<string, string>} `author#seq` → clave */
  const seenPosition = new Map();
  /** @type {Map<string, {author:string, sequence:number}>} clave → coordenada */
  const coordsByKey = new Map();
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
    // NIVEL 1 · la POSICIÓN también es única. Dos claves distintas en
    // `(author, sequence)` son una BIFURCACIÓN del feed: el driver la prohíbe
    // (`reescritura_de_feed`) y este escritor la dejaba pasar en silencio.
    const posId = `${classified.coords.author}#${classified.coords.sequence}`;
    const posBefore = seenPosition.get(posId);
    if (posBefore !== undefined) {
      duplicatePositions.push({
        author: classified.coords.author,
        sequence: classified.coords.sequence,
        keys: [posBefore, classified.key]
      });
      continue;
    }
    seenPosition.set(posId, classified.key);
    seen.set(classified.key, { corpus: classified.corpus, sha });
    coordsByKey.set(classified.key, {
      author: classified.coords.author,
      sequence: classified.coords.sequence
    });
    byCorpus[classified.corpus].push({
      key: classified.key,
      value: classified.value,
      content: classified.content,
      valueSha256: sha,
      coords: classified.coords,
      type:
        typeof classified.content?.type === 'string' ? classified.content.type : 'unknown'
    });
  }

  // NIVEL 2 · coherencia del CONJUNTO: se MIDE y se DECLARA, no se tira dato.
  // Ver la decisión «dónde vive la regla» en la cabecera. Un pack con este
  // material sí es rechazado por el VALIDAR del driver: la asimetría es
  // deliberada y está declarada.
  for (const corpus of Object.keys(byCorpus)) {
    for (const row of byCorpus[corpus]) {
      const { author, sequence, previous } = row.coords;
      if (previous === null && sequence !== 1) {
        feedIncoherencias.push({ key: row.key, author, sequence, previous, motivo: 'previous_null_con_sequence_distinta_de_1' });
        continue;
      }
      if (previous !== null && sequence === 1) {
        feedIncoherencias.push({ key: row.key, author, sequence, previous, motivo: 'sequence_1_con_previous' });
        continue;
      }
      if (previous === null) continue;
      const target = coordsByKey.get(previous);
      if (!target) continue; // el anterior no viaja en el volcado: no verificable
      if (target.author !== author) {
        feedIncoherencias.push({ key: row.key, author, sequence, previous, motivo: 'previous_de_otro_feed' });
      } else if (target.sequence >= sequence) {
        feedIncoherencias.push({ key: row.key, author, sequence, previous, motivo: 'previous_no_es_anterior' });
      }
    }
  }

  return {
    byCorpus,
    skipped,
    total: messages.length,
    skippedReasons,
    skippedDetail,
    duplicateKeys,
    duplicatePositions,
    feedIncoherencias
  };
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
function indexLanded(ssbRoot) {
  /** @type {Map<string, { rel: string, valueSha256: string }>} */
  const byKey = new Map();
  /** @type {Map<string, { rel: string, key: string }>} `author#seq` → ocupante */
  const byPosition = new Map();
  /** @type {Map<string, { rel: string, key: string }>} ruta PLEGADA → ocupante */
  const byFolded = new Map();
  /** @type {{ file: string, motivo: string, esperado?: string }[]} */
  const anomalias = [];

  /** @param {string} dir @param {string} rel */
  function walk(dir, rel) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      const childAbs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(childAbs, childRel);
        continue;
      }
      if (!entry.isFile()) {
        anomalias.push({ file: childRel, motivo: 'enlace_en_volumen' });
        continue;
      }
      /** @type {any} */
      let row = null;
      try {
        row = JSON.parse(fs.readFileSync(childAbs, 'utf8'));
      } catch {
        row = null;
      }
      const key =
        row && typeof row.key === 'string' && row.key && row.value && typeof row.value === 'object'
          ? row.key
          : null;
      const parts = childRel.split('/');
      if (!key) {
        // El sidecar propio del volumen es lo ÚNICO que puede vivir en la raíz.
        if (!(parts.length === 1 && parts[0] === MANIFEST_NAME)) {
          anomalias.push({ file: childRel, motivo: 'fichero_sin_clave' });
        }
        continue;
      }
      const coords = feedCoords(row.value);
      if (!coords) {
        anomalias.push({ file: childRel, motivo: 'sin_coordenada_de_feed' });
        continue;
      }
      // MISMA prueba de admisión que aplica el driver al destino (D-G): un
      // fichero que no vive en su ruta canónica es INALCANZABLE para el lector
      // (loader.mjs:131-146). Deduplicar contra él sería un `dedup` que miente.
      const corpusOk = parts.length === 2 && SSB_CORPORA.some((c) => c.path === parts[0]);
      const esperado = corpusOk ? `${parts[0]}/${messageFileName(key)}` : null;
      if (!corpusOk || parts[1] !== messageFileName(key)) {
        anomalias.push({
          file: childRel,
          motivo: 'fuera_de_layout',
          ...(esperado ? { esperado } : {})
        });
        continue;
      }
      if (byKey.has(key)) {
        anomalias.push({ file: childRel, motivo: 'clave_duplicada_en_volumen' });
        continue;
      }
      // Dos ficheros que en un FS insensible a la caja serían UNO (volumen
      // construido en Linux): no es replicable y no se puede sincronizar encima.
      if (byFolded.has(foldRel(childRel))) {
        anomalias.push({ file: childRel, motivo: 'colision_de_caja_en_volumen' });
        continue;
      }
      byFolded.set(foldRel(childRel), { rel: childRel, key });
      byKey.set(key, { rel: childRel, valueSha256: valueSha256(row.value) });
      const posId = `${coords.author}#${coords.sequence}`;
      const ocupante = byPosition.get(posId);
      if (ocupante && ocupante.key !== key) {
        anomalias.push({ file: childRel, motivo: 'feed_bifurcado_en_volumen' });
        continue;
      }
      byPosition.set(posId, { rel: childRel, key });
    }
  }
  if (fs.existsSync(ssbRoot)) walk(ssbRoot, '');
  return { byKey, byPosition, byFolded, anomalias };
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
  const {
    byCorpus,
    skipped,
    total,
    skippedReasons,
    skippedDetail,
    duplicateKeys,
    duplicatePositions,
    feedIncoherencias
  } = partitionExportable(messages);

  const divergentInLog = duplicateKeys.filter((d) => d.kind === 'divergente');
  if (divergentInLog.length > 0) {
    throw new Error(
      `clave_duplicada_en_log: el volcado trae ${divergentInLog.length} clave(s) repetida(s) con contenido DISTINTO ` +
        `(${divergentInLog.map((d) => d.key).join(', ')}) — dos mensajes distintos bajo la misma clave se pisarían en silencio; abortando sin escribir.`
    );
  }
  if (duplicatePositions.length > 0) {
    throw new Error(
      `posicion_duplicada_en_log: el volcado trae ${duplicatePositions.length} posición(es) de feed reclamada(s) por claves DISTINTAS ` +
        `(${duplicatePositions.map((d) => `${d.author}#${d.sequence}: ${d.keys.join(' vs ')}`).join('; ')}) — ` +
        'es una bifurcación de feed, y la posición aterrizada es inmutable; abortando sin escribir.'
    );
  }

  const ssbRoot = path.join(volumesRoot, ...SSB_VOLUME_PATH.split('/'));
  fs.mkdirSync(ssbRoot, { recursive: true });
  for (const corpus of SSB_CORPORA) {
    fs.mkdirSync(path.join(ssbRoot, corpus.path), { recursive: true });
  }

  // ── PASE DRY: se planifica entero antes de escribir un solo byte ──────────
  const landed = indexLanded(ssbRoot);
  if (landed.anomalias.length > 0) {
    // MISMA doctrina que el driver ante un destino con agujeros: sin índice
    // completo no se puede planificar «jamás duplicar». Aterrizar encima de un
    // volumen así produciría material duplicado o inalcanzable.
    throw new Error(
      `layout_invalido_en_volumen: ${landed.anomalias.length} anomalía(s) en ${ssbRoot} ` +
        `(${landed.anomalias
          .map((a) => `${a.file}: ${a.motivo}${a.esperado ? ` (esperado ${a.esperado})` : ''}`)
          .join('; ')}) — el lector no puede resolver ese material; abortando sin escribir.`
    );
  }
  /** @type {{ abs: string, payload: string }[]} */
  const writes = [];
  /** @type {{ key: string, at: string, corpus: string }[]} */
  const conflicts = [];
  /** @type {{ author: string, sequence: number, key: string, at: string, destKey: string }[]} */
  const posConflicts = [];
  /** @type {{ key: string, at: string, destKey: string, rel: string }[]} */
  const caseConflicts = [];
  /** @type {{ key: string, at: string }[]} */
  const unchanged = [];
  for (const corpus of SSB_CORPORA) {
    const dir = path.join(ssbRoot, corpus.path);
    for (const row of byCorpus[corpus.id] || []) {
      const rel = `${corpus.path}/${messageFileName(row.key)}`;
      const before = landed.byKey.get(row.key);
      if (before) {
        if (before.valueSha256 === row.valueSha256) unchanged.push({ key: row.key, at: before.rel });
        else conflicts.push({ key: row.key, at: before.rel, corpus: corpus.id });
        continue;
      }
      // NIVEL 1 · la posición aterrizada es INMUTABLE, también por este camino.
      const posId = `${row.coords.author}#${row.coords.sequence}`;
      const ocupante = landed.byPosition.get(posId);
      if (ocupante && ocupante.key !== row.key) {
        posConflicts.push({
          author: row.coords.author,
          sequence: row.coords.sequence,
          key: row.key,
          at: ocupante.rel,
          destKey: ocupante.key
        });
        continue;
      }
      // NIVEL 1 · la ruta canónica es única EN EL SISTEMA DE FICHEROS, no solo
      // como cadena: base64url distingue la caja y NTFS/APFS no. Dos claves que
      // solo difieran en la caja de su codificación escribirían UN fichero y el
      // conteo diría dos — pérdida silenciosa. Misma comprobación que el driver
      // hace con `foldRel` (`colision_ruta` / `colision_de_caja_en_pack`).
      const ocupanteRuta = landed.byFolded.get(foldRel(rel));
      if (ocupanteRuta && ocupanteRuta.key !== row.key) {
        caseConflicts.push({ key: row.key, at: ocupanteRuta.rel, destKey: ocupanteRuta.key, rel });
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
      landed.byKey.set(row.key, { rel, valueSha256: row.valueSha256 });
      landed.byPosition.set(posId, { rel, key: row.key });
      landed.byFolded.set(foldRel(rel), { rel, key: row.key });
    }
  }
  if (conflicts.length > 0) {
    throw new Error(
      `clave_divergente: ${conflicts.length} clave(s) del volcado ya viven en el volumen con contenido DISTINTO ` +
        `(${conflicts.map((c) => `${c.key} @ ${c.at}`).join('; ')}) — sobrescribirlas sería pérdida de dato; abortando sin escribir.`
    );
  }
  if (caseConflicts.length > 0) {
    throw new Error(
      `colision_de_caja: ${caseConflicts.length} clave(s) del volcado rinden una ruta que ya está ocupada por OTRA clave ` +
        'en un sistema de ficheros insensible a la caja ' +
        `(${caseConflicts.map((c) => `${c.rel} vs ${c.at}: ${c.key} vs ${c.destKey}`).join('; ')}) — ` +
        'base64url distingue la caja y NTFS/APFS no: escribirlas dejaría UN fichero y el conteo diría dos; abortando sin escribir.'
    );
  }
  if (posConflicts.length > 0) {
    throw new Error(
      `posicion_ocupada: ${posConflicts.length} posición(es) de feed ya aterrizada(s) con OTRA clave ` +
        `(${posConflicts.map((c) => `${c.author}#${c.sequence}: ${c.key} vs ${c.destKey} @ ${c.at}`).join('; ')}) — ` +
        'la posición aterrizada es inmutable (es lo que el import llama `reescritura_de_feed`); abortando sin escribir.'
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
    // `exported` cuenta los mensajes DE ESTE VOLCADO que están en el volumen;
    // `corpora[].files` cuenta TODOS los ficheros del volumen. Antes de U205
    // concordaban por construcción porque el sync arrasaba el corpus; al dejar
    // de borrar dejan de concordar, y callarlo haría mentir al sidecar —que es
    // justamente la marca de sync de este volumen—. `volumeFiles` y `orphans`
    // nombran la diferencia en vez de dejarla implícita: `orphans` es material
    // que vive en el volumen y que este volcado NO trajo (import previo, o un
    // volcado con ventana temporal más corta). NO es un error: un mensaje SSB
    // es inmutable y un feed no se despublica. Ver §9 del reporte: no hay vía
    // de retirada por clave.
    totals: {
      input: total,
      exported: writes.length + unchanged.length,
      skipped,
      added: writes.length,
      unchanged: unchanged.length,
      volumeFiles: Object.values(counts).reduce((a, b) => a + b, 0),
      orphans:
        Object.values(counts).reduce((a, b) => a + b, 0) - (writes.length + unchanged.length),
      feedIncoherencias: feedIncoherencias.length
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
    duplicateKeys,
    feedIncoherencias
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
