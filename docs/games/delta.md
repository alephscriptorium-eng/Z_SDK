# delta (ARG)

Juego multijugador three.js: el tablero son los volúmenes (firehose +
wikicache) y jugar los hace crecer. Familia `packages/delta/*` en
[`Z_SDK-games-library`](https://github.com/alephscriptorium-eng/Z_SDK-games-library).

| Paquete | Qué es |
| ------- | ------ |
| `arg-domain` | Dominio puro (consume `@zeus/protocol`) |
| `arg-feeds` | Feeds node-only |
| `arg-console` | Portal de vistas (tablero / jugador) |
| `arg-player-mcp` | MCP por actor sobre `@zeus/player-mcp-kit` |
| `arg-demos` | Autoridad (`@zeus/authority-kit`) + launcher |

Desde la library:

```bash
cd ../Z_SDK-games-library
npm run demo:arg
```

Wire del juego: `arg:state` / `arg:intent` / … (capa sobre el contrato único).
Playbook: `packages/delta/spec/CASOS.md`. Dosier: `packages/delta/README.md`.
