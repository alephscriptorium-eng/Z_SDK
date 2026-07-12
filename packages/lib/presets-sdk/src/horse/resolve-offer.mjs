import { applyPresetFilter } from '../presets/filter.mjs';

const PRESET_SYSTEM_PROMPT = 'preset.system';

/**
 * Fail early when flat names collide across servers or capability kinds.
 * @param {Map<string, string>} seen — name → serverName
 * @param {string} name
 * @param {string} serverName
 * @param {string} kind
 */
function assertNoCollision(seen, name, serverName, kind) {
  const prior = seen.get(name);
  if (prior) {
    throw new Error(
      `Preset name collision: "${name}" (${kind} from ${serverName}) ` +
      `collides with ${prior}`
    );
  }
  seen.set(name, `${kind}@${serverName}`);
}

/**
 * @param {object} item — catalog-formatted capability
 * @param {string} serverName
 * @returns {object}
 */
function withServerMeta(item, serverName) {
  return {
    ...item,
    _meta: { ...(item._meta ?? {}), serverName }
  };
}

/**
 * Resolve a curated preset + catalog into a horse.offer() payload.
 *
 * HP-B: flat names with collision-guard; routing via _meta.serverName;
 * preset without prompt is valid; metadata in _meta.preset (no AsyncAPI envelope).
 *
 * @param {object} preset — { id, name, description?, category?, prompt?, items[] }
 * @param {object[]} catalog — ServerRegistry.buildCatalog() entries
 * @returns {{ tools: object[], resources: object[], prompts: object[], templates: object[], _meta: object }}
 */
export function resolvePresetOffer(preset, catalog) {
  if (!preset?.id) {
    throw new Error('resolvePresetOffer: preset.id is required');
  }

  const seen = new Map();
  const tools = [];
  const resources = [];
  const prompts = [];
  const templates = [];

  const catalogByServer = new Map((catalog ?? []).map((entry) => [entry.serverName, entry]));
  const serverNames = [...new Set((preset.items ?? []).map((item) => item.serverName))];

  for (const serverName of serverNames) {
    const entry = catalogByServer.get(serverName);
    if (!entry) continue;

    const filtered = applyPresetFilter(entry, preset);
    if (!filtered) continue;

    for (const tool of filtered.tools ?? []) {
      assertNoCollision(seen, tool.name, serverName, 'tool');
      tools.push(withServerMeta({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters ?? tool.inputSchema ?? { type: 'object' }
      }, serverName));
    }

    for (const resource of filtered.resources ?? []) {
      assertNoCollision(seen, resource.name, serverName, 'resource');
      resources.push(withServerMeta({
        name: resource.name,
        description: resource.description,
        uri: resource.uri,
        mimeType: resource.mimeType ?? 'application/json'
      }, serverName));
    }

    for (const template of filtered.resourceTemplates ?? []) {
      assertNoCollision(seen, template.name, serverName, 'resourceTemplate');
      templates.push(withServerMeta({
        name: template.name,
        description: template.description,
        uriTemplate: template.uriTemplate,
        mimeType: template.mimeType ?? 'application/json'
      }, serverName));
    }

    for (const prompt of filtered.prompts ?? []) {
      assertNoCollision(seen, prompt.name, serverName, 'prompt');
      prompts.push(withServerMeta({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments ?? []
      }, serverName));
    }
  }

  const presetResourceName = `preset-${preset.id}`;
  assertNoCollision(seen, presetResourceName, 'preset', 'resource');
  resources.push({
    name: `preset-${preset.id}`,
    description: preset.description ?? '',
    uri: `preset://${preset.id}`,
    mimeType: 'application/json',
    _meta: { preset: true, presetId: preset.id }
  });

  if (preset.prompt?.trim()) {
    assertNoCollision(seen, PRESET_SYSTEM_PROMPT, 'preset', 'prompt');
    prompts.push({
      name: PRESET_SYSTEM_PROMPT,
      description: `System prompt for preset ${preset.name}`,
      arguments: [],
      _meta: { presetId: preset.id, presetPrompt: preset.prompt }
    });
  }

  return {
    tools,
    resources,
    prompts,
    templates,
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
 * Broadcast a full preset offer (including _meta.preset) over HORSE.
 * Bypasses channels facade trimming of unknown keys.
 *
 * @param {object} client — SocketClient with .room()
 * @param {string} room
 * @param {string} selfId
 * @param {ReturnType<typeof resolvePresetOffer>} resolved
 */
export function broadcastPresetOffer(client, room, selfId, resolved) {
  client.room('HORSE', {
    method: 'offer',
    params: resolved,
    from: selfId,
    to: '*'
  }, room);
  return resolved;
}
