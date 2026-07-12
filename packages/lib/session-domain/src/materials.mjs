import { DECK_NODE_BINDINGS } from './bindings.mjs';

/**
 * @param {Record<string, object>} decks
 * @param {Map<string, object>} [pins] key `${nodeId}:${slot}`
 */
export function decksToMaterialsByNode(decks = {}, pins = new Map()) {
  /** @type {Record<string, object[]>} */
  const byNode = {};

  for (const [deckId, binding] of Object.entries(DECK_NODE_BINDINGS)) {
    const deck = decks[deckId];
    if (!deck || deck.phase === 'empty') continue;
    const entry = {
      slot: binding.slot,
      phase: deck.phase,
      serverName: deck.serverName ?? undefined,
      presetId: deck.presetId ?? null,
      resolved: deck.resolved ?? undefined
    };
    byNode[binding.nodeId] = byNode[binding.nodeId] ?? [];
    byNode[binding.nodeId].push(entry);
  }

  for (const [key, pin] of pins) {
    const [nodeId, slot] = key.split(':');
    const list = byNode[nodeId] ?? [];
    const idx = list.findIndex((m) => m.slot === slot);
    const entry = {
      slot,
      phase: pin.phase ?? 'cued',
      serverName: pin.serverName,
      presetId: pin.presetId ?? null,
      resolved: pin.resolved
    };
    if (idx >= 0) list[idx] = { ...list[idx], ...entry };
    else list.push(entry);
    byNode[nodeId] = list;
  }

  return byNode;
}
