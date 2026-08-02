import { segmentarViaje } from '@zeus/linea-kit/viaje';
export const bad = segmentarViaje(
  { id: 'v', origin: 'A', destination: 'B', pasos: [{ from: 'A', to: 'B' }] },
  { editorAllowlist: ['bob'] }
);
