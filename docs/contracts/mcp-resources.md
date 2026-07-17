# Resources MCP

Toda capacidad REST se proyecta como resource / resource-template MCP desde
la misma **RouteEntry** (ola 4 / WP-U40).

## Proyección automática (`projectRoutesToMcp`)

```js
import { projectRoutesToMcp, bindProjectedHttpReaders } from '@zeus/http-contract';

const { resources, templates } = projectRoutesToMcp(routes);
// GET sin {params} → resource
// GET con {params} en URI → resource-template
// POST/PUT/… → omitidos (tools MCP son otro camino)
```

- Si la ruta declara `xMcpResource`, esa URI gana.
- Si no, se deriva `rest://{openapi-path}`.
- `bindProjectedHttpReaders` cablea lectores HTTP al servidor MCP.
- OpenAPI documenta `x-mcp-resource` al regenerar specs.

Ejemplo vivo: firehose-browser `corpora.get` →
`firehose://corpus/{corpusId}` (e2e en `@zeus/firehose-browser`).

## Catálogo de payloads curados

Además de la proyección por ruta, `@zeus/http-contract/mcp-resources` mantiene
schemas de payloads conocidos (linea / firehose / solar / server card).
Catálogo generado: `packages/lib/http-contract/spec/mcp-resources.md`.

```bash
npm run spec:generate -w @zeus/http-contract
```

Ver [http-contract](/engine/http-contract).
