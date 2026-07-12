/**
 * Server catalog display helpers for player-ui-debug TUI + MCP.
 */

/**
 * @param {object} server
 */
export function isServerConnected(server) {
  if (server?.isConnected === false) return false;
  if (server?.status === 'disconnected') return false;
  return true;
}

/**
 * @param {object} server
 */
export function serverDisplayName(server) {
  return server?.name || server?.id || server?.serverName || '?';
}

/**
 * @param {object[]} servers
 */
export function sortServersForDisplay(servers = []) {
  return [...servers].sort((a, b) => {
    const aUp = isServerConnected(a) ? 0 : 1;
    const bUp = isServerConnected(b) ? 0 : 1;
    if (aUp !== bUp) return aUp - bUp;
    return serverDisplayName(a).localeCompare(serverDisplayName(b));
  });
}
