# OpenAPI / Redoc

Las specs REST salen de manifiestos **RouteEntry** vía `@zeus/http-contract`
(`npm run spec:generate:all`). Redoc estático:

```bash
npm run spec:redoc    # → docs/public/api/<slug>.html (gitignored)
```

| Servicio | HTML |
| -------- | ---- |
| Editor UI | [/api/editor-ui.html](/api/editor-ui.html) |
| Player UI (tablero) | [/api/player-ui.html](/api/player-ui.html) |
| Cache Browser | [/api/cache-browser.html](/api/cache-browser.html) |
| Firehose Browser | [/api/firehose-browser.html](/api/firehose-browser.html) |
| MCP HTTP transport | [/api/mcp-http.html](/api/mcp-http.html) |

YAML fuente: `packages/**/spec/openapi.yaml` y
`packages/engine/presets-sdk/spec/mcp-http.openapi.yaml`.
