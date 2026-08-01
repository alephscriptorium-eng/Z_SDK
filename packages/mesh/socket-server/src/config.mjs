import { DEFAULT_ZEUS_UI_MESH } from '@zeus/presets-sdk/env';
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
    port: Number(
      options.port ??
        process.env.ZEUS_PORT_SCRIPTORIUM ??
        process.env.ZEUS_SCRIPTORIUM_PORT ??
        mesh.port
    ),
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
