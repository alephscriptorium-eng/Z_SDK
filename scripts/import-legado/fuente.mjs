/**
 * Lectura SOLO LECTURA de las fuentes del corpus legado y normalización a un
 * modelo neutro de dominio (`obras`), sin arrastrar vocabulario de origen.
 *
 * Las rutas de las fuentes NUNCA se hornean aquí: se inyectan por argumento
 * (el CLI las toma de variables de entorno del operador — ver README). El
 * modelo neutro solo usa términos de dominio: obra, personaje, escena,
 * capítulo/tramo.
 *
 * Fuente JSON: colección con `resources` que agrupa tres pozos por id
 * (`characters` / `scenes` / `chapters`) y una o más colecciones de obras. La
 * colección de obras NO se referencia por su nombre en código: se detecta como
 * «cualquier clave de resources que no sea uno de los tres pozos conocidos»
 * (o se fija con `worksKey`). Así el importador lee el corpus real sin que su
 * clave de origen aparezca jamás en el árbol público.
 */

import fs from 'node:fs';
import path from 'node:path';

const POZOS = ['characters', 'scenes', 'chapters'];

/**
 * @param {unknown} coll
 * @returns {Map<string, Record<string, unknown>>}
 */
function indexarPorId(coll) {
  const map = new Map();
  if (!Array.isArray(coll)) return map;
  coll.forEach((item, i) => {
    if (item && typeof item === 'object') {
      const id = typeof item.id === 'string' ? item.id : `#${i}`;
      map.set(id, item);
    }
  });
  return map;
}

/**
 * Resuelve una lista de referencias (ids string o objetos embebidos) contra un
 * pozo indexado. Tolera ambas formas.
 * @param {unknown} lista
 * @param {Map<string, Record<string, unknown>>} pozo
 * @returns {Record<string, unknown>[]}
 */
function resolverRefs(lista, pozo) {
  if (!Array.isArray(lista)) return [];
  /** @type {Record<string, unknown>[]} */
  const out = [];
  for (const ref of lista) {
    if (typeof ref === 'string') {
      const hit = pozo.get(ref);
      if (hit) out.push(hit);
    } else if (ref && typeof ref === 'object') {
      out.push(/** @type {Record<string, unknown>} */ (ref));
    }
  }
  return out;
}

/** @param {unknown} v @returns {string} */
function idDe(v, i) {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && typeof v.id === 'string') return v.id;
  return `#${i}`;
}

/** @param {Record<string, unknown>} c */
function normPersonaje(c, i) {
  return {
    key: idDe(c, i),
    nombre: String(c.name ?? c.nombre ?? c.title ?? `Personaje ${i + 1}`),
    descripcion: String(c.description ?? c.descripcion ?? ''),
    rasgos: Array.isArray(c.traits) ? c.traits.map(String) : [],
    trasfondo: String(c.backstory ?? ''),
    rol: String(c.rol ?? c.role ?? 'personaje')
  };
}

/** @param {Record<string, unknown>} s */
function normEscena(s, i) {
  return {
    key: idDe(s, i),
    titulo: String(s.title ?? s.name ?? `Escena ${i + 1}`),
    descripcion: String(s.description ?? ''),
    escenario: String(s.setting ?? ''),
    resumen: String(s.summary ?? ''),
    contenido: String(s.content ?? ''),
    personajeKeys: Array.isArray(s.characters)
      ? s.characters.map((r, j) => idDe(r, j))
      : []
  };
}

/** @param {Record<string, unknown>} ch */
function normCapitulo(ch, i) {
  return {
    key: idDe(ch, i),
    titulo: String(ch.title ?? ch.name ?? `Tramo ${i + 1}`),
    resumen: String(ch.summary ?? ''),
    contenido: String(ch.content ?? '')
  };
}

/**
 * @param {Record<string, unknown>} w
 * @param {number} i
 * @param {{ personajes: Map, escenas: Map, capitulos: Map }} pozos
 */
function normObra(w, i, pozos) {
  return {
    key: idDe(w, i),
    titulo: String(w.title ?? w.name ?? `Obra ${i + 1}`),
    descripcion: String(w.description ?? ''),
    personajes: resolverRefs(w.characters, pozos.personajes).map(normPersonaje),
    escenas: resolverRefs(w.scenes, pozos.escenas).map(normEscena),
    capitulos: resolverRefs(w.chapters, pozos.capitulos).map(normCapitulo)
  };
}

/**
 * Lee y normaliza el corpus JSON principal (solo lectura).
 * @param {string} rutaJson — ruta inyectada (nunca horneada)
 * @param {{ worksKey?: string|null }} [opts]
 * @returns {Array<ReturnType<typeof normObra>>}
 */
export function leerCorpusJson(rutaJson, opts = {}) {
  const raw = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));
  const resources =
    raw && typeof raw === 'object' && raw.resources && typeof raw.resources === 'object'
      ? raw.resources
      : raw;
  const pozos = {
    personajes: indexarPorId(resources.characters),
    escenas: indexarPorId(resources.scenes),
    capitulos: indexarPorId(resources.chapters)
  };
  const worksKeys = opts.worksKey
    ? [opts.worksKey]
    : Object.keys(resources).filter((k) => !POZOS.includes(k));
  /** @type {Array<ReturnType<typeof normObra>>} */
  const obras = [];
  for (const wk of worksKeys) {
    const coll = resources[wk];
    if (!Array.isArray(coll)) continue;
    coll.forEach((w, i) => {
      if (w && typeof w === 'object') obras.push(normObra(w, i, pozos));
    });
  }
  return obras;
}

/** @param {string} txt @returns {string} */
function primerTitulo(txt) {
  const m = txt.match(/^\s*#\s+(.+)\s*$/m);
  return m ? m[1].trim() : '';
}

/** @param {string} txt @returns {string} */
function primerParrafo(txt) {
  for (const linea of txt.split(/\r?\n/)) {
    const t = linea.trim();
    if (t && !t.startsWith('#')) return t;
  }
  return '';
}

/**
 * Lee una obra en markdown por capítulos (un fichero .md = un tramo).
 * Solo lectura; la ruta se inyecta.
 * @param {string} dir — directorio inyectado (nunca horneado)
 * @returns {ReturnType<typeof normObra>}
 */
export function leerObraMarkdown(dir) {
  const ficheros = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .sort();
  const capitulos = ficheros.map((f, i) => {
    const txt = fs.readFileSync(path.join(dir, f), 'utf8');
    return {
      key: f,
      titulo: primerTitulo(txt) || path.basename(f, path.extname(f)),
      resumen: primerParrafo(txt),
      contenido: txt
    };
  });
  return {
    key: path.basename(dir),
    titulo: path.basename(dir),
    descripcion: '',
    personajes: [],
    escenas: [],
    capitulos
  };
}

/**
 * Reúne las fuentes disponibles (JSON y/o obra markdown) en una lista de obras.
 * @param {{ jsonPath?: string|null, obraDir?: string|null, worksKey?: string|null }} rutas
 * @returns {Array<ReturnType<typeof normObra>>}
 */
export function leerFuente(rutas = {}) {
  /** @type {Array<ReturnType<typeof normObra>>} */
  const obras = [];
  if (rutas.jsonPath) {
    obras.push(...leerCorpusJson(rutas.jsonPath, { worksKey: rutas.worksKey ?? null }));
  }
  if (rutas.obraDir) {
    obras.push(leerObraMarkdown(rutas.obraDir));
  }
  return obras;
}
