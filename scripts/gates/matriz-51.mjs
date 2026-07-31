#!/usr/bin/env node
/**
 * Gate matriz 51/51 (WP-U233) — el denominador con dientes.
 *
 * Deriva EN RUNTIME el manifest de las piezas del árbol (no transcribe
 * plan/MATRIZ-RUNTIME-51.md; la usa solo como CONTRASTE del denominador):
 *
 *   - denominador = miembros de los globs de `workspaces` del manifest raíz
 *     con package.json + manifests anidados fuera de node_modules/dist que
 *     no sean fixtures de test (hoy: 50 + 1 = 51);
 *   - por pieza: tipo (lib/MCP/UI/CLI/servicio/demo) · capacidad (1 línea del
 *     description) · canal (npm/ninguno con evidencia de
 *     plan/PUBLISH-ALLOWLIST.md, o ⏳ hasta U236) · consumidor (deps inversas
 *     @zeus + catálogo + scripts raíz, o «ninguno detectado») · start/health
 *     (script real + entrada de catálogo) — CADA celda con evidencia (ruta)
 *     o ⏳ explícito;
 *   - catálogo = parse estático de CATALOG_SEED
 *     (packages/mesh/mcp-launcher/src/catalog.mjs) + CITY_LEAF_SEED
 *     (packages/mesh/ciudad-lifecycle/src/catalog-extend.mjs). Parse
 *     estático a propósito: el gate corre en checkout limpio sin
 *     node_modules (mismo patrón autocontenido que scan.mjs).
 *
 * Falla (exit 1) si:
 *   - el total derivado ≠ EXPECTED_TOTAL (51) — crecer conscientemente =
 *     actualizar la constante Y plan/MATRIZ-RUNTIME-51.md;
 *   - pieza del árbol sin fila en el contraste, o fila del contraste sin
 *     pieza en el árbol (pieza fantasma / pieza ocultada);
 *   - el contraste tiene filas duplicadas o su total físico ≠ 51;
 *   - entrada de catálogo con `workspace` que no existe como pieza, o SIN
 *     marca explícita de flota-declarada (`workspace: null`), o con
 *     `workspace` presente pero no parseable (no se fabrica null), o
 *     bloque sin `id` literal parseable (spread → falso-positivo ruidoso,
 *     falla cerrada — ver parseSeedEntries);
 *   - cualquier celda sin evidencia ni ⏳, o con valor vacío sin ⏳
 *     (falla, no advierte).
 *
 * Las entradas `workspace: null` (flota declarada > materializada, U179:
 * 4 seed + 6 city) NO fallan: se listan como «⏳ declarado» — visibles.
 *
 * Invocación (sin script npm — GOBIERNO-EJECUCION-F2 §2: package.json
 * intacto; U180–U185 lo consumen):
 *   node scripts/gates/matriz-51.mjs          → tabla humana; exit ≠ 0 si falla
 *   node scripts/gates/matriz-51.mjs --json   → JSON estable por stdout
 * Autoprueba: node --test test/gates/matriz-51.test.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../..');

/**
 * Denominador esperado (mesa F2 / plan/MATRIZ-RUNTIME-51.md).
 * Cambiarlo exige asiento consciente: nueva pieza ⇒ actualizar también el
 * contraste plan/MATRIZ-RUNTIME-51.md (o su sucesor).
 */
export const EXPECTED_TOTAL = 51;

export const CONTRASTE_PATH = 'plan/MATRIZ-RUNTIME-51.md';
export const ALLOWLIST_PATH = 'plan/PUBLISH-ALLOWLIST.md';
export const CATALOG_PATH = 'packages/mesh/mcp-launcher/src/catalog.mjs';
export const CATALOG_EXTEND_PATH =
  'packages/mesh/ciudad-lifecycle/src/catalog-extend.mjs';

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.angular',
  '.worktrees',
  'coverage',
  '.turbo',
  'vendor'
]);

/** @param {string} root @param {string} abs */
function rel(root, abs) {
  return path.relative(root, abs).split(path.sep).join('/');
}

/** @param {string} s */
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @typedef {{ valor: string, evidencia: string }} Celda
 * @typedef {{
 *   pieza: string, dir: string, grupo: string,
 *   celdas: { tipo: Celda, capacidad: Celda, canal: Celda,
 *             consumidor: Celda, start: Celda, health: Celda }
 * }} Fila
 * @typedef {{ codigo: string, detalle: string }} Fallo
 */

// ---------------------------------------------------------------------------
// 1 · Enumeración del denominador (árbol vivo, no transcripción)
// ---------------------------------------------------------------------------

/**
 * @param {{ repoRoot?: string }} [opts]
 * @returns {{
 *   piezas: { dir: string, name: string, manifest: object, grupo: string }[],
 *   excluidos: { path: string, motivo: string }[],
 *   fallos: Fallo[]
 * }}
 */
export function enumerarPiezas(opts = {}) {
  const root = opts.repoRoot ?? REPO_ROOT;
  /** @type {Fallo[]} */
  const fallos = [];
  /** @type {{ path: string, motivo: string }[]} */
  const excluidos = [];
  /** @type {{ dir: string, name: string, manifest: object, grupo: string }[]} */
  const piezas = [];

  const raizPath = path.join(root, 'package.json');
  const raiz = JSON.parse(fs.readFileSync(raizPath, 'utf8'));
  const globs = Array.isArray(raiz.workspaces) ? raiz.workspaces : [];

  const memberDirs = [];
  for (const glob of globs) {
    if (!glob.endsWith('/*')) {
      fallos.push({
        codigo: 'workspaces-glob',
        detalle: `glob de workspaces no soportado por el gate: "${glob}" (package.json raíz)`
      });
      continue;
    }
    const base = glob.slice(0, -2);
    const absBase = path.join(root, base);
    if (!fs.existsSync(absBase)) continue;
    for (const entry of fs.readdirSync(absBase, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) continue;
      const dirRel = `${base}/${entry.name}`;
      const manifestAbs = path.join(absBase, entry.name, 'package.json');
      if (!fs.existsSync(manifestAbs)) {
        excluidos.push({
          path: dirRel,
          motivo: 'matchea glob de workspaces pero no tiene package.json (npm no lo trata como miembro)'
        });
        continue;
      }
      memberDirs.push({ dirRel, manifestAbs, grupo: base.split('/').pop() });
    }
  }

  /** @param {string} manifestAbs @param {string} dirRel @param {string} grupo */
  const addPieza = (manifestAbs, dirRel, grupo) => {
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestAbs, 'utf8'));
    } catch (e) {
      fallos.push({ codigo: 'manifest-invalido', detalle: `${dirRel}/package.json: ${e.message}` });
      return;
    }
    if (!manifest.name) {
      fallos.push({ codigo: 'manifest-sin-name', detalle: `${dirRel}/package.json sin campo name` });
      return;
    }
    piezas.push({ dir: dirRel, name: manifest.name, manifest, grupo });
  };

  for (const m of memberDirs) addPieza(m.manifestAbs, m.dirRel, m.grupo);

  // Manifests anidados bajo miembros (piezas con package.json propio fuera
  // de los globs). Fixtures de test = excluidos con motivo, no invisibles.
  for (const m of memberDirs) {
    const walk = (absDir) => {
      for (const entry of fs.readdirSync(absDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const abs = path.join(absDir, entry.name);
        if (entry.isDirectory()) {
          walk(abs);
          continue;
        }
        if (entry.name !== 'package.json') continue;
        const dirRel = rel(root, absDir);
        if (dirRel === m.dirRel) continue; // el manifest del propio miembro
        if (/\/(test|tests|fixtures)\//.test(`/${dirRel}/`)) {
          excluidos.push({ path: `${dirRel}/package.json`, motivo: 'manifest de fixture de test — no es pieza' });
          continue;
        }
        addPieza(abs, dirRel, 'anidada');
      }
    };
    walk(path.join(root, m.dirRel));
  }

  const vistos = new Map();
  for (const p of piezas) {
    if (vistos.has(p.name)) {
      fallos.push({
        codigo: 'name-duplicado',
        detalle: `${p.name} aparece en ${vistos.get(p.name)} y ${p.dir}`
      });
    } else {
      vistos.set(p.name, p.dir);
    }
  }

  piezas.sort((a, b) => a.dir.localeCompare(b.dir));
  return { piezas, excluidos, fallos };
}

// ---------------------------------------------------------------------------
// 2 · Catálogo (parse estático de los seeds — sin node_modules)
// ---------------------------------------------------------------------------

/**
 * Parse estático de un array-seed de catálogo (`export const <NOMBRE> = [...]`).
 * Soporta un nivel de objeto anidado (p. ej. `tree: {...}`).
 *
 * Endurecido tras contrarrevisión (D1):
 * - `id`/`workspace` aceptan comillas simples Y dobles;
 * - los comentarios `// ...` se eliminan ANTES de buscar la marca (un
 *   comentario que diga "workspace: null" no cuenta como marca);
 * - `workspace:` presente pero no parseable (ni null ni string) = fallo
 *   `catalogo-parse` RUIDOSO — jamás se fabrica un null silencioso;
 * - bloque de entrada sin `id` parseable = fallo `catalogo-parse` RUIDOSO.
 *   Nota (limitación documentada): una entrada construida con spread
 *   (`{ ...BASE, id }`) cae aquí como falso-positivo ruidoso — falla
 *   cerrada, el gate exige entradas literales.
 *
 * @param {string} texto contenido del fichero
 * @param {string} marcador p. ej. 'CATALOG_SEED'
 * @param {string} fuente ruta relativa (evidencia)
 * @returns {{ entradas: { id: string, workspace: string|null, hasWorkspaceKey: boolean, fuente: string }[], fallos: Fallo[] }}
 */
export function parseSeedEntries(texto, marcador, fuente) {
  /** @type {Fallo[]} */
  const fallos = [];
  /** @type {{ id: string, workspace: string|null, hasWorkspaceKey: boolean, fuente: string }[]} */
  const entradas = [];
  const inicio = texto.indexOf(`export const ${marcador} = [`);
  if (inicio === -1) {
    fallos.push({ codigo: 'catalogo-parse', detalle: `no se encontró "export const ${marcador} = [" en ${fuente}` });
    return { entradas, fallos };
  }
  const fin = texto.indexOf('\n];', inicio);
  if (fin === -1) {
    fallos.push({ codigo: 'catalogo-parse', detalle: `cierre "];" no encontrado para ${marcador} en ${fuente}` });
    return { entradas, fallos };
  }
  const slice = texto.slice(inicio, fin);
  const bloques = slice.match(/\{(?:[^{}]|\{[^{}]*\})*\}/g) || [];
  /** @param {string} b */
  const resumen = (b) => b.replace(/\s+/g, ' ').trim().slice(0, 80);
  for (const bloqueCrudo of bloques) {
    // fuera comentarios de línea: no pueden satisfacer marcas (D1-V4)
    const bloque = bloqueCrudo.replace(/(^|[\s,{[])\/\/[^\n]*/gm, '$1');
    const idMatch = bloque.match(/(?:^|[\s{,])id\s*:\s*(?:'([^']+)'|"([^"]+)")/);
    if (!idMatch) {
      fallos.push({
        codigo: 'catalogo-parse',
        detalle: `${marcador} en ${fuente}: bloque de entrada sin id parseable (¿spread/formato no literal?): ${resumen(bloqueCrudo)}`
      });
      continue;
    }
    const id = idMatch[1] ?? idMatch[2];
    const hasWorkspaceKey = /(?:^|[\s{,])workspace\s*:/.test(bloque);
    const wsMatch = bloque.match(/(?:^|[\s{,])workspace\s*:\s*(null|'([^']*)'|"([^"]*)")/);
    if (hasWorkspaceKey && !wsMatch) {
      fallos.push({
        codigo: 'catalogo-parse',
        detalle: `entrada "${id}" (${fuente}): campo workspace presente pero no parseable (se esperaba null o string entre comillas simples/dobles) — no se fabrica null`
      });
      continue;
    }
    entradas.push({
      id,
      workspace: wsMatch ? (wsMatch[1] === 'null' ? null : (wsMatch[2] ?? wsMatch[3])) : null,
      hasWorkspaceKey,
      fuente
    });
  }
  if (entradas.length === 0) {
    fallos.push({ codigo: 'catalogo-parse', detalle: `${marcador} en ${fuente}: 0 entradas parseadas` });
  }
  return { entradas, fallos };
}

/**
 * @param {{ repoRoot?: string }} [opts]
 */
export function parseCatalogo(opts = {}) {
  const root = opts.repoRoot ?? REPO_ROOT;
  /** @type {Fallo[]} */
  const fallos = [];
  const entradas = [];
  for (const [ruta, marcador] of [
    [CATALOG_PATH, 'CATALOG_SEED'],
    [CATALOG_EXTEND_PATH, 'CITY_LEAF_SEED']
  ]) {
    const abs = path.join(root, ruta);
    if (!fs.existsSync(abs)) {
      fallos.push({ codigo: 'catalogo-ausente', detalle: `${ruta} no existe` });
      continue;
    }
    const r = parseSeedEntries(fs.readFileSync(abs, 'utf8'), marcador, ruta);
    entradas.push(...r.entradas);
    fallos.push(...r.fallos);
  }
  return { entradas, fallos };
}

/**
 * Catálogo vs árbol: workspace inexistente = fallo; sin marca explícita
 * (`workspace:` ausente) = fallo; workspace null = ⏳ declarado (visible).
 * @param {{ id: string, workspace: string|null, hasWorkspaceKey: boolean, fuente: string }[]} entradas
 * @param {Set<string>} nombresPiezas
 */
export function compararCatalogo(entradas, nombresPiezas) {
  /** @type {Fallo[]} */
  const fallos = [];
  /** @type {{ id: string, fuente: string, estado: string }[]} */
  const declaradasSinPieza = [];
  for (const e of entradas) {
    if (!e.hasWorkspaceKey) {
      fallos.push({
        codigo: 'catalogo-sin-marca',
        detalle: `entrada "${e.id}" (${e.fuente}) sin campo workspace: ni pieza ni marca explícita de flota-declarada`
      });
      continue;
    }
    if (e.workspace === null) {
      declaradasSinPieza.push({
        id: e.id,
        fuente: e.fuente,
        estado: '⏳ declarado — flota declarada > materializada (workspace: null; ver U183/U185)'
      });
      continue;
    }
    if (!nombresPiezas.has(e.workspace)) {
      fallos.push({
        codigo: 'catalogo-workspace-fantasma',
        detalle: `entrada "${e.id}" (${e.fuente}) declara workspace ${e.workspace} que no existe como pieza del árbol`
      });
    }
  }
  return { fallos, declaradasSinPieza };
}

// ---------------------------------------------------------------------------
// 3 · Contraste (plan/MATRIZ-RUNTIME-51.md) y allowlist (canal)
// ---------------------------------------------------------------------------

/**
 * @param {{ repoRoot?: string }} [opts]
 * @returns {{ nombres: string[], fallos: Fallo[] }}
 */
export function parseContraste(opts = {}) {
  const root = opts.repoRoot ?? REPO_ROOT;
  const abs = path.join(root, CONTRASTE_PATH);
  if (!fs.existsSync(abs)) {
    return { nombres: [], fallos: [{ codigo: 'contraste-ausente', detalle: `${CONTRASTE_PATH} no existe` }] };
  }
  const texto = fs.readFileSync(abs, 'utf8');
  /** @type {string[]} */
  const nombres = [];
  const vistos = new Set();
  const duplicados = new Set();
  for (const m of texto.matchAll(/^\|\s*(@zeus\/[A-Za-z0-9._-]+)\s*\|/gm)) {
    nombres.push(m[1]);
    if (vistos.has(m[1])) duplicados.add(m[1]);
    vistos.add(m[1]);
  }
  /** @type {Fallo[]} */
  const fallos = [];
  if (nombres.length === 0) {
    fallos.push({ codigo: 'contraste-vacio', detalle: `${CONTRASTE_PATH}: 0 filas | @zeus/... | parseadas` });
  }
  for (const d of [...duplicados].sort()) {
    fallos.push({
      codigo: 'contraste-duplicado',
      detalle: `${CONTRASTE_PATH}: fila duplicada para ${d} (${nombres.length} filas físicas / ${vistos.size} únicas)`
    });
  }
  return { nombres, unicos: [...vistos], fallos };
}

/**
 * Clases publicables desde plan/PUBLISH-ALLOWLIST.md (§2 clase B ya en canal,
 * §3 candidatos C: P0 con GO / P1 en triage).
 * @param {{ repoRoot?: string }} [opts]
 * @returns {{ claseB: Set<string>, p0: Set<string>, p1: Set<string>, fallos: Fallo[] }}
 */
export function parseAllowlist(opts = {}) {
  const root = opts.repoRoot ?? REPO_ROOT;
  const abs = path.join(root, ALLOWLIST_PATH);
  const claseB = new Set();
  const p0 = new Set();
  const p1 = new Set();
  if (!fs.existsSync(abs)) {
    return { claseB, p0, p1, fallos: [{ codigo: 'allowlist-ausente', detalle: `${ALLOWLIST_PATH} no existe` }] };
  }
  const texto = fs.readFileSync(abs, 'utf8');
  const seccion = (desde, hasta) => {
    const i = texto.indexOf(desde);
    if (i === -1) return '';
    const j = hasta ? texto.indexOf(hasta, i) : -1;
    return texto.slice(i, j === -1 ? undefined : j);
  };
  for (const m of seccion('## 2.', '## 3.').matchAll(/`(@zeus\/[A-Za-z0-9._-]+)`/g)) claseB.add(m[1]);
  const s3 = seccion('## 3.', '## 4.');
  const sub = (desde, hasta) => {
    const i = s3.indexOf(desde);
    if (i === -1) return '';
    const j = hasta ? s3.indexOf(hasta, i) : -1;
    return s3.slice(i, j === -1 ? undefined : j);
  };
  for (const m of sub('### P0', '### P1').matchAll(/^\|\s*`(@zeus\/[A-Za-z0-9._-]+)`/gm)) p0.add(m[1]);
  for (const m of sub('### P1', '### GO').matchAll(/^\|\s*`(@zeus\/[A-Za-z0-9._-]+)`/gm)) p1.add(m[1]);
  return { claseB, p0, p1, fallos: [] };
}

// ---------------------------------------------------------------------------
// 4 · Derivación de filas (6 celdas con evidencia o ⏳)
// ---------------------------------------------------------------------------

const UI_RE = /\b(UI|browser|viewer|monitor|editor|deck|portal)\b/i;
const MCP_DESC_RE = /^MCP (servers?|meta-ops)\b/i;

/** @param {string} root @param {string} dir @returns {string|null} ruta relativa con marcador MCP */
function mcpFileSignal(root, dir) {
  for (const f of ['src/server.mjs', 'src/mcp-server.mjs', 'src/start.mjs']) {
    const abs = path.join(root, dir, f);
    if (!fs.existsSync(abs)) continue;
    const head = fs.readFileSync(abs, 'utf8').slice(0, 400);
    if (/MCP server/i.test(head)) return `${dir}/${f}`;
  }
  return null;
}

/**
 * @param {{ dir: string, name: string, manifest: object, grupo: string }[]} piezas
 * @param {{ repoRoot?: string }} [opts]
 * @returns {{ filas: Fila[], fallos: Fallo[] }}
 */
export function derivarFilas(piezas, opts = {}) {
  const root = opts.repoRoot ?? REPO_ROOT;
  const { entradas: entradasCatalogo, fallos: fallosCat } = parseCatalogo({ repoRoot: root });
  const allow = parseAllowlist({ repoRoot: root });
  /** @type {Fallo[]} */
  const fallos = [...fallosCat, ...allow.fallos];

  const raiz = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const rootScripts = Object.entries(raiz.scripts || {});

  /** referencias en scripts raíz: -w <name> o ruta del dir de la pieza */
  const refsRaiz = (p) => {
    const wRe = new RegExp(`-w[= ]${escapeRe(p.name)}(\\s|$)`);
    const dirRe = new RegExp(`(^|[\\s"'])${escapeRe(p.dir)}([\\s/"']|$)`);
    return rootScripts.filter(([, v]) => wRe.test(v) || dirRe.test(v)).map(([k]) => k);
  };

  const filas = piezas.map((p) => {
    const desc = typeof p.manifest.description === 'string' ? p.manifest.description.trim() : '';
    const manifestRel = `${p.dir}/package.json`;
    const entrada = entradasCatalogo.find((e) => e.workspace === p.name) || null;
    const scriptsRef = refsRaiz(p);
    const startPropio = p.manifest.scripts && typeof p.manifest.scripts.start === 'string';
    const startRaiz = scriptsRef.filter((s) => s.startsWith('start:'));
    const tieneStart = startPropio || startRaiz.length > 0;

    // tipo — precedencia: catálogo(MCP) > desc/file MCP > UI > CLI > demo > servicio > lib
    /** @type {Celda} */
    let tipo;
    const señalMcpFichero = tieneStart ? mcpFileSignal(root, p.dir) : null;
    if (entrada) {
      tipo = { valor: 'MCP', evidencia: `${entrada.fuente} (entrada "${entrada.id}")` };
    } else if (tieneStart && MCP_DESC_RE.test(desc)) {
      tipo = { valor: 'MCP', evidencia: `${manifestRel} (description "MCP …") + arranque` };
    } else if (señalMcpFichero) {
      tipo = { valor: 'MCP', evidencia: `${señalMcpFichero} (cabecera "MCP server") + arranque` };
    } else if (tieneStart && UI_RE.test(desc)) {
      tipo = { valor: 'UI', evidencia: `${manifestRel} (description) + arranque` };
    } else if (p.manifest.bin) {
      tipo = { valor: 'CLI', evidencia: `${manifestRel} (bin: ${Object.keys(p.manifest.bin).join(', ')})` };
    } else if (p.grupo === 'examples') {
      tipo = { valor: 'demo', evidencia: `${manifestRel} (examples/*; scripts raíz: ${scriptsRef.join(', ') || 'ninguno'})` };
    } else if (tieneStart) {
      tipo = { valor: 'servicio', evidencia: `${manifestRel} (arranque sin señal MCP/UI)` };
    } else {
      tipo = { valor: 'lib', evidencia: `${manifestRel} (sin bin, sin start propio ni start:* raíz)` };
    }

    /** @type {Celda} */
    const capacidad = desc
      ? { valor: desc.length > 110 ? `${desc.slice(0, 107)}…` : desc, evidencia: `${manifestRel} (description)` }
      : { valor: '⏳ sin description en el manifest', evidencia: manifestRel };

    // canal — evidencia de plan/PUBLISH-ALLOWLIST.md, o ⏳ hasta U236
    /** @type {Celda} */
    let canal;
    const esPrivado = p.manifest.private === true;
    const conRegistry = Boolean(p.manifest.publishConfig && p.manifest.publishConfig.registry);
    if (allow.claseB.has(p.name)) {
      canal = { valor: 'npm', evidencia: `${ALLOWLIST_PATH} §2 (clase B ya en canal)` };
    } else if (allow.p0.has(p.name)) {
      canal = { valor: 'npm', evidencia: `${ALLOWLIST_PATH} §3 P0 (GO publish FINAL)` };
    } else if (allow.p1.has(p.name)) {
      canal = {
        valor: '⏳ candidato P1 — publish-ready U178 / matriz U236',
        evidencia: `${ALLOWLIST_PATH} §3 P1`
      };
    } else if (p.grupo === 'engine' && conRegistry && !esPrivado) {
      canal = {
        valor: 'npm',
        evidencia: `${ALLOWLIST_PATH} §1 (clase A) + ${manifestRel} (publishConfig.registry, sin private)`
      };
    } else {
      canal = {
        valor: 'ninguno (privado; canal app/pack ⏳ U236)',
        evidencia: `${ALLOWLIST_PATH} §1/§4 (clase D/E/F/G — mantener privado)`
      };
    }

    // consumidor — deps inversas @zeus + catálogo + scripts raíz
    const consumidores = [];
    const evidencias = [];
    for (const otra of piezas) {
      if (otra.name === p.name) continue;
      const depsDe = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
        .some((k) => otra.manifest[k] && Object.prototype.hasOwnProperty.call(otra.manifest[k], p.name));
      if (depsDe) {
        consumidores.push(otra.name);
        evidencias.push(`${otra.dir}/package.json`);
      }
    }
    if (entrada) {
      consumidores.push(`catálogo mcp-launcher (id ${entrada.id})`);
      evidencias.push(entrada.fuente);
    }
    if (scriptsRef.length > 0) {
      consumidores.push(`scripts raíz (${scriptsRef.join(', ')})`);
      evidencias.push('package.json');
    }
    /** @type {Celda} */
    const consumidor = consumidores.length > 0
      ? { valor: consumidores.join(' · '), evidencia: [...new Set(evidencias)].join(' · ') }
      : {
          valor: 'ninguno detectado',
          evidencia: `búsqueda inversa 0 hits: manifests de las ${piezas.length} piezas + ${CATALOG_PATH} + package.json (scripts raíz)`
        };

    // start — script real (propio, raíz o bin)
    /** @type {Celda} */
    let start;
    if (startPropio) {
      start = {
        valor: startRaiz.length > 0 ? `npm run ${startRaiz[0]} → start del paquete` : 'start del paquete',
        evidencia: manifestRel + (startRaiz.length > 0 ? ' + package.json (raíz)' : '')
      };
    } else if (startRaiz.length > 0) {
      start = { valor: `npm run ${startRaiz[0]} (raíz)`, evidencia: 'package.json (raíz)' };
    } else if (p.manifest.bin) {
      start = { valor: `CLI por bin (${Object.keys(p.manifest.bin).join(', ')})`, evidencia: manifestRel };
    } else {
      const ejercicioRaiz = scriptsRef.filter((s) => !/^(test:|lint|format)/.test(s));
      start = ejercicioRaiz.length > 0
        ? {
            valor: `no se arranca; ejercitada vía raíz (${ejercicioRaiz.join(', ')})`,
            evidencia: 'package.json (raíz)'
          }
        : {
            valor: 'no se arranca (lib)',
            evidencia: `${manifestRel} — sin "start" propio; scripts raíz sin start:* para la pieza`
          };
    }

    // health — entrada de catálogo
    /** @type {Celda} */
    const health = entrada
      ? { valor: '/mcp/health vía catálogo', evidencia: `${entrada.fuente} (entrada "${entrada.id}")` }
      : { valor: 'sin entrada de catálogo', evidencia: `${CATALOG_PATH} — grep workspace ${p.name} → 0` };

    /** @type {Fila} */
    return {
      pieza: p.name,
      dir: p.dir,
      grupo: p.grupo,
      celdas: { tipo, capacidad, canal, consumidor, start, health }
    };
  });

  return { filas, fallos };
}

// ---------------------------------------------------------------------------
// 5 · Validación de celdas (hostil-omite: sin evidencia ni ⏳ = fallo)
// ---------------------------------------------------------------------------

export const CELDAS = ['tipo', 'capacidad', 'canal', 'consumidor', 'start', 'health'];

/**
 * @param {Fila[]} filas
 * @returns {Fallo[]}
 */
export function validarCeldas(filas) {
  /** @type {Fallo[]} */
  const fallos = [];
  for (const fila of filas) {
    for (const nombre of CELDAS) {
      const celda = fila.celdas ? fila.celdas[nombre] : undefined;
      const valor = celda && typeof celda.valor === 'string' ? celda.valor : '';
      const evidencia = celda && typeof celda.evidencia === 'string' ? celda.evidencia : '';
      const conEvidencia = evidencia.trim().length > 0;
      const conValor = valor.trim().length > 0;
      const conPendiente = valor.includes('⏳') || evidencia.includes('⏳');
      const etiqueta = fila.pieza || fila.dir || '(fila sin pieza)';
      if (!conEvidencia && !conPendiente) {
        fallos.push({
          codigo: 'celda-sin-evidencia',
          detalle: `${etiqueta} · celda "${nombre}" sin evidencia ni ⏳`
        });
      } else if (!conValor && !conPendiente) {
        // D3: evidencia sin valor no es celda válida — falla salvo ⏳ explícito
        fallos.push({
          codigo: 'celda-sin-valor',
          detalle: `${etiqueta} · celda "${nombre}" con valor vacío sin ⏳ (evidencia sola no basta)`
        });
      }
    }
  }
  return fallos;
}

// ---------------------------------------------------------------------------
// 6 · Gate completo
// ---------------------------------------------------------------------------

/**
 * @param {{ repoRoot?: string }} [opts]
 */
export function runMatriz51(opts = {}) {
  const root = opts.repoRoot ?? REPO_ROOT;
  /** @type {Fallo[]} */
  const fallos = [];

  const enumeracion = enumerarPiezas({ repoRoot: root });
  fallos.push(...enumeracion.fallos);
  const nombres = new Set(enumeracion.piezas.map((p) => p.name));

  // denominador con dientes
  if (enumeracion.piezas.length !== EXPECTED_TOTAL) {
    fallos.push({
      codigo: 'denominador-total',
      detalle: `derivadas ${enumeracion.piezas.length} piezas ≠ ${EXPECTED_TOTAL} esperadas — crecer/retirar exige asiento consciente (EXPECTED_TOTAL + ${CONTRASTE_PATH})`
    });
  }

  // contraste con la MATRIZ (U179): coincide o la divergencia se explica
  const contraste = parseContraste({ repoRoot: root });
  fallos.push(...contraste.fallos);
  if (contraste.nombres.length !== EXPECTED_TOTAL) {
    fallos.push({
      codigo: 'contraste-total',
      detalle: `${CONTRASTE_PATH}: ${contraste.nombres.length} filas físicas ≠ ${EXPECTED_TOTAL} esperadas (duplicado, fila falsa o retiro sin asiento)`
    });
  }
  const setContraste = new Set(contraste.nombres);
  const soloArbol = [...nombres].filter((n) => !setContraste.has(n)).sort();
  const soloMatriz = [...setContraste].filter((n) => !nombres.has(n)).sort();
  for (const n of soloArbol) {
    fallos.push({
      codigo: 'contraste-solo-arbol',
      detalle: `pieza del árbol sin fila en ${CONTRASTE_PATH}: ${n} (¿pieza fantasma o alta sin asiento?)`
    });
  }
  for (const n of soloMatriz) {
    fallos.push({
      codigo: 'contraste-solo-matriz',
      detalle: `fila de ${CONTRASTE_PATH} sin pieza en el árbol: ${n} (¿pieza ocultada o retiro sin asiento?)`
    });
  }

  // catálogo: workspace debe existir; workspace:null = ⏳ declarado visible
  const catalogo = parseCatalogo({ repoRoot: root });
  const cmpCat = compararCatalogo(catalogo.entradas, nombres);
  fallos.push(...cmpCat.fallos);

  // filas derivadas + validación de celdas
  const derivacion = derivarFilas(enumeracion.piezas, { repoRoot: root });
  fallos.push(...derivacion.fallos);
  fallos.push(...validarCeldas(derivacion.filas));

  // dedupe (parseCatalogo corre en comparación y en derivación)
  const clavesVistas = new Set();
  const fallosUnicos = fallos.filter((f) => {
    const k = `${f.codigo}|${f.detalle}`;
    if (clavesVistas.has(k)) return false;
    clavesVistas.add(k);
    return true;
  });

  return {
    ok: fallosUnicos.length === 0,
    fallos: fallosUnicos,
    filas: derivacion.filas,
    declaradasSinPieza: cmpCat.declaradasSinPieza,
    excluidos: enumeracion.excluidos,
    contraste: {
      fuente: CONTRASTE_PATH,
      filasContraste: contraste.nombres.length,
      coincide: soloArbol.length === 0 && soloMatriz.length === 0,
      soloArbol,
      soloMatriz
    },
    denominador: {
      esperado: EXPECTED_TOTAL,
      derivado: enumeracion.piezas.length,
      porGrupo: enumeracion.piezas.reduce((acc, p) => {
        acc[p.grupo] = (acc[p.grupo] || 0) + 1;
        return acc;
      }, {})
    }
  };
}

/** JSON estable (consumo U180–U185). */
export function buildJson(result) {
  return {
    gate: 'matriz-51',
    version: 1,
    generadoDesde: {
      workspaces: 'package.json (raíz)',
      catalogo: [CATALOG_PATH, CATALOG_EXTEND_PATH],
      allowlist: ALLOWLIST_PATH,
      contraste: CONTRASTE_PATH
    },
    ok: result.ok,
    denominador: result.denominador,
    contraste: result.contraste,
    piezas: result.filas,
    declaradasSinPieza: result.declaradasSinPieza,
    excluidos: result.excluidos,
    fallos: result.fallos
  };
}

/** @param {string} s @param {number} n */
function corta(s, n) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export function formatHumano(result) {
  const lineas = [];
  lineas.push(`matriz-51 — manifest derivado del árbol (denominador ${result.denominador.esperado})`);
  const grupos = Object.entries(result.denominador.porGrupo)
    .map(([g, n]) => `${g} ${n}`)
    .join(' · ');
  lineas.push(`derivadas: ${result.denominador.derivado} (${grupos}) · contraste ${result.contraste.fuente}: ${result.contraste.coincide ? 'coincide' : 'DIVERGE'} (${result.contraste.filasContraste} filas)`);
  lineas.push('');
  lineas.push('| pieza | tipo | capacidad | canal | start | health | consumidor |');
  lineas.push('|---|---|---|---|---|---|---|');
  for (const f of result.filas) {
    const c = f.celdas;
    lineas.push(
      `| ${f.pieza} | ${c.tipo.valor} | ${corta(c.capacidad.valor, 44)} | ${corta(c.canal.valor, 30)} | ${corta(c.start.valor, 34)} | ${corta(c.health.valor, 26)} | ${corta(c.consumidor.valor, 44)} |`
    );
  }
  lineas.push('');
  lineas.push(`declaradas sin pieza (${result.declaradasSinPieza.length}) — visibles, no invisibles:`);
  for (const d of result.declaradasSinPieza) {
    lineas.push(`  - ${d.id} (${d.fuente}) · ${d.estado}`);
  }
  lineas.push(`excluidos con motivo (${result.excluidos.length}):`);
  for (const e of result.excluidos) {
    lineas.push(`  - ${e.path} · ${e.motivo}`);
  }
  lineas.push('');
  lineas.push('evidencia por celda: node scripts/gates/matriz-51.mjs --json');
  if (result.ok) {
    lineas.push(`matriz-51: OK — ${result.denominador.derivado}/${result.denominador.esperado} filas derivadas · ${result.declaradasSinPieza.length} declaradas-sin-pieza visibles · 0 fallos`);
  } else {
    lineas.push(`matriz-51: FAIL (${result.fallos.length} fallo(s))`);
    for (const f of result.fallos) {
      lineas.push(`  [${f.codigo}] ${f.detalle}`);
    }
  }
  return lineas.join('\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const esCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (esCli) {
  const result = runMatriz51();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(buildJson(result), null, 2));
  } else {
    console.log(formatHumano(result));
  }
  if (!result.ok) process.exit(1);
}
