/** Types for `@zeus/http-contract/express` (WP-U157). */

import type { ZodTypeAny } from './index.js';

export function getValidateMode(): 'off' | 'warn' | 'enforce';

export function validate(
  schemas: { params?: ZodTypeAny; query?: ZodTypeAny; body?: ZodTypeAny },
  opts?: { mode?: 'off' | 'warn' | 'enforce'; routeId?: string }
): (req: unknown, res: unknown, next: (err?: unknown) => void) => void;
