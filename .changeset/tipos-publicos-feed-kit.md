---
'@zeus/feed-kit': patch
---

`@zeus/feed-kit` publica tipos: los SEIS subpaths de `exports` resuelven su
condición `types` y las declaraciones viajan en el tarball.

El paquete llevaba `0.3.0` con CERO ficheros `.d.ts`. Ahora hay declaraciones
bajo `types/` para raíz, `./families`, `./synthetic`, `./resolve`, `./mcp` y
`./jetstream`. Donde el runtime no congela shape (handles MCP reales, posts
jetstream abiertos) el tipo usa `unknown` / objetos abiertos, no `any`.
Diff de runtime cero.
