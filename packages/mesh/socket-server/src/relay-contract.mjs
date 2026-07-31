import { createHash } from 'node:crypto';

/**
 * CONTRATO-RELAY v1 — la allowlist del relay como contrato explícito (WP-U194).
 *
 * ESTE FICHERO ES LA ÚNICA FUENTE de los nombres de evento que el relay
 * propaga. `config.mjs` re-exporta desde aquí (`RELAY_UPSTREAM`,
 * `RELAY_DOWNSTREAM_TOP`) y `relay.mjs` los consume de `config.mjs`: no
 * existe una segunda lista viva en ningún otro fichero. Antes de U194 los
 * nombres vivían sueltos en `config.mjs:6-17`, sin versión ni sello.
 *
 * Reglas del contrato:
 *
 * 1. **Un solo sitio.** Añadir o quitar un evento se hace AQUÍ, en las
 *    tablas `UPSTREAM` / `DOWNSTREAM_TOP`. En ningún otro lugar.
 * 2. **Sellado.** `RELAY_CONTRACT_SEAL` es el sha256 de la forma canónica
 *    (versión + ambas tablas). Tocar una tabla sin re-sellar hace que
 *    `assertRelayContract()` lance **en la carga del módulo**: el servidor
 *    no arranca y toda la suite del paquete cae. La allowlist no se puede
 *    cambiar en silencio.
 * 3. **Versionado.** `RELAY_CONTRACT_VERSION` es semver explícito y entra
 *    en el sello: cambiar la política cambia el sello, y re-sellar sin
 *    tocar la versión sigue siendo rojo en
 *    `test/relay-contract.test.mjs` (ancla literal versión + sello).
 *    Contrato sin versión declarada = el gate falla (no arranca).
 * 4. **Inmutable en runtime.** Las tablas publicadas están congeladas y el
 *    Set de bajada rechaza `add`/`delete`/`clear`: nadie amplía la
 *    allowlist desde otro módulo sin pasar por este fichero.
 *
 * Alcance: esto es política de PROPAGACIÓN (qué nombre de evento cruza el
 * puente), no de permiso ni de identidad — la frontera «transporte ≠
 * permiso» de U186 sigue intacta y este contrato no la toca.
 *
 * Decisión de diseño del WP (GOBIERNO-EJECUCION-F2 :177-180 lo dejaba
 * `<pendiente>`: contrato local vs proyección al spec compartido de
 * `@zeus/protocol`): **contrato local**. Proyectarlo al spec crearía
 * exactamente la segunda lista viva que el WP existe para eliminar; el
 * spec compartido describe la forma de `state|intent|track|ledger`, no
 * qué nombres reemite este relay.
 */

/** Versión del contrato (semver explícito; entra en el sello). */
export const RELAY_CONTRACT_VERSION = '1.0.0';

/**
 * Subida: lo que el relay reenvía del cliente local hacia el puente.
 * Origen previo a U194: `src/config.mjs:6` (`RELAY_UPSTREAM`).
 * @type {readonly string[]}
 */
const UPSTREAM = ['CLIENT_REGISTER', 'CLIENT_SUSCRIBE', 'ROOM_MESSAGE'];

/**
 * Bajada: los 8 eventos de nivel superior que el relay reemite del puente
 * hacia los clientes locales.
 * Origen previo a U194: `src/config.mjs:8-17` (`RELAY_DOWNSTREAM_TOP`).
 * @type {readonly string[]}
 */
const DOWNSTREAM_TOP = [
  'SET_STATE',
  'deck:resolved',
  'deck:error',
  'catalog:servers',
  'state',
  'intent',
  'ledger',
  'track'
];

/**
 * Sello del contrato: sha256 de la forma canónica (versión + ambas tablas).
 *
 * Al cambiar la allowlist: sube `RELAY_CONTRACT_VERSION`, recalcula con
 *
 *   node -e "import('./packages/mesh/socket-server/src/relay-contract.mjs')"
 *
 * — el gate de carga imprime en su error el sello del contenido — y pega
 * ese valor aquí. Actualiza además el ancla de `test/relay-contract.test.mjs`.
 */
export const RELAY_CONTRACT_SEAL =
  '57adb96df059db58ee86e20b725012f37adb9f5d20f99f901863cff3b637335e';

const SEMVER = /^\d+\.\d+\.\d+$/;
const HEX64 = /^[0-9a-f]{64}$/;

/**
 * Forma canónica sellable. El orden de subida es significativo (es el
 * orden de registro de handlers); el de bajada se normaliza porque el
 * conjunto es un Set y su orden no es política.
 * @param {{ version: unknown, upstream: Iterable<string>, downstream: Iterable<string> }} decl
 */
export function relayContractCanonicalForm(decl) {
  const upstream = [...decl.upstream];
  const downstream = [...decl.downstream].slice().sort();
  return [
    `CONTRATO-RELAY v${decl.version}`,
    `upstream(${upstream.length}): ${upstream.join(',')}`,
    `downstream(${downstream.length}): ${downstream.join(',')}`,
    ''
  ].join('\n');
}

/**
 * sha256 hex de la forma canónica.
 * @param {{ version: unknown, upstream: Iterable<string>, downstream: Iterable<string> }} decl
 */
export function computeRelaySeal(decl) {
  return createHash('sha256').update(relayContractCanonicalForm(decl), 'utf8').digest('hex');
}

/**
 * @param {string} campo
 * @param {unknown} valor
 * @returns {string[]}
 */
function tablaValida(campo, valor) {
  if (!valor || typeof valor[Symbol.iterator] !== 'function' || typeof valor === 'string') {
    throw new Error(`CONTRATO-RELAY: '${campo}' debe ser una tabla iterable de nombres de evento.`);
  }
  const lista = [...valor];
  if (lista.length === 0) {
    throw new Error(
      `CONTRATO-RELAY: '${campo}' está vacía. Una allowlist vacía no es un contrato: decláralo o retira el relay.`
    );
  }
  for (const nombre of lista) {
    if (typeof nombre !== 'string' || nombre.trim() === '') {
      throw new Error(
        `CONTRATO-RELAY: '${campo}' contiene un nombre de evento que no es cadena no vacía (${JSON.stringify(nombre)}).`
      );
    }
  }
  if (new Set(lista).size !== lista.length) {
    throw new Error(`CONTRATO-RELAY: '${campo}' tiene nombres duplicados.`);
  }
  return lista;
}

/**
 * Gate del contrato: fail-closed. Lanza si la versión no está declarada,
 * si las tablas son inválidas o si el sello no corresponde al contenido.
 * @param {{ version?: unknown, seal?: unknown, upstream: Iterable<string>, downstream: Iterable<string> }} decl
 */
export function assertRelayContract(decl) {
  if (!decl || typeof decl !== 'object') {
    throw new Error('CONTRATO-RELAY: no hay declaración de contrato que verificar.');
  }
  if (typeof decl.version !== 'string' || !SEMVER.test(decl.version)) {
    throw new Error(
      `CONTRATO-RELAY: versión no declarada o malformada (${JSON.stringify(decl.version)}). ` +
        'La allowlist sin versión explícita no es contrato.'
    );
  }
  if (typeof decl.seal !== 'string' || !HEX64.test(decl.seal)) {
    throw new Error(
      `CONTRATO-RELAY: sello no declarado o malformado (${JSON.stringify(decl.seal)}). ` +
        'Se espera sha256 hex de 64 caracteres en minúscula.'
    );
  }
  const upstream = tablaValida('upstream', decl.upstream);
  const downstream = tablaValida('downstream', decl.downstream);
  const esperado = computeRelaySeal({ version: decl.version, upstream, downstream });
  if (esperado !== decl.seal) {
    throw new Error(
      `CONTRATO-RELAY v${decl.version}: el sello NO corresponde a la allowlist declarada.\n` +
        `  sello declarado : ${decl.seal}\n` +
        `  sello del contenido: ${esperado}\n` +
        `  subida (${upstream.length}): ${upstream.join(', ')}\n` +
        `  bajada (${downstream.length}): ${[...downstream].sort().join(', ')}\n` +
        'Cambiar la allowlist es un cambio de contrato: sube RELAY_CONTRACT_VERSION, ' +
        'pon el sello nuevo en RELAY_CONTRACT_SEAL y actualiza el ancla de ' +
        'test/relay-contract.test.mjs.'
    );
  }
  return { version: decl.version, seal: decl.seal, upstream, downstream };
}

/**
 * Set con la allowlist cerrada: conserva `has`/iteración/spread (lo que el
 * relay y los tests usan) y rechaza toda mutación en caliente.
 * @param {string[]} valores
 */
function conjuntoSellado(valores) {
  const set = new Set(valores);
  const denegar = (metodo) => () => {
    throw new Error(
      `CONTRATO-RELAY: la allowlist es inmutable en runtime ('${metodo}' denegado). ` +
        'Cambiarla es un cambio de contrato en src/relay-contract.mjs.'
    );
  };
  Object.defineProperties(set, {
    add: { value: denegar('add'), writable: false, configurable: false, enumerable: false },
    delete: { value: denegar('delete'), writable: false, configurable: false, enumerable: false },
    clear: { value: denegar('clear'), writable: false, configurable: false, enumerable: false }
  });
  return Object.freeze(set);
}

// ── Gate en la carga del módulo: contrato roto = el relay no existe ──────
assertRelayContract({
  version: RELAY_CONTRACT_VERSION,
  seal: RELAY_CONTRACT_SEAL,
  upstream: UPSTREAM,
  downstream: DOWNSTREAM_TOP
});

/**
 * El contrato publicado. `upstream` es un array congelado (el orden es
 * política); `downstream` es un Set sellado (lo que `relay.mjs` consulta).
 */
export const RELAY_CONTRACT = Object.freeze({
  version: RELAY_CONTRACT_VERSION,
  seal: RELAY_CONTRACT_SEAL,
  upstream: Object.freeze([...UPSTREAM]),
  downstream: conjuntoSellado(DOWNSTREAM_TOP)
});

/**
 * Instantánea serializable del contrato — para citarlo, loguearlo o
 * compararlo entre versiones sin importar el módulo entero.
 */
export function relayContractDescriptor() {
  return {
    version: RELAY_CONTRACT.version,
    seal: RELAY_CONTRACT.seal,
    upstream: [...RELAY_CONTRACT.upstream],
    downstream: [...RELAY_CONTRACT.downstream],
    counts: {
      upstream: RELAY_CONTRACT.upstream.length,
      downstream: RELAY_CONTRACT.downstream.size
    }
  };
}
