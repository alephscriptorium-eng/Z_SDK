# Rooms y presets

## `@zeus/rooms`

Cliente Node de rooms Socket.IO sobre el transporte de plataforma
(`socket-server` `/runtime`). Resuelve la URL de room vía
`ZEUS_SCRIPTORIUM_URL` / presets — sin hardcodear host:puerto en el juego.

## `@zeus/presets-sdk`

Columna vertebral operativa:

- Catálogo MCP y presets
- **env / puertos** (`resolveZeusUiPorts`, `resolveZeusMcpPorts`,
  `resolveSpecToolPorts` — docs en `:3230` por defecto)
- Volúmenes y rutas HTTP compartidas
- Helpers de docs (`@zeus/presets-sdk/docs`: Swagger UI, mount de specs)
- `openBrowser` **opt-in**: solo si `ZEUS_OPEN_BROWSER=1`

Paquete hermano en browser: `@zeus/room-client-browser`.

## Handshake externo

Clientes anónimos (Node/Bun/TS) usan `ZEUS_SCRIPTORIUM_URL` + auth
`{ token, room, user }` y emiten eventos del contrato (`intent|state|track|ledger`).
Guía: [Handshake externo](/guide/external-handshake).
