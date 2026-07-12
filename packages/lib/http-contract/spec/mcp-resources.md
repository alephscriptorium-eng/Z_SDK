# MCP Resource Payload Schemas

Generated from `RESOURCE_PAYLOADS` in `@zeus/http-contract/mcp-resources`.

| URI / Template | Schema |
|----------------|--------|
| `body://info` | body://info |
| `body://position/{timestamp}` | body://position/{timestamp} |
| `body://rotation/{timestamp}` | body://rotation/{timestamp} |
| `firehose://corpus/{corpusId}` | firehose://corpus/{corpusId} |
| `firehose://post/{corpusId}/{batch}/{filename}` | firehose://post/{corpusId}/{batch}/{filename} |
| `firehose://stats` | firehose://stats |
| `firehose://triage` | firehose://triage |
| `linea://cache/stats` | linea://cache/stats |
| `linea://info` | linea://info |
| `linea://nodo/{year}` | linea://nodo/{year} |
| `linea://oldid/{year}` | linea://oldid/{year} |
| `linea://parte/{id}` | linea://parte/{id} |
| `linea://registro/{id}` | linea://registro/{id} |
| `linea://registros/nodo/{nodo_id}` | linea://registros/nodo/{nodo_id} |
| `linea://registros/year/{year}` | linea://registros/year/{year} |
| `linea://wikitext/{oldid}` | linea://wikitext/{oldid} |
| `server://card` | server://card |

> Full JSON Schemas: run `npm run spec:generate -w @zeus/http-contract`.