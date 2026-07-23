# @zeus/webrtc-signaling

## 0.3.3

### Patch Changes

- 29e42cf: WP-U156: add `"types"` conditions on `./peer-session`, `./messages`, and `./peer-card-gate`.
- 21796ba: WP-U160: rooms/socket-server/webrtc-signaling consumen @zeus/socket-core; se corta la dep @alephscript/mcp-core-sdk en paquetes @zeus.
- Updated dependencies [76e183b]
- Updated dependencies [29e42cf]
- Updated dependencies [21796ba]
  - @zeus/protocol@0.4.1
  - @zeus/presets-sdk@0.1.3
  - @zeus/rooms@0.1.2

## 0.3.2

### Patch Changes

- Updated dependencies [05d70fd]
  - @zeus/rooms@0.1.1

## 0.3.1

### Patch Changes

- Updated dependencies [1df2fd2]
  - @zeus/protocol@0.4.0

## 0.3.0

### Minor Changes

- bd02d70: Z_SDK #4: ssbId on federation handshake + traveling peer-card seat signature (ed25519).

### Patch Changes

- Updated dependencies [bd02d70]
- Updated dependencies [3ebfce3]
  - @zeus/protocol@0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies [6974189]
  - @zeus/presets-sdk@0.1.2

## 0.2.0

### Minor Changes

- b491a04: WP-U88: resolveIceServers from ZEUS_WEBRTC_* (coturn; Google STUN opt-in + WARNING) and SignalingService over socket-server rooms with trickle ICE.
- d143022: WP-U90: SsbPrivateSignalingService (ssb-box webrtc-signal DMs via OASIS pub) + oasisWebrtc UI port slot; complete offer/answer without trickle.
- c09b7ed: WP-U93: authority issues peer-card on join; webrtc-signaling requires a fresh card with role before offer/answer/ICE (D-20 torno).

### Patch Changes

- 9e47b27: WP-U89: WebRTC viewer mesh — peer-session browser export; webrtcViewer UI port in presets.
- Updated dependencies [d363de4]
- Updated dependencies [e884493]
- Updated dependencies [fadb4b5]
- Updated dependencies [d4d618e]
- Updated dependencies [b491a04]
- Updated dependencies [9e47b27]
- Updated dependencies [d143022]
- Updated dependencies [6131403]
- Updated dependencies [5031cec]
- Updated dependencies [4b09212]
- Updated dependencies [c5f3449]
  - @zeus/presets-sdk@0.1.1
  - @zeus/protocol@0.2.0
