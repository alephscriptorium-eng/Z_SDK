import http from 'node:http';
import { SocketServer } from '@alephscript/mcp-core-sdk/server';
import {
  NAMESPACE,
  resolveBridgeUrl,
  resolveConfig,
  serverBaseUrl
} from './config.mjs';
import { createHttpApp } from './http-app.mjs';
import { attachRemoteBridge } from './relay.mjs';
import { closeScriptoriumServer } from './close-server.mjs';

/**
 * @param {object} [options]
 * @param {number} [options.port]
 * @param {string} [options.host]
 * @param {'local'|'remote'} [options.bridge]
 * @param {string} [options.secret]
 */
export async function createScriptoriumServer(options = {}) {
  const { port, host, bridge, secret } = resolveConfig(options);
  const { app, adminUiAvailable } = createHttpApp({
    bridge,
    serverUrl: serverBaseUrl(host, port)
  });

  const httpServer = http.createServer(app);

  /** @type {import('@alephscript/mcp-core-sdk/server').SocketServer} */
  const socketServer = new SocketServer('Scriptorium', httpServer, true, true);
  socketServer.createNamespace(NAMESPACE);
  const localNs = socketServer.io.of(`/${NAMESPACE}`);

  /** @type {import('@alephscript/mcp-core-sdk/client').SocketClient | null} */
  let bridgeClient = null;

  if (bridge === 'remote') {
    bridgeClient = attachRemoteBridge(localNs, {
      bridgeUrl: resolveBridgeUrl(host, port),
      secret
    });
  }

  await new Promise((resolve, reject) => {
    const onError = (err) => {
      httpServer.off('error', onError);
      if (/** @type {NodeJS.ErrnoException} */ (err).code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${port} already in use — a previous socket-server may still be running. ` +
              'Run: npm run stop:services -- "socket-server stopped" socket-server'
          )
        );
        return;
      }
      reject(err);
    };
    httpServer.once('error', onError);
    httpServer.listen(port, host, () => {
      httpServer.off('error', onError);
      resolve();
    });
  });

  const addr = httpServer.address();
  const boundPort = typeof addr === 'object' && addr ? addr.port : port;
  const baseUrl = serverBaseUrl(host, boundPort);

  return {
    httpServer,
    socketServer,
    bridgeClient,
    port: boundPort,
    host,
    url: baseUrl,
    runtimeUrl: `${baseUrl}/${NAMESPACE}`,
    adminUiUrl: `${baseUrl}/admin/`,
    adminUiAvailable,
    close: () => closeScriptoriumServer(httpServer, socketServer, bridgeClient)
  };
}
