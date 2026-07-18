/**
 * SSB private-message transport for WebRTC signaling (WP-U90 / D-17).
 *
 * Content type `webrtc-signal` is published as an ssb-box DM (`recps`) so the
 * OASIS pub relays ciphertext between feedIds — no dedicated signaling server.
 *
 * Real pubs inject a duck-typed sbot via `createSbotPrivateTransport`.
 * Tests / e2e use `createInMemorySsbPrivateBus` (in-process pub mediator).
 */

/** SSB content.type for WebRTC signaling DMs. */
export const SSB_WEBRTC_SIGNAL_TYPE = 'webrtc-signal';

/**
 * @typedef {object} SsbPrivateMessage
 * @property {string} key
 * @property {{ author: string, content: object, timestamp: number }} value
 */

/**
 * @typedef {object} SsbPrivateTransport
 * @property {() => string} whoami
 * @property {(content: object, recps: string[]) => Promise<SsbPrivateMessage>} publishPrivate
 * @property {(handler: (msg: SsbPrivateMessage) => void) => () => void} subscribePrivate
 */

/**
 * Wrap a classic sbot (`private.publish` + `private.read`) as SsbPrivateTransport.
 * Duck-typed — no hard dependency on secret-stack in this package.
 *
 * @param {object} sbot
 * @param {object} [opts]
 * @param {string} [opts.feedId] — override whoami when sbot.id is missing
 * @returns {SsbPrivateTransport}
 */
export function createSbotPrivateTransport(sbot, opts = {}) {
  if (!sbot?.private?.publish || !sbot?.private?.read) {
    throw new Error(
      'createSbotPrivateTransport: sbot.private.publish and sbot.private.read are required'
    );
  }

  const feedId =
    opts.feedId ||
    sbot.id ||
    sbot.whoami?.()?.id ||
    (typeof sbot.whoami === 'string' ? sbot.whoami : null);

  if (!feedId) {
    throw new Error('createSbotPrivateTransport: cannot resolve feedId (sbot.id / whoami)');
  }

  return {
    whoami() {
      return feedId;
    },

    publishPrivate(content, recps) {
      const body = { ...content, type: content.type || SSB_WEBRTC_SIGNAL_TYPE, recps };
      return new Promise((resolve, reject) => {
        sbot.private.publish(body, recps, (err, msg) => {
          if (err) reject(err);
          else resolve(msg);
        });
      });
    },

    subscribePrivate(handler) {
      const stream = sbot.private.read({ live: true, old: true });
      let ended = false;
      const onData = (msg) => {
        if (ended || !msg?.value?.content) return;
        if (msg.value.content.type !== SSB_WEBRTC_SIGNAL_TYPE) return;
        handler(msg);
      };

      if (typeof stream?.pipe === 'function' && typeof stream?.source === 'function') {
        // pull-stream source
        const drain = (read) => {
          read(null, function next(end, data) {
            if (ended || end === true) return;
            if (end) return;
            onData(data);
            read(null, next);
          });
        };
        drain(stream.source ? stream : stream);
        return () => {
          ended = true;
          stream.abort?.();
        };
      }

      if (typeof stream?.on === 'function') {
        stream.on('data', onData);
        return () => {
          ended = true;
          stream.off?.('data', onData);
          stream.destroy?.();
        };
      }

      throw new Error(
        'createSbotPrivateTransport: unsupported private.read stream shape (need pull-stream or EventEmitter)'
      );
    }
  };
}

/**
 * In-process pub mediator: private DMs delivered only to `recps` mailboxes.
 * Stands in for OASIS gossip of ssb-box messages in tests and e2e.
 *
 * @returns {{
 *   createTransport: (feedId: string) => SsbPrivateTransport,
 *   feedIds: () => string[]
 * }}
 */
export function createInMemorySsbPrivateBus() {
  /** @type {Map<string, Set<(msg: SsbPrivateMessage) => void>>} */
  const mailboxes = new Map();
  let seq = 0;

  function ensureMailbox(feedId) {
    if (!mailboxes.has(feedId)) mailboxes.set(feedId, new Set());
    return mailboxes.get(feedId);
  }

  return {
    feedIds() {
      return [...mailboxes.keys()];
    },

    /**
     * @param {string} feedId
     * @returns {SsbPrivateTransport}
     */
    createTransport(feedId) {
      ensureMailbox(feedId);
      return {
        whoami() {
          return feedId;
        },

        async publishPrivate(content, recps) {
          if (!Array.isArray(recps) || recps.length === 0) {
            throw new Error('publishPrivate requires non-empty recps (ssb-box recipients)');
          }
          const msg = {
            key: `%webrtc-signal-${++seq}.sha256`,
            value: {
              author: feedId,
              timestamp: Date.now(),
              content: {
                ...content,
                type: content.type || SSB_WEBRTC_SIGNAL_TYPE,
                recps: [...recps]
              }
            }
          };
          for (const recipient of recps) {
            const box = ensureMailbox(recipient);
            for (const handler of box) {
              try {
                handler(msg);
              } catch {
                /* isolate listener faults */
              }
            }
          }
          return msg;
        },

        subscribePrivate(handler) {
          const box = ensureMailbox(feedId);
          box.add(handler);
          return () => box.delete(handler);
        }
      };
    }
  };
}
