/**
 * redactarParte — firma única §A1.
 * Pura: mismo input → mismo parte; sin Date.now ni random.
 */

import {
  PARTE_VERSION,
  ESTADOS_BARRIO,
  estadoVacio
} from './tipos.mjs';
import { PLANTILLAS, PLANTILLAS_PENDIENTE, applyPlantilla } from './plantillas.mjs';

/**
 * @param {import('./tipos.mjs').ParteEstado|null|undefined} estadoAnterior
 * @param {import('./tipos.mjs').ParteDelta[]} deltas
 * @returns {{ parte: import('./tipos.mjs').ParteDeCiudad, estado: import('./tipos.mjs').ParteEstado }}
 */
export function redactarParte(estadoAnterior, deltas) {
  const prev = cloneEstado(estadoAnterior ?? estadoVacio());
  const next = cloneEstado(prev);
  /** @type {string[]} */
  const workTitulares = [];

  for (const d of deltas || []) {
    if (!d || typeof d !== 'object') continue;
    if (d.type === 'tick') {
      if (Number.isInteger(d.tick)) next.tick = d.tick;
      continue;
    }
    if (d.type === 'barrio') {
      applyBarrioDelta(next, d);
      continue;
    }
    if (d.type === 'work') {
      const id = d.barrioId;
      if (typeof id !== 'string' || !id) continue;
      ensureBarrio(next, id);
      const texto =
        typeof d.texto === 'string' && d.texto
          ? d.texto
          : applyPlantilla(PLANTILLAS.WORK, { id });
      workTitulares.push(texto);
    }
  }

  const barrios = [];
  const titulares = [];
  const pendientes = [];
  const censo = { vivos: 0, latentes: 0, muertos: 0, rotos: 0 };
  const ids = Object.keys(next.barrios).sort();

  for (const id of ids) {
    const cur = next.barrios[id];
    const before = prev.barrios[id];
    const delta = classifyDelta(before, cur);
    barrios.push({
      id,
      estado: cur.estado,
      delta,
      gentesActivas: cur.gentesActivas
    });
    censo[pluralKey(cur.estado)] += 1;

    const titular = titularFor(id, cur.estado, delta);
    if (titular) titulares.push(titular);

    if (cur.estado === 'latente' || cur.estado === 'roto') {
      pendientes.push({
        barrioId: id,
        texto: applyPlantilla(PLANTILLAS_PENDIENTE[cur.estado], { id })
      });
    }
  }

  for (const t of workTitulares) {
    if (titulares.length >= 5) break;
    if (!titulares.includes(t)) titulares.push(t);
  }

  // Censo siempre como último titular si cabe (máx 5).
  const censoTitular = applyPlantilla(PLANTILLAS.CENSO, censo);
  if (titulares.length < 5 && !titulares.includes(censoTitular)) {
    titulares.push(censoTitular);
  }
  while (titulares.length > 5) titulares.pop();

  /** @type {import('./tipos.mjs').ParteDeCiudad} */
  const parte = {
    version: PARTE_VERSION,
    tick: next.tick,
    censo,
    barrios,
    titulares,
    pendientes
  };

  return { parte, estado: next };
}

/**
 * @param {import('./tipos.mjs').ParteEstado} estado
 * @returns {import('./tipos.mjs').ParteEstado}
 */
function cloneEstado(estado) {
  /** @type {Record<string, import('./tipos.mjs').BarrioEstado>} */
  const barrios = {};
  for (const [id, b] of Object.entries(estado.barrios || {})) {
    barrios[id] = {
      estado: b.estado,
      gentesActivas: b.gentesActivas
    };
  }
  return { tick: estado.tick ?? 0, barrios };
}

/**
 * @param {import('./tipos.mjs').ParteEstado} estado
 * @param {string} id
 */
function ensureBarrio(estado, id) {
  if (!estado.barrios[id]) {
    estado.barrios[id] = { estado: 'latente', gentesActivas: 0 };
  }
}

/**
 * @param {import('./tipos.mjs').ParteEstado} estado
 * @param {import('./tipos.mjs').DeltaBarrioPatch} d
 */
function applyBarrioDelta(estado, d) {
  if (typeof d.id !== 'string' || !d.id) return;
  ensureBarrio(estado, d.id);
  const b = estado.barrios[d.id];
  if (d.estado != null && ESTADOS_BARRIO.includes(d.estado)) {
    b.estado = d.estado;
  }
  if (Number.isInteger(d.gentesActivas) && d.gentesActivas >= 0) {
    b.gentesActivas = d.gentesActivas;
  } else if (Number.isInteger(d.deltaGentes)) {
    b.gentesActivas = Math.max(0, b.gentesActivas + d.deltaGentes);
  }
}

/**
 * @param {import('./tipos.mjs').BarrioEstado|undefined} before
 * @param {import('./tipos.mjs').BarrioEstado} cur
 * @returns {import('./tipos.mjs').DeltaBarrio}
 */
function classifyDelta(before, cur) {
  if (!before) {
    return cur.estado === 'vivo' || cur.gentesActivas > 0 ? 'subio' : 'igual';
  }
  const rank = { muerto: 0, roto: 1, latente: 2, vivo: 3 };
  const prevR = rank[before.estado] ?? 0;
  const curR = rank[cur.estado] ?? 0;
  if (curR > prevR || cur.gentesActivas > before.gentesActivas) return 'subio';
  if (curR < prevR || cur.gentesActivas < before.gentesActivas) return 'bajo';
  return 'igual';
}

/**
 * @param {import('./tipos.mjs').EstadoBarrio} estado
 */
function pluralKey(estado) {
  if (estado === 'vivo') return 'vivos';
  if (estado === 'latente') return 'latentes';
  if (estado === 'muerto') return 'muertos';
  return 'rotos';
}

/**
 * @param {string} id
 * @param {import('./tipos.mjs').EstadoBarrio} estado
 * @param {import('./tipos.mjs').DeltaBarrio} delta
 */
function titularFor(id, estado, delta) {
  if (estado === 'roto') return applyPlantilla(PLANTILLAS.ROTO, { id, estado });
  if (estado === 'muerto') return applyPlantilla(PLANTILLAS.MUERTO, { id, estado });
  if (estado === 'latente') return applyPlantilla(PLANTILLAS.LATENTE, { id, estado });
  if (delta === 'subio') return applyPlantilla(PLANTILLAS.SUBIO, { id, estado });
  if (delta === 'bajo') return applyPlantilla(PLANTILLAS.BAJO, { id, estado });
  return applyPlantilla(PLANTILLAS.IGUAL_VIVO, { id, estado });
}
