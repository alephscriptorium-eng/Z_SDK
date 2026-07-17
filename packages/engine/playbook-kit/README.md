# `@zeus/playbook-kit`

Método **CASOS** como producto del SDK:

1. Formato de caso (precondición / pasos MCP / observación humana / criterio / errores)
2. Test de coherencia del playbook markdown
3. Plantilla de acta (`VALIDACION.md`)
4. Runner que ejecuta la **mitad MCP-verificable** y pre-rellena el acta

La mitad visual sigue siendo humana (G-ARG.1). Sin nombres de juego (D-8).

## Uso

```js
import fs from 'node:fs';
import {
  checkPlaybookCoherence,
  parseCaso,
  createMcpHttpClient,
  runMcpCases,
  renderActa
} from '@zeus/playbook-kit';
import { resolveZeusMcpPorts, resolveZeusHost } from '@zeus/presets-sdk/env';

const markdown = fs.readFileSync('path/to/CASOS.md', 'utf8');
const coherence = checkPlaybookCoherence(markdown, {
  expectedIds: ['C-01', 'C-02' /* … */],
  toolPattern: /`player_\w+\s*\{/
});
if (!coherence.ok) throw new Error(coherence.errors.join('\n'));

const client = createMcpHttpClient({
  host: resolveZeusHost(),
  port: resolveZeusMcpPorts().argPlayer.uno
});
await client.waitConnected();
await client.initialize();

const { ok, acta } = await runMcpCases({
  markdown,
  casoIds: ['C-01', 'C-03', 'C-04b', 'C-05'],
  callTool: (tool, args) => client.callTool(tool, args),
  game: 'delta',
  resolveDeps: true // C-05 tira de C-04 como setup
});
```

## CLI

```bash
npm exec -w @zeus/playbook-kit -- zeus-playbook-run --casos packages/games/delta/spec/CASOS.md --check
npm exec -w @zeus/playbook-kit -- zeus-playbook-run \
  --casos packages/games/delta/spec/CASOS.md \
  --ids C-01,C-03,C-04b,C-05 \
  --game delta \
  --out /tmp/acta-delta.md
```

Puerto por defecto: `resolveZeusMcpPorts().argPlayer.uno`. No abre navegadores.

## ¿pozo puede consumirlo tal cual?

Sí: el kit solo exige markdown con `## C-xx — título` y campos
`Precondición` / `Pasos del agente` / `Qué observa el humano` /
`Criterio de éxito` / `Errores esperados`, más llamadas `` `tool {json}` ``.
El juego aporta la ruta del playbook, el patrón de tools y el MCP HTTP.

## Tests

`npm test -w @zeus/playbook-kit`
