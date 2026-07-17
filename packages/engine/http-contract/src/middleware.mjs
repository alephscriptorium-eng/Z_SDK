import { resolveValidateMode } from '@zeus/presets-sdk/env';
import { ValidationErrorBody } from './envelope.mjs';

/**
 * @returns {'off'|'warn'|'enforce'}
 */
export function getValidateMode() {
  return resolveValidateMode('http');
}

/**
 * Express middleware factory — validates params, query, body against zod schemas.
 * @param {{ params?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny, body?: import('zod').ZodTypeAny }} schemas
 * @param {{ mode?: 'off'|'warn'|'enforce', routeId?: string }} [opts]
 */
export function validate(schemas, opts = {}) {
  const mode = opts.mode ?? getValidateMode();
  if (mode === 'off') {
    return (_req, _res, next) => next();
  }

  return (req, res, next) => {
    const failures = [];

    if (schemas.params) {
      const parsed = schemas.params.safeParse(req.params);
      if (!parsed.success) failures.push({ part: 'params', error: parsed.error.flatten() });
    }
    if (schemas.query) {
      const parsed = schemas.query.safeParse(req.query);
      if (!parsed.success) failures.push({ part: 'query', error: parsed.error.flatten() });
    }
    if (schemas.body) {
      const parsed = schemas.body.safeParse(req.body);
      if (!parsed.success) failures.push({ part: 'body', error: parsed.error.flatten() });
    }

    if (failures.length === 0) return next();

    const body = ValidationErrorBody.parse({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: failures
    });

    if (mode === 'warn') {
      console.warn(
        `[http-contract] validation warn${opts.routeId ? ` (${opts.routeId})` : ''}:`,
        JSON.stringify(failures)
      );
      return next();
    }

    return res.status(400).json(body);
  };
}
