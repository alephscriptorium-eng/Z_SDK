/**
 * @param {import('http').Server} httpServer
 * @param {import('@alephscript/mcp-core-sdk/server').SocketServer} socketServer
 * @param {import('@alephscript/mcp-core-sdk/client').SocketClient | null} bridgeClient
 */
export async function closeScriptoriumServer(httpServer, socketServer, bridgeClient) {
  bridgeClient?.io?.removeAllListeners();
  bridgeClient?.io?.disconnect();
  bridgeClient?.io?.close();

  const io = socketServer?.io;
  if (io) {
    io.disconnectSockets(true);
    await new Promise((resolve) => io.close(() => resolve()));
    return;
  }

  if (!httpServer.listening) return;

  httpServer.closeAllConnections?.();
  await new Promise((resolve, reject) => {
    httpServer.close((err) => {
      if (err?.code === 'ERR_SERVER_NOT_RUNNING') resolve();
      else if (err) reject(err);
      else resolve();
    });
  });
}
