import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SocketClient } from '@zeus/socket-core/client';
import { createScriptoriumServer } from '../src/index.mjs';
import { emitDownstream, relayDiscardLedger, resetRelayDiscardLedger } from '../src/relay.mjs';
import { NAMESPACE, RELAY_DOWNSTREAM_TOP, RELAY_UPSTREAM } from '../src/config.mjs';
import {
  RELAY_CONTRACT,
  RELAY_CONTRACT_SEAL,
  RELAY_CONTRACT_VERSION,
  assertRelayContract,
  computeRelaySeal,
  relayContractDescriptor
} from '../src/relay-contract.mjs';

/**
 * WP-U194 · la allowlist del relay como contrato.
 *
 * Este fichero NO reproduce los nombres de los eventos: si lo hiciera sería
 * la segunda lista viva que U194 existe para eliminar. Ancla tres escalares
 * — versión, sello sha256 y cuentas — y todo lo demás lo deriva del propio
 * contrato o lo prueba por comportamiento contra un puente real.
 *
 * Escrito para el lector hostil. Cazan:
 *  - añadir/quitar un evento sin re-sellar → el módulo NO carga (gate de
 *    carga) y toda la suite cae;
 *  - añadir/quitar re-sellando pero sin subir versión → ancla del sello roja;
 *  - declarar una segunda lista en otro `src/*.mjs` → «sin segunda lista» roja;
 *  - ampliar la allowlist en caliente, incluido `Set.prototype.add.call()`
 *    → «inmutable» roja (corrección de D2);
 *  - borrar la guarda `RELAY_DOWNSTREAM_TOP.has(event)` o el bucle de subida
 *    → cierre e2e rojo (los intrusos pasan / lo permitido deja de pasar);
 *  - **añadir cualquier vía de emisión hacia abajo en `relay.mjs`**, sea con
 *    comillas, con backtick, con concatenación o con lo que se invente →
 *    censo de despacho rojo (corrección de D1: se ancla la FORMA del
 *    despacho, no la notación del nombre).
 *
 * Lo que estos tests NO cubren, dicho aquí para que nadie lo lea de más:
 * el desempaquetado del sobre (`relay.mjs:95`) no consulta la allowlist, y
 * eso queda asertado como hueco abierto, no como si estuviera cerrado.
 */

/** Ancla literal: cambiarla es declarar un cambio de contrato. */
const VERSION_ANCLADA = '1.0.0';
const SELLO_ANCLADO = '57adb96df059db58ee86e20b725012f37adb9f5d20f99f901863cff3b637335e';
const CUENTA_SUBIDA = 3;
const CUENTA_BAJADA = 8;

/**
 * Ancla de la FORMA del despacho de TODO
 * `packages/mesh/socket-server/src/**` (correcciones U194-D1, D-A y DEF-1).
 *
 * El corpus de sondas por literales reconoce una notación, no un valor: una
 * puerta trasera escrita con backtick o con `'a' + 'b'` se le escapa. Esto
 * ancla otra cosa: la forma normalizada de cada fuente del paquete y el
 * inventario de fuentes. Cualquier vía de emisión nueva — con la notación
 * que sea y en el fichero que sea — mueve el sello.
 *
 * **Alcance declarado, y ahora implementado igual**: el árbol `src/**`
 * completo — recursivo, y las **seis** extensiones que este runtime ejecuta
 * (`.mjs`/`.js`/`.cjs`/`.mts`/`.ts`/`.cts`, Node 22.18+ strippea tipos sin
 * flag), sin distinguir mayúsculas (`fuentesDelPaquete`).
 *
 * **Tres** correcciones sucesivas de esta misma frase, todas por lo mismo:
 * anclar solo `relay.mjs` era falso (`create-server.mjs` es donde nacen
 * `localNs` y `bridgeClient`); barrer solo el primer nivel también
 * (`src/sub/puerta.mjs`, `src/puerta.js`, `src/puerta.cjs`); y cubrir tres
 * extensiones de seis igual (`src/puerta.mts`). La tercera cayó **tres
 * líneas por debajo de este aviso**.
 *
 * Si tocas el alcance: la frase, el `readdirSync` y las extensiones que el
 * runtime ejecuta tienen que decir lo mismo. Comprobarlo NO es leer esta
 * frase — es poner el fichero en `src/` y ver la suite en rojo.
 *
 * `EMISIONES_ANCLADAS` es señal legible, **no** garantía: el conteo se deja
 * clavado quitando una vía y añadiendo otra. Quien caza es el sello.
 *
 * Al cambiar legítimamente cualquier fuente del paquete (U192/U193 son los
 * dueños de `relay.mjs`), re-anclar aquí es parte del cambio: la propagación
 * es contrato.
 *
 * Qué tolera y qué no, medido y sin redondear:
 *  - **tolera** comentarios, indentación, líneas en blanco, colapso de
 *    espacios y EOL (CRLF↔LF es indiferente);
 *  - **NO tolera** repartir una línea en varias ni renombrar identificadores;
 *  - `prettier --write` sobre `src/relay.mjs` deja el sello **idéntico**,
 *    pero sobre el paquete entero **lo mueve**: `admin-ui.mjs`,
 *    `create-server.mjs` y `lifecycle.mjs` no están prettier-limpios en el
 *    repo hoy (`npx prettier --check` los marca). No es defecto del censo:
 *    es higiene pendiente del paquete, anotada en el reporte.
 */
const EMISIONES_ANCLADAS = 5;
// WP-U266 · re-anclado DOS veces, y las dos por `src/config.mjs`:
//   1. pasa a resolver su puerto por `readEnvPortAlias` en vez de `Number(process.env…)`
//   2. el ORDEN de sus dos claves deja de estar escrito aqui y se pide a
//      `uiPortEnvChain('scriptorium')`, para que quien ata y quien anuncia no
//      puedan divergir (M-a: con `ZEUS_SCRIPTORIUM_PORT=5555` el servidor
//      escuchaba en 5555 y el catalogo anunciaba 3017).
// El censo lo cazo las dos veces, que es su trabajo. Ninguna toca la
// propagacion: `config.mjs` sigue con `emisiones=0` y `relay.mjs` —el unico
// emisor— queda intacto con sus 5, asi que `EMISIONES_ANCLADAS` no se mueve.
// Sellos anteriores:
//   c842ca2fe42978bda1bda0fdd3ab8db4c86d764a5b0e259efc08cbc047ee42d0  (base)
//   9decbf22d8cad61a4f50d3ff1b719e2e984590047f728521aa516036af6d7617  (paso 1)
const SELLO_DESPACHO_ANCLADO = 'bc27d3dedd0ae6602f8692eec771cccaa0f9db0f7f9fb9f635a39765d3d40877';

/** Nombres que socket.io reserva y no se pueden emitir como evento. */
const RESERVADOS_SOCKETIO = new Set([
  'connect',
  'connection',
  'connect_error',
  'disconnect',
  'disconnecting',
  'new_namespace',
  'newListener',
  'removeListener'
]);

/** Espera activa con tope; falla con etiqueta si no se cumple. */
function waitFor(predicate, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (predicate()) {
        clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error(`timeout esperando: ${label}`));
      }
    }, 25);
  });
}

/** Lee el texto de un fuente del paquete. */
function fuente(rutaRelativa) {
  return readFileSync(new URL(rutaRelativa, import.meta.url), 'utf8');
}

/**
 * Literales de cadena con pinta de nombre de evento presentes en los
 * fuentes dados. Es UNA red, no LA red: reconoce las tres notaciones de
 * literal (comilla simple, doble y backtick) pero por construcción no puede
 * ver un nombre construido en tiempo de ejecución (`'a' + 'b'`). Quien
 * cierra ese hueco es el censo de despacho, que ancla la forma y no el
 * nombre. Se conserva porque es barata y porque caza al descuidado.
 * @param {string[]} rutas
 */
function literalesDeFuente(rutas) {
  const encontrados = new Set();
  for (const ruta of rutas) {
    const re = /'([^'\n\\]{1,64})'|"([^"\n\\]{1,64})"|`([^`\n\\$]{1,64})`/g;
    for (const m of fuente(ruta).matchAll(re)) {
      const s = m[1] ?? m[2] ?? m[3];
      if (s && !/\s/.test(s) && !RESERVADOS_SOCKETIO.has(s)) encontrados.add(s);
    }
  }
  return [...encontrados];
}

/**
 * Forma normalizada de un fuente: sin comentarios, sin líneas en blanco y
 * con los espacios colapsados. Es lo que se sella para el censo de
 * despacho. Tolera comentarios, indentación, líneas en blanco, colapso de
 * espacios y EOL. NO tolera repartir una línea en varias ni renombrar
 * identificadores — eso obliga a re-anclar, y es el precio de que no tolere
 * una rama de emisión añadida, la escriba quien la escriba y como la escriba.
 * Detalle sobre `prettier` en el comentario de `SELLO_DESPACHO_ANCLADO`.
 * @param {string} texto
 */
function formaNormalizada(texto) {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\r?\n/)
    .map((linea) => linea.replace(/(^|[^:])\/\/.*$/, '$1').trim().replace(/\s+/g, ' '))
    .filter((linea) => linea !== '')
    .join('\n');
}

/**
 * Inventario de fuentes de `packages/mesh/socket-server/src/`.
 *
 * **Recursivo y con las SEIS extensiones que este runtime ejecuta**
 * (U194-DEF-1 y DEF-A): `.mjs`, `.js`, `.cjs`, `.mts`, `.ts`, `.cts`, sin
 * distinguir mayúsculas. Node 22.18+ strippea tipos de serie —sin flag ni
 * loader— y este repo corre `v22.21.1` con `engines: ">=22.0.0"` y CI en
 * `node-version: '22'`, así que un `.mts` es tan ejecutable como un `.mjs`.
 *
 * Dos versiones anteriores fallaron por lo mismo, alcance declarado más
 * ancho que el implementado:
 *  - `filter(f => f.endsWith('.mjs'))` → primer nivel, una extensión:
 *    `src/sub/puerta.mjs`, `src/puerta.js` y `src/puerta.cjs` cargaban,
 *    emitían y eran invisibles;
 *  - `/\.(mjs|js|cjs)$/i` → tres extensiones de seis: `src/puerta.mts`
 *    cargaba, emitía y era invisible (verificado: la suite en verde con la
 *    puerta puesta, y eslint tampoco la veía).
 *
 * Lo usan el censo de despacho **y** «sin segunda lista»: un único
 * enumerador para que no vuelvan a divergir — una tabla paralela en
 * `src/sub/config2.mjs` evadía los dos a la vez.
 *
 * Rutas relativas a `src/` con separador normalizado a `/`, para que el
 * sello no dependa del sistema de ficheros.
 */
function fuentesDelPaquete() {
  return readdirSync(new URL('../src/', import.meta.url), { recursive: true })
    .map((f) => String(f).replaceAll('\\', '/'))
    .filter((f) => /\.(mjs|js|cjs|mts|ts|cts)$/i.test(f))
    .sort();
}

/**
 * Censo de despacho de TODO `packages/mesh/socket-server/src/`.
 *
 * Alcance, y es una decisión, no un descuido: **el paquete entero**. Anclar
 * solo `relay.mjs` era falso — la contrarrevisión metió una puerta en
 * `create-server.mjs`, que es justamente donde nacen `localNs` y
 * `bridgeClient`, y la suite siguió verde. Cualquier fuente de este `src/`
 * puede propagar sin pasar por la allowlist, así que todos entran.
 *
 * Fuera de este árbol no se persigue: se declara como hueco con dueño.
 *
 * El inventario forma parte del censo, así que un fichero nuevo mueve el
 * sello aunque todavía no lo importe nadie — en cualquier subdirectorio.
 */
function censoDeDespacho() {
  const filas = fuentesDelPaquete()
    .map((fichero) => {
      const forma = formaNormalizada(fuente(`../src/${fichero}`));
      return {
        fichero,
        emisiones: [...forma.matchAll(/\.emit\(/g)].length,
        sello: createHash('sha256').update(forma, 'utf8').digest('hex')
      };
    });
  return {
    filas,
    emisiones: filas.reduce((n, f) => n + f.emisiones, 0),
    sello: createHash('sha256')
      .update(filas.map((f) => `${f.fichero} ${f.sello}`).join('\n'), 'utf8')
      .digest('hex')
  };
}

/** Declaración plana equivalente al contrato vivo (para sondear el gate). */
function declaracionViva() {
  return {
    version: RELAY_CONTRACT_VERSION,
    seal: RELAY_CONTRACT_SEAL,
    upstream: [...RELAY_CONTRACT.upstream],
    downstream: [...RELAY_CONTRACT.downstream]
  };
}

// ── 1 · Ancla ────────────────────────────────────────────────────────────

test('ancla del contrato: versión, sello y cuentas son literales fijados', () => {
  assert.equal(
    RELAY_CONTRACT_VERSION,
    VERSION_ANCLADA,
    'la versión del contrato cambió: es un cambio de política, decláralo aquí y en el reporte del WP'
  );
  assert.equal(
    RELAY_CONTRACT_SEAL,
    SELLO_ANCLADO,
    'el sello del contrato cambió: la allowlist NO es la misma. Sube la versión y actualiza este ancla a conciencia'
  );
  assert.equal(RELAY_CONTRACT.upstream.length, CUENTA_SUBIDA, 'la tabla de subida cambió de tamaño');
  assert.equal(RELAY_CONTRACT.downstream.size, CUENTA_BAJADA, 'la allowlist de bajada cambió de tamaño');
  assert.deepEqual(relayContractDescriptor().counts, {
    upstream: CUENTA_SUBIDA,
    downstream: CUENTA_BAJADA
  });
});

// ── 2 · El sello es del contenido, en las dos direcciones ────────────────

test('el sello es del contenido: añadir o quitar un evento lo cambia y el gate lo caza', () => {
  const viva = declaracionViva();

  assert.equal(
    computeRelaySeal(viva),
    SELLO_ANCLADO,
    'el sello declarado no corresponde a la allowlist viva'
  );

  const mutaciones = {
    'AÑADIR un evento a la bajada': {
      ...viva,
      downstream: [...viva.downstream, 'evento:colado']
    },
    'QUITAR un evento de la bajada': { ...viva, downstream: viva.downstream.slice(1) },
    'AÑADIR un evento a la subida': { ...viva, upstream: [...viva.upstream, 'EVENTO_COLADO'] },
    'QUITAR un evento de la subida': { ...viva, upstream: viva.upstream.slice(1) },
    'REORDENAR la subida (el orden de registro es política)': {
      ...viva,
      upstream: [...viva.upstream].reverse()
    },
    'misma allowlist con OTRA versión': { ...viva, version: '9.9.9' }
  };

  for (const [etiqueta, mutada] of Object.entries(mutaciones)) {
    assert.notEqual(
      computeRelaySeal(mutada),
      SELLO_ANCLADO,
      `${etiqueta}: el sello NO cambió — el sello no está sellando nada`
    );
    assert.throws(
      () => assertRelayContract({ ...mutada, seal: SELLO_ANCLADO }),
      /el sello NO corresponde a la allowlist declarada/,
      `${etiqueta}: el gate del contrato no lanzó`
    );
  }

  // Y el camino legítimo existe: re-sellar con la versión subida sí valida.
  const legitima = { ...viva, downstream: [...viva.downstream, 'evento:nuevo'], version: '1.1.0' };
  assert.doesNotThrow(() =>
    assertRelayContract({ ...legitima, seal: computeRelaySeal(legitima) })
  );
});

// ── 3 · Fuente única ─────────────────────────────────────────────────────

test('fuente única: el runtime consume el contrato por identidad, no por copia', () => {
  assert.equal(
    RELAY_UPSTREAM,
    RELAY_CONTRACT.upstream,
    'config.mjs no re-exporta el contrato: hay una tabla de subida paralela'
  );
  assert.equal(
    RELAY_DOWNSTREAM_TOP,
    RELAY_CONTRACT.downstream,
    'config.mjs no re-exporta el contrato: hay una allowlist de bajada paralela'
  );
});

test('sin segunda lista: ningún otro fuente del paquete declara nombres del contrato', () => {
  const nombres = [...RELAY_CONTRACT.upstream, ...RELAY_CONTRACT.downstream];
  // Excepciones declaradas: relay.mjs desempaqueta ROOM_MESSAGE y da a
  // SET_STATE un camino propio (comportamiento heredado de la base, probado
  // por relay-trace.test.mjs). No son listas: son dos ramas nombradas.
  const permitido = { 'relay.mjs': new Set(['ROOM_MESSAGE', 'SET_STATE']) };
  // Se enumera el árbol, no una lista fija: un fuente nuevo con una tabla
  // paralela entra solo en el barrido, esté en `src/` o en `src/sub/…` y
  // sea `.mjs`, `.js` o `.cjs` (mismo enumerador que el censo, DEF-1).
  const otrosFuentes = fuentesDelPaquete().filter((f) => f !== 'relay-contract.mjs');
  assert.ok(otrosFuentes.length >= 5, `barrido vacío o truncado (${otrosFuentes.length} fuentes)`);
  assert.ok(otrosFuentes.includes('config.mjs') && otrosFuentes.includes('relay.mjs'));

  const infracciones = [];
  for (const nombre of otrosFuentes) {
    const texto = fuente(`../src/${nombre}`);
    for (const evento of nombres) {
      if (permitido[nombre]?.has(evento)) continue;
      // Las TRES notaciones de literal. Con solo comilla simple y doble,
      // una tabla paralela escrita con backticks pasaba en verde (D-B):
      // es la lección de D1 sin aplicar en el test de al lado.
      if (
        texto.includes(`'${evento}'`) ||
        texto.includes(`"${evento}"`) ||
        texto.includes('`' + evento + '`')
      ) {
        infracciones.push(`src/${nombre} declara '${evento}'`);
      }
    }
  }
  assert.deepEqual(
    infracciones,
    [],
    'segunda lista viva detectada: los nombres de evento solo pueden estar en src/relay-contract.mjs'
  );
});

// ── 3-bis · Censo de despacho: la FORMA, no la notación (D1) ────────────

test('censo de despacho: ninguna vía de emisión nueva en TODO src/ del paquete', () => {
  const censo = censoDeDespacho();

  // El inventario entra en el censo: un `src/puerta.mjs` nuevo mueve el
  // sello aunque nadie lo importe todavía.
  const tabla = censo.filas
    .map((f) => `    ${f.fichero.padEnd(24)} emisiones=${f.emisiones}  ${f.sello.slice(0, 16)}…`)
    .join('\n');

  assert.equal(
    censo.sello,
    SELLO_DESPACHO_ANCLADO,
    'la forma de algún fuente de packages/mesh/socket-server/src/ cambió (comentarios, ' +
      'líneas en blanco y espacios ya están descontados).\n' +
      'Este paquete es donde nacen `localNs` y `bridgeClient`: una vía de emisión nueva ' +
      'en CUALQUIERA de estos ficheros propaga sin pasar por la allowlist. Si el cambio ' +
      'es legítimo, re-ancla SELLO_DESPACHO_ANCLADO (y EMISIONES_ANCLADAS si movió) y ' +
      'declara el cambio como cambio de contrato.\n' +
      `  sello anclado : ${SELLO_DESPACHO_ANCLADO}\n` +
      `  sello actual  : ${censo.sello}\n` +
      `  censo por fichero:\n${tabla}`
  );

  // Señal legible secundaria. NO es la garantía: el contador se puede dejar
  // clavado quitando una vía y añadiendo otra (la contrarrevisión lo hizo).
  // Quien caza es el sello; esto solo hace el diagnóstico legible.
  assert.equal(
    censo.emisiones,
    EMISIONES_ANCLADAS,
    `cambió el número total de \`.emit(\` en src/ (${censo.emisiones} vs ${EMISIONES_ANCLADAS}):\n${tabla}`
  );

  // Las guardas del contrato siguen en su sitio, comprobadas sobre la forma
  // normalizada para que reformatear no las esconda.
  const relay = formaNormalizada(fuente('../src/relay.mjs'));
  assert.ok(
    relay.includes('if (RELAY_DOWNSTREAM_TOP.has(event)) {'),
    'la guarda de allowlist de la vía top-level ya no está en src/relay.mjs'
  );
  assert.ok(
    relay.includes('for (const ev of RELAY_UPSTREAM) {'),
    'el bucle de subida gobernado por el contrato ya no está en src/relay.mjs'
  );
});

test('el gate del contrato corre en la carga y su resultado es portante (D4)', () => {
  const contrato = formaNormalizada(fuente('../src/relay-contract.mjs'));

  // 1. La llamada existe a nivel de módulo…
  assert.ok(
    contrato.includes('const VERIFICADO = assertRelayContract({'),
    'desapareció la llamada a assertRelayContract() en la carga del módulo: el contrato ' +
      'dejaría de verificarse al importar'
  );
  // 2. …y lo publicado se construye A PARTIR de su resultado, no de las
  //    tablas crudas. Así, borrar el gate no lo deja sin correr en silencio:
  //    deja el módulo sin cargar.
  for (const campo of [
    'version: VERIFICADO.version',
    'seal: VERIFICADO.seal',
    'upstream: Object.freeze([...VERIFICADO.upstream])',
    'downstream: listaSellada(VERIFICADO.downstream)'
  ]) {
    assert.ok(
      contrato.includes(campo),
      `RELAY_CONTRACT ya no deriva del resultado del gate (falta \`${campo}\`): el gate ` +
        'volvería a ser borrable sin consecuencia'
    );
  }
});

// ── 4 · Gate fail-closed (cara hostil-omite) ─────────────────────────────

test('gate fail-closed: sin versión, sin sello o con tabla inválida el contrato no carga', () => {
  const viva = declaracionViva();
  // Campo AUSENTE de verdad (no `undefined` puesto a mano): la cara
  // hostil-omite exige que el default de lo que no viene sea denegar.
  const sinCampo = (obj, campo) =>
    Object.fromEntries(Object.entries(obj).filter(([k]) => k !== campo));
  const sinVersion = sinCampo(viva, 'version');
  const sinSello = sinCampo(viva, 'seal');
  assert.equal('version' in sinVersion, false);
  assert.equal('seal' in sinSello, false);

  assert.throws(() => assertRelayContract(null), /no hay declaración de contrato/);
  assert.throws(() => assertRelayContract(sinVersion), /versión no declarada o malformada/);
  assert.throws(() => assertRelayContract({ ...viva, version: undefined }), /versión no declarada/);
  assert.throws(() => assertRelayContract({ ...viva, version: '' }), /versión no declarada/);
  assert.throws(() => assertRelayContract({ ...viva, version: 'v1' }), /versión no declarada/);
  assert.throws(() => assertRelayContract({ ...viva, version: 1 }), /versión no declarada/);

  assert.throws(() => assertRelayContract(sinSello), /sello no declarado o malformado/);
  assert.throws(() => assertRelayContract({ ...viva, seal: 'no-es-un-sha256' }), /sello no declarado/);
  assert.throws(() => assertRelayContract({ ...viva, seal: SELLO_ANCLADO.toUpperCase() }), /sello no declarado/);

  assert.throws(() => assertRelayContract({ ...viva, downstream: [] }), /'downstream' está vacía/);
  assert.throws(() => assertRelayContract({ ...viva, upstream: [] }), /'upstream' está vacía/);
  assert.throws(() => assertRelayContract({ ...viva, downstream: 'track' }), /tabla iterable/);
  assert.throws(() => assertRelayContract({ ...viva, upstream: undefined }), /tabla iterable/);
  assert.throws(
    () => assertRelayContract({ ...viva, downstream: [...viva.downstream, viva.downstream[0]] }),
    /nombres duplicados/
  );
  assert.throws(
    () => assertRelayContract({ ...viva, downstream: [...viva.downstream.slice(1), 42] }),
    /no es cadena no vacía/
  );
  assert.throws(
    () => assertRelayContract({ ...viva, upstream: [...viva.upstream.slice(1), '  '] }),
    /no es cadena no vacía/
  );
});

// ── 5 · Inmutable en caliente ────────────────────────────────────────────

test('la allowlist no se amplía en caliente: add/delete/clear denegados', () => {
  assert.throws(() => RELAY_DOWNSTREAM_TOP.add('evento:colado'), /inmutable en runtime/);
  assert.equal(RELAY_DOWNSTREAM_TOP.has('evento:colado'), false, 'el add denegado no debe entrar');
  assert.throws(() => RELAY_DOWNSTREAM_TOP.delete([...RELAY_DOWNSTREAM_TOP][0]), /inmutable en runtime/);
  assert.throws(() => RELAY_DOWNSTREAM_TOP.clear(), /inmutable en runtime/);
  assert.equal(RELAY_DOWNSTREAM_TOP.size, CUENTA_BAJADA);

  assert.throws(() => RELAY_UPSTREAM.push('EVENTO_COLADO'), TypeError);
  assert.equal(RELAY_UPSTREAM.length, CUENTA_SUBIDA);

  // El descriptor es copia: mutarlo no toca el contrato.
  const copia = relayContractDescriptor();
  copia.downstream.push('evento:colado');
  copia.upstream.push('EVENTO_COLADO');
  assert.equal(RELAY_DOWNSTREAM_TOP.size, CUENTA_BAJADA);
  assert.equal(RELAY_UPSTREAM.length, CUENTA_SUBIDA);
  assert.equal(RELAY_DOWNSTREAM_TOP.has('evento:colado'), false);
});

test('la allowlist cumple de verdad el ReadonlySet<string> que publica el .d.ts (D-C)', () => {
  // `types/index.d.ts` declara `downstream: ReadonlySet<string>`. Al dejar de
  // ser un `Set` (corrección de D2) la superficie se escribió a mano, y
  // faltaba `entries()`: el tipo compilaba y el runtime reventaba. Este test
  // ejerce CADA miembro de ReadonlySet para que el .d.ts no pueda mentir.
  const lista = RELAY_CONTRACT.downstream;
  const uno = [...lista][0];

  assert.equal(typeof lista.size, 'number');
  assert.equal(lista.size, CUENTA_BAJADA);
  assert.equal(lista.has(uno), true);
  assert.equal(lista.has('evento:que-no-existe'), false);
  assert.deepEqual([...lista.values()], [...lista]);
  assert.deepEqual([...lista.keys()], [...lista]);
  assert.deepEqual(
    [...lista.entries()],
    [...lista].map((v) => [v, v]),
    'entries() debe existir y rendir pares [valor, valor], como en un Set'
  );
  assert.equal(typeof lista[Symbol.iterator], 'function');

  const vistos = [];
  lista.forEach(function (valor, valor2, receptor) {
    vistos.push(valor);
    assert.equal(valor2, valor, 'el 2.º argumento de forEach es el valor, como en Set');
    assert.equal(receptor, lista, 'el 3.º argumento de forEach debe ser la lista publicada');
    assert.equal(this?.marca, 'thisArg', 'forEach debe respetar thisArg');
  }, { marca: 'thisArg' });
  assert.deepEqual(vistos, [...lista]);

  // Y ningún miembro de ReadonlySet se quedó sin implementar.
  for (const miembro of ['has', 'size', 'entries', 'keys', 'values', 'forEach']) {
    assert.ok(miembro in lista, `la superficie publicada no tiene \`${miembro}\``);
  }
});

test('la allowlist resiste el secuestro por prototipo (D2: sombrear métodos no bastaba)', () => {
  // La versión devuelta de U194 publicaba un `Set` real con los métodos
  // sombreados en la instancia. `Object.freeze` no toca el slot interno
  // [[SetData]], así que llamar al método del prototipo con la allowlist de
  // receptor la ampliaba de verdad. Probado e2e por la contrarrevisión: el
  // evento colado llegó al cliente de abajo. Estas son las sondas
  // permanentes de que esa vía está cerrada.
  assert.equal(
    RELAY_DOWNSTREAM_TOP instanceof Set,
    false,
    'la allowlist volvió a ser un Set: Set.prototype puede secuestrarla'
  );

  for (const metodo of ['add', 'delete', 'clear']) {
    assert.throws(
      () => Set.prototype[metodo].call(RELAY_DOWNSTREAM_TOP, 'evento:colado'),
      TypeError,
      `Set.prototype.${metodo}.call() alcanzó la allowlist`
    );
  }
  assert.equal(RELAY_DOWNSTREAM_TOP.has('evento:colado'), false, 'entró por el prototipo');
  assert.equal(RELAY_DOWNSTREAM_TOP.size, CUENTA_BAJADA, 'el tamaño se movió');

  // El array de subida sí es un array; su congelación sí es real, y también
  // por la vía del prototipo.
  assert.throws(
    () => Array.prototype.push.call(RELAY_UPSTREAM, 'EVENTO_COLADO'),
    TypeError,
    'Array.prototype.push.call() alcanzó la tabla de subida'
  );
  assert.equal(RELAY_UPSTREAM.length, CUENTA_SUBIDA);

  // Y no se puede reabrir redefiniendo la superficie publicada.
  assert.throws(
    () => Object.defineProperty(RELAY_DOWNSTREAM_TOP, 'has', { value: () => true }),
    TypeError,
    'se pudo redefinir `has` sobre la allowlist'
  );
  assert.throws(
    () => Object.defineProperty(RELAY_CONTRACT, 'downstream', { value: new Set(['todo']) }),
    TypeError,
    'se pudo sustituir la allowlist entera en RELAY_CONTRACT'
  );
  assert.equal(RELAY_DOWNSTREAM_TOP.has('evento:colado'), false);
  assert.equal(RELAY_DOWNSTREAM_TOP.size, CUENTA_BAJADA);
});

// ── 5-bis · Lo que la allowlist NO gobierna, asertado sin taparlo (D3) ──

test('HUECO ABIERTO: el sobre ROOM_MESSAGE reemite cualquier nombre sin consultar la allowlist', () => {
  // Esto NO es una prueba de que algo funcione: es un caso rojo asertado sin
  // taparlo, al estilo de U187. `emitDownstream` (src/relay.mjs:95) hace
  // `localNs.emit(inner, data)` con el nombre que venga dentro del sobre,
  // sin pasar por RELAY_DOWNSTREAM_TOP. Es herencia de la base — U194 no lo
  // empeoró (`relay.mjs`: 0 ediciones) y no puede arreglarlo, porque
  // `relay.mjs` es fichero caliente de U192/U193 (GOBIERNO §2).
  //
  // Consecuencia honesta: el contrato gobierna la VÍA TOP-LEVEL, no el
  // desempaquetado. Enrutado a U193/U195.
  //
  // CUANDO SE CIERRE, ESTE TEST DEBE CAER. Es su función: que nadie cierre
  // el agujero sin enterarse de que aquí se estaba documentando.
  resetRelayDiscardLedger();
  const ns = { emitidos: [], emit(event, data) { this.emitidos.push({ event, data }); } };

  const colado = 'evento:colado-por-sobre';
  assert.equal(RELAY_DOWNSTREAM_TOP.has(colado), false, 'el nombre de sonda no debe estar en la allowlist');
  emitDownstream(ns, { event: colado, room: 'R', data: { marca: 'D3' } });

  assert.ok(
    ns.emitidos.some((e) => e.event === colado),
    'si esto falla, el agujero del sobre SE CERRÓ: enhorabuena — actualiza este test, ' +
      'la cabecera de src/relay-contract.mjs y el §8 del reporte de U194'
  );

  // Lo mismo con un nombre de la tabla de SUBIDA, que la vía top-level sí corta.
  emitDownstream(ns, { event: 'CLIENT_REGISTER', room: 'R', data: { marca: 'D3' } });
  assert.ok(
    ns.emitidos.some((e) => e.event === 'CLIENT_REGISTER'),
    'el sobre tampoco filtra los nombres de subida (mismo hueco)'
  );
});

test('el último cazador del atacante competente sigue vivo (D5)', () => {
  // Un atacante que añada un evento, suba la versión, re-selle y actualice
  // las anclas de ESTE fichero pasa todos los tests de U194. El único que lo
  // caza entonces es la enumeración literal de U192 en relay-trace.test.mjs,
  // que es una aserción histórica («la política es la previa a U192»), no una
  // lista viva. Si un WP futuro la re-apunta al contrato, muere el último
  // cazador y nadie se entera. Este test hace que sí se enteren.
  const trace = fuente('../test/relay-trace.test.mjs');
  const ausentes = [...RELAY_CONTRACT.upstream, ...RELAY_CONTRACT.downstream].filter(
    (ev) => !trace.includes(`'${ev}'`) && !trace.includes(`"${ev}"`)
  );
  assert.deepEqual(
    ausentes,
    [],
    'test/relay-trace.test.mjs ya no enumera literalmente la política de U192. Era el ' +
      'único test que caza a quien añade un evento re-sellando Y subiendo la versión. ' +
      'Si la retirada es deliberada, U194 necesita su propia ancla literal en su lugar'
  );
});

// ── 6 · Cierre e2e de la vía top-level ──────────────────────────────────

test('cierre de la vía top-level contra puente real: por onAny solo pasa el contrato', async () => {
  resetRelayDiscardLedger();

  const enContrato = new Set([...RELAY_CONTRACT.upstream, ...RELAY_CONTRACT.downstream]);
  const intrusos = [
    ...literalesDeFuente(['../src/relay.mjs', '../src/config.mjs', '../src/relay-contract.mjs']),
    'EVENTO_INTRUSO_U194',
    'deck:colado',
    'SET_STATE_',
    'set_state',
    'TRACK',
    'ledger:extra'
  ].filter((ev) => !enContrato.has(ev));

  // Si el corpus se queda vacío o pierde los literales del relay, la sonda
  // no está sondeando: eso también es rojo.
  assert.ok(intrusos.length >= 10, `corpus de sondas demasiado pequeño (${intrusos.length})`);
  assert.ok(intrusos.includes('MAKE_MASTER'), 'el corpus no leyó los literales de src/relay.mjs');

  /** @type {Array<{ event: string, data: unknown }>} */
  const vistosArriba = [];
  /** @type {Array<{ event: string, data: unknown }>} */
  const vistosAbajo = [];

  const arriba = await createScriptoriumServer({ port: 0, host: '127.0.0.1', bridge: 'local' });
  const nsArriba = arriba.socketServer.io.of(`/${NAMESPACE}`);
  nsArriba.on('connection', (socket) => {
    socket.onAny((event, data) => vistosArriba.push({ event, data }));
  });

  process.env.ZEUS_SCRIPTORIUM_BRIDGE_URL = arriba.url;
  let abajo;
  let observador;
  try {
    abajo = await createScriptoriumServer({ port: 0, host: '127.0.0.1', bridge: 'remote' });
    await waitFor(() => abajo.bridgeClient?.io?.connected, 8000, 'puente conectado');

    observador = new SocketClient('observador-u194', abajo.url, `/${NAMESPACE}`, {
      auth: { token: 'test', room: 'PUBLIC_ROOM', user: 'observador-u194' }
    });
    observador.io.onAny((event, data) => vistosAbajo.push({ event, data }));
    await waitFor(() => observador.io.connected, 8000, 'observador conectado');

    // ── BAJADA ────────────────────────────────────────────────────────────
    // Primero los intrusos; después los del contrato. socket.io conserva el
    // orden sobre la misma conexión: si llegan los últimos, los intrusos ya
    // fueron procesados y su ausencia abajo es concluyente.
    for (const ev of intrusos) nsArriba.emit(ev, { sonda: 'u194', ev });
    for (const ev of RELAY_CONTRACT.downstream) nsArriba.emit(ev, { contrato: ev });

    await waitFor(
      () =>
        [...RELAY_CONTRACT.downstream].every((ev) =>
          vistosAbajo.some((v) => v.event === ev && v.data?.contrato === ev)
        ),
      8000,
      'los eventos del contrato llegan abajo (control positivo)'
    );

    const coladosAbajo = intrusos.filter((ev) => vistosAbajo.some((v) => v.event === ev));
    assert.deepEqual(
      coladosAbajo,
      [],
      'eventos AUSENTES del contrato cruzaron hacia abajo: la guarda de allowlist no está cerrando'
    );

    // Y cada corte dejó rastro con motivo (herencia de U192, aquí exigida
    // para todo el corpus, no solo para un intruso de muestra).
    let ledger = relayDiscardLedger();
    const sinRastro = intrusos.filter(
      (ev) =>
        !ledger.some(
          (e) =>
            e.event === ev && e.direction === 'downstream' && e.reason === 'fuera-de-allowlist-de-bajada'
        )
    );
    assert.deepEqual(sinRastro, [], 'hubo cortes de bajada sin registro de descarte');

    const contratoComoDescarte = [...RELAY_CONTRACT.downstream].filter((ev) =>
      ledger.some((e) => e.event === ev && e.direction === 'downstream')
    );
    assert.deepEqual(contratoComoDescarte, [], 'un evento del contrato figura como descartado');

    // ── SUBIDA ────────────────────────────────────────────────────────────
    for (const ev of intrusos) observador.io.emit(ev, { sonda: 'u194-subida', ev });
    for (const ev of RELAY_CONTRACT.upstream) observador.io.emit(ev, { contratoSubida: ev });

    await waitFor(
      () =>
        [...RELAY_CONTRACT.upstream].every((ev) =>
          vistosArriba.some((v) => v.event === ev && v.data?.contratoSubida === ev)
        ),
      8000,
      'los eventos de subida del contrato cruzan el puente (control positivo)'
    );

    const coladosArriba = intrusos.filter((ev) => vistosArriba.some((v) => v.event === ev));
    assert.deepEqual(
      coladosArriba,
      [],
      'eventos AUSENTES del contrato cruzaron hacia arriba: el bucle de subida no está cerrando'
    );

    ledger = relayDiscardLedger();
    const sinRastroArriba = intrusos.filter(
      (ev) =>
        !ledger.some(
          (e) =>
            e.event === ev &&
            e.direction === 'upstream' &&
            e.reason === 'fuera-del-conjunto-de-subida'
        )
    );
    assert.deepEqual(sinRastroArriba, [], 'hubo cortes de subida sin registro de descarte');
  } finally {
    delete process.env.ZEUS_SCRIPTORIUM_BRIDGE_URL;
    observador?.io?.disconnect();
    observador?.io?.close();
    if (abajo) await abajo.close();
    await arriba.close();
  }
});
