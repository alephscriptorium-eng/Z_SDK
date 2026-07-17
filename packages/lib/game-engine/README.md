# `@zeus/game-engine`

Motor de gamemap puro (browser-safe `src/`) + helpers Node para montar assets
GLB vía `express.static` + import maps.

```js
import { createMapEngine } from '@zeus/game-engine';
import { srcDir, modelsDir } from '@zeus/game-engine/node'; // node-only
```

**No nombra juegos** (D-8): el consumidor aporta el contenido/escenas.

## Tests

`npm test -w @zeus/game-engine`
