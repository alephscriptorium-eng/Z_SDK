# `@zeus/webrtc-signaling`

Señalización WebRTC (WP-U88 / WP-U90 / D-17).

## Piezas

| export | rol |
| ------ | --- |
| `SignalingService` | API abstracta (procedencia: `web-rtc-gamify-ui` SignalingService) |
| `SocketRoomSignalingService` | Impl. vía `@zeus/rooms` + trickle ICE (U88) |
| `SsbPrivateSignalingService` | Impl. vía DMs SSB `type: webrtc-signal` / ssb-box (U90) |
| `createInMemorySsbPrivateBus` | Pub mediador in-process (tests / e2e) |
| `createSbotPrivateTransport` | Adaptador duck-typed a `sbot.private.*` |
| `resolveIceServers` | Reexport de `@zeus/presets-sdk/env` |
| `negotiateDataChannel` | Helper DataChannel (`trickle` default true) |
| `negotiateDataChannelComplete` | Offer+answer completos, sin trickle (SSB) |

## Señalización por rooms (U88)

Wire events: `webrtc-offer` | `webrtc-answer` | `webrtc-ice-candidate` |
`join-room` | `leave-room`.

## Señalización por pub SSB (U90)

Mensajes privados cifrados (`recps` / ssb-box). El pub OASIS retransmite
ciphertext entre feedIds — **no** hay servidor de señalización dedicado ni
copy-paste de SDP.

```js
import {
  createInMemorySsbPrivateBus,
  SsbPrivateSignalingService,
  negotiateDataChannelComplete,
  resolveIceServers
} from '@zeus/webrtc-signaling';

const bus = createInMemorySsbPrivateBus();
const alice = new SsbPrivateSignalingService({
  transport: bus.createTransport('@alice.ed25519')
});
const bob = new SsbPrivateSignalingService({
  transport: bus.createTransport('@bob.ed25519')
});
await alice.connect('@alice.ed25519');
await bob.connect('@bob.ed25519');
// negotiateDataChannelComplete({ signaling: alice, remotePeerId: '@bob.ed25519', … })
```

Con sbot real: `createSbotPrivateTransport(sbot)`.

Adaptación del módulo Oasis `/webrtc` (sin copy-paste):
[`@zeus/oasis-webrtc`](../../mesh/oasis-webrtc/). Candidato upstream:
[`docs/UPSTREAM_PR.md`](../../mesh/oasis-webrtc/docs/UPSTREAM_PR.md).

## ICE (sin Google por defecto)

```js
import { resolveIceServers } from '@zeus/webrtc-signaling';

const iceServers = resolveIceServers();
```

Env: `ZEUS_WEBRTC_STUN`, `ZEUS_WEBRTC_TURN_URL` / `ZEUS_WEBRTC_TURN_USER` /
`ZEUS_WEBRTC_TURN_PASS`. Google STUN solo con
`ZEUS_WEBRTC_ALLOW_GOOGLE_STUN=1` (+ WARNING gigante).

## Tests

`npm test -w @zeus/webrtc-signaling`
