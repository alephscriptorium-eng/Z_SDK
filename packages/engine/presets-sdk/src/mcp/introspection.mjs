/**
 * Capability counts from the built McpServer (same registration stores as tools/list, etc.).
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function getMcpCapabilities(server) {
  return {
    tools: Object.values(server._registeredTools).filter((tool) => tool.enabled).length,
    resources: Object.values(server._registeredResources).filter((resource) => resource.enabled).length,
    resourceTemplates: Object.keys(server._registeredResourceTemplates).length,
    prompts: Object.values(server._registeredPrompts).filter((prompt) => prompt.enabled).length
  };
}
