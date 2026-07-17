/**
 * Node-only fs loader for line corpora under a base path (DISK_02/LINEAS layout).
 * Pure resolution helpers live in `./resolve.mjs` (browser-safe).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'yaml';
import {
  buildSectionIndex,
  parseWpTimestamp,
  slimRegistro
} from './resolve.mjs';

export {
  parseWpTimestamp,
  slimRegistro,
  buildSectionIndex,
  resolveNodo,
  resolveParte,
  resolveOldid,
  resolveRegistrosForNodo,
  resolveRegistrosForYear,
  validateNodoSectionMappings
} from './resolve.mjs';

/**
 * @param {string} satDir
 * @returns {string}
 */
function defaultResolveCacheDir(satDir) {
  return path.join(satDir, 'cache');
}

function parseAnchorYear(note) {
  if (!note || typeof note !== 'string') return null;
  const match = note.match(/WP\s+(\d{4})/);
  return match ? Number(match[1]) : null;
}

async function loadWaveAAnchors(basePath) {
  const anchorsPath = path.join(basePath, 'scripts/fetch-priority-viaje1.json');
  try {
    const raw = JSON.parse(await fs.readFile(anchorsPath, 'utf8'));
    const anchors = Array.isArray(raw)
      ? raw.filter((entry) => entry.tier === 'nodo-anchor' && entry.nodo_id)
      : [];
    const byNodoId = {};
    for (const anchor of anchors) {
      if (byNodoId[anchor.nodo_id]) continue;
      byNodoId[anchor.nodo_id] = {
        nodo_id: anchor.nodo_id,
        oldid: anchor.oldid,
        note: anchor.note,
        anchor_year: parseAnchorYear(anchor.note)
      };
    }
    return { anchors, byNodoId };
  } catch (err) {
    console.warn(`[loadWaveAAnchors] Could not load anchors: ${err.message}`);
    return { anchors: [], byNodoId: {} };
  }
}

async function loadNodoSections(satDir) {
  const sectionsPath = path.join(satDir, 'nodo-sections.json');
  try {
    const raw = JSON.parse(await fs.readFile(sectionsPath, 'utf8'));
    return raw.nodos ?? {};
  } catch (err) {
    console.warn(`[loadNodoSections] Could not load nodo-sections.json: ${err.message}`);
    return {};
  }
}

async function loadCuratedRegistroIds(registrosDir) {
  const curated = new Set();
  try {
    const entries = await fs.readdir(registrosDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const idMatch = entry.name.match(/^(r\d+)/);
      if (idMatch) curated.add(idMatch[1]);
    }
  } catch {
    // registros dir may be absent
  }
  return curated;
}

/**
 * @param {string} satDir
 * @param {{
 *   resolveCacheDir?: (satDir: string) => string,
 *   sateliteCoverage?: { min: number, max: number }
 * }} [options]
 */
async function loadWpHistoriaIndex(satDir, options = {}) {
  const resolveCacheDir = options.resolveCacheDir ?? defaultResolveCacheDir;
  const manifestPath = path.join(satDir, 'manifest.json');
  const raw = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

  const milestones = raw.meta?.milestones ?? [];
  const extremes = raw.meta?.snapshots ?? {};
  const registroIndex = (raw.registros ?? []).map(slimRegistro);

  const byDate = registroIndex
    .map((entry) => ({ ...entry, dateMs: parseWpTimestamp(entry.timestamp) }))
    .filter((entry) => entry.dateMs != null)
    .sort((a, b) => a.dateMs - b.dateMs);

  const cacheDir = path.join(resolveCacheDir(satDir), 'snapshots');
  const registrosDir = path.join(satDir, 'registros');

  let cachedOldids = [];
  let cachedWikitexts = 0;
  try {
    const files = await fs.readdir(cacheDir);
    const wikitextFiles = files.filter((f) => f.endsWith('.wikitext'));
    cachedWikitexts = wikitextFiles.length;
    cachedOldids = wikitextFiles.map((f) => parseInt(f.replace('.wikitext', ''), 10)).filter(Number.isFinite);
  } catch (err) {
    console.warn(`[loadWpHistoriaIndex] Could not scan cache/snapshots: ${err.message}`);
  }

  let curatedRegistros = 0;
  let curatedRegistroIds = new Set();
  try {
    const entries = await fs.readdir(registrosDir, { withFileTypes: true });
    curatedRegistros = entries.filter((e) => e.isDirectory()).length;
    curatedRegistroIds = await loadCuratedRegistroIds(registrosDir);
  } catch (err) {
    console.warn(`[loadWpHistoriaIndex] Could not scan registros: ${err.message}`);
  }

  const nodoSections = await loadNodoSections(satDir);
  const sectionIndex = buildSectionIndex(registroIndex);
  const lineasRoot = path.resolve(satDir, '../../..');
  const waveA = await loadWaveAAnchors(lineasRoot);

  const milestoneCount = registroIndex.filter((r) => r.milestone).length;
  const milestoneOldids = registroIndex.filter((r) => r.milestone).map((r) => r.oldid);
  const milestonesWithoutBody = milestoneOldids.filter((oid) => !cachedOldids.includes(oid)).length;
  const coverage_pct = raw.meta?.registro_count ? (cachedWikitexts / raw.meta.registro_count) * 100 : 0;

  return {
    meta: {
      corpus: raw.meta?.corpus,
      title: raw.meta?.title,
      registro_count: raw.meta?.registro_count,
      milestones,
      extremes
    },
    milestones,
    extremes,
    registroIndex,
    byDate,
    nodoSections,
    sectionIndex,
    waveA,
    curatedRegistroIds,
    coverage: options.sateliteCoverage ?? null,
    cacheStats: {
      registro_count: raw.meta?.registro_count ?? 0,
      curated_registros: curatedRegistros,
      cached_wikitexts: cachedWikitexts,
      cached_oldids: cachedOldids.sort((a, b) => a - b),
      milestone_count: milestoneCount,
      milestones_sin_cuerpo: Math.max(0, milestonesWithoutBody),
      coverage_pct: parseFloat(coverage_pct.toFixed(2))
    },
    satDir
  };
}

/**
 * @param {string} basePath
 * @param {object} entry
 * @param {{
 *   resolveCacheDir?: (satDir: string) => string,
 *   troncoCoverage?: { min: number, max: number },
 *   sateliteCoverage?: { min: number, max: number }
 * }} [options]
 */
async function loadLineInstance(basePath, entry, options = {}) {
  const linePath = path.join(basePath, entry.path);
  const manifest = JSON.parse(await fs.readFile(path.join(linePath, 'manifest.json'), 'utf8'));

  const nodos = {};
  for (const nodoRef of manifest.nodos ?? []) {
    const metaRel = nodoRef.paths?.meta ?? `nodos/${nodoRef.id}/meta.json`;
    const meta = JSON.parse(await fs.readFile(path.join(linePath, metaRel), 'utf8'));
    nodos[nodoRef.id] = { ...nodoRef, ...meta };
  }

  let satellite = null;
  const satRel = manifest.meta?.satelite_wp;
  if (satRel) {
    satellite = await loadWpHistoriaIndex(path.join(linePath, satRel), options);
  }

  return {
    entry,
    manifest,
    nodos,
    satellite,
    linePath,
    coverage: options.troncoCoverage ?? null
  };
}

/**
 * Loads registry.yaml and all line instances under basePath (read-only).
 * @param {string} basePath — absolute path to lineas root (e.g. DISK_02/LINEAS)
 * @param {{
 *   resolveCacheDir?: (satDir: string) => string,
 *   troncoCoverage?: { min: number, max: number },
 *   sateliteCoverage?: { min: number, max: number }
 * }} [options]
 */
export async function loadLineaData(basePath, options = {}) {
  if (!basePath || typeof basePath !== 'string') {
    throw new Error('loadLineaData requires basePath (absolute lineas root)');
  }
  const registryRaw = await fs.readFile(path.join(basePath, 'registry.yaml'), 'utf8');
  const registry = yaml.parse(registryRaw);

  const lineas = {};
  for (const entry of registry) {
    lineas[entry.id] = await loadLineInstance(basePath, entry, options);
  }

  return { basePath, registry, lineas };
}

/**
 * Re-scan cache/snapshots and update satellite.cacheStats in place.
 * @param {object} satellite
 * @param {{ resolveCacheDir?: (satDir: string) => string }} [options]
 */
export async function rescanSatelliteCache(satellite, options = {}) {
  const resolveCacheDir = options.resolveCacheDir ?? defaultResolveCacheDir;
  const cacheDir = path.join(resolveCacheDir(satellite.satDir), 'snapshots');
  let cachedOldids = [];
  let cachedWikitexts = 0;

  try {
    const files = await fs.readdir(cacheDir);
    const wikitextFiles = files.filter((f) => f.endsWith('.wikitext'));
    cachedWikitexts = wikitextFiles.length;
    cachedOldids = wikitextFiles
      .map((f) => parseInt(f.replace('.wikitext', ''), 10))
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
  } catch (err) {
    console.warn(`[rescanSatelliteCache] Could not scan cache/snapshots: ${err.message}`);
  }

  const milestoneOldids = (satellite.registroIndex ?? [])
    .filter((r) => r.milestone)
    .map((r) => r.oldid);
  const milestonesWithoutBody = milestoneOldids.filter((oid) => !cachedOldids.includes(oid)).length;
  const registroCount = satellite.cacheStats?.registro_count ?? 0;
  const coverage_pct = registroCount ? (cachedWikitexts / registroCount) * 100 : 0;

  Object.assign(satellite.cacheStats, {
    cached_wikitexts: cachedWikitexts,
    cached_oldids: cachedOldids,
    milestones_sin_cuerpo: Math.max(0, milestonesWithoutBody),
    coverage_pct: parseFloat(coverage_pct.toFixed(2))
  });

  return satellite.cacheStats;
}

/**
 * @param {object} satellite
 * @param {number|string} oldid
 * @param {{ resolveCacheDir?: (satDir: string) => string }} [options]
 */
export async function readWikitext(satellite, oldid, options = {}) {
  const resolveCacheDir = options.resolveCacheDir ?? defaultResolveCacheDir;
  const oid = Number(oldid);
  if (!Number.isFinite(oid) || oid <= 0) {
    return { error: `Invalid oldid "${oldid}": must be a positive number` };
  }

  if (!satellite.cacheStats.cached_oldids.includes(oid)) {
    return {
      error: 'not cached',
      cached: false,
      oldid: oid,
      stats: satellite.cacheStats,
      hint: 'Invoca cache_wikitext o usa el botón Cachear en Tablero.',
      action: {
        tool: 'cache_wikitext',
        server: 'linea-wp-historia',
        arguments: { oldid: oid },
        poll: `linea://wikitext/${oid}`
      }
    };
  }

  const cacheRoot = resolveCacheDir(satellite.satDir);
  const wikitextPath = path.join(cacheRoot, `snapshots/${oid}.wikitext`);
  const metaPath = path.join(cacheRoot, `snapshots/${oid}.meta.json`);

  try {
    const wikitext = await fs.readFile(wikitextPath, 'utf8');
    let meta = null;
    try {
      meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    } catch {
      // meta.json is optional
    }
    return {
      oldid: oid,
      cached: true,
      wikitext_length: wikitext.length,
      wikitext,
      meta
    };
  } catch (err) {
    return { error: `Failed to read wikitext for oldid ${oid}: ${err.message}` };
  }
}

async function resolveRegistroDir(satellite, registroId, registro) {
  const registrosRoot = path.join(satellite.satDir, 'registros');
  const canonical = path.join(registrosRoot, `${registro.id}-oldid-${registro.oldid}`);

  try {
    const stat = await fs.stat(canonical);
    if (stat.isDirectory()) return canonical;
  } catch {
    // try slug-suffixed folder names below
  }

  try {
    const entries = await fs.readdir(registrosRoot, { withFileTypes: true });
    const matchDir = entries.find(
      (e) => e.isDirectory() && (e.name === registroId || e.name.startsWith(`${registroId}-oldid-`))
    );
    if (matchDir) return path.join(registrosRoot, matchDir.name);
  } catch {
    // registros dir may be absent
  }

  return null;
}

/**
 * Read curated markdown sidecars for a registro (any *.md in the registro dir).
 * Avoids hardcoding game-named filenames in engine code (two-games gate).
 * @param {object} satellite
 * @param {string} registroId
 */
export async function readRegistro(satellite, registroId) {
  const registro = satellite.registroIndex.find((r) => r.id === registroId);
  if (!registro) {
    return { error: `Unknown registro_id "${registroId}"` };
  }

  const registroDir = await resolveRegistroDir(satellite, registroId, registro);
  if (!registroDir) {
    return {
      error: `Registro directory not found for "${registroId}"`,
      stats: satellite.cacheStats,
      hint: `Solo ${satellite.cacheStats.curated_registros} registros curados disponibles de ${satellite.cacheStats.registro_count} totales`
    };
  }

  try {
    const entries = await fs.readdir(registroDir);
    const mdFiles = entries.filter((f) => f.endsWith('.md'));
    /** @type {Record<string, string>} */
    const markdown = {};
    for (const name of mdFiles) {
      markdown[name] = await fs.readFile(path.join(registroDir, name), 'utf8');
    }

    const registroMd =
      markdown['registro.md'] ??
      Object.entries(markdown).find(([name]) => name.startsWith('registro'))?.[1] ??
      null;

    // Second sidecar historically named for the curation note file (DATOS §2).
    const curationNote =
      Object.entries(markdown).find(([name]) => name !== 'registro.md' && name.endsWith('.md'))?.[1] ??
      null;

    return {
      registro_id: registroId,
      oldid: registro.oldid,
      timestamp: registro.timestamp,
      milestone: registro.milestone,
      registro_md: registroMd,
      delta_md: curationNote,
      markdown
    };
  } catch (err) {
    return { error: `Failed to read registro "${registroId}": ${err.message}` };
  }
}
