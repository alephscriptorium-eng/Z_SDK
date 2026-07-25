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
import { resolveRequireReparto, REQUIRE_REPARTO_ENV } from './config.mjs';

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
 * Enforce the single gate before mutation:
 *   - eje V  · approval token (always).
 *   - U173   · reparto authorship. Whether reparto is MANDATORY is a
 *     **server-side deploy policy** (`resolveRequireReparto`, env
 *     `ZEUS_LINEA_EDITOR_REQUIRE_REPARTO`), NOT a caller choice: when the flag
 *     is on, any gated mutation without a `reparto` is denied
 *     (`reparto_requerido`) before any write. When a reparto IS supplied it is
 *     always evaluated (`exigirSeat:true`). The caller cannot weaken this — the
 *     policy is read from the environment, like the approval token.
 *
 * `gate.reparto_required` mirrors the live server policy; `gate.reparto_supplied`
 * whether this call carried a reparto. Error payloads carry the motivo.
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
  const requireReparto = resolveRequireReparto();
  const gate = {
    tool: opts.toolName,
    token_required: true,
    gate_line: gateLine,
    expected_token: token,
    // Server-side deploy policy (env), NOT caller-controlled:
    reparto_required: requireReparto,
    reparto_policy_env: REQUIRE_REPARTO_ENV,
    reparto_supplied: opts.reparto != null
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

  // U173 · reparto authorship face.
  if (opts.reparto == null) {
    // Server policy may REQUIRE a reparto for every mutation (deployer decides).
    if (requireReparto) {
      const decision = {
        ok: false,
        motivo: 'reparto_requerido',
        actorSsbId: null,
        personajeId: opts.personajeId ?? null
      };
      gate.reparto = {
        required: true,
        supplied: false,
        gate_line: REPARTO_GATE_LINE,
        permiso: opts.permiso ?? AUTHORSHIP_PERMISO,
        motivo: 'reparto_requerido'
      };
      return {
        ok: false,
        error:
          'Mutation refused: server policy requires a reparto ' +
          `(${REQUIRE_REPARTO_ENV}); pass reparto + card + personajeId`,
        rule: 'linea-editor.reparto_requerido',
        gate,
        decision
      };
    }
    // Flag off: token-only path (retro-compatible).
    return { ok: true, token, gate };
  }

  // Reparto supplied → always evaluate authorship (additive to the token face).
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
