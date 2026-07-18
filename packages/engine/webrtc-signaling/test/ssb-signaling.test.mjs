import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SSB_WEBRTC_SIGNAL_TYPE,
  ABSTRACT_TO_SSB_SIGNAL,
  createInMemorySsbPrivateBus,
  createSbotPrivateTransport,
  SsbPrivateSignalingService
} from '../src/index.mjs';

test('SSB signal table maps abstract offer/answer (no trickle by default)', () => {
  assert.equal(SSB_WEBRTC_SIGNAL_TYPE, 'webrtc-signal');
  assert.equal(ABSTRACT_TO_SSB_SIGNAL.offer, 'offer');
  assert.equal(ABSTRACT_TO_SSB_SIGNAL.answer, 'answer');
});

test('InMemorySsbPrivateBus delivers DM only to recps (pub mediator)', async () => {
  const bus = createInMemorySsbPrivateBus();
  const aliceT = bus.createTransport('@alice.ed25519');
  const bobT = bus.createTransport('@bob.ed25519');
  const carolT = bus.createTransport('@carol.ed25519');

  const bobInbox = [];
  const carolInbox = [];
  bobT.subscribePrivate((m) => bobInbox.push(m));
  carolT.subscribePrivate((m) => carolInbox.push(m));

  await aliceT.publishPrivate(
    { type: SSB_WEBRTC_SIGNAL_TYPE, signal: 'offer', from: '@alice.ed25519', to: '@bob.ed25519' },
    ['@bob.ed25519']
  );

  assert.equal(bobInbox.length, 1);
  assert.equal(bobInbox[0].value.content.signal, 'offer');
  assert.deepEqual(bobInbox[0].value.content.recps, ['@bob.ed25519']);
  assert.equal(carolInbox.length, 0);
});

test('SsbPrivateSignalingService exchanges offer without copy-paste or ice trickle', async () => {
  const bus = createInMemorySsbPrivateBus();
  const alice = new SsbPrivateSignalingService({
    transport: bus.createTransport('@alice.ed25519')
  });
  const bob = new SsbPrivateSignalingService({
    transport: bus.createTransport('@bob.ed25519')
  });

  await alice.connect('@alice.ed25519');
  await bob.connect('@bob.ed25519');
  await alice.joinRoom('private');
  await bob.joinRoom('private');

  const seen = [];
  bob.on('message', (m) => seen.push(m));

  const iceSent = [];
  const orig = alice.sendMessage.bind(alice);
  alice.sendMessage = async (message) => {
    if (message.type === 'ice-candidate') iceSent.push(message);
    return orig(message);
  };

  await alice.sendOffer('@bob.ed25519', { type: 'offer', sdp: 'v=0\r\no=- 1 1 IN IP4 0.0.0.0\r\n' });
  // trickle no-op by default
  await alice.sendIceCandidate('@bob.ed25519', { candidate: 'candidate:1' });

  assert.equal(iceSent.length, 0);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].type, 'offer');
  assert.equal(seen[0].from, '@alice.ed25519');
  assert.equal(seen[0].offer.sdp.includes('v=0'), true);

  await bob.sendAnswer('@alice.ed25519', { type: 'answer', sdp: 'v=0-answer' });
  const aliceSeen = [];
  alice.on('message', (m) => aliceSeen.push(m));
  // re-send so listener is bound (answer already published before listener)
  await bob.sendAnswer('@alice.ed25519', { type: 'answer', sdp: 'v=0-answer-2' });
  assert.equal(aliceSeen.length, 1);
  assert.equal(aliceSeen[0].type, 'answer');

  await alice.disconnect();
  await bob.disconnect();
});

test('SsbPrivateSignalingService filters wrong target and self', async () => {
  const bus = createInMemorySsbPrivateBus();
  const alice = new SsbPrivateSignalingService({
    transport: bus.createTransport('@alice.ed25519')
  });
  await alice.connect('@alice.ed25519');

  const seen = [];
  alice.on('message', (m) => seen.push(m));

  // inject via transport as if from bob but addressed to carol
  const bobT = bus.createTransport('@bob.ed25519');
  await bobT.publishPrivate(
    {
      type: SSB_WEBRTC_SIGNAL_TYPE,
      signal: 'offer',
      from: '@bob.ed25519',
      to: '@carol.ed25519',
      offer: { type: 'offer', sdp: 'x' }
    },
    ['@alice.ed25519'] // wrongly delivered — service still filters by content.to
  );
  assert.equal(seen.length, 0);

  await bobT.publishPrivate(
    {
      type: SSB_WEBRTC_SIGNAL_TYPE,
      signal: 'offer',
      from: '@bob.ed25519',
      to: '@alice.ed25519',
      offer: { type: 'offer', sdp: 'ok' }
    },
    ['@alice.ed25519']
  );
  assert.equal(seen.length, 1);
  assert.equal(seen[0].offer.sdp, 'ok');
});

test('createSbotPrivateTransport requires private.publish/read', () => {
  assert.throws(() => createSbotPrivateTransport({}), /private\.publish/);
});

test('createSbotPrivateTransport publishes with recps via duck-typed sbot', async () => {
  const published = [];
  const handlers = [];
  const sbot = {
    id: '@alice.ed25519',
    private: {
      publish(content, recps, cb) {
        published.push({ content, recps });
        cb(null, {
          key: '%1',
          value: { author: '@alice.ed25519', content, timestamp: 1 }
        });
      },
      read() {
        return {
          on(ev, fn) {
            if (ev === 'data') handlers.push(fn);
          },
          off() {},
          destroy() {}
        };
      }
    }
  };
  const t = createSbotPrivateTransport(sbot);
  assert.equal(t.whoami(), '@alice.ed25519');
  await t.publishPrivate({ type: SSB_WEBRTC_SIGNAL_TYPE, signal: 'offer' }, ['@bob.ed25519']);
  assert.equal(published.length, 1);
  assert.deepEqual(published[0].recps, ['@bob.ed25519']);
  assert.equal(published[0].content.type, SSB_WEBRTC_SIGNAL_TYPE);
});
