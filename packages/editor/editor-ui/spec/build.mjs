import { buildOpenApiDoc, zeusOpenApiServers, readPackageVersion } from '@zeus/http-contract';
import { EDITOR_ROUTES } from '../src/contract.mjs';

export function buildEditorSpec() {
  return buildOpenApiDoc(EDITOR_ROUTES, {
    title: 'Zeus Editor UI API',
    version: readPackageVersion(import.meta.url),
    description: 'REST API for @zeus/editor-ui world editor (gamemap/release) and cloak/MCP catalog.',
    servers: zeusOpenApiServers('editor')
  });
}
