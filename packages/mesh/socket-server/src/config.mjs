import { DEFAULT_ZEUS_UI_MESH, readEnvPortAlias } from '@zeus/presets-sdk/env';
import { resolveScriptoriumSecret } from '@zeus/rooms';
import { RELAY_CONTRACT } from './relay-contract.mjs';

export const NAMESPACE = 'runtime';

/**
 * Política de propagación del relay — WP-U194.
 *
 * Aquí NO hay lista: los nombres viven en una sola tabla, la de
 * `src/relay-contract.mjs` (versionada y sellada). Esto son alias por
 * identidad (`===` con `RELAY_CONTRACT.upstream` / `.downstream`) para no
 * romper a los consumidores que ya importaban de este módulo.
 * Añadir o quitar un evento AQUÍ es un error: se hace en el contrato.
 */
export const RELAY_UPSTREAM = RELAY_CONTRACT.upstream;

export const RELAY_DOWNSTREAM_TOP = RELAY_CONTRACT.downstream;

/**
 * @param {object} [options]
 * @param {number} [options.port]
 * @param {string} [options.host]
 * @param {'local'|'remote'} [options.bridge]
 * @param {string} [options.secret]
 */
export function resolveConfig(options = {}) {
  const mesh = DEFAULT_ZEUS_UI_MESH.scriptorium;
  return {
    // WP-U266 · el puerto que viene del ENTORNO se valida; el que viene por
    // `options.port` NO. No es una inconsistencia: son dos cosas distintas.
    //   - `ZEUS_PORT_SCRIPTORIUM=0` es configuracion mal formada -> aborta.
    //   - `{ port: 0 }` en codigo es "dame un puerto efimero", que es el patron
    //     que usan seis llamadas de esta misma suite (y el que WP-U267 dejo
    //     como bueno para no atar puertos a mano). Sigue funcionando igual.
    // Hasta U266 esto era `Number(process.env.X ?? …)` y por eso el defecto de
    // la ficha seguia vivo aqui: con `ZEUS_PORT_SCRIPTORIUM=0` el servidor
    // levantaba en un puerto efimero y lo anunciaba como suyo, en verde.
    port:
      options.port != null
        ? Number(options.port)
        : readEnvPortAlias(['ZEUS_PORT_SCRIPTORIUM', 'ZEUS_SCRIPTORIUM_PORT'], mesh.port),
    host: options.host ?? process.env.ZEUS_SCRIPTORIUM_HOST ?? mesh.host,
    bridge: options.bridge ?? process.env.ZEUS_SCRIPTORIUM_BRIDGE ?? 'local',
    secret: options.secret ?? resolveScriptoriumSecret()
  };
}

/** @param {string} host @param {number} port */
export function resolveBridgeUrl(host, port) {
  return (
    process.env.ZEUS_SCRIPTORIUM_BRIDGE_URL ||
    process.env.ZEUS_SCRIPTORIUM_URL ||
    `http://${host}:${port}`
  );
}

/** Hostname suitable for URLs shown in logs or injected into the Admin UI. */
export function displayHost(host) {
  return host === '0.0.0.0' ? 'localhost' : host;
}

/** @param {string} host @param {number} port */
export function serverBaseUrl(host, port) {
  return `http://${displayHost(host)}:${port}`;
}
