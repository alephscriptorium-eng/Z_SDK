# delta (ARG)

Juego multijugador three.js: el tablero son los volúmenes (firehose +
wikicache) y jugar los hace crecer. Familia `packages/arg/*`.

| Paquete | Qué es |
| ------- | ------ |
| `arg-domain` | Dominio puro (consume `@zeus/protocol`) |
| `arg-feeds` | Feeds node-only |
| `arg-console` | Portal de vistas (tablero / jugador) |
| `arg-player-mcp` | MCP por actor sobre `@zeus/player-mcp-kit` |
| `arg-demos` | Autoridad (`@zeus/authority-kit`) + launcher |

```bash
npm run demo:arg
```

Wire del juego: `arg:state` / `arg:intent` / … (capa sobre el contrato único).
Playbook: `packages/arg/spec/CASOS.md`. Dosier: `packages/arg/README.md`.
