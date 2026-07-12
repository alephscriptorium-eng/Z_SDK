import { NAMESPACE, resolveConfig } from './config.mjs';
import { openBrowser } from '@zeus/presets-sdk/env';
import { createScriptoriumServer } from './create-server.mjs';
import { registerShutdown } from './lifecycle.mjs';

export async function startScriptoriumServer(options = {}) {
  const { bridge } = resolveConfig(options);
  const server = await createScriptoriumServer(options);

  console.log(`Scriptorium server on ${server.url}/${NAMESPACE}`);

  if (server.adminUiAvailable) {
    console.log(`Admin UI: ${server.adminUiUrl} (alias /ui/)`);
    openBrowser(server.adminUiUrl);
  } else {
    console.warn('Admin UI static assets unavailable — install @socket.io/admin-ui');
  }

  console.log(`Bridge mode: ${bridge}`);

  registerShutdown(() => server.close());

  return server;
}
