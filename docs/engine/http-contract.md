# HTTP contract — `@zeus/http-contract`

Fuente de verdad de rutas REST: manifiestos **RouteEntry** →

1. OpenAPI (Redoc / Swagger)
2. Proyección automática a **resource / resource-template MCP** (WP-U40)
3. Middleware Express de validación + cobertura de rutas

```js
import {
  defineRoutes,
  buildOpenApiDoc,
  projectRoutesToMcp,
  bindProjectedHttpReaders
} from '@zeus/http-contract';

const routes = defineRoutes([
  {
    id: 'corpora.get',
    method: 'GET',
    path: '/api/corpora/:corpusId',
    summary: 'Corpus by id',
    xMcpResource: 'firehose://corpus/{corpusId}'
  }
]);

const { resources, templates } = projectRoutesToMcp(routes);
```

- URI MCP: `xMcpResource` si existe; si no, `rest://…` derivado del path OpenAPI.
- Solo GET se proyecta como resource (mutations → tools quedan fuera de esta proyección).
- Catálogo legacy de payloads: `@zeus/http-contract/mcp-resources` /
  `spec/mcp-resources.md` (schemas curados linea/firehose/solar).

Detalle: [Resources MCP](/contracts/mcp-resources) · [OpenAPI](/contracts/openapi).
README: `packages/lib/http-contract/README.md`.
