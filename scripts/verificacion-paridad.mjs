#!/usr/bin/env node
// =============================================================================
// verificacion-paridad.mjs · lo que `ci.yml` verifica, `release.yml` lo verifica
//                            también, y ANTES de publicar — WP-U263
// =============================================================================
//
// MOTIVO — medido, no supuesto
//   `release.yml` llevaba su PROPIA copia de la matriz de test (`:47-73` antes
//   de este WP: 25 workspaces, sin `include`, sin guardas). `ci.yml` tenía 27 y
//   las dos guardas de root de VOLUMES que dejaron U256 y U261. La copia se
//   pudrió en silencio: `needs_volumes_root` aparecía **8 veces en `ci.yml` y 0
//   en `release.yml`**, y el flujo `Release` llevaba **8 runs seguidos en rojo**
//   sobre `main` (el más reciente al abrir el WP, `30722124096`) con
//   `test @zeus/linea-system` cayendo por
//       Error: ZEUS_VOLUMES_ROOT is not set — volumes root is not operable […]
//   Se cerró una ola entera leyendo UN flujo y dando el otro por bueno.
//
//   Un comentario que diga «mantener en sync» es exactamente la clase de
//   declaración que este mundo lleva ocho olas pagando. Esto lo COMPRUEBA.
//
// QUÉ COMPRUEBA — tres cosas, y las dos últimas son las que este repo necesita
//
//   1) COBERTURA DE PASOS. Todo paso con `run:` de `ci.yml` —de CUALQUIERA de
//      sus jobs— tiene que aparecer en `release.yml` con el MISMO comando y el
//      MISMO `if:`. El `if` entra en la huella a propósito: copiar la guarda y
//      apagarla con `if: false` satisface un cotejo de comandos a secas y deja
//      exactamente el verde mudo que este WP viene a cerrar.
//      Faltar sólo es legítimo si está DECLARADO en `EXCLUIDOS` con su motivo:
//      dato visible en el diff, no una excepción enterrada en una condición.
//
//   2) ORDEN, SOBRE EL GRAFO DE `needs` — NO sobre el número de línea.
//      Ésta es la adaptación que exige la forma de este repo y la razón por la
//      que el instrumento hermano no se podía copiar tal cual. En el mundo del
//      que viene esta idea, `release.yml` era un job y bastaba comparar líneas.
//      Aquí `release.yml` tiene TRES jobs y quien publica es `release`, que se
//      apoya en `needs: [quality, test]`. Un cotejo por línea daría:
//        · falso VERDE — un paso escrito por encima de la línea que publica
//          pero en un job que NO está en el `needs` del que publica corre en
//          PARALELO con la publicación: no la bloquea, y el cotejo lo aplaude.
//        · falso ROJO — mover el job `release` al principio del fichero no
//          cambia nada de lo que ocurre, y un cotejo por línea lo denunciaría.
//      Así que un paso cuenta como «antes de publicar» sólo si vive en el
//      cierre transitivo de `needs` del job que publica, o en ese mismo job por
//      encima de la línea que publica.
//
//   3) COBERTURA DE MATRIZ. Toda entrada de `strategy.matrix` de un job de
//      `ci.yml` tiene que estar en el job del MISMO nombre de `release.yml`.
//      Sin esto el instrumento sería ciego al defecto que vino a cerrar: los
//      dos flujos corren el MISMO texto —`npm test -w "${{ matrix.workspace }}"`—
//      y toda la divergencia vive en la LISTA, que no es un `run:`. Quitar
//      `@zeus/linea-kit` de la matriz de publicación deja 43 tests sin correr
//      con la regla (1) en verde.
//
//   Las tres fallan cerrado. Si este instrumento no reconoce el flujo —no
//   encuentra el paso que publica, no sabe resolver un `needs`, no ve un solo
//   `run:`— sale con error, nunca en verde. No se aplaude por no haber sabido
//   leer.
//
// LO QUE **NO** GARANTIZA — léase antes de confiar en él
//   · NO comprueba la dirección contraria, y no debe: `release.yml` tiene pasos
//     que `ci.yml` no tiene y así ha de ser (detección de credenciales, npmrc,
//     changesets). La regla es de INCLUSIÓN Y ORDEN, no de igualdad; exigir
//     igualdad bloquearía publicaciones legítimas.
//   · NO compara el `env:` de los pasos. Deliberado, y con instrumento en su
//     lugar: el `env` que importa aquí es `ZEUS_VOLUMES_ROOT`, y de que llegue
//     —y apunte a un root completo— responden en RUNTIME las dos guardas de
//     `ci.yml` (hoy también en `release.yml`), que caen con `::error::` si la
//     variable viene vacía o el root no tiene sus ficheros. Meter el `env` en
//     la huella añadiría rojos por diferencias de expresión sin añadir
//     poder de detección sobre el caso real.
//   · NO juzga si un comando verifica algo. Si `ci.yml` cambia `npm test` por
//     `echo ok`, este instrumento exige felizmente ese `echo ok` en los dos
//     ficheros. De que los pasos muerdan responden `npm run gates`, la suite de
//     `test/gates/` y el guardián de árbol inmutable; esto sólo vigila que la
//     publicación no verifique MENOS que una rama.
//   · NO es un parser de YAML: no hay ninguno declarado en `package.json` y
//     añadir una dependencia queda fuera del ALCANCE_DIFF de este WP. Es un
//     lector del SUBCONJUNTO que estos dos ficheros usan (mapas por sangría,
//     listas de escalares, listas de mapas, `run:` escalar y en bloque). Anclas
//     YAML, flujos JSON o `run: >` plegado lo despistarían — y por eso, si no
//     encuentra NINGÚN paso en `ci.yml`, muere en vez de aplaudir.
//   · NO vigila `uses:` (acciones de terceros). Un `actions/checkout` con
//     `fetch-depth` distinto en cada flujo no lo caza. Deuda dicha.
//   · Al normalizar un `run:` en bloque quita las líneas que son SÓLO
//     comentario de shell. Un heredoc con `#` significativo a principio de
//     línea desaparecería de la comparación.
//
// USO
//   node scripts/verificacion-paridad.mjs [<ci.yml>] [<release.yml>]
//       Sin argumentos usa los dos flujos del repo. Los argumentos existen para
//       poder ATACAR el instrumento con ficheros de prueba; NO son un
//       interruptor de bypass: los dos flujos lo invocan sin argumentos y
//       cualquier ruta que se le pase se imprime en la salida.
//
// CÓDIGOS DE SALIDA
//   0  cobertura de pasos y de matriz completas, y todo antes de publicar
//   1  falta un paso o una entrada de matriz, o algo corre después de publicar
//   2  error de uso: fichero ilegible, flujo irreconocible, cero pasos
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── DATO 1 · exclusiones declaradas ──────────────────────────────────────────
// Pasos de `ci.yml` que NO tienen por qué estar en `release.yml`. Cada entrada
// se firma con su motivo y el instrumento las imprime en cada corrida, para que
// nadie tenga que abrir este fichero para saber qué se está perdonando.
//
// HOY ESTÁ VACÍA, y que lo esté es el resultado del WP: en vez de perdonarle a
// la publicación los jobs `sello-root` y `smoke-ts-registry`, se le añadieron.
// La lista existe para que la primera exclusión futura tenga que escribirse
// aquí, con su motivo y en el diff.
const EXCLUIDOS = [];

// ── DATO 2 · qué cuenta como publicar ────────────────────────────────────────
// Se toma la PRIMERA aparición de cualquiera de estos patrones en release.yml.
// Toda la verificación tiene que quedar por encima —o en un job del que ese
// job dependa.
const PUBLICACION = [
  /uses:\s*changesets\/action/,
  /uses:\s*softprops\/action-gh-release/,
  /\bchangeset\s+publish\b/,
  /\bnpm\s+run\s+release:publish\b/,
  /\bnpm\s+publish\b/,
  /\bgh\s+release\s+create\b/,
  /createGithubReleases:\s*true/
];

function morir(msg) {
  console.error(`verificacion-paridad: ${msg}`);
  process.exit(2);
}

function leer(rel) {
  const abs = path.isAbsolute(rel) ? rel : path.join(REPO_ROOT, rel);
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch (err) {
    return morir(`no se pudo leer ${abs}: ${err.message}`);
  }
}

/** Indentación (en espacios) de una línea; Infinity si está en blanco. */
function sangria(linea) {
  if (linea.trim() === '') return Infinity;
  return linea.length - linea.trimStart().length;
}

/** Quita comillas envolventes de un escalar YAML simple. */
function escalar(bruto) {
  const t = bruto.trim().replace(/\s+#.*$/, '').trim();
  const m = t.match(/^'(.*)'$/) || t.match(/^"(.*)"$/);
  return m ? m[1] : t;
}

/**
 * Normaliza el cuerpo de un `run:`: quita la sangría común, tira las líneas en
 * blanco y las que son SÓLO comentario de shell, y une con «\n». Dos pasos con
 * el mismo shell y distinta sangría o distintos comentarios salen iguales.
 */
function normalizar(lineas) {
  const utiles = lineas.filter((l) => l.trim() !== '' && !l.trimStart().startsWith('#'));
  if (utiles.length === 0) return '';
  const comun = Math.min(...utiles.map(sangria));
  return utiles.map((l) => l.slice(comun).trimEnd()).join('\n');
}

/** ¿Es `|`, `>`, `|-`, `>+`…? (indicador de bloque, no un valor). */
function esIndicadorDeBloque(resto) {
  return /^[|>][-+]?\d*\s*$/.test(resto.trim());
}

/**
 * Lee el bloque que sigue a `clave:` — las líneas más sangradas que `nivel`.
 * Devuelve las líneas y el índice de la primera línea que YA no pertenece.
 */
function bloque(lineas, desde, nivel) {
  const cuerpo = [];
  let j = desde;
  while (j < lineas.length && (sangria(lineas[j]) > nivel || lineas[j].trim() === '')) {
    cuerpo.push(lineas[j]);
    j++;
  }
  // Las líneas en blanco del final no son del bloque.
  while (cuerpo.length > 0 && cuerpo[cuerpo.length - 1].trim() === '') {
    cuerpo.pop();
    j--;
  }
  return { cuerpo, fin: j };
}

/**
 * Parsea el subconjunto de YAML que usan estos dos flujos: mapas por sangría,
 * listas de escalares y listas de mapas. Devuelve objetos/arrays/strings.
 * Sólo se usa para las MATRICES, que es donde hace falta estructura.
 */
function parsearBloque(lineas) {
  const utiles = lineas.filter((l) => l.trim() !== '' && !l.trimStart().startsWith('#'));
  if (utiles.length === 0) return null;
  const base = Math.min(...utiles.map(sangria));

  // ¿Lista?
  if (utiles[0].trimStart().startsWith('- ') || utiles[0].trim() === '-') {
    const salida = [];
    for (let i = 0; i < utiles.length; i++) {
      if (sangria(utiles[i]) !== base || !utiles[i].trimStart().startsWith('-')) continue;
      const primera = utiles[i].trimStart().replace(/^-\s*/, '');
      // Recoge las líneas del elemento (las siguientes más sangradas).
      const propias = [];
      let j = i + 1;
      while (j < utiles.length && sangria(utiles[j]) > base) {
        propias.push(utiles[j]);
        j++;
      }
      if (primera !== '' && !primera.includes(':')) {
        salida.push(escalar(primera)); // escalar suelto
      } else if (primera === '') {
        salida.push(parsearBloque(propias));
      } else {
        // Mapa cuyo primer par viaja en la misma línea que el guion.
        const sangriaClave = utiles[i].length - primera.length;
        salida.push(parsearBloque([' '.repeat(sangriaClave) + primera, ...propias]));
      }
      i = j - 1;
    }
    return salida;
  }

  // Mapa.
  const salida = {};
  for (let i = 0; i < utiles.length; i++) {
    if (sangria(utiles[i]) !== base) continue;
    const m = utiles[i].trim().match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    const [, clave, resto] = m;
    const propias = [];
    let j = i + 1;
    while (j < utiles.length && sangria(utiles[j]) > base) {
      propias.push(utiles[j]);
      j++;
    }
    if (resto.trim() !== '' && !esIndicadorDeBloque(resto)) salida[clave] = escalar(resto);
    else if (propias.length > 0) salida[clave] = parsearBloque(propias);
    else salida[clave] = null;
    i = j - 1;
  }
  return salida;
}

/**
 * Escanea un flujo entero y devuelve sus jobs con lo que este instrumento
 * necesita: `needs`, los pasos con `run:` (comando, `if:` y línea) y la matriz.
 */
function analizar(texto, ruta) {
  const lineas = texto.split(/\r?\n/);
  const jobs = [];

  const iJobs = lineas.findIndex((l) => /^jobs:\s*$/.test(l));
  if (iJobs === -1) morir(`no encuentro la clave «jobs:» en ${ruta}`);

  for (let i = iJobs + 1; i < lineas.length; i++) {
    const m = lineas[i].match(/^ {2}([A-Za-z_][\w-]*):\s*$/);
    if (!m) continue;
    const { cuerpo, fin } = bloque(lineas, i + 1, 2);
    jobs.push({ nombre: m[1], linea: i + 1, lineas: cuerpo, desde: i + 1 });
    i = fin - 1;
  }

  for (const job of jobs) {
    // ── needs ──
    job.needs = [];
    for (let k = 0; k < job.lineas.length; k++) {
      const mn = job.lineas[k].match(/^ {4}needs:\s*(.*)$/);
      if (!mn) continue;
      const resto = mn[1].trim();
      if (resto.startsWith('[')) {
        job.needs = resto
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map((s) => escalar(s))
          .filter(Boolean);
      } else if (resto !== '' && !esIndicadorDeBloque(resto)) {
        job.needs = [escalar(resto)];
      } else {
        const { cuerpo } = bloque(job.lineas, k + 1, 4);
        job.needs = cuerpo
          .filter((l) => l.trim().startsWith('-'))
          .map((l) => escalar(l.trim().replace(/^-\s*/, '')));
      }
      break;
    }

    // ── matriz ──
    job.matriz = null;
    for (let k = 0; k < job.lineas.length; k++) {
      const mm = job.lineas[k].match(/^(\s*)matrix:\s*$/);
      if (!mm) continue;
      const { cuerpo } = bloque(job.lineas, k + 1, mm[1].length);
      job.matriz = parsearBloque(cuerpo);
      break;
    }

    // ── pasos con `run:` ──
    // Se recorre el job entero buscando `run:`; el `name:` y el `if:` vigentes
    // son los del paso en curso, que empieza en cada `- ` del nivel de `steps`.
    job.pasos = [];
    let nombre = '(sin nombre)';
    let condicion = '';
    let nivelPaso = null;
    for (let k = 0; k < job.lineas.length; k++) {
      const linea = job.lineas[k];
      const abs = job.desde + k + 1; // 1-based en el fichero

      const mItem = linea.match(/^(\s*)-\s+\S/);
      if (mItem && (nivelPaso === null || mItem[1].length === nivelPaso)) {
        if (nivelPaso === null && /^\s*-\s+(uses|name|run|id|if):/.test(linea)) {
          nivelPaso = mItem[1].length;
        }
        if (mItem[1].length === nivelPaso) {
          nombre = '(sin nombre)';
          condicion = '';
        }
      }

      const mNombre = linea.match(/^\s*-?\s*name:\s*(.+?)\s*$/);
      if (mNombre) {
        nombre = mNombre[1];
        continue;
      }
      const mIf = linea.match(/^\s*-?\s*if:\s*(.+?)\s*$/);
      if (mIf) {
        condicion = escalar(mIf[1]);
        continue;
      }

      const mRun = linea.match(/^(\s*)run:\s*(.*)$/);
      if (!mRun) continue;
      const [, sangriaRun, resto] = mRun;

      if (resto.trim() !== '' && !esIndicadorDeBloque(resto)) {
        job.pasos.push({ nombre, condicion, linea: abs, texto: resto.trim() });
        continue;
      }
      const { cuerpo, fin } = bloque(job.lineas, k + 1, sangriaRun.length);
      job.pasos.push({ nombre, condicion, linea: abs, texto: normalizar(cuerpo) });
      k = fin - 1;
    }
  }

  return { lineas, jobs };
}

/** Huella de un paso: comando + condición. Ver §1 de la cabecera. */
function huella(paso) {
  return `${paso.condicion} ${paso.texto}`;
}

/** Línea (1-based) de la primera aparición de un patrón de publicación. */
function lineaDePublicacion(lineas) {
  for (let i = 0; i < lineas.length; i++) {
    if (PUBLICACION.some((p) => p.test(lineas[i]))) return i + 1;
  }
  return null;
}

// ── programa ─────────────────────────────────────────────────────────────────
const [argCi, argRelease, ...sobra] = process.argv.slice(2);
if (sobra.length > 0) {
  morir(`sobran argumentos: ${sobra.join(' ')} — uso: [<ci.yml>] [<release.yml>]`);
}

const rutaCi = argCi ?? '.github/workflows/ci.yml';
const rutaRelease = argRelease ?? '.github/workflows/release.yml';

const flujoCi = analizar(leer(rutaCi), rutaCi);
const flujoRelease = analizar(leer(rutaRelease), rutaRelease);

console.log(`verificación exigida por : ${rutaCi}`);
console.log(`flujo que debe cumplirla : ${rutaRelease}`);

const pasosCi = flujoCi.jobs.flatMap((j) => j.pasos.map((p) => ({ ...p, job: j.nombre })));
if (pasosCi.length === 0) {
  morir(
    `cero pasos «run:» en ${rutaCi} — o el flujo cambió de forma o este lector ya no lo ` +
      `entiende; no se aplaude por no haber sabido leer`
  );
}

const corte = lineaDePublicacion(flujoRelease.lineas);
if (corte === null) {
  morir(
    `no encuentro en ${rutaRelease} ningún paso que publique ` +
      `(${PUBLICACION.map(String).join(', ')}) — sin saber DÓNDE se publica no puedo ` +
      `comprobar que la verificación va antes`
  );
}

const jobsRelease = new Map(flujoRelease.jobs.map((j) => [j.nombre, j]));
const jobQuePublica = flujoRelease.jobs.find(
  (j) => corte >= j.desde && corte <= j.desde + j.lineas.length
);
if (!jobQuePublica) {
  morir(`la línea que publica (${rutaRelease}:${corte}) no cae dentro de ningún job reconocido`);
}
console.log(`publica                  : job «${jobQuePublica.nombre}» en ${rutaRelease}:${corte}`);

// Cierre transitivo de `needs`: los jobs que TERMINAN antes de que el job que
// publica empiece. Fail-closed: un `needs` a un job inexistente mata.
const previos = new Set();
const pila = [...jobQuePublica.needs];
while (pila.length > 0) {
  const n = pila.pop();
  if (previos.has(n)) continue;
  const j = jobsRelease.get(n);
  if (!j) {
    morir(
      `el job «${jobQuePublica.nombre}» declara «needs: ${n}» y no hay ningún job así en ` +
        `${rutaRelease} — no puedo saber qué corre antes de publicar`
    );
  }
  previos.add(n);
  pila.push(...j.needs);
}
console.log(
  `corren antes de publicar : ${[...previos].map((n) => `«${n}»`).join(', ') || '(ninguno)'}`
);

// Índice de lo que SÍ bloquea la publicación: huella → dónde.
const bloquean = new Map();
for (const nombre of previos) {
  for (const p of jobsRelease.get(nombre).pasos) {
    if (!bloquean.has(huella(p))) bloquean.set(huella(p), { job: nombre, linea: p.linea });
  }
}
// Y los pasos del propio job que publica, pero sólo los que van ANTES.
for (const p of jobQuePublica.pasos) {
  if (p.linea >= corte) continue;
  if (!bloquean.has(huella(p))) bloquean.set(huella(p), { job: jobQuePublica.nombre, linea: p.linea });
}
// Los que están en el flujo pero NO bloquean: para poder distinguir «no está»
// de «está, pero tarde», que son diagnósticos distintos.
const tardios = new Map();
for (const j of flujoRelease.jobs) {
  for (const p of j.pasos) {
    if (bloquean.has(huella(p))) continue;
    if (!tardios.has(huella(p))) tardios.set(huella(p), { job: j.nombre, linea: p.linea });
  }
}

const perdonados = [];
const ausentes = [];
const fueraDeOrden = [];
let exigidos = 0;

for (const p of pasosCi) {
  const excusa = EXCLUIDOS.find((e) => e.patron.test(p.texto));
  if (excusa) {
    perdonados.push({ ...p, motivo: excusa.motivo });
    continue;
  }
  exigidos++;
  if (bloquean.has(huella(p))) continue;
  const tarde = tardios.get(huella(p));
  if (tarde) fueraDeOrden.push({ ...p, donde: tarde });
  else ausentes.push(p);
}

// ── cobertura de matriz ──────────────────────────────────────────────────────
const matrizAusente = [];
for (const jobCi of flujoCi.jobs) {
  if (!jobCi.matriz) continue;
  const jobRel = jobsRelease.get(jobCi.nombre);
  if (!jobRel) continue; // ya lo denuncia la cobertura de pasos
  for (const [clave, valor] of Object.entries(jobCi.matriz)) {
    if (!Array.isArray(valor)) continue;
    const suyos = (jobRel.matriz && jobRel.matriz[clave]) || [];
    const vistos = new Set((Array.isArray(suyos) ? suyos : []).map((v) => JSON.stringify(v)));
    for (const entrada of valor) {
      if (!vistos.has(JSON.stringify(entrada))) {
        matrizAusente.push({ job: jobCi.nombre, clave, entrada });
      }
    }
  }
}

// ── informe ──────────────────────────────────────────────────────────────────
if (perdonados.length > 0) {
  console.log('');
  console.log(`exclusiones declaradas (${perdonados.length}) — no se exigen al publicar:`);
  for (const p of perdonados) {
    console.log(`  · ${rutaCi}:${p.linea} «${p.nombre}» (job ${p.job})`);
    console.log(`    motivo: ${p.motivo}`);
  }
}

let fallo = false;

if (ausentes.length > 0) {
  fallo = true;
  console.error('');
  console.error(
    `PARIDAD ROTA · ${ausentes.length} paso(s) que ${rutaCi} ejecuta y ${rutaRelease} NO:`
  );
  for (const a of ausentes) {
    console.error(`  · ${rutaCi}:${a.linea} «${a.nombre}» (job ${a.job})`);
    if (a.condicion) console.error(`      if: ${a.condicion}`);
    for (const l of a.texto.split('\n')) console.error(`      ${l}`);
  }
  console.error('');
  console.error(`  Se publicaría verificando MENOS de lo que se le exige a una rama. Añade el`);
  console.error(`  paso a ${rutaRelease} —en el job que publica o en uno del que dependa— o`);
  console.error(`  declara la exclusión con su motivo en EXCLUIDOS de este fichero.`);
}

if (fueraDeOrden.length > 0) {
  fallo = true;
  console.error('');
  console.error(
    `ORDEN ROTO · ${fueraDeOrden.length} paso(s) que NO bloquean la publicación:`
  );
  for (const t of fueraDeOrden) {
    console.error(
      `  · «${t.nombre}» está en ${rutaRelease}:${t.donde.linea} (job «${t.donde.job}»), que no` +
        ` está en el «needs» de «${jobQuePublica.nombre}» ni le precede dentro del job.`
    );
  }
  console.error('');
  console.error('  Un gate que corre después de publicar —o en paralelo— no es un gate.');
}

if (matrizAusente.length > 0) {
  fallo = true;
  console.error('');
  console.error(
    `MATRIZ ROTA · ${matrizAusente.length} entrada(s) que ${rutaCi} recorre y ${rutaRelease} NO:`
  );
  for (const m of matrizAusente) {
    console.error(`  · job «${m.job}» · matrix.${m.clave} · ${JSON.stringify(m.entrada)}`);
  }
  console.error('');
  console.error('  El comando es el mismo en los dos flujos; lo que falta es la fila que lo');
  console.error('  hace correr. Se publicaría sin haber ejecutado esos casos.');
}

if (fallo) process.exit(1);

const filas = flujoCi.jobs
  .filter((j) => j.matriz)
  .map((j) => `${j.nombre}: ${Object.entries(j.matriz).filter(([, v]) => Array.isArray(v)).map(([k, v]) => `${k}×${v.length}`).join(' ')}`)
  .join(' · ');

console.log('');
console.log(
  `paridad OK · ${exigidos} paso(s) de ${rutaCi} presentes en ${rutaRelease} y todos bloqueando` +
    ` la publicación`
);
if (filas) console.log(`matriz OK  · ${filas}`);
