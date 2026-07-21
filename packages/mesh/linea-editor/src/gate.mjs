/**
 * Visible mutation approval gate (eje V).
 * Hides the write layer behind an auditable check — not the gate itself.
 */

import {
  mcpApprovalGateLine,
  resolveMcpApprovalToken
} from '@zeus/presets-sdk';

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
 * Enforce approve flag + exact token before mutation.
 * @param {{
 *   approve?: boolean,
 *   approvalToken?: string,
 *   toolName: string
 * }} opts
 * @returns {{ ok: true, token: string } | { ok: false, error: string, rule: string, gate: object }}
 */
export function requireMutationApproval(opts) {
  const { token, gateLine } = describeApprovalGate(opts.toolName);
  const gate = {
    tool: opts.toolName,
    token_required: true,
    gate_line: gateLine,
    expected_token: token
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

  return { ok: true, token, gate };
}
