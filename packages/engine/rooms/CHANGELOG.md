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
  - `zones: '*'` ahora **lanza**: en rooms no hay comodín;
  - **un nombre de sala que contenga `::z:` ahora lanza**, en las cuatro
    puertas (`connectAndJoin`, `emitRoomEvent`, `setState`, `makeMaster`).
    Sin esto los espacios de nombres no eran disjuntos: `room: 'SALA::z:norte'`
    con `zones` omitido caía en el canal de la zona `norte` sin declararla.
    Ninguna sala del repo usa el separador (grep: cero).

  **Decisiones declaradas, no accidentales**:
  - el id de zona es **sensible a mayúsculas** (`'Norte'` ≠ `'norte'`): plegar
    uniría ámbitos declarados separados, y unir es ensanchar;
  - `zone: ''` **lanza al emitir** aunque `zones: ''` caiga a la sala desnuda
    al suscribir. Asimetría deliberada: al suscribir el blanco da el ámbito
    más pequeño; al emitir mandaría el mensaje a un destino que nadie pidió.

  **Límites que viajan en README y `types/`**: el aislamiento es
  intra-servidor y **no sobrevive al relay**; ámbito **no** es permiso.

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
