# @zeus/rooms

## 0.1.1

### Patch Changes

- 05d70fd: Peercard en bootstrap del room-bridge MCP (mismo carril identidad puerta):
  `createPlayerRoomBridge` acepta `peerCard` / `requirePeerCard` / `assertPeerCard`
  y reenvía la card en `connectAndJoin` → `CLIENT_REGISTER`.
