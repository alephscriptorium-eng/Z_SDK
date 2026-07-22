# `@zeus/webrtc-signaling`

Señalización WebRTC (WP-U88 / WP-U90 / WP-U93 / D-17 / D-20).

## Piezas

| export | rol |
| ------ | --- |
| `SignalingService` | API abstracta (procedencia: `web-rtc-gamify-ui` SignalingService) |
| `SocketRoomSignalingService` | Impl. vía `@zeus/rooms` + trickle ICE (U88) |
| `SsbPrivateSignalingService` | Impl. vía DMs SSB `type: webrtc-signal` / ssb-box (U90) |
| `createInMemorySsbPrivateBus` | Pub mediador in-process (tests / e2e) |
| `createSbotPrivateTransport` | Adaptador duck-typed a `sbot.private.*` |
| `assertSignalingPeerCard` | Torno: forma + frescura + rol (U93) |
| `resolveIceServers` | Reexport de `@zeus/presets-sdk/env` |
| `negotiateDataChannel` | Helper DataChannel (`trickle` default true) |
| `negotiateDataChannelComplete` | Offer+answer completos, sin trickle (SSB) |

## Peer-card (torno WP-U93 / D-20)

La autoridad de sala **emite** el peer-card al join (`issuePeerCard` /
`startAuthority` en `@zeus/authority-kit`). Este paquete **exige** card
válida (`assertSignalingPeerCard`: fresca + con rol) antes de retransmitir
`join-room` / offer / answer / ICE.

```js
import { issuePeerCard } from '@zeus/authority-kit';
import { SocketRoomSignalingService } from '@zeus/webrtc-signaling';

const card = issuePeerCard({
  roomId: 'ROOM',
  endpoint: process.env.ZEUS_SCRIPTORIUM_URL,
  role: 'player',
  sessionId: 'alice'
});
const alice = new SocketRoomSignalingService({ url, room: 'ROOM' });
await alice.connect('alice');
await alice.joinRoom('ROOM', card); // sin card ⇒ rechazo
```

Identidad ad-hoc del handshake (`peerId` / `displayName` sueltos) queda
sustituida por el card (`sessionId` / `displayName` / `scopes` en el ticket).

### Hook SSB (extensión Z_SDK #4)

Punto de enganche D-20 paso 3 (antes documentado sin implementar):

1. **`ssbId`** (`@….ed25519`) en la card y en el handshake de señalización.
   `SsbPrivateSignalingService` exige `ssbId` por defecto; si falta en la
   card al `joinRoom`, se toma del `userId` / whoami cuando es un feed id.
2. **`seatSignature`** — firma ed25519 del payload canónico de la tarjeta
   viajera (`travelingPeerCardPayload` / `signTravelingPeerCard` /
   `verifyTravelingPeerCard`). Presente ⇒ el torno verifica; inválida ⇒
   rechazo. `requireSeatSignature: true` la hace obligatoria.

```js
import {
  generateSeatKeyPair,
  signTravelingPeerCard,
  assertSignalingPeerCard
} from '@zeus/webrtc-signaling';

const keys = generateSeatKeyPair();
const signed = signTravelingPeerCard(card, keys.privateKey, keys.ssbId);
assertSignalingPeerCard(signed, { requireSsbId: true, requireSeatSignature: true });
```

No es ACL ni niveles (Z_SDK #5 / #6). La emisión TTL/campos no-crypto de la
card sigue en `@zeus/authority-kit` (`issuePeerCard`).

**Portería del carril LAN para blobs (WP-U100/U101 / D-21 fila 4):** el
transfer de blobs por DataChannel debe pasar por el mismo torno
(`assertSignalingPeerCard`). El cliente saliente
[`@zeus/blobstore-client`](../../mesh/blobstore-client/) (U101) y el harness
[`@zeus/blob-sync-harness`](../../mesh/blob-sync-harness/) (U100) reusan el
gate; cero torno nuevo. Plano datos WAN = `ssb-blobs` en el pub.

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
import { issuePeerCard } from '@zeus/authority-kit';

const bus = createInMemorySsbPrivateBus();
const alice = new SsbPrivateSignalingService({
  transport: bus.createTransport('@alice.ed25519')
});
const bob = new SsbPrivateSignalingService({
  transport: bus.createTransport('@bob.ed25519')
});
await alice.connect('@alice.ed25519');
await bob.connect('@bob.ed25519');
const cardA = issuePeerCard({
  roomId: 'oasis-private',
  endpoint: 'ssb:oasis',
  role: 'player',
  sessionId: '@alice.ed25519'
});
const cardB = issuePeerCard({
  roomId: 'oasis-private',
  endpoint: 'ssb:oasis',
  role: 'player',
  sessionId: '@bob.ed25519'
});
await alice.joinRoom('oasis-private', cardA);
await bob.joinRoom('oasis-private', cardB);
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
