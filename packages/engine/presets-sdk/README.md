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
```

## Specs

```bash
npm run spec:generate -w @zeus/presets-sdk
```

## Tests

`npm test -w @zeus/presets-sdk`
