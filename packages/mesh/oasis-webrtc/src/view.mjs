/**
 * Adapted /webrtc page — no copy-paste textareas (demolition of B's flow).
 * Peer is addressed by SSB feedId; signaling goes through /api/webrtc/*.
 */

/**
 * @returns {string} HTML document
 */
export function renderWebrtcPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Oasis WebRTC (SSB signaling)</title>
  <link rel="stylesheet" href="/assets/styles/webrtc.css" />
</head>
<body>
  <main class="webrtc-page">
    <header class="tags-header">
      <h2>WebRTC</h2>
      <p>Peer-to-peer DataChannel via SSB private messages (pub as mediator). No copy-paste SDP.</p>
    </header>

    <section class="card" id="step-identity">
      <h3>① Your SSB identity</h3>
      <label for="local-feed">Local feedId</label>
      <input id="local-feed" class="webrtc-input" type="text" placeholder="@you.ed25519" autocomplete="off" />
      <label for="peer-feed">Peer feedId</label>
      <input id="peer-feed" class="webrtc-input" type="text" placeholder="@peer.ed25519" autocomplete="off" />
      <div class="mode-buttons-row">
        <button type="button" class="filter-btn" id="btn-register">Register on pub</button>
      </div>
      <p class="hint" id="identity-status">Not registered</p>
    </section>

    <section class="card webrtc-hidden" id="step-call">
      <h3>② Call</h3>
      <label for="call-mode">Mode</label>
      <select id="call-mode" class="webrtc-select">
        <option value="data">Data only (chat)</option>
        <option value="av">Audio/Video</option>
      </select>
      <div class="mode-buttons-row">
        <button type="button" class="filter-btn" id="btn-offer">Offer (complete SDP)</button>
        <button type="button" class="filter-btn" id="btn-listen">Listen for offer</button>
      </div>
    </section>

    <section class="card webrtc-hidden" id="step-media">
      <h3>Media</h3>
      <div class="webrtc-video-grid">
        <div class="webrtc-video-box">
          <label>Local</label>
          <video id="local-video" autoplay playsinline muted class="webrtc-video"></video>
        </div>
        <div class="webrtc-video-box">
          <label>Remote</label>
          <video id="remote-video" autoplay playsinline class="webrtc-video"></video>
        </div>
      </div>
    </section>

    <section class="card webrtc-hidden" id="step-connected">
      <h3>Status</h3>
      <div class="card-field">
        <span class="card-label">Connection: </span>
        <span class="card-value" id="conn-status">…</span>
      </div>
      <div class="card-field">
        <span class="card-label">DataChannel: </span>
        <span class="card-value" id="dc-status">…</span>
      </div>
    </section>

    <section class="card webrtc-hidden" id="step-chat">
      <h3>DataChannel chat</h3>
      <div id="chat-messages" class="webrtc-chat-messages"></div>
      <form id="chat-form">
        <div class="webrtc-chat-row">
          <input type="text" id="chat-input" class="webrtc-chat-input" placeholder="Type a message…" autocomplete="off" />
          <button type="submit" class="filter-btn">Send</button>
        </div>
      </form>
    </section>

    <section class="card webrtc-hidden" id="step-disconnect">
      <button type="button" class="filter-btn webrtc-disconnect-btn" id="btn-disconnect">Disconnect</button>
    </section>
  </main>
  <script src="/js/webrtc-app.js"></script>
</body>
</html>`;
}
