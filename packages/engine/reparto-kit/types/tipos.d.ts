export const REPARTO_VERSION: 'reparto/1';
export const PERMISOS: readonly ['reparto:leer', 'reparto:interpretar', 'reparto:dirigir'];
export const MOTIVOS: Readonly<{
  CONCEDIDO: 'concedido';
  CARD_NO_VIGENTE: 'card_no_vigente';
  IDENTIDAD_AUSENTE: 'identidad_ausente';
  PERSONAJE_DESCONOCIDO: 'personaje_desconocido';
  PERMISO_DESCONOCIDO: 'permiso_desconocido';
  PERSONAJE_NO_EN_REPARTO: 'personaje_no_en_reparto';
  ROL_SIN_PERMISO: 'rol_sin_permiso';
}>;

export type Permiso = (typeof PERMISOS)[number];

export interface Personaje {
  id: string;
  nombre: string;
  rol: string;
}

export interface Asignacion {
  actorSsbId: string;
  personajeId: string;
}

export interface RepartoV1 {
  version: 'reparto/1';
  personajes: Personaje[];
  asignaciones: Asignacion[];
  politica: Record<string, string[]>;
}

export function isPersonajeShaped(value: unknown): value is Personaje;
export function isAsignacionShaped(value: unknown): value is Asignacion;
export function isRepartoShaped(value: unknown): value is RepartoV1;
export function repartoVacio(): RepartoV1;
export function crearReparto(input?: {
  personajes?: Personaje[];
  asignaciones?: Asignacion[];
  politica?: Record<string, string[]>;
}): Readonly<RepartoV1>;
