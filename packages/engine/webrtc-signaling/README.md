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

### Hook SSB (extensión explícita — sin implementar aquí)

Punto de enganche futuro (D-20 paso 3; D-21 fila 4/6): el asiento SSB
(credencial de room / grafo de follows del pub Oasis) puede **sustituir o
reforzar** la emisión del peer-card antes del torno LAN. Este paquete solo
valida la card; **cero código SSB nuevo en U93** — ni blobs, ni sidecar, ni
puente `ssb-blobs` WAN. Cuando exista el puente, la señalización seguirá
exigiendo `assertSignalingPeerCard` igual; solo cambia quién firma/emite el
ticket (autoridad de sala hoy → credencial Oasis mañana).

**Portería del carril LAN para blobs (WP-U100 / D-21 fila 4):** el transfer
de blobs por DataChannel debe pasar por el mismo torno
(`assertSignalingPeerCard`). El harness de validación
[`@zeus/blob-sync-harness`](../../mesh/blob-sync-harness/) lo documenta y
ejercita sin reimplementar el gate ni el sidecar WAN.

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
