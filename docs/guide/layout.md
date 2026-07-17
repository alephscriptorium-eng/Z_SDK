# Mapa del monorepo

Layout canónico (ARQUITECTURA §2; move físico **WP-U51**).

```
packages/
  engine/    # SDK genérico, publicable
    protocol/  authority-kit/  player-mcp-kit/  playbook-kit/  view-kit/
    game-engine/  rooms/  presets-sdk/  http-contract/
    ui-kit/  ui-3d-kit/  app-shell/  firehose-core/  test-utils/  room-client-browser/
  editor/    # mundo A — crear juegos
    editor-ui/
  mesh/      # mundo B — operar y jugar
    socket-server/  player-ui/  player-3d-ui/  operator-ui/  operator-bridge/
    cache-browser/  firehose-browser/  console-monitor/  3d-monitor/
    linea-system/  linea-firehose/  solar-system/
  games/     # hasta ola 6; luego Z_SDK-games-library
    delta/   # domain, feeds, console, player-mcp, demos, spec
    pozo/
examples/    # game-demos, ping-pong-bots — material didáctico
```

## Reglas de dependencia

1. `games/*`, `mesh/*`, `editor/*` importan de `engine/*`. Nunca al revés.
2. Nada importa de `games/*` salvo sus subpaquetes y launchers.
3. Dominio de juego: browser-safe, sin red/fs (feeds node-only en paquete propio).
4. Puertos/URLs solo desde `presets-sdk/env`.
