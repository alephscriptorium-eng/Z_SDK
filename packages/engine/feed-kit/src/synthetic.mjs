/**
 * Synthetic feeds for all three families (browser-safe, deterministic).
 */

import { makeFeedItem, withDropletAlias } from './item.mjs';

/** PRNG determinista (mulberry32). */
export function createRng(seed = 1) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STREAM_THEMES = Object.freeze([
  'asamblea',
  'archivo',
  'rumor',
  'acta',
  'brindis',
  'protesta',
  'inventario'
]);

const GOSSIP_THEMES = Object.freeze([
  'tribe',
  'proposal',
  'vote',
  'invite',
  'candidature'
]);

const STATIC_ANCHORS = Object.freeze([1874, 1875, 1876, 1877, 1878]);

/**
 * Stream family synthetic (ATProto / firehose shape).
 * @param {{ seed?: number }} [opts]
 */
export function createSyntheticStreamFeed({ seed = 1 } = {}) {
  const rng = createRng(seed);
  let index = 0;
  const feed = {
    family: /** @type {const} */ ('stream'),
    kind: 'synthetic',
    nextItems(count = 1) {
      const out = [];
      for (let i = 0; i < count; i++) {
        const tema = STREAM_THEMES[Math.floor(rng() * STREAM_THEMES.length)];
        out.push(
          makeFeedItem({
            family: 'stream',
            kind: 'micropost',
            corpus: 'raw',
            index,
            uri: `firehose://synthetic/${seed}/${index}#${tema}`,
            text: tema
          })
        );
        index += 1;
      }
      return out;
    },
    commitLabel(_ref, _label) {
      return Promise.resolve({ ok: true, committed: false, mode: 'synthetic' });
    }
  };
  return withDropletAlias(feed);
}

/**
 * Gossip family synthetic (SSB shape).
 * @param {{ seed?: number }} [opts]
 */
export function createSyntheticGossipFeed({ seed = 1 } = {}) {
  const rng = createRng(seed);
  let index = 0;
  const feed = {
    family: /** @type {const} */ ('gossip'),
    kind: 'synthetic',
    nextItems(count = 1) {
      const out = [];
      for (let i = 0; i < count; i++) {
        const tema = GOSSIP_THEMES[Math.floor(rng() * GOSSIP_THEMES.length)];
        out.push(
          makeFeedItem({
            family: 'gossip',
            kind: 'message',
            corpus: 'tribes',
            index,
            uri: `ssb://synthetic/${seed}/${index}#${tema}`,
            text: tema,
            curation_status: 'raw'
          })
        );
        index += 1;
      }
      return out;
    },
    commitLabel(_ref, _label) {
      return Promise.resolve({ ok: true, committed: false, mode: 'synthetic' });
    }
  };
  return withDropletAlias(feed);
}

/**
 * Static family synthetic (wiki / linea anchors as a slow iterator).
 * @param {{ seed?: number, anchors?: number[] }} [opts]
 */
export function createSyntheticStaticFeed({ seed = 1, anchors = STATIC_ANCHORS } = {}) {
  let cursor = 0;
  const feed = {
    family: /** @type {const} */ ('static'),
    kind: 'synthetic',
    nextItems(count = 1) {
      const out = [];
      for (let i = 0; i < count; i++) {
        const year = anchors[cursor % anchors.length];
        cursor += 1;
        out.push(
          makeFeedItem({
            family: 'static',
            kind: 'nodo',
            index: year,
            uri: `linea://nodo/${year}`,
            text: String(year),
            curation_status: 'canon',
            meta: { seed }
          })
        );
      }
      return out;
    },
    /**
     * @param {object} _anchor
     * @param {string} [_approval]
     */
    materialize(_anchor, _approval) {
      return Promise.resolve({ ok: true, committed: false, mode: 'synthetic' });
    },
    commitLabel(_ref, _label) {
      return Promise.resolve({ ok: true, committed: false, mode: 'synthetic' });
    }
  };
  return withDropletAlias(feed);
}

/**
 * Bag of synthetic feeds for all families.
 * @param {{ seed?: number }} [opts]
 */
export function createSyntheticFeedBag({ seed = 1 } = {}) {
  return {
    mode: 'synthetic',
    families: {
      static: createSyntheticStaticFeed({ seed }),
      stream: createSyntheticStreamFeed({ seed }),
      gossip: createSyntheticGossipFeed({ seed })
    }
  };
}
