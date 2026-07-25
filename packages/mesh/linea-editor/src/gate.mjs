/**
 * Visible mutation approval gate.
 *
 * Two faces of ONE gate (no parallel mechanism):
 *   - eje V  · approval token: enforce `approve` + exact `approvalToken`.
 *   - U173   · reparto authorship: when a `reparto` (`@zeus/reparto-kit`
 *     `reparto/1`) is supplied, the acting peer-card (`ssbId`) must be
 *     authorised to author the given `personajeId` — evaluated by
 *     `evaluarPermiso` with `exigirSeat:true` (seat frontier on).
 *
 * The single `gate` object returned carries BOTH faces; error payloads and
 * `editor://info` expose it verbatim. Reparto face is additive: calls without
 * a `reparto` behave exactly as the token-only gate did.
 */

import {
  mcpApprovalGateLine,
  resolveMcpApprovalToken
} from '@zeus/presets-sdk';
import { evaluarPermiso, isRepartoShaped } from '@zeus/reparto-kit';

/** Domain verb required to AUTHOR a personaje (`interpretar` = actuar/autorar). */
export const AUTHORSHIP_PERMISO = 'reparto:interpretar';

/** Human-readable line describing the reparto face of the gate. */
export const REPARTO_GATE_LINE =
  'autoría por reparto: la peer-card (ssbId) debe poder ' +
  `${AUTHORSHIP_PERMISO} el personajeId indicado (asiento exigido)`;

/**
 * @param {string | string[]} toolNames
 * @returns {{ token: string, gateLine: string }}
 */
export function describeApprovalGate(toolNames) {
  const token = resolveMcpApprovalToken();
  return {
    token,
    gateLine: mcpApprovalGateLine(toolNames)
  };
}

/**
 * Reparto authorship face (U173), folded into the SAME gate object.
 * Only meaningful when a reparto is supplied; forces `exigirSeat:true` so a
 * card without seat denies (`seat_ausente`) and a tampered ssbId denies
 * (`seat_invalido`).
 *
 * @param {{
 *   reparto: object,
 *   card?: object,
 *   personajeId?: string,
 *   permiso?: string,
 *   now?: number
 * }} opts
 * @returns {{
 *   face: object,
 *   decision: import('@zeus/reparto-kit').DecisionPermiso | { ok: false, motivo: string, actorSsbId: null }
 * }}
 */
export function evaluateRepartoAuthorship(opts) {
  const permiso = opts.permiso ?? AUTHORSHIP_PERMISO;
  if (!isRepartoShaped(opts.reparto)) {
    const decision = {
      ok: false,
      motivo: 'reparto_no_shaped',
      actorSsbId: null,
      personajeId: opts.personajeId ?? null,
      permiso
    };
    return {
      face: {
        required: true,
        gate_line: REPARTO_GATE_LINE,
        permiso,
        personaje_id: opts.personajeId ?? null,
        exigir_seat: true,
        motivo: decision.motivo,
        actor_ssb_id: null,
        rol: null,
        asiento: null
      },
      decision
    };
  }
  const decision = evaluarPermiso(opts.reparto, opts.card, {
    personajeId: opts.personajeId,
    permiso,
    now: opts.now,
    exigirSeat: true
  });
  const face = {
    required: true,
    gate_line: REPARTO_GATE_LINE,
    permiso,
    personaje_id: opts.personajeId ?? null,
    exigir_seat: true,
    motivo: decision.motivo,
    actor_ssb_id: decision.actorSsbId ?? null,
    rol: decision.rol ?? null,
    asiento: decision.asiento ?? null
  };
  if (decision.seatError) face.seat_error = decision.seatError;
  return { face, decision };
}

/**
 * Enforce the single gate before mutation: approval token (eje V) and, when a
 * reparto is supplied, reparto authorship (U173).
 * @param {{
 *   approve?: boolean,
 *   approvalToken?: string,
 *   toolName: string,
 *   reparto?: object,
 *   card?: object,
 *   personajeId?: string,
 *   permiso?: string,
 *   now?: number
 * }} opts
 * @returns {{ ok: true, token: string, gate: object, decision?: object } | { ok: false, error: string, rule: string, gate: object, decision?: object }}
 */
export function requireMutationApproval(opts) {
  const { token, gateLine } = describeApprovalGate(opts.toolName);
  const gate = {
    tool: opts.toolName,
    token_required: true,
    gate_line: gateLine,
    expected_token: token,
    reparto_required: opts.reparto != null
  };

  if (!opts.approve) {
    return {
      ok: false,
      error: `Mutation refused: approval gate (pass approve: true + approvalToken)`,
      rule: 'linea-editor.approval_required',
      gate
    };
  }

  if (opts.approvalToken !== token) {
    return {
      ok: false,
      error: 'Mutation refused: approval token mismatch',
      rule: 'linea-editor.token_mismatch',
      gate
    };
  }

  // U173 · reparto authorship face (additive; only when a reparto is supplied).
  if (opts.reparto != null) {
    const { face, decision } = evaluateRepartoAuthorship({
      reparto: opts.reparto,
      card: opts.card,
      personajeId: opts.personajeId,
      permiso: opts.permiso,
      now: opts.now
    });
    gate.reparto = face;
    if (!decision.ok) {
      return {
        ok: false,
        error: `Mutation refused: reparto authorship denied (${decision.motivo})`,
        rule: `linea-editor.reparto_${decision.motivo}`,
        gate,
        decision
      };
    }
    return { ok: true, token, gate, decision };
  }

  return { ok: true, token, gate };
}
