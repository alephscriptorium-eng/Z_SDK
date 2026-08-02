import { nodoIdsFromTrunk } from '@zeus/linea-kit/viaje';
export const bad: string[] = nodoIdsFromTrunk({ nodos: [{ id: 42 }, { id: true }] });
