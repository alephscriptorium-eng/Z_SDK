import type { RepartoV1, Personaje } from './tipos.js';

export interface DecisionPermiso {
  ok: boolean;
  motivo: string;
  actorSsbId: string | null;
  personajeId?: string | null;
  rol?: string | null;
  asiento?: string | null;
  permiso?: string;
  seatError?: string;
}

export function actorDeCard(card: unknown): string | null;
export function personajesDeActor(reparto: RepartoV1, actorSsbId: string): Personaje[];
export function actoresDePersonaje(reparto: RepartoV1, personajeId: string): string[];
export function permisosDePersonaje(reparto: RepartoV1, personajeId: string): string[];
export function evaluarPermiso(
  reparto: RepartoV1,
  card: unknown,
  q: { personajeId: string; permiso: string; now?: number; exigirSeat?: boolean }
): DecisionPermiso;
export function puede(
  reparto: RepartoV1,
  card: unknown,
  personajeId: string,
  permiso: string,
  opts?: number | { now?: number; exigirSeat?: boolean }
): boolean;
