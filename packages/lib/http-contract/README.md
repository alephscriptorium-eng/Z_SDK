# `@zeus/http-contract`

Contrato HTTP del SDK: manifiestos **RouteEntry** como fuente de verdad →

- OpenAPI ( generadores / Redoc )
- Middleware Express de validación (zod envelopes)
- Cobertura de rutas montadas
- **Proyección RouteEntry → MCP resource / resource-template** (WP-U40)

## RouteEntry → MCP

```js
import {
  defineRoutes,
  projectRoutesToMcp,
  bindProjectedHttpReaders,
  buildOpenApiDoc
} from '@zeus/http-contract';

const routes = defineRoutes([
  {
    id: 'stats.get',
    method: 'GET',
    path: '/api/stats',
    summary: 'Stats',
    xMcpResource: 'firehose://stats'
  },
  {
    id: 'corpora.get',
    method: 'GET',
    path: '/api/corpora/:corpusId',
    summary: 'Corpus',
    xMcpResource: 'firehose://corpus/{corpusId}'
  }
]);

const { resources, templates } = projectRoutesToMcp(routes);
// resources: stats · templates: corpora (URI con {corpusId})
```

- Solo **GET** se proyecta; mutaciones no se convierten en resources.
- Sin `xMcpResource`, URI derivada `rest://{openapi-path}`.
- `buildOpenApiDoc` escribe `x-mcp-resource` en la operación.

## Catálogo de payloads

Subpath `@zeus/http-contract/mcp-resources`: schemas curados
(linea / firehose / solar / server card). Spec generada:

```bash
npm run spec:generate -w @zeus/http-contract
# → spec/mcp-resources.md
```

## Tests

`npm test -w @zeus/http-contract`
