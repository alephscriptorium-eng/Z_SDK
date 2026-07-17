# Tutorial: crea tu línea en 30 minutos

Starterkit del kit de línea (`@zeus/linea-kit`, WP-U81). El **contrato** de
entrada al mesh es el validador U80; estas tools son cortesía.

## Qué obtienes

Una línea sintética **juguete**:

- tronco con **3 nodos** (`N01`–`N03`)
- satélite `wp/historia/` con **10 registros** y milestones por reglas
- `registry.yaml` actualizado
- stubs de conexión MCP / remotes (`conectar-satelite`)
- un snapshot cacheado de ejemplo (gate `approve`)

## Pasos

```bash
# Desde la raíz del monorepo (worktree OK)
mkdir -p /tmp/zeus-lineas-demo

npx zeus-linea-kit starterkit-linea \
  --lineas-root /tmp/zeus-lineas-demo \
  --id juguete \
  --overwrite
```

Equivale a encadenar `crear-linea` → `segmentar` → `conectar-satelite` →
`fetch --approve`.

## Validar (contrato U80)

```js
import { validate, validateFile } from '@zeus/linea-kit/validate';
import { readFileSync } from 'node:fs';

validateFile('manifest-tronco', '/tmp/zeus-lineas-demo/juguete/manifest.json');
const sat = JSON.parse(
  readFileSync('/tmp/zeus-lineas-demo/juguete/wp/historia/manifest.json', 'utf8')
);
validate('manifest-satelite', sat);
for (const r of sat.registros) validate('registro', r);
```

## Servir con linea-system

```js
import { loadLineaData } from '@zeus/linea-kit/loader';
import { createServer } from '../../mesh/linea-system/src/linea-server.mjs';
// en el monorepo; o exporta createServer desde @zeus/linea-system si está expuesto

const { lineas } = await loadLineaData('/tmp/zeus-lineas-demo');
const data = lineas.juguete;
const handle = await createServer(
  {
    name: 'linea-juguete',
    kind: 'tronco',
    port: Number(process.env.ZEUS_MCP_LINEA_ESPAN) || undefined,
    lineaId: 'juguete',
    coverage: { min: 1900, max: 2020 }
  },
  data
).start();

// GET http://127.0.0.1:<port>/mcp/health
// resource linea://info → nodo_count: 3
await handle.close();
```

Worktrees: si necesitas VOLUMES vivos del árbol principal,

`ZEUS_VOLUMES_ROOT=<repo-principal>/VOLUMES`.

## API programática

```js
import { createLineaJuguete } from '@zeus/linea-kit/starterkits';

const result = createLineaJuguete({
  lineasRoot: '/tmp/zeus-lineas-demo',
  id: 'juguete',
  overwrite: true
});
```

Ver también: [tutorial-force-30min.md](./tutorial-force-30min.md).
