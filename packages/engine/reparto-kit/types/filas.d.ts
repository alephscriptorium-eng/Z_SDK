import type { RepartoV1 } from './tipos.js';

export function filasCastDesdeReparto(
  reparto: RepartoV1
): Array<{ participant: string; role: string; oldid: string }>;
