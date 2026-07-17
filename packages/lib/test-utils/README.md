# `@zeus/test-utils`

Helpers compartidos de smoke-test para paquetes MCP/HTTP Zeus (contratos,
clientes de prueba). Publicado en lockstep con el resto del engine para que
consumidores externos puedan reutilizar los mismos fixtures de handshake.

```js
import { /* smoke helpers */ } from '@zeus/test-utils';
```

## Justificación de publicación

Listado en ARQUITECTURA §2 bajo `engine/`; útil fuera del monorepo para smokes
contra el registry (WP-U54). No es mesh ni juego.

## Tests

`npm test -w @zeus/test-utils`
