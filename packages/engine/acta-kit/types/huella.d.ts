/**
 * Hash del último evento del barrio en el ledger (input inyectable; pura).
 * Sin Date.now ni random: el caller pasa el evento / blob.
 */
export declare function huellaLedger(evento: unknown): string;
