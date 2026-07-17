# `@zeus/rooms`

Cliente Node de rooms Socket.IO para el transporte de plataforma
(`socket-server` `/runtime`). Une autoridad, MCP players y demos a una room
sin hardcodear URL: resuelve vía `ZEUS_SCRIPTORIUM_URL` / presets-sdk.

```js
import { createClient, connectAndJoin } from '@zeus/rooms';
```

Browser: `@zeus/room-client-browser`.

## Tests

`npm test -w @zeus/rooms`
