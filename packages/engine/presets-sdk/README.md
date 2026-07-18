# `@zeus/presets-sdk`

Columna vertebral operativa del monorepo:

- Catálogo MCP y presets
- **env / puertos** (`resolveZeusUiPorts`, `resolveZeusMcpPorts`,
  `resolveSpecToolPorts`, stop-targets)
- Volúmenes y rutas HTTP compartidas
- Helpers de docs (`@zeus/presets-sdk/docs`)
- Horse / discovery

```js
import {
  resolveZeusUiPorts,
  resolveZeusMcpPorts,
  resolveSpecToolPorts,
  openBrowser
} from '@zeus/presets-sdk/env';

const { docs } = resolveSpecToolPorts(); // default 3230
openBrowser(`http://127.0.0.1:${docs}/`); // solo si ZEUS_OPEN_BROWSER=1

const mcp = resolveZeusMcpPorts();
// juegos library: mcp.pozoPlayer.uno (4131) · mcp.solvePlayer.uno (4132)
const ui = resolveZeusUiPorts();
// ui.pozoView.port (3025) · ui.solveView.port (3026)
```

Overrides: `ZEUS_MCP_POZO`, `ZEUS_MCP_SOLVE`, `ZEUS_PORT_POZO_VIEW`,
`ZEUS_PORT_SOLVE_VIEW` (y el resto de `ZEUS_MCP_*` / `ZEUS_PORT_*` del
catálogo). Los defaults de puerto de juegos viven **aquí**, no en el
código del juego.

## Specs

```bash
npm run spec:generate -w @zeus/presets-sdk
```

## Tests

`npm test -w @zeus/presets-sdk`
