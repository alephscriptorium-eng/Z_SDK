/**
 * Starts the two linea MCP servers (linea-espana, linea-wp-historia) in one
 * process. Usable as a CLI (npm start) or programmatically via startAll().
 */

import { resolveZeusMcpPorts, isMainModule, runMcpMain } from '@zeus/presets-sdk';
import { assertVolumesRootBootable } from '@zeus/volumes-ops';
import { createServer } from './linea-server.mjs';
import { loadLineaData } from './loader.mjs';
import { lineaServers } from './lineas.mjs';

function lineaServersWithEnvPorts() {
  const mcp = resolveZeusMcpPorts();
  return {
    espana: { ...lineaServers.espana, port: mcp.lineas.espana },
    wpHistoria: { ...lineaServers.wpHistoria, port: mcp.lineas.wpHistoria }
  };
}

/**
 * Starts both linea servers. Resolves to an array of
 * { name, port, url, close() } handles, in order: espana, wp-historia.
 * If any server fails to start, already-started ones are closed first.
 * @param {string} [basePath]
 */
export async function startAll(basePath) {
  const servers = lineaServersWithEnvPorts();
  // WP-U206 · decisión ⑩. LIMITACIÓN DECLARADA, no la fuerzo: `loader.mjs:28`
  // (`export const DEFAULT_BASE_PATH = resolveLineasBasePath()`) resuelve en
  // TIEMPO DE IMPORT DE MÓDULO, o sea antes que cualquier guarda de arranque.
  // Consecuencia exacta: para un root AUSENTE o no resoluble, esta guarda
  // llega tarde — el import ya habrá lanzado con el error del resolvedor.
  // Lo que sí protege, y es lo que este WP persigue: un root PRESENTE pero
  // CORRUPTO, porque la lectura de datos ocurre aquí abajo, no en el import.
  assertVolumesRootBootable({ service: 'linea-system', volumeIds: ['lineas'] });
  const { lineas } = await loadLineaData(basePath);
  const espanaData = lineas[servers.espana.lineaId];
  if (!espanaData) {
    throw new Error(`Line data not found for "${servers.espana.lineaId}"`);
  }

  const configs = [servers.espana, servers.wpHistoria];
  const handles = [];

  for (const config of configs) {
    try {
      handles.push(await createServer(config, espanaData).start());
    } catch (err) {
      await Promise.allSettled(handles.map((h) => h.close()));
      throw err;
    }
  }

  return handles;
}

if (isMainModule(import.meta.url)) {
  await runMcpMain(startAll);
}
