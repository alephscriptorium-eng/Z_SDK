import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOasisWebrtcApp, resolveOasisWebrtcListen } from '../src/index.mjs';
import { renderWebrtcPage } from '../src/view.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_JS = join(__dirname, '../public/webrtc-app.js');

test('resolveOasisWebrtcListen uses presets-sdk slot (no hardcoded port in call site)', () => {
  const slot = resolveOasisWebrtcListen({
    ZEUS_PORT_OASIS_WEBRTC: '13022',
    ZEUS_HOST: '127.0.0.1'
  });
  assert.equal(slot.port, 13022);
  assert.equal(slot.host, '127.0.0.1');
  assert.equal(slot.path, '/webrtc');
});

test('adapted page and client demolish copy-paste symbols', () => {
  const html = renderWebrtcPage();
  assert.equal(html.includes('offer-code'), false);
  assert.equal(html.includes('answer-code'), false);
  assert.equal(html.includes('answer-input'), false);
  assert.equal(html.includes('remote-offer-input'), false);
  assert.equal(html.includes('btn-copy-offer'), false);
  assert.equal(html.includes('peer-feed'), true);

  const js = readFileSync(PUBLIC_JS, 'utf8');
  assert.equal(/function encode\(/.test(js), false);
  assert.equal(/btoa\(/.test(js), false);
  assert.equal(/offer-code/.test(js), false);
  assert.equal(js.includes('/api/webrtc/signal'), true);
  assert.equal(/stun\.l\.google/.test(js), false);
});

test('HTTP API publishes webrtc-signal DM and delivers to peer inbox', async () => {
  const oasis = createOasisWebrtcApp({
    env: {
      ZEUS_HOST: '127.0.0.1'
    },
    resolveIce: () => []
  });

  const { server, url } = await oasis.listen({ host: '127.0.0.1', port: 0 });
  const base = url;

  try {
    const who = await fetch(`${base}/api/webrtc/whoami?feedId=@alice.ed25519`, {
      headers: { 'X-SSB-Feed': '@alice.ed25519' }
    }).then((r) => r.json());
    assert.equal(who.feedId, '@alice.ed25519');

    await fetch(`${base}/api/webrtc/whoami?feedId=@bob.ed25519`, {
      headers: { 'X-SSB-Feed': '@bob.ed25519' }
    });

    const pub = await fetch(`${base}/api/webrtc/signal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SSB-Feed': '@alice.ed25519'
      },
      body: JSON.stringify({
        feedId: '@alice.ed25519',
        to: '@bob.ed25519',
        signal: 'offer',
        offer: { type: 'offer', sdp: 'v=0-test' }
      })
    }).then((r) => r.json());
    assert.equal(pub.ok, true);

    const inbox = await fetch(
      `${base}/api/webrtc/inbox?feedId=@bob.ed25519&since=0`,
      { headers: { 'X-SSB-Feed': '@bob.ed25519' } }
    ).then((r) => r.json());

    assert.ok(inbox.messages.length >= 1);
    const last = inbox.messages[inbox.messages.length - 1];
    assert.equal(last.content.type, 'webrtc-signal');
    assert.equal(last.content.signal, 'offer');
    assert.equal(last.content.offer.sdp, 'v=0-test');

    const page = await fetch(`${base}/webrtc`).then((r) => r.text());
    assert.equal(page.includes('No copy-paste SDP'), true);
    assert.equal(page.includes('offer-code'), false);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
