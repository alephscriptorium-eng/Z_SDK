# @zeus/rooms

## 0.1.2

### Patch Changes

- 21796ba: WP-U160: rooms/socket-server/webrtc-signaling consumen @zeus/socket-core; se corta la dep @alephscript/mcp-core-sdk en paquetes @zeus.
- Updated dependencies [3c0a778]
  - @zeus/socket-core@0.2.0

## 0.1.1

### Patch Changes

- 05d70fd: Peercard en bootstrap del room-bridge MCP (mismo carril identidad puerta):
  `createPlayerRoomBridge` acepta `peerCard` / `requirePeerCard` / `assertPeerCard`
  y reenvía la card en `connectAndJoin` → `CLIENT_REGISTER`.
