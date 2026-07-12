import { ERROR_CODES, makeError } from '../errors.mjs';

/**
 * @typedef {object} HandlerContext
 * @property {import('socket.io').Socket} socket
 * @property {object} server
 * @property {Function} [ack]
 */

/**
 * Wrap an event handler with inbound schema validation and error handling.
 * @param {string} event
 * @param {import('zod').ZodTypeAny} schema
 * @param {(payload: unknown, ctx: HandlerContext) => unknown | Promise<unknown>} handler
 * @param {object} opts
 * @param {'off' | 'enforce' | 'warn'} [opts.validate]
 * @param {(info: object) => void} [opts.onError]
 * @param {object} server
 */
export function wrapHandler(event, schema, handler, { validate = 'warn', onError, server } = {}) {
  return async (rawPayload, socket, ack) => {
    const ctx = { socket, server, ack };
    let payload = rawPayload ?? {};

    if (validate !== 'off') {
      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        const err = makeError({
          event,
          code: ERROR_CODES.INVALID_PAYLOAD,
          message: 'Invalid payload',
          details: parsed.error.flatten()
        });
        if (validate === 'enforce') {
          onError?.({ type: 'validation', event, error: err });
          server.unicast(socket, 'session:error', err);
          if (ack) ack(err);
          return;
        }
        console.warn(
          `[session-protocol] validation warn (${event}):`,
          JSON.stringify(parsed.error.flatten())
        );
        onError?.({ type: 'validation', event, error: err });
      } else {
        payload = parsed.data;
      }
    }

    try {
      const result = await handler(payload, ctx);
      if (ack && result !== undefined) ack(result);
    } catch (error) {
      const err = makeError({
        event,
        code: ERROR_CODES.HANDLER_ERROR,
        message: error?.message || String(error)
      });
      onError?.({ type: 'handler', event, error: err, cause: error });
      server.unicast(socket, 'session:error', err);
      if (ack) ack(err);
    }
  };
}

/**
 * Optionally validate outbound payloads in debug/warn mode.
 * @param {string} event
 * @param {unknown} payload
 * @param {import('zod').ZodTypeAny | undefined} schema
 * @param {'off' | 'enforce' | 'warn'} validate
 * @param {(info: object) => void} [onError]
 */
export function validateOutbound(event, payload, schema, validate, onError) {
  if (!schema || validate === 'off' || validate === 'enforce') return payload;
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    onError?.({
      type: 'outbound',
      event,
      error: parsed.error.flatten()
    });
  }
  return payload;
}
