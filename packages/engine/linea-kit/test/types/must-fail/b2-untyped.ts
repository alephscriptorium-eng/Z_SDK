import { acceptWalks } from '@zeus/linea-kit/viaje';
declare const untrusted: unknown;
const r = acceptWalks(untrusted);
export const bad: number = r.ok ? r.accepted[0].from.length : 0;
