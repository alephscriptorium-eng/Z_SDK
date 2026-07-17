/**
 * Pure resolution helpers for line corpora (browser-safe, no fs).
 */

const MONTHS = Object.freeze({
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11
});

/**
 * Parse Wikipedia-ES historial timestamps (`20:30 24 jun 2026` / `28 sep 2007`).
 * @param {string|null|undefined} ts
 * @returns {number|null} UTC ms
 */
export function parseWpTimestamp(ts) {
  if (!ts || typeof ts !== 'string') return null;

  const withTime = ts.match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\s+(\w{3})\s+(\d{4})$/);
  if (withTime) {
    const [, hh, mm, dd, mon, yyyy] = withTime;
    const m = MONTHS[mon.toLowerCase()];
    if (m === undefined) return null;
    return Date.UTC(Number(yyyy), m, Number(dd), Number(hh), Number(mm), 0);
  }

  const noTime = ts.match(/^(\d{1,2})\s+(\w{3})\s+(\d{4})$/);
  if (noTime) {
    const [, dd, mon, yyyy] = noTime;
    const m = MONTHS[mon.toLowerCase()];
    if (m === undefined) return null;
    return Date.UTC(Number(yyyy), m, Number(dd), 0, 0, 0);
  }

  return null;
}

/**
 * @param {object} registro
 */
export function slimRegistro(registro) {
  return {
    id: registro.id,
    oldid: registro.oldid,
    timestamp: registro.timestamp,
    section: registro.section ?? null,
    milestone: registro.milestone ?? false
  };
}

/**
 * @param {object[]} registroIndex
 */
export function buildSectionIndex(registroIndex) {
  const bySection = {};
  for (const registro of registroIndex) {
    if (!registro.section) continue;
    if (!bySection[registro.section]) bySection[registro.section] = [];
    bySection[registro.section].push(registro);
  }
  return bySection;
}

/**
 * @param {object} lineData
 * @param {number|string} year
 * @param {{ min: number, max: number }} [coverage]
 */
export function resolveNodo(lineData, year, coverage = lineData.coverage) {
  const y = Number(year);
  if (!Number.isFinite(y)) {
    return { error: `Invalid year "${year}": must be a number`, coverage };
  }
  if (coverage && (y < coverage.min || y > coverage.max)) {
    return { error: `Year ${y} outside coverage`, coverage };
  }

  const nodo = Object.values(lineData.nodos).find(
    (entry) => y >= entry.año_ini && (entry.año_fin == null || y <= entry.año_fin)
  );
  if (!nodo) {
    return { error: `No nodo for year ${y}`, coverage };
  }

  return {
    year: y,
    nodo: {
      id: nodo.id,
      parte: nodo.parte,
      etiqueta: nodo.etiqueta,
      tesis: nodo.tesis ?? nodo.tesis_villacañas ?? null,
      tesis_villacañas: nodo.tesis_villacañas,
      articulos_wp: nodo.articulos_wp,
      año_ini: nodo.año_ini,
      año_fin: nodo.año_fin
    }
  };
}

/**
 * @param {object} lineData
 * @param {string} parteId
 */
export function resolveParte(lineData, parteId) {
  const parte = lineData.manifest.meta?.partes?.find((entry) => entry.id === parteId);
  if (!parte) {
    return { error: `Unknown parte "${parteId}"` };
  }
  return {
    id: parte.id,
    titulo: parte.titulo,
    año_ini: parte.año_ini,
    año_fin: parte.año_fin,
    nodos: parte.nodos
  };
}

/**
 * @param {object} satellite
 * @param {number|string} year
 */
export function resolveOldid(satellite, year) {
  const y = Number(year);
  const coverage = satellite.coverage;
  if (!Number.isFinite(y)) {
    return { error: `Invalid year "${year}": must be a number`, coverage };
  }
  if (coverage && (y < coverage.min || y > coverage.max)) {
    return { error: `Year ${y} outside WP historia coverage`, coverage };
  }

  const targetMs = Date.UTC(y, 11, 31, 23, 59, 59);
  const { byDate } = satellite;
  let lo = 0;
  let hi = byDate.length - 1;
  let best = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (byDate[mid].dateMs <= targetMs) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (best === -1) {
    return { error: `No registro <= year ${y}`, coverage };
  }

  const reg = byDate[best];
  return {
    year: y,
    oldid: reg.oldid,
    timestamp: reg.timestamp,
    registro_id: reg.id
  };
}

function formatRegistroItem(registro, satellite, anchorOldid = null) {
  const cached = satellite.cacheStats.cached_oldids.includes(registro.oldid);
  return {
    registro_id: registro.id,
    oldid: registro.oldid,
    timestamp: registro.timestamp,
    section: registro.section,
    milestone: registro.milestone ?? false,
    cached,
    curated: satellite.curatedRegistroIds.has(registro.id),
    is_anchor: anchorOldid != null && registro.oldid === anchorOldid
  };
}

/**
 * @param {object} lineData
 * @param {string} nodoId
 * @param {{ limit?: number, milestonesOnly?: boolean }} [options]
 */
export function resolveRegistrosForNodo(lineData, nodoId, options = {}) {
  const { limit, milestonesOnly = false } = options;
  const satellite = lineData.satellite;
  if (!satellite) {
    return { error: 'No satellite data loaded for this line' };
  }

  const nodoEntry = lineData.nodos[nodoId];
  if (!nodoEntry) {
    return { error: `Unknown nodo_id "${nodoId}"` };
  }

  const nodoMapEntry = satellite.nodoSections[nodoId];
  if (!nodoMapEntry?.sections?.length) {
    return { error: `No section mapping for nodo "${nodoId}"` };
  }

  const sections = nodoMapEntry.sections;
  const anchor = satellite.waveA?.byNodoId?.[nodoId] ?? null;
  const seenOldids = new Set();
  let registros = [];

  for (const section of sections) {
    const sectionRegs = satellite.sectionIndex[section] ?? [];
    for (const reg of sectionRegs) {
      if (milestonesOnly && !reg.milestone) continue;
      if (seenOldids.has(reg.oldid)) continue;
      seenOldids.add(reg.oldid);
      registros.push(formatRegistroItem(reg, satellite, anchor?.oldid ?? null));
    }
  }

  registros.sort((a, b) => {
    if (a.is_anchor !== b.is_anchor) return a.is_anchor ? -1 : 1;
    const aMs = parseWpTimestamp(a.timestamp) ?? 0;
    const bMs = parseWpTimestamp(b.timestamp) ?? 0;
    return bMs - aMs;
  });

  if (anchor?.oldid != null && !registros.some((r) => r.oldid === anchor.oldid)) {
    const anchorReg = satellite.registroIndex.find((r) => r.oldid === anchor.oldid);
    if (anchorReg) {
      registros.unshift(formatRegistroItem(anchorReg, satellite, anchor.oldid));
    } else {
      registros.unshift({
        registro_id: null,
        oldid: anchor.oldid,
        timestamp: null,
        section: null,
        milestone: false,
        cached: satellite.cacheStats.cached_oldids.includes(anchor.oldid),
        curated: false,
        is_anchor: true
      });
    }
  }

  const total = registros.length;
  if (limit != null && Number.isFinite(Number(limit))) {
    registros = registros.slice(0, Number(limit));
  }

  return {
    nodo_id: nodoId,
    nodo: {
      id: nodoEntry.id,
      etiqueta: nodoEntry.etiqueta,
      año_ini: nodoEntry.año_ini,
      año_fin: nodoEntry.año_fin
    },
    anchor,
    sections,
    registros,
    total,
    cached_count: registros.filter((r) => r.cached).length
  };
}

/**
 * @param {object} lineData
 * @param {number|string} year
 * @param {{ limit?: number, milestonesOnly?: boolean }} [options]
 */
export function resolveRegistrosForYear(lineData, year, options = {}) {
  const nodoResult = resolveNodo(lineData, year);
  if (nodoResult.error) {
    return nodoResult;
  }

  const registrosResult = resolveRegistrosForNodo(lineData, nodoResult.nodo.id, options);
  if (registrosResult.error) {
    return { ...registrosResult, year: nodoResult.year, nodo: nodoResult.nodo };
  }

  return {
    year: nodoResult.year,
    nodo: nodoResult.nodo,
    anchor: registrosResult.anchor,
    sections: registrosResult.sections,
    registros: registrosResult.registros,
    total: registrosResult.total,
    cached_count: registrosResult.cached_count
  };
}

/**
 * @param {object} lineData
 */
export function validateNodoSectionMappings(lineData) {
  const satellite = lineData.satellite;
  if (!satellite) {
    return { error: 'No satellite data loaded for this line' };
  }

  const issues = [];
  const nodoIds = Object.keys(lineData.nodos).sort();

  for (const nodoId of nodoIds) {
    const mapping = satellite.nodoSections[nodoId];
    if (!mapping?.sections?.length) {
      issues.push({ nodo_id: nodoId, kind: 'missing_mapping' });
      continue;
    }

    const unknownSections = mapping.sections.filter((section) => !satellite.sectionIndex[section]?.length);
    if (unknownSections.length) {
      issues.push({ nodo_id: nodoId, kind: 'unknown_sections', sections: unknownSections });
    }

    const result = resolveRegistrosForNodo(lineData, nodoId);
    if (result.error) {
      issues.push({ nodo_id: nodoId, kind: 'resolve_error', error: result.error });
    } else if (result.total === 0) {
      issues.push({ nodo_id: nodoId, kind: 'empty_registros', sections: mapping.sections });
    }
  }

  return {
    ok: issues.length === 0,
    nodo_count: nodoIds.length,
    issues
  };
}
