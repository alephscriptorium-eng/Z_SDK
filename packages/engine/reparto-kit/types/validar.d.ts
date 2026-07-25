import type { RepartoV1 } from './tipos.js';

export function blobReparto(reparto: RepartoV1): string;
export function validarReparto(
  reparto: RepartoV1,
  patronCeguera: string | RegExp | null | undefined
): { ok: boolean; matches: string[] };
export function patronCegueraDesdeEnv(env?: Record<string, string | undefined>): string | undefined;
