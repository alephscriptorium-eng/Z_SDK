# `@zeus/view-kit`

Kit de vistas **3D + HTML** browser-safe del SDK. Nace del kit de navegador
de `arg-console` (WP-U20). Sin nombres de juego (D-8): un segundo juego
(p. ej. pozo) puede consumirlo tal cual para escena, HUD, paneles, stick
puppets y wiring de room; lo específico del juego (escenario, gotas,
inspector de dominio, intents) vive junto a las vistas del juego.

## Browser (import-map)

El servidor monta `src/` y declara el mapa:

```js
import { srcDir as viewKitSrcDir } from '@zeus/view-kit/node';
app.use('/view-kit', express.static(viewKitSrcDir));
// import map:
//   "@zeus/view-kit": "/view-kit/index.mjs"
//   "@zeus/view-kit/": "/view-kit/"
```

```js
import {
  createViewerScene,
  createPanel,
  createActorsLayer,
  connectRoom,
  onChannelEvent
} from '@zeus/view-kit';
```

Dependencias browser (`three`, `@zeus/ui-3d-kit`, room-client) las resuelve
el import-map / static del host — no Node.

Consumidores actuales: `arg-console`, `3d-monitor`, `player-3d-ui`.

## Node

```js
import { srcDir, pkgDir } from '@zeus/view-kit/node';
```

Solo path helpers. No importar `/node` desde el navegador.

## Tests

```bash
npm test -w @zeus/view-kit
```
