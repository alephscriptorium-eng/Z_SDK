/**
 * Minimal RTCPeerConnection helper over SignalingService.
 * iceServers always from caller (resolveIceServers) — never hardcoded Google.
 *
 * Modes:
 * - trickle: true (default, WP-U88) — send ICE candidates as they arrive
 * - trickle: false (WP-U90 SSB) — waitForIceComplete; full offer/answer only
 */

/**
 * Resolve RTCPeerConnection constructor (browser global or Node @roamhq/wrtc).
 * @returns {Promise<typeof RTCPeerConnection>}
 */
export async function loadRtcPeerConnection() {
  if (typeof globalThis.RTCPeerConnection === 'function') {
    return globalThis.RTCPeerConnection;
  }
  try {
    const wrtc = await import('@roamhq/wrtc');
    return wrtc.default?.RTCPeerConnection ?? wrtc.RTCPeerConnection;
  } catch (err) {
    throw new Error(
      `RTCPeerConnection unavailable (browser global missing; install @roamhq/wrtc for Node): ${err?.message || err}`
    );
  }
}

/**
 * Wait until ICE gathering completes so SDP embeds all candidates (no trickle).
 * @param {RTCPeerConnection} pc
 * @param {number} [timeoutMs]
 * @returns {Promise<RTCSessionDescriptionInit>}
 */
export function waitForIceComplete(pc, timeoutMs = 15_000) {
  return new Promise((resolve, reject) => {
    if (pc.iceGatheringState === 'complete') {
      resolve(pc.localDescription);
      return;
    }
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`waitForIceComplete timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    const onChange = () => {
      if (pc.iceGatheringState === 'complete') {
        cleanup();
        resolve(pc.localDescription);
      }
    };

    function cleanup() {
      clearTimeout(timer);
      if (typeof pc.removeEventListener === 'function') {
        pc.removeEventListener('icegatheringstatechange', onChange);
      }
      if (pc.onicegatheringstatechange === onChange) {
        pc.onicegatheringstatechange = null;
      }
    }

    if (typeof pc.addEventListener === 'function') {
      pc.addEventListener('icegatheringstatechange', onChange);
    }
    pc.onicegatheringstatechange = onChange;
  });
}

/**
 * Negotiate a DataChannel between local and remote peer.
 *
 * @param {object} opts
 * @param {import('./signaling-service.mjs').SignalingService} opts.signaling
 * @param {string} opts.remotePeerId
 * @param {boolean} opts.polite — false = offerer (creates DataChannel)
 * @param {RTCIceServer[]} [opts.iceServers]
 * @param {string} [opts.label]
 * @param {typeof RTCPeerConnection} [opts.RTCPeerConnection]
 * @param {number} [opts.timeoutMs]
 * @param {boolean} [opts.trickle=true] — false → complete SDP (SSB / gossip)
 * @returns {Promise<{ pc: RTCPeerConnection, channel: RTCDataChannel }>}
 */
export async function negotiateDataChannel(opts) {
  const {
    signaling,
    remotePeerId,
    polite,
    iceServers = [],
    label = 'zeus-data',
    timeoutMs = 20_000,
    trickle = true
  } = opts;

  const RTCPeerConnectionCtor =
    opts.RTCPeerConnection ?? (await loadRtcPeerConnection());

  const pc = new RTCPeerConnectionCtor({ iceServers });
  /** @type {RTCDataChannel|null} */
  let channel = null;
  /** @type {((c: RTCDataChannel) => void)|null} */
  let resolveChannel = null;
  const channelReady = new Promise((resolve) => {
    resolveChannel = resolve;
  });

  if (trickle) {
    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      signaling.sendIceCandidate(remotePeerId, ev.candidate.toJSON?.() ?? ev.candidate);
    };
  }

  pc.ondatachannel = (ev) => {
    channel = ev.channel;
    resolveChannel?.(channel);
  };

  const onMessage = async (message) => {
    if (message.from !== remotePeerId) return;
    try {
      if (message.type === 'offer' && message.offer) {
        await pc.setRemoteDescription(message.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        const desc = trickle
          ? pc.localDescription
          : await waitForIceComplete(pc, timeoutMs);
        await signaling.sendAnswer(remotePeerId, desc);
      } else if (message.type === 'answer' && message.answer) {
        await pc.setRemoteDescription(message.answer);
      } else if (trickle && message.type === 'ice-candidate' && message.candidate) {
        await pc.addIceCandidate(message.candidate);
      }
    } catch (err) {
      signaling.handleError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };
  signaling.on('message', onMessage);

  try {
    if (!polite) {
      channel = pc.createDataChannel(label, { ordered: true });
      resolveChannel?.(channel);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const desc = trickle
        ? pc.localDescription
        : await waitForIceComplete(pc, timeoutMs);
      await signaling.sendOffer(remotePeerId, desc);
    }

    const openChannel = await Promise.race([
      channelReady.then(async (ch) => {
        if (ch.readyState === 'open') return ch;
        await new Promise((resolve, reject) => {
          const t = setTimeout(
            () => reject(new Error(`DataChannel open timeout after ${timeoutMs}ms`)),
            timeoutMs
          );
          ch.addEventListener('open', () => {
            clearTimeout(t);
            resolve();
          });
          ch.addEventListener('error', (e) => {
            clearTimeout(t);
            reject(e?.error || new Error('DataChannel error'));
          });
        });
        return ch;
      }),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`negotiateDataChannel timeout after ${timeoutMs}ms`)),
          timeoutMs
        );
      })
    ]);

    return { pc, channel: openChannel };
  } finally {
    signaling.off('message', onMessage);
  }
}

/**
 * Convenience: negotiate with complete offer/answer (no trickle) — WP-U90 SSB.
 * @param {Parameters<typeof negotiateDataChannel>[0]} opts
 */
export function negotiateDataChannelComplete(opts) {
  return negotiateDataChannel({ ...opts, trickle: false });
}
