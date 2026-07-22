---
'@zeus/player-mcp-kit': patch
'@zeus/rooms': patch
---

Peercard en bootstrap del room-bridge MCP (mismo carril identidad puerta):
`createPlayerRoomBridge` acepta `peerCard` / `requirePeerCard` / `assertPeerCard`
y reenvía la card en `connectAndJoin` → `CLIENT_REGISTER`.
