# Mapa del monorepo

Layout **objetivo** (ARQUITECTURA §2). Hoy el código vive aún en
`packages/lib|app|platform|arg|games|mcp`; el move físico es **WP-U51**.
Este portal documenta el mapa conceptual ya vigente.

```
packages/
  engine/    # SDK genérico, publicable
    protocol/  authority-kit/  player-mcp-kit/  playbook-kit/  view-kit/
    game-engine/  rooms/  presets-sdk/  http-contract/
    ui-kit/  ui-3d-kit/  app-shell/  firehose-core/  test-utils/
  editor/    # mundo A — crear juegos
    editor-ui/
  mesh/      # mundo B — operar y jugar
    socket-server/  player-ui/  operator-ui/  operator-bridge/
    cache-browser/  firehose-browser/  console-monitor/  3d-monitor/
    linea-system/  linea-firehose/  solar-system/
  games/     # hasta ola 6; luego Z_SDK-games-library
    delta/   # hoy packages/arg/*
    pozo/    # packages/games/pozo
examples/    # game-demos, ping-pong-bots — material didáctico
```

## Reglas de dependencia

1. `games/*`, `mesh/*`, `editor/*` importan de `engine/*`. Nunca al revés.
2. Nada importa de `games/*` salvo sus subpaquetes y launchers.
3. Dominio de juego: browser-safe, sin red/fs (feeds node-only en paquete propio).
4. Puertos/URLs solo desde `presets-sdk/env`.

## Correspondencia hoy → objetivo

| Hoy | Objetivo |
| --- | -------- |
| `packages/lib/*` | `engine/` (kits + libs) |
| `packages/app/editor-ui` | `editor/` |
| `packages/app/player-ui`, `packages/platform/*`, `packages/operator-ui` | `mesh/` |
| `packages/arg/*` | `games/delta` |
| `packages/games/pozo` | `games/pozo` |
| `packages/app/game-demos`, `ping-pong-bots` | `examples/` |
