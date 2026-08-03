import type { ActaDeBarrio } from './tipos.d.ts';

/**
 * Extrae acta de un mensaje/payload ledger (plaza).
 * Acepta protocolo `{ payload: { entryKind:'acta', detail:{acta} } }`
 * o domain-local `{ kind:'acta', detail:{acta} }`.
 */
export declare function actaDesdeEntry(entry: unknown): ActaDeBarrio | null;

export type AdoptarActaResult =
  | { ok: true; acta: ActaDeBarrio | null }
  | { ok: false; error: string };

/**
 * Última entryKind `acta` válida del barrioID gana; sin acta → `{ ok:true, acta:null }`.
 */
export declare function adoptarActaDesdePlaza(
  entries: unknown[],
  barrioId: string
): AdoptarActaResult;
