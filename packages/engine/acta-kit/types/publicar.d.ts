import type { ActaDeBarrio } from './tipos.d.ts';

export interface PublicarMeta {
  game: string;
  ts?: number;
  seq?: number;
  from?: string;
}

/**
 * Mensaje ledger listo para el canal plaza. El payload conserva campos
 * abiertos del protocolo; no se estrechan aquí más de lo que el runtime escribe.
 */
export interface MensajeLedgerActa {
  event: string;
  payload: Record<string, unknown>;
}

export interface IntentarPublicarOpts extends PublicarMeta {
  publish: (event: string, payload: Record<string, unknown>) => void;
}

export interface IntentarPublicarResult {
  ok: boolean;
  published: boolean;
  matches: string[];
  message: MensajeLedgerActa;
}

export declare function mensajeActa(
  acta: ActaDeBarrio,
  meta: PublicarMeta
): MensajeLedgerActa;

export declare function mensajeActaRechazada(
  acta: ActaDeBarrio,
  matches: string[],
  meta: PublicarMeta
): MensajeLedgerActa;

export declare function intentarPublicarActa(
  acta: ActaDeBarrio,
  patronCeguera: string | RegExp | null | undefined,
  opts: IntentarPublicarOpts
): IntentarPublicarResult;
