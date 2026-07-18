/**
 * Verdict helper for WP-U100 CA → U101 commitment (D-21 fila 5).
 */

/**
 * @param {{
 *   live: { status: string, evidence: string },
 *   fixtureOk: boolean,
 *   lanOk: boolean
 * }} input
 */
export function verdictU101(input) {
  const { live, fixtureOk, lanOk } = input;
  if (!fixtureOk || !lanOk) {
    return {
      verdict: 'no despeja',
      reason: 'fixture o portero LAN falló — contrato de validación roto'
    };
  }
  if (live.status !== 'ready' || live.evidence !== 'live') {
    return {
      verdict: 'no despeja',
      reason:
        'sin evidencia live sync 2-nodos Oasis (ops/sidecar pendiente); ' +
        'fixture+portero OK no bastan para comprometer U101'
    };
  }
  return {
    verdict: 'despeja',
    reason: 'fixture + portero LAN + env live listo para validar contra sidecar'
  };
}
