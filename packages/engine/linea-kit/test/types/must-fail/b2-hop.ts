import { acceptWalks } from '@zeus/linea-kit/viaje';
const r = acceptWalks([{ kind: 'walk' as const, from: 'A', to: 'B' }]);
export const bad = r.ok ? r.accepted[0].hop : 0;
