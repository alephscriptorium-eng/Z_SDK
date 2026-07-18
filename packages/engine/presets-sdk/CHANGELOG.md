# @zeus/presets-sdk

## 0.1.1

### Patch Changes

- d363de4: WP-U102: resolveStopServicePorts maps webrtc-viewer (stop:services all hermetic in CI).
- e884493: WP-U52: drop residual ARG wording in game-engine metadata; clarify presets-sdk root barrel comment (not a compat shim).
- d4d618e: WP-U84: SSB → VOLUMES — schema `ssb-manifest` + validate DISK_04; presets
  paths/`ZEUS_MCP_SSB` for `@zeus/ssb-system` loader.
- b491a04: WP-U88: resolveIceServers from ZEUS_WEBRTC_* (coturn; Google STUN opt-in + WARNING) and SignalingService over socket-server rooms with trickle ICE.
- 9e47b27: WP-U89: WebRTC viewer mesh — peer-session browser export; webrtcViewer UI port in presets.
- d143022: WP-U90: SsbPrivateSignalingService (ssb-box webrtc-signal DMs via OASIS pub) + oasisWebrtc UI port slot; complete offer/answer without trickle.
- 6131403: WP-U91: force/cota MCP loader — `loadForcesData` in linea-kit, `force://`
  resources via `@zeus/force-system`, forces MCP port + path resolver, http-contract payloads.
- Updated dependencies [6131403]
  - @zeus/http-contract@0.1.1
  - @zeus/ui-kit@0.1.1
