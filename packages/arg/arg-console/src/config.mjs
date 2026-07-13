/**
 * Configuración mínima y autocontenida del arg-console.
 *
 * A propósito NO usa createAppConfig de @zeus/app-shell (su whitelist de
 * appIds no conoce este paquete): host/puerto de env con defaults del
 * contrato (CONTRATO.md §6) y datos del socket-server para el viewer-config.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Raíz del paquete (contiene package.json y assets/). */
export const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const DEFAULT_ARG_CONSOLE_PORT = 3021;
export const DEFAULT_SCRIPTORIUM_PORT = 3017;

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{server: {port:number, host:string}, scriptorium: {host:string, port:number, path:string, secret:string}}}
 */
export function getConfig(env = process.env) {
  return {
    server: {
      port: Number(env.ZEUS_PORT_ARG_CONSOLE) || DEFAULT_ARG_CONSOLE_PORT,
      host: env.ZEUS_ARG_CONSOLE_HOST || 'localhost'
    },
    scriptorium: {
      host: env.ZEUS_SCRIPTORIUM_HOST || 'localhost',
      port: Number(env.ZEUS_PORT_SCRIPTORIUM) || DEFAULT_SCRIPTORIUM_PORT,
      path: '/runtime',
      secret: env.ZEUS_SCRIPTORIUM_SECRET || 'dev-secret'
    }
  };
}
