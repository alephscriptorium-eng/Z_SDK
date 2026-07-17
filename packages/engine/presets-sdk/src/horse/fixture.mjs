/**
 * Minimal preset + catalog fixture for horse-preset e2e (ping-pong peer-a).
 * Full ALEPH seeds live in zeus-sdk/data/seeds/aleph-presets.json (Tablero e2e).
 */

export const horsePresetFixture = {
  preset: {
    id: 'fixture-observer',
    name: 'fixture-observer',
    description: 'Ping-pong horse preset fixture',
    category: 'fixture',
    prompt: 'You are a fixture peer with curated tools only.',
    items: [
      { serverName: 'alpha-mcp', type: 'tool', name: 'echo' },
      { serverName: 'alpha-mcp', type: 'tool', name: 'get_status' }
    ]
  },
  catalog: [
    {
      serverName: 'alpha-mcp',
      serverInfo: { name: 'Alpha MCP' },
      isConnected: true,
      tools: [
        { name: 'echo', description: 'Echo text', parameters: { type: 'object' }, type: 'tool' },
        { name: 'get_status', description: 'Status', parameters: { type: 'object' }, type: 'tool' },
        { name: 'secret_tool', description: 'Not in preset', parameters: {}, type: 'tool' }
      ],
      resources: [],
      resourceTemplates: [],
      prompts: []
    },
    {
      serverName: 'beta-mcp',
      serverInfo: { name: 'Beta MCP' },
      isConnected: true,
      tools: [
        { name: 'ignored_tool', description: 'Filtered out', parameters: {}, type: 'tool' }
      ],
      resources: [],
      resourceTemplates: [],
      prompts: []
    }
  ],
  upstream: {
    async callTool(serverName, name, args = {}) {
      if (serverName === 'alpha-mcp' && name === 'echo') {
        return { content: [{ type: 'text', text: String(args.text ?? 'ok') }] };
      }
      if (serverName === 'alpha-mcp' && name === 'get_status') {
        return { content: [{ type: 'text', text: 'fixture-ok' }] };
      }
      throw new Error(`Unexpected tool ${serverName}.${name}`);
    }
  }
};
