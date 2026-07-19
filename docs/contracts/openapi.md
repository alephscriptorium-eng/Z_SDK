# OpenAPI / Redoc

Las specs REST salen de manifiestos **RouteEntry** vía `@zeus/http-contract`
(`npm run spec:generate:all`). Redoc estático:

```bash
npm run spec:redoc    # → docs/public/api/<slug>.html (gitignored)
```

| Servicio | HTML |
| -------- | ---- |
| Editor UI | <a href="/api/editor-ui.html" target="_blank" rel="noreferrer">/api/editor-ui.html</a> |
| Player UI (tablero) | <a href="/api/player-ui.html" target="_blank" rel="noreferrer">/api/player-ui.html</a> |
| Cache Browser | <a href="/api/cache-browser.html" target="_blank" rel="noreferrer">/api/cache-browser.html</a> |
| Firehose Browser | <a href="/api/firehose-browser.html" target="_blank" rel="noreferrer">/api/firehose-browser.html</a> |
| MCP HTTP transport | <a href="/api/mcp-http.html" target="_blank" rel="noreferrer">/api/mcp-http.html</a> |

YAML fuente: `packages/**/spec/openapi.yaml` y
`packages/engine/presets-sdk/spec/mcp-http.openapi.yaml`.
