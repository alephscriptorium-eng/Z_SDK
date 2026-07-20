# Mapa del monorepo

Layout canónico ([ARQUITECTURA §2](https://github.com/alephscriptorium-eng/Z_SDK/blob/main/plan/ARQUITECTURA.md)).
Histórico de moves: [estado del swarm](/guide/estado).

```
packages/
  engine/    # SDK genérico, publicable
  editor/    # mundo A — crear juegos
  mesh/      # mundo B — operar y jugar
examples/    # material didáctico
```

Los juegos de referencia viven en el repo hermano
[`Z_SDK-games-library`](https://github.com/alephscriptorium-eng/Z_SDK-games-library).

## Paquetes engine (mínimo)

| Paquete | Rol |
| ------- | --- |
| `@zeus/protocol` | Envelope `state\|intent\|track\|ledger` |
| `@zeus/authority-kit` | Loop de tick + reducer inyectado |
| `@zeus/player-mcp-kit` | Un MCP por actor |
| `@zeus/playbook-kit` | CASOS / acta / runner |
| `@zeus/http-contract` | RouteEntry → OpenAPI + MCP |
| `@zeus/rooms` / `@zeus/presets-sdk` | Rooms Socket.IO + env/puertos |

Fuente viva (lista completa): directorio `packages/engine/*/package.json` en
este monorepo. Detalle por página: [Engine](/engine/).

## Reglas de dependencia

1. `mesh/*`, `editor/*` y los juegos importan de `engine/*`. Nunca al revés.
2. Nada importa un juego salvo sus subpaquetes y launchers.
3. Dominio de juego: browser-safe; feeds node-only en paquete propio.
4. Puertos/URLs solo desde `presets-sdk/env`.
