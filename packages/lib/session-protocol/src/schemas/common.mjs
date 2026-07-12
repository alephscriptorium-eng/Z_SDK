import { z } from 'zod';

export const DeckId = z.enum(['A', 'B', 'C']);
export const Year = z.coerce.number();
export const Oldid = z.coerce.number();
export const CasoId = z.string().min(1);
export const Corpus = z.enum(['candidate', 'raw', 'discarded', 'labeled']);
