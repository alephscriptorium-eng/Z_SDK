import type { ActaDeBarrio } from './tipos.d.ts';

export interface ValidarActaResult {
  ok: boolean;
  matches: string[];
}

export declare function blobActa(acta: ActaDeBarrio): string;

/**
 * Shape + resumen ≤400 + guardarraíl ceguera. Sin patrón → no ok.
 */
export declare function validarActa(
  acta: unknown,
  patronCeguera: string | RegExp | null | undefined
): ValidarActaResult;

export declare function patronCegueraDesdeEnv(
  env?: Record<string, string | undefined>
): string | undefined;
