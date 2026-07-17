import { DEFAULT_ZEUS_UI_MESH } from '@zeus/presets-sdk/env';
import { resolveScriptoriumSecret } from '@zeus/rooms';

export const NAMESPACE = 'runtime';

export const RELAY_UPSTREAM = ['CLIENT_REGISTER', 'CLIENT_SUSCRIBE', 'ROOM_MESSAGE'];

export const RELAY_DOWNSTREAM_TOP = new Set([
  'SET_STATE',
  'deck:resolved',
  'deck:error',
  'catalog:servers',
  'state',
  'intent',
  'ledger',
  'track'
]);

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
