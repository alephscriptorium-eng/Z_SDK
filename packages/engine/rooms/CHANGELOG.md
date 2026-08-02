# @zeus/rooms

## No publicado

### Minor Changes

- WP-U196: las zonas dejan de ser un filtro opaco y pasan a ser **ámbito**.
  `connectAndJoin({ zones })` emite un `CLIENT_SUSCRIBE` por canal
  `room::z:<zona>` en vez de uno solo con `zones` dentro; `emitRoomEvent`,
  `setState` y `makeMaster` aceptan `zone` y dirigen al canal. Nuevos
  exports: `ZONE_SCOPE_SEPARATOR`, `zoneChannel`, `normalizeZones`,
  `resolveZoneChannels`.

  **Rupturas** (ninguna con consumidor vivo en el repo, verificado por grep):
  - el retorno de `connectAndJoin` pasa de `zones: string|string[]|null` a
    `zones: string[]` (`[]` = sin zona) y añade `channels: string[]`;
  - el sobre de `CLIENT_SUSCRIBE` con zonas pasa de `{ room, zones }` a
    `{ room: canal, zone }`, uno por zona;
  - `zones: '*'` ahora **lanza**: en rooms no hay comodín.

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
