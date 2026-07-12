import { io } from 'socket.io-client';
import { createSessionClientCore } from './client-core.mjs';
import { resolveSessionSocketUrl } from './endpoint.mjs';
import { INBOUND_SCHEMAS } from './schemas/inbound.mjs';

/**
 * Node session client with optional outbound validation.
 * @param {string} [sessionUrl] Full namespace URL; defaults to resolveSessionSocketUrl()
 * @param {object} [opts]
 * @param {(type: string, payload?: Record<string, unknown>, detail?: string) => void} [opts.pushEvent]
 * @param {'enforce' | 'warn' | 'off'} [opts.validate]
 */
export function createSessionClient(sessionUrl, opts = {}) {
  const { pushEvent, validate = 'warn', ioOptions } = opts;
  const url = sessionUrl || resolveSessionSocketUrl();

  const core = createSessionClientCore({
    url,
    ioFactory: io,
    ioOptions,
    pushEvent
  });

  if (validate === 'off') return core;

  const originalEmit = core.emit.bind(core);
  core.emit = (event, payload) => {
    const schema = INBOUND_SCHEMAS.get(event);
    if (schema) {
      const parsed = schema.safeParse(payload ?? {});
      if (!parsed.success) {
        pushEvent?.('emit:invalid', { event, issues: parsed.error.flatten() });
        if (validate === 'enforce') return false;
      }
    }
    return originalEmit(event, payload);
  };

  return core;
}
