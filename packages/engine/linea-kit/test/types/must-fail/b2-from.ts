import { acceptWalks } from '@zeus/linea-kit/viaje';
declare const untrusted: unknown;
const r = acceptWalks(untrusted);
// El runtime NO comprobo el tipo de `from`; el declarado no puede prometerlo.
export const bad: string = r.ok ? r.accepted[0].from : '';
