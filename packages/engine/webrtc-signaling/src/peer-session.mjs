/**
 * Minimal RTCPeerConnection helper with trickle ICE over SignalingService.
 * iceServers always from caller (resolveIceServers) — never hardcoded Google.
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
 * Negotiate a DataChannel between local and remote peer via trickle ICE.
 *
 * @param {object} opts
 * @param {import('./signaling-service.mjs').SignalingService} opts.signaling
 * @param {string} opts.remotePeerId
 * @param {boolean} opts.polite — false = offerer (creates DataChannel)
 * @param {RTCIceServer[]} [opts.iceServers]
 * @param {string} [opts.label]
 * @param {typeof RTCPeerConnection} [opts.RTCPeerConnection]
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<{ pc: RTCPeerConnection, channel: RTCDataChannel }>}
 */
export async function negotiateDataChannel(opts) {
  const {
    signaling,
    remotePeerId,
    polite,
    iceServers = [],
    label = 'zeus-data',
    timeoutMs = 20_000
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

  const onIce = (ev) => {
    if (!ev.candidate) return;
    signaling.sendIceCandidate(remotePeerId, ev.candidate.toJSON?.() ?? ev.candidate);
  };
  pc.onicecandidate = onIce;

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
        await signaling.sendAnswer(remotePeerId, pc.localDescription);
      } else if (message.type === 'answer' && message.answer) {
        await pc.setRemoteDescription(message.answer);
      } else if (message.type === 'ice-candidate' && message.candidate) {
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
      await signaling.sendOffer(remotePeerId, pc.localDescription);
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
