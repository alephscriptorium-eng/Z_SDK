/**
 * Human-approval gate lines for MCP mutation prompts (human-in-the-loop).
 * Token value: ZEUS_MCP_APPROVAL_TOKEN in root .env (see resolveMcpApprovalToken).
 */

import { resolveMcpApprovalToken } from '../env/index.mjs';

/**
 * @param {string | string[]} tools Tool name(s) that must not run before approval.
 */
export function mcpApprovalGateLine(tools) {
  const token = resolveMcpApprovalToken();
  const list = Array.isArray(tools) ? tools.join(', ') : tools;
  return `No llames a ${list} hasta recibir el token exacto \`${token}\` del usuario (sin variantes ni paráfrasis).`;
}
