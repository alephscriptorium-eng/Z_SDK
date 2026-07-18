/**
 * Oasis WebRTC client — SSB private signaling (WP-U90).
 *
 * Adaptation of plan/recursos/simple-ssb-webrtc webrtc-app.js @ 7d5c757.
 * Demolition: NO copy-paste textareas, NO base64 offer/answer exchange,
 * NO hardcoded Google STUN. ICE from /api/webrtc/ice (presets-sdk/env).
 * Signaling: POST /api/webrtc/signal + poll /api/webrtc/inbox (pub mediator).
 */
(function () {
  'use strict';

  let pc = null;
  let dc = null;
  let dcRemote = null;
  let localStream = null;
  let callMode = 'data';
  let localFeed = '';
  let peerFeed = '';
  let inboxSince = 0;
  let pollTimer = null;
  let iceServers = [];

  function $(id) {
    return document.getElementById(id);
  }

  function show(id) {
    var el = $(id);
    if (el) el.classList.remove('webrtc-hidden');
  }

  function hide(id) {
    var el = $(id);
    if (el) el.classList.add('webrtc-hidden');
  }

  function appendChat(who, text) {
    var container = $('chat-messages');
    if (!container) return;
    var msg = document.createElement('div');
    msg.className = 'webrtc-chat-msg';
    var lbl = document.createElement('span');
    lbl.className = who === 'You' ? 'webrtc-chat-you' : 'webrtc-chat-peer';
    lbl.textContent = who + ': ';
    msg.appendChild(lbl);
    msg.appendChild(document.createTextNode(text));
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  function updateStatus(connState, dcState) {
    var cs = $('conn-status');
    var ds = $('dc-status');
    if (cs) cs.textContent = connState || pc?.connectionState || '…';
    if (ds) ds.textContent = dcState || dc?.readyState || dcRemote?.readyState || '…';
  }

  function setIdentityStatus(text) {
    var el = $('identity-status');
    if (el) el.textContent = text;
  }

  function headers() {
    return {
      'Content-Type': 'application/json',
      'X-SSB-Feed': localFeed
    };
  }

  async function api(path, opts) {
    var res = await fetch(path, opts);
    var body = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) throw new Error(body.error || res.statusText || 'request failed');
    return body;
  }

  function setupDataChannel(channel) {
    channel.onopen = function () {
      updateStatus('connected', 'open');
      show('step-chat');
      show('step-disconnect');
      appendChat('System', 'DataChannel open — you can chat now.');
    };
    channel.onclose = function () {
      updateStatus('disconnected', 'closed');
      appendChat('System', 'DataChannel closed.');
    };
    channel.onmessage = function (e) {
      appendChat('Peer', e.data);
    };
  }

  function waitForIceComplete(peer) {
    return new Promise(function (resolve, reject) {
      if (peer.iceGatheringState === 'complete') {
        resolve(peer.localDescription);
        return;
      }
      var timer = setTimeout(function () {
        reject(new Error('ICE gathering timeout'));
      }, 15000);
      peer.onicegatheringstatechange = function () {
        if (peer.iceGatheringState === 'complete') {
          clearTimeout(timer);
          resolve(peer.localDescription);
        }
      };
    });
  }

  function createPeerConnection() {
    pc = new RTCPeerConnection({ iceServers: iceServers });
    pc.oniceconnectionstatechange = function () {
      updateStatus(pc.iceConnectionState);
    };
    pc.onconnectionstatechange = function () {
      updateStatus(pc.connectionState);
    };
    pc.ondatachannel = function (e) {
      dcRemote = e.channel;
      setupDataChannel(dcRemote);
    };
    pc.ontrack = function (e) {
      var remoteVideo = $('remote-video');
      if (remoteVideo && e.streams && e.streams[0]) {
        remoteVideo.srcObject = e.streams[0];
      }
    };
    return pc;
  }

  async function acquireMedia() {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      var localVideo = $('local-video');
      if (localVideo) localVideo.srcObject = localStream;
      return localStream;
    } catch (err) {
      appendChat('System', 'Camera/mic error: ' + err.message);
      return null;
    }
  }

  function addMediaTracks() {
    if (!localStream || !pc) return;
    localStream.getTracks().forEach(function (track) {
      pc.addTrack(track, localStream);
    });
  }

  function stopMedia() {
    if (localStream) {
      localStream.getTracks().forEach(function (t) {
        t.stop();
      });
      localStream = null;
    }
    var lv = $('local-video');
    var rv = $('remote-video');
    if (lv) lv.srcObject = null;
    if (rv) rv.srcObject = null;
  }

  async function publishSignal(signal, payload) {
    return api('/api/webrtc/signal', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(
        Object.assign(
          {
            feedId: localFeed,
            to: peerFeed,
            signal: signal
          },
          payload || {}
        )
      )
    });
  }

  async function handleRemoteSignal(content) {
    if (!content || content.from === localFeed) return;
    if (content.to && content.to !== localFeed) return;

    if (content.signal === 'offer' && content.offer) {
      callMode = $('call-mode') ? $('call-mode').value : 'data';
      createPeerConnection();
      await pc.setRemoteDescription(content.offer);
      if (callMode === 'av') {
        var stream = await acquireMedia();
        if (stream) {
          addMediaTracks();
          show('step-media');
        }
      }
      var answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      var fullAnswer = await waitForIceComplete(pc);
      await publishSignal('answer', { answer: fullAnswer });
      show('step-connected');
      updateStatus('connecting…');
    } else if (content.signal === 'answer' && content.answer && pc) {
      await pc.setRemoteDescription(content.answer);
      updateStatus('connecting…');
    }
  }

  async function pollInbox() {
    if (!localFeed) return;
    try {
      var data = await api(
        '/api/webrtc/inbox?feedId=' +
          encodeURIComponent(localFeed) +
          '&since=' +
          inboxSince,
        { headers: headers() }
      );
      inboxSince = data.nextSince;
      var msgs = data.messages || [];
      for (var i = 0; i < msgs.length; i++) {
        await handleRemoteSignal(msgs[i].content);
      }
    } catch (err) {
      appendChat('System', 'inbox poll: ' + err.message);
    }
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(pollInbox, 500);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  var webrtcApp = {
    register: async function () {
      localFeed = ($('local-feed').value || '').trim();
      peerFeed = ($('peer-feed').value || '').trim();
      if (!localFeed || !peerFeed) {
        setIdentityStatus('Both feedIds are required');
        return;
      }
      try {
        var ice = await api('/api/webrtc/ice');
        iceServers = ice.iceServers || [];
        await api('/api/webrtc/whoami?feedId=' + encodeURIComponent(localFeed), {
          headers: headers()
        });
        inboxSince = 0;
        startPolling();
        setIdentityStatus('Registered as ' + localFeed + ' → peer ' + peerFeed);
        show('step-call');
        show('step-connected');
        updateStatus('idle', '—');
      } catch (err) {
        setIdentityStatus('Error: ' + err.message);
      }
    },

    offer: async function () {
      if (!localFeed || !peerFeed) return;
      callMode = $('call-mode') ? $('call-mode').value : 'data';
      createPeerConnection();
      dc = pc.createDataChannel('oasis-webrtc', { ordered: true });
      setupDataChannel(dc);
      if (callMode === 'av') {
        var stream = await acquireMedia();
        if (stream) {
          addMediaTracks();
          show('step-media');
        }
      }
      var offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      var fullOffer = await waitForIceComplete(pc);
      await publishSignal('offer', { offer: fullOffer });
      show('step-connected');
      updateStatus('waiting for answer…', 'pending');
      appendChat('System', 'Complete offer published as private webrtc-signal DM.');
    },

    listen: function () {
      updateStatus('listening for offer…');
      appendChat('System', 'Polling pub inbox for private offer from peer.');
      pollInbox();
    },

    sendMessage: function (e) {
      e.preventDefault();
      var input = $('chat-input');
      var text = input.value.trim();
      if (!text) return;
      var channel = dc || dcRemote;
      if (!channel || channel.readyState !== 'open') {
        appendChat('System', 'DataChannel not open yet.');
        return;
      }
      channel.send(text);
      appendChat('You', text);
      input.value = '';
    },

    disconnect: function () {
      stopPolling();
      if (dc) {
        try {
          dc.close();
        } catch (_) {}
      }
      if (dcRemote) {
        try {
          dcRemote.close();
        } catch (_) {}
      }
      if (pc) {
        try {
          pc.close();
        } catch (_) {}
      }
      stopMedia();
      pc = null;
      dc = null;
      dcRemote = null;
      callMode = 'data';
      hide('step-call');
      hide('step-connected');
      hide('step-chat');
      hide('step-disconnect');
      hide('step-media');
      if ($('chat-messages')) $('chat-messages').innerHTML = '';
      setIdentityStatus('Disconnected — register again to call');
      updateStatus('disconnected', 'closed');
    }
  };

  window.webrtcApp = webrtcApp;

  document.addEventListener('DOMContentLoaded', function () {
    $('btn-register').addEventListener('click', webrtcApp.register);
    $('btn-offer').addEventListener('click', webrtcApp.offer);
    $('btn-listen').addEventListener('click', webrtcApp.listen);
    $('btn-disconnect').addEventListener('click', webrtcApp.disconnect);
    $('chat-form').addEventListener('submit', webrtcApp.sendMessage);
  });
})();
