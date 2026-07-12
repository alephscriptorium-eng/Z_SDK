const JSONRPC = '2.0';
const PRESET_SYSTEM_PROMPT = 'preset.system';

/**
 * @typedef {object} PresetHorseUpstream
 * @property {(serverName: string, name: string, args?: object) => Promise<unknown>} callTool
 * @property {(serverName: string, uri: string) => Promise<unknown>} [readResource]
 * @property {(serverName: string, name: string, args?: object) => Promise<unknown>} [getPrompt]
 */

/**
 * MCP handler scoped to a resolved preset offer. Lists only preset items;
 * proxies calls upstream via _meta.serverName routing.
 */
export class PresetHorseProxy {
  /**
   * @param {object} options
   * @param {ReturnType<import('./resolve-offer.mjs').resolvePresetOffer>} options.offer
   * @param {PresetHorseUpstream} options.upstream
   */
  constructor({ offer, upstream }) {
    this.offer = offer;
    this.upstream = upstream;
    this._unsub = null;
  }

  /**
   * @param {object} msg — JSON-RPC request
   * @returns {Promise<object|null>} JSON-RPC response body (without jsonrpc), or null if not handled
   */
  async handleMessage(msg) {
    if (!msg?.method || msg.id == null) return null;

    const { method, params = {}, id } = msg;

    try {
      switch (method) {
        case 'initialize':
          return {
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {},
                prompts: {}
              },
              serverInfo: { name: 'preset-horse-proxy', version: '0.1.0' }
            }
          };

        case 'notifications/initialized':
          return null;

        case 'tools/list':
          return { id, result: { tools: this.offer.tools } };

        case 'tools/call': {
          const name = params.name;
          const tool = this.offer.tools.find((t) => t.name === name);
          if (!tool) {
            return {
              id,
              error: { code: -32601, message: `Unknown tool: ${name}` }
            };
          }
          const result = await this.upstream.callTool(
            tool._meta.serverName,
            name,
            params.arguments ?? {}
          );
          return { id, result };
        }

        case 'resources/list':
          return { id, result: { resources: this.offer.resources } };

        case 'resources/read': {
          const uri = params.uri;
          const resource = this.offer.resources.find((r) => r.uri === uri);
          if (!resource) {
            return {
              id,
              error: { code: -32601, message: `Unknown resource: ${uri}` }
            };
          }
          if (resource._meta?.preset) {
            return {
              id,
              result: {
                contents: [{
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(this.offer._meta?.preset ?? {}, null, 2)
                }]
              }
            };
          }
          if (!this.upstream.readResource) {
            return {
              id,
              error: { code: -32603, message: 'readResource not configured' }
            };
          }
          const contents = await this.upstream.readResource(resource._meta.serverName, uri);
          return { id, result: contents };
        }

        case 'prompts/list':
          return { id, result: { prompts: this.offer.prompts } };

        case 'prompts/get': {
          const name = params.name;
          const prompt = this.offer.prompts.find((p) => p.name === name);
          if (!prompt) {
            return {
              id,
              error: { code: -32601, message: `Unknown prompt: ${name}` }
            };
          }
          if (name === PRESET_SYSTEM_PROMPT && prompt._meta?.presetPrompt) {
            return {
              id,
              result: {
                description: prompt.description,
                messages: [{ role: 'user', content: { type: 'text', text: prompt._meta.presetPrompt } }]
              }
            };
          }
          if (!this.upstream.getPrompt) {
            return {
              id,
              error: { code: -32603, message: 'getPrompt not configured' }
            };
          }
          const result = await this.upstream.getPrompt(
            prompt._meta.serverName,
            name,
            params.arguments ?? {}
          );
          return { id, result };
        }

        default:
          return {
            id,
            error: { code: -32601, message: `Method not found: ${method}` }
          };
      }
    } catch (error) {
      return {
        id,
        error: { code: -32603, message: error?.message ?? 'Internal error' }
      };
    }
  }

  /**
   * Attach HORSE JSON-RPC handler to a rooms client.
   *
   * @param {object} client — SocketClient with .io and .room()
   * @param {string} room
   * @param {string} selfId
   * @returns {() => void} unsubscribe
   */
  attach(client, room, selfId) {
    const handler = async (raw) => {
      const envelope = raw?.data ?? raw;
      if (envelope?.to && envelope.to !== selfId && envelope.to !== '*') return;

      const msg = envelope?.data ?? envelope;
      if (!msg?.jsonrpc || !msg.method) return;
      if (msg.from === selfId) return;

      const response = await this.handleMessage(msg);
      if (!response) return;

      const { id, result, error } = response;
      client.room('HORSE', {
        jsonrpc: JSONRPC,
        id,
        result,
        error,
        from: selfId,
        to: msg.from ?? envelope.from
      }, room);
    };

    client.io.on('HORSE', handler);
    this._unsub = () => client.io.off('HORSE', handler);
    return this._unsub;
  }

  detach() {
    this._unsub?.();
    this._unsub = null;
  }
}

/**
 * @param {ConstructorParameters<typeof PresetHorseProxy>[0]} options
 * @returns {PresetHorseProxy}
 */
export function createPresetHorseProxy(options) {
  return new PresetHorseProxy(options);
}
