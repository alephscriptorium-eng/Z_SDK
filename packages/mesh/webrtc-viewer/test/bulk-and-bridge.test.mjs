import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateCacheObject,
  buildBulkCacheEnvelope,
  receiveAndValidateCache
} from '../src/bulk/cache-transfer.mjs';
import {
  WEBRTC_REST_ACTIONS,
  buildWebRtcViewerUrl,
  resolveWebRtcViewerEndpoint
} from '../src/game-bridge.mjs';
import {
  resolveWebRtcRestActionBrowser,
  buildWebRtcViewerUrlFromBase
} from '../src/browser/game-actions.mjs';

test('validateCacheObject accepts cache-sidecar-meta (U80)', () => {
  const object = {
    oldid: 42,
    title: 'demo',
    timestamp: '2026-07-18T00:00:00.000Z',
    user: 'alice',
    bytes: 10
  };
  const result = validateCacheObject(object, 'cache-sidecar-meta');
  assert.equal(result.ok, true);
  assert.equal(result.schemaId, 'cache-sidecar-meta');
});

test('validateCacheObject rejects missing oldid', () => {
  const result = validateCacheObject({ title: 'no-oldid' }, 'cache-sidecar-meta');
  assert.equal(result.ok, false);
  assert.ok(result.errors?.length);
});

test('receiveAndValidateCache round-trip', () => {
  const envelope = buildBulkCacheEnvelope({ oldid: 7, title: 'x' });
  const result = receiveAndValidateCache(envelope);
  assert.equal(result.ok, true);
  assert.equal(result.object.oldid, 7);
});

test('game bridge builds viewer URL from presets ports', () => {
  const prev = process.env.ZEUS_PORT_WEBRTC_VIEWER;
  process.env.ZEUS_PORT_WEBRTC_VIEWER = '19022';
  try {
    const { port, baseUrl } = resolveWebRtcViewerEndpoint(process.env);
    assert.equal(port, 19022);
    assert.match(baseUrl, /19022/);
    const url = buildWebRtcViewerUrl({
      action: 'webrtc-call',
      room: 'R1',
      peerId: 'bob',
      userId: 'alice',
      env: process.env
    });
    assert.match(url, /action=webrtc-call/);
    assert.match(url, /peer=bob/);
  } finally {
    if (prev == null) delete process.env.ZEUS_PORT_WEBRTC_VIEWER;
    else process.env.ZEUS_PORT_WEBRTC_VIEWER = prev;
  }
});

test('browser game-actions resolve rest ids', () => {
  assert.equal(WEBRTC_REST_ACTIONS.length, 3);
  const url = resolveWebRtcRestActionBrowser('webrtc-share', {
    webrtcViewerUrl: 'http://localhost:19022',
    room: 'ARG_DELTA',
    peerId: 'dos',
    userId: 'uno'
  });
  assert.equal(
    url,
    buildWebRtcViewerUrlFromBase('http://localhost:19022', {
      action: 'webrtc-share',
      room: 'ARG_DELTA',
      peerId: 'dos',
      userId: 'uno',
      mode: 'room'
    })
  );
  assert.equal(resolveWebRtcRestActionBrowser('list-presets', {}), null);
});
