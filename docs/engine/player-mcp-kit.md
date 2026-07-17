# Player MCP kit — `@zeus/player-mcp-kit`

Patrón **un MCP por actor** con semántica verificable:

1. Emitir intent → esperar evidencia en `state` / `ledger`
2. Dry-run de rechazos (ventana noop + `explain`)
3. Resources estándar: `<game>://player/state`, `<game>://scene`, `<game>://casos`
4. Health: `connected` + `lastStateTs`

El juego inyecta wire events, `makeIntent`, puerto (`presets-sdk/env`) y
lectores de resources. Parseo de playbook: [`@zeus/playbook-kit`](/engine/playbook-kit).

README: `packages/engine/player-mcp-kit/README.md`.
