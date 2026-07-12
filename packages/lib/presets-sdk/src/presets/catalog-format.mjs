export function formatTools(tools) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description || 'No description available',
    parameters: tool.inputSchema || {},
    type: 'tool'
  }));
}

export function formatResources(resources) {
  return resources.map((resource) => ({
    name: resource.name,
    description: resource.description || 'No description available',
    uri: resource.uri,
    mimeType: resource.mimeType,
    type: 'resource'
  }));
}

export function formatResourceTemplates(templates) {
  return templates.map((template) => ({
    name: template.name,
    description: template.description || 'No description available',
    uriTemplate: template.uriTemplate,
    mimeType: template.mimeType,
    type: 'resourceTemplate'
  }));
}

export function formatPrompts(prompts) {
  return prompts.map((prompt) => ({
    name: prompt.name,
    description: prompt.description || 'No description available',
    arguments: prompt.arguments || [],
    type: 'prompt'
  }));
}
