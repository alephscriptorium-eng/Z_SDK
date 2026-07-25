# `@zeus/http-contract`

Contrato HTTP del SDK: manifiestos **RouteEntry** como fuente de verdad →

- OpenAPI ( generadores / Redoc )
- Middleware Express de validación (zod envelopes)
- Cobertura de rutas montadas
- **Proyección RouteEntry → MCP resource / resource-template** (WP-U40)
- **Proyección RouteEntry de mutación → MCP tool** (WP-U172)

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

- **GET** → resource / resource-template; **mutación** (POST/PUT/PATCH/DELETE)
  → **tool** (`tools[]` en el mismo `projectRoutesToMcp`).
- Sin `xMcpResource`, URI derivada `rest://{openapi-path}`.
- `buildOpenApiDoc` escribe `x-mcp-resource` en la operación.

## Mutaciones → MCP tools (WP-U172)

```js
import { projectRoutesToMcp, bindProjectedHttpMutators } from '@zeus/http-contract';

const { tools } = projectRoutesToMcp(routes); // POST/PUT/… → tool descriptors
const { toolRegistry } = bindProjectedHttpMutators({ tools }, {
  baseUrl,
  gate: (ctx) => /* consumer-injected approval (D-8) */ ({ ok: true }),
  // fetchImpl opcional (default: global fetch)
});

// call() aplica, en orden: gate → validación de envelope (zod) → mutación HTTP.
const res = await toolRegistry[0].call({ params, body, /* +lo que el gate lea */ });
```

- El **gate** lo inyecta el consumidor (`ctx → { ok, error?, rule?, gate? }`);
  sin gate cableado la mutación se rechaza (`http-contract.gate_missing`).
- La **card del gate** viaja en `res.gate` tanto en éxito como en error
  (patrón `linea-editor`: gate en card/errores).
- El **envelope** se valida con el mismo schema zod del `RouteEntry`
  (`request.body` / `request.params`); fallo → `VALIDATION_ERROR` sin tocar red.
- `xMcpTool` en el `RouteEntry` renombra la tool (default: `id`).

## Catálogo de payloads

Subpath `@zeus/http-contract/mcp-resources`: schemas curados
(linea / firehose / solar / server card). Spec generada:

```bash
npm run spec:generate -w @zeus/http-contract
# → spec/mcp-resources.md
```

## Tests

`npm test -w @zeus/http-contract`
