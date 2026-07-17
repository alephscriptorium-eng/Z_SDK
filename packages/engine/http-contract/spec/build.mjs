import { renderMcpResourceCatalog } from '../src/openapi.mjs';
import { RESOURCE_PAYLOADS } from '../src/mcp-resources/index.mjs';

export function buildMcpResourceCatalog() {
  return renderMcpResourceCatalog(RESOURCE_PAYLOADS);
}
