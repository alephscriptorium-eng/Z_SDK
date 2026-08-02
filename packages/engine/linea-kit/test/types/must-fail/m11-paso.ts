import type { ViajeRecorrido } from '@zeus/linea-kit/viaje';
declare const r: ViajeRecorrido;
export const bad: number = r.pasos[0].chosen_from.length;
