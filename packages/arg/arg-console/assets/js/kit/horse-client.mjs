/**
 * Cliente HORSE del navegador — cache de ofertas + JSON-RPC por room.
 * G-ARG.1: solo red; sin motores de dominio.
 */

const RPC_TIMEOUT_MS = 8000;

/**
 * Resuelve oferta mínima desde preset + catálogo (subset browser-safe).
 * @param {object} preset
 * @param {object[]} catalog
 */
export function resolvePresetOfferBrowser(preset, catalog) {
  const catalogByServer = new Map((catalog ?? []).map((e) => [e.serverName, e]));
  const tools = [];
  const resources = [];
  const prompts = [];

  for (const item of preset.items ?? []) {
    const entry = catalogByServer.get(item.serverName);
    if (!entry) continue;
    if (item.type === 'tool') {
      const tool = (entry.tools ?? []).find((t) => t.name === item.name);
      if (tool) {
        tools.push({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.parameters ?? tool.inputSchema ?? { type: 'object' },
          _meta: { serverName: item.serverName }
        });
      }
    } else if (item.type === 'resource') {
      const resource = (entry.resources ?? []).find((r) => r.name === item.name);
      if (resource) {
        resources.push({
          name: resource.name,
          description: resource.description,
          uri: resource.uri,
          mimeType: resource.mimeType ?? 'application/json',
          _meta: { serverName: item.serverName }
        });
      }
    } else if (item.type === 'prompt') {
      const prompt = (entry.prompts ?? []).find((p) => p.name === item.name);
      if (prompt) {
        prompts.push({
          name: prompt.name,
          description: prompt.description,
          arguments: prompt.arguments ?? [],
          _meta: { serverName: item.serverName }
        });
      }
    }
  }

  resources.push({
    name: `preset-${preset.id}`,
    description: preset.description ?? '',
    uri: `preset://${preset.id}`,
    mimeType: 'application/json',
    _meta: { preset: true, presetId: preset.id }
  });

  if (preset.prompt?.trim()) {
    prompts.push({
      name: 'preset.system',
      description: `System prompt for preset ${preset.name}`,
      arguments: [],
      _meta: { presetId: preset.id, presetPrompt: preset.prompt }
    });
  }

  return {
    tools,
    resources,
    prompts,
    templates: [],
    _meta: {
      preset: {
        id: preset.id,
        name: preset.name,
        category: preset.category ?? '',
        description: preset.description ?? '',
        itemsCount: (preset.items ?? []).length,
        curated: true
      }
    }
  };
}

/**
 * @param {{ emit: Function, onRoomEvent: Function }} room
 * @param {string} selfId identidad HORSE local (p.ej. jugador-uno)
 */
export function createHorseClient(room, selfId) {
  /** @type {Map<string, object>} */
  const offers = new Map();
  /** @type {Map<number, { resolve: Function, reject: Function, timer: ReturnType<typeof setTimeout>, to: string }>} */
  const pending = new Map();
  let nextId = 1;

  function unwrapHorse(raw) {
    return raw?.data ?? raw;
  }

  const offHorse = room.onRoomEvent('HORSE', (raw) => {
    handleHorse(raw);
  });

  const offEnvelope = room.onRoomEvent('ROOM_MESSAGE', (raw) => {
    const entries = Array.isArray(raw) ? raw : [raw];
    for (const entry of entries) {
      if (entry?.event === 'HORSE') handleHorse(entry.data ?? entry);
    }
  });

  function handleHorse(raw) {
    const envelope = unwrapHorse(raw);

    if (envelope?.method === 'offer' && envelope.from) {
      offers.set(envelope.from, envelope.params ?? envelope);
      return;
    }

    const msg = envelope?.data ?? envelope;
    if (!msg || msg.id == null) return;
    const slot = pending.get(msg.id);
    if (!slot) return;
    if (envelope?.from && envelope.from !== slot.to) return;

    clearTimeout(slot.timer);
    pending.delete(msg.id);
    if (msg.error) slot.reject(Object.assign(new Error(msg.error.message ?? 'HORSE error'), { horse: msg.error }));
    else slot.resolve(msg);
  }

  return {
    getOffer(from) {
      return offers.get(from) ?? null;
    },

    cacheOffer(from, params) {
      offers.set(from, params);
    },

    broadcastPresetOffer(resolved) {
      room.emit('HORSE', { method: 'offer', params: resolved, from: selfId, to: '*' });
      offers.set(selfId, resolved);
      return resolved;
    },

    /**
     * @param {string} to peer HORSE id (grifo-a, horse-demo, …)
     * @param {string} method JSON-RPC method
     * @param {object} [params]
     */
    horseRpc(to, method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`HORSE timeout: ${method}`));
        }, RPC_TIMEOUT_MS);
        pending.set(id, { resolve, reject, timer, to });
        room.emit('HORSE', { jsonrpc: '2.0', method, params, id, from: selfId, to });
      });
    },

  async fetchAndBroadcastOffer(presetName) {
      const [presetRes, listRes] = await Promise.all([
        fetch(`/api/mcp/preset/${encodeURIComponent(presetName)}`),
        fetch('/api/mcp/list')
      ]);
      if (!presetRes.ok) throw new Error(`preset ${presetName} no encontrado`);
      const presetBody = await presetRes.json();
      const listBody = listRes.ok ? await listRes.json() : { catalog: [] };
      const resolved = resolvePresetOfferBrowser(presetBody.preset, listBody.catalog ?? []);
      return this.broadcastPresetOffer(resolved);
    },

    dispose() {
      offHorse?.();
      offEnvelope?.();
      for (const slot of pending.values()) clearTimeout(slot.timer);
      pending.clear();
    }
  };
}
