import type { LineaInstance } from '@zeus/linea-kit/loader';
declare const instance: LineaInstance;
export const bad: string[] = (instance.manifest.meta.partes ?? []).map((p) => p.id.toUpperCase());
