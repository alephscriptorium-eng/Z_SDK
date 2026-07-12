/** @typedef {'inbound' | 'outbound'} EventDirection */
/** @typedef {'broadcast' | 'unicast'} EventDelivery */

export const SESSION_NAMESPACE = '/session';
export const PROTOCOL_VERSION = '1.0.0';

/**
 * Authoritative event manifest — source for schemas, server wiring, and AsyncAPI generation.
 * @type {Record<string, { direction: EventDirection, delivery: EventDelivery, description: string, replyEvent?: string, ack?: boolean, debugOnly?: boolean, deprecated?: boolean }>}
 */
export const EVENTS = {
  'domain:deck:load': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Load a preset onto a deck slot and resolve all decks'
  },
  'domain:playhead:set': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Set the historical playhead year and re-resolve decks'
  },
  'registro:select': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Select a registro oldid on deck B and resolve wikitext'
  },
  'micropost:select': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Select a firehose micropost file on deck C'
  },
  'firehose:corpus': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Switch firehose corpus/path on deck C'
  },
  'wikitext:cache': {
    direction: 'inbound',
    delivery: 'unicast',
    description: 'Invoke cache_wikitext tool for an oldid',
    replyEvent: 'wikitext:cache-result',
    ack: true
  },
  'wikitext:poll': {
    direction: 'inbound',
    delivery: 'unicast',
    description: 'Poll wikitext cache status (deprecated — server-side wait preferred)',
    replyEvent: 'wikitext:poll-result',
    deprecated: true
  },
  'sync:toggle': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Toggle deck sync mode'
  },
  'transport:play': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Start transport playback'
  },
  'transport:pause': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Pause transport playback'
  },
  'caso:set': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Set the active ALEPH caso id'
  },
  'selection:cast': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Cast an attributed selection (actor picks a target, e.g. a registro oldid)'
  },
  'game:intent': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Map-engine intent (sit/walk) — master validates via reducer; map reduction deferred until M2'
  },
  'material:pin': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Pin transmedia material to a map node slot'
  },
  'material:unpin': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Remove a pinned material from a map node slot'
  },
  'node:ontology:set': {
    direction: 'inbound',
    delivery: 'broadcast',
    description: 'Merge ontology semantics onto a map node'
  },
  'session:state': {
    direction: 'outbound',
    delivery: 'broadcast',
    description: 'Authoritative session snapshot from XState actor'
  },
  'deck:resolved': {
    direction: 'outbound',
    delivery: 'broadcast',
    description: 'Deck resolution payload after MCP fetch'
  },
  'catalog:servers': {
    direction: 'outbound',
    delivery: 'unicast',
    description: 'MCP server catalog pushed on connect'
  },
  'wikitext:cache-result': {
    direction: 'outbound',
    delivery: 'unicast',
    description: 'Result of wikitext:cache tool invocation'
  },
  'wikitext:poll-result': {
    direction: 'outbound',
    delivery: 'unicast',
    description: 'Result of wikitext cache poll',
    deprecated: true
  },
  'debug:stats': {
    direction: 'outbound',
    delivery: 'broadcast',
    description: 'Debug heartbeat with event counts and resolve timings',
    debugOnly: true
  },
  'debug:resolve-timing': {
    direction: 'outbound',
    delivery: 'broadcast',
    description: 'Per-deck resolve timing in debug mode',
    debugOnly: true
  },
  'session:error': {
    direction: 'outbound',
    delivery: 'unicast',
    description: 'Validation or handler error unicast to the emitting client'
  }
};

export const INBOUND_EVENTS = Object.entries(EVENTS)
  .filter(([, meta]) => meta.direction === 'inbound')
  .map(([name]) => name);

export const OUTBOUND_EVENTS = Object.entries(EVENTS)
  .filter(([, meta]) => meta.direction === 'outbound')
  .map(([name]) => name);
