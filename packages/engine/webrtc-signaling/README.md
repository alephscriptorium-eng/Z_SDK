# `@zeus/webrtc-signaling`

Señalización WebRTC sobre rooms del socket-server (WP-U88 / D-17).

## Piezas

| export | rol |
| ------ | --- |
| `SignalingService` | API abstracta (procedencia: `web-rtc-gamify-ui` SignalingService) |
| `SocketRoomSignalingService` | Impl. vía `@zeus/rooms` + trickle ICE |
| `resolveIceServers` | Reexport de `@zeus/presets-sdk/env` |
| `negotiateDataChannel` | Helper mínimo DataChannel (sin media UI; eso es U89) |

Wire events (contrato Aleph del repo A): `webrtc-offer` | `webrtc-answer` |
`webrtc-ice-candidate` | `join-room` | `leave-room`.

## ICE (sin Google por defecto)

```js
import { resolveIceServers } from '@zeus/presets-sdk/env';
// or from '@zeus/webrtc-signaling'

const iceServers = resolveIceServers();
```

Env: `ZEUS_WEBRTC_STUN`, `ZEUS_WEBRTC_TURN_URL` / `ZEUS_WEBRTC_TURN_USER` /
`ZEUS_WEBRTC_TURN_PASS`. Google STUN solo con
`ZEUS_WEBRTC_ALLOW_GOOGLE_STUN=1` (+ WARNING gigante). Gate U00: literales
`stun.l.google` fuera de `presets-sdk/env` = rojo.

## Ejemplo

```js
import {
  SocketRoomSignalingService,
  negotiateDataChannel,
  resolveIceServers
} from '@zeus/webrtc-signaling';

const iceServers = resolveIceServers();
const signaling = new SocketRoomSignalingService();
await signaling.connect('alice');
await signaling.joinRoom('demo-room');
// peer B joins the same room; then negotiateDataChannel({…})
```

## Demolición

Este paquete **no** trae `stun.l.google` hardcodeado (a diferencia de los
defaults de A/B en `plan/recursos/`).

Runbook coturn: [`docs/mesh/coturn-runbook.md`](../../../docs/mesh/coturn-runbook.md).

## Tests

`npm test -w @zeus/webrtc-signaling`
