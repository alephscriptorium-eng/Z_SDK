/**
 * Browser ESM entry — uses window.io injected by socket.io script tag.
 */
import { createSessionClientCore } from '../src/client-core.mjs';
import { SESSION_NAMESPACE } from '../src/protocol.mjs';

/**
 * @param {object} [opts]
 * @param {string} [opts.namespace]
 * @param {(type: string, payload?: Record<string, unknown>) => void} [opts.onEvent]
 */
export function createBrowserSessionClient(opts = {}) {
  const namespace = opts.namespace || SESSION_NAMESPACE;
  const ioFactory = globalThis.io;
  if (typeof ioFactory !== 'function') {
    throw new Error('socket.io client (window.io) not loaded');
  }
  return createSessionClientCore({
    url: namespace,
    ioFactory,
    pushEvent: opts.onEvent
  });
}

export { SESSION_NAMESPACE };
