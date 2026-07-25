/**
 * Transformación pura: modelo neutro de `obras` → formatos EXISTENTES del
 * engine, con IDs zeus deterministas (precedente D-19).
 *
 * Por cada obra emite el triple:
 *   - línea (formatos @zeus/linea-kit): nodos-document + manifest-tronco +
 *     nodo-meta[] + entrada de lineas-registry. Capítulos → tramos de línea.
 *   - story-board (dialecto solve-inline de @zeus/story-board-schema): escenas
 *     → actos; personajes referenciados por `personajes.refs` (refs-only, U174).
 *   - reparto (shape `reparto/1` de @zeus/reparto-kit): personajes desde los
 *     characters; `asignaciones: []` (los actores llegan después); `politica`
 *     mínima por rol.
 *
 * Sin IO ni relojes: determinista (mismo input → mismos ids/estructuras).
 * `generated_at` solo se añade si el operador inyecta `opts.now`.
 */

import { crearReparto } from '@zeus/reparto-kit';
import { zeusId } from './ids.mjs';

const WIDGET_ESCENA = 'panel-escena';
const AUTOR_TRONCO = 'dramaturgo';
const SATELITE_REL = 'wp/historia/';

/**
 * Construye los formatos de línea (linea-kit) para una obra.
 * @param {import('./fuente.mjs').leerObraMarkdown extends (...a:any)=>infer R ? R : any} obra
 * @param {string} lineId
 */
function construirLinea(obra, lineId) {
  // Capítulos → tramos de línea. Sin capítulos, caen las escenas; sin ninguno,
  // un tramo por defecto (una línea necesita ≥1 nodo).
  let tramos = obra.capitulos;
  if (!tramos.length) {
    tramos = obra.escenas.length
      ? obra.escenas.map((e) => ({ key: e.key, titulo: e.titulo, resumen: e.resumen }))
      : [{ key: 't0', titulo: obra.titulo, resumen: obra.descripcion }];
  }

  const metas = tramos.map((t, i) => ({
    id: zeusId('nodo', t.titulo, obra.key, t.key, i),
    parte: 'I',
    año_ini: i,
    año_fin: null,
    etiqueta: t.titulo,
    tesis: t.resumen ?? '',
    articulos_wp: []
  }));

  const parteResumen = {
    id: 'I',
    titulo: 'Parte I',
    año_ini: 0,
    año_fin: metas.length ? metas.length - 1 : null
  };

  const nodosDocument = {
    version: '0.1.0',
    corpus: `LINEAS/${lineId}`,
    autor_tronco: AUTOR_TRONCO,
    referencia_wp_cima: '',
    partes: [
      {
        ...parteResumen,
        nodos: metas.map((m) => ({
          id: m.id,
          años: `${m.año_ini}`,
          etiqueta: m.etiqueta,
          tesis: m.tesis,
          articulos_wp: []
        }))
      }
    ]
  };

  const manifestTronco = {
    meta: {
      corpus: `LINEAS/${lineId}`,
      version: '0.1.0',
      source: 'import-legado',
      autor_tronco: AUTOR_TRONCO,
      referencia_wp_cima: '',
      nodo_count: metas.length,
      partes: [{ ...parteResumen, nodos: metas.map((m) => m.id) }],
      satelite_wp: SATELITE_REL
    },
    nodos: metas.map((m) => ({
      id: m.id,
      paths: { meta: `nodos/${m.id}/meta.json`, folder: `nodos/${m.id}/` }
    }))
  };

  const registryEntry = {
    id: lineId,
    path: lineId,
    etiqueta: obra.titulo,
    autor_tronco: AUTOR_TRONCO,
    nodo_prefix: 'nodo',
    nodo_count: metas.length,
    referencia_wp_cima: ''
  };

  return { nodosDocument, manifestTronco, metas, registryEntry };
}

/**
 * Importa una obra neutra al triple de formatos destino.
 * @param {any} obra
 * @param {{ now?: string|null }} [opts]
 */
export function importarObra(obra, opts = {}) {
  const lineId = zeusId('linea', obra.titulo, obra.key);

  // --- reparto (reparto/1), asignaciones vacías ---
  const personajes = obra.personajes.map((p) => ({
    id: zeusId('pj', p.nombre, obra.key, p.key),
    nombre: p.nombre,
    rol: p.rol || 'personaje'
  }));
  /** @type {Record<string, string[]>} */
  const politica = {};
  for (const p of personajes) {
    if (!politica[p.rol]) politica[p.rol] = ['reparto:leer', 'reparto:interpretar'];
  }
  const reparto = crearReparto({ personajes, asignaciones: [], politica });

  // --- story-board (solve-inline): escenas → actos ---
  const fuenteActos = obra.escenas.length
    ? obra.escenas
    : obra.capitulos.length
      ? obra.capitulos
      : [{ titulo: obra.titulo }];
  const acts = fuenteActos.map((s, i) => ({
    id: `act-${i}`,
    title: s.titulo || `Acto ${i + 1}`,
    widgets: [WIDGET_ESCENA]
  }));
  /** @type {Record<string, unknown>} */
  const board = { version: 1, title: obra.titulo, acts };
  if (personajes.length) {
    board.personajes = {
      reparto: `reparto://${lineId}/reparto.json`,
      refs: personajes.map((p) => ({ personajeId: p.id }))
    };
  }
  if (opts.now) board.generated_at = String(opts.now);

  // --- línea (linea-kit) ---
  const linea = construirLinea(obra, lineId);
  if (opts.now) linea.manifestTronco.meta.generated_at = String(opts.now);

  return {
    lineId,
    obra: { key: obra.key, titulo: obra.titulo },
    board,
    reparto,
    linea
  };
}

/**
 * Importa una colección de obras. Devuelve el bundle completo, con el
 * lineas-registry agregado de todas las obras.
 * @param {any[]} obras
 * @param {{ now?: string|null }} [opts]
 */
export function importarCorpus(obras, opts = {}) {
  const items = obras.map((o) => importarObra(o, opts));
  const registry = items.map((it) => it.linea.registryEntry);
  return { items, registry };
}
