# @zeus/ui-3d-kit

Kit de componentes **three.js vanilla** (ESM puro, sin bundler) para los visores 3D
de Zeus. El `src/` es **browser-safe**: se sirve **crudo** vía `express.static` y un
**import map** en la página resuelve `three` / `three/addons/*` en el navegador — node
nunca resuelve esos imports. Los módulos sin three (engine, adapter, walk-driver) son
además unit-testables bajo `node --test`.

Consumido por [`@zeus/player-3d-ui`](../../app/player-3d-ui) (escena vaivén +
marionetas) y [`@zeus/player-debug-3d-ui`](../../app/player-debug-3d-ui) (escena radial).

## API (resumen)

| Grupo | Export | Función |
|-------|--------|---------|
| **core** | `createSceneManager` | escena, cámara, renderer, OrbitControls, loop FPS |
| | `createAnimationController` | mixer + clips de una marioneta |
| | `createTrajectoryManager` | trayectorias/partículas entre puntos (escena radial) |
| **puppet** | `loadPuppet` | carga GLB + expone `setPosition/setHeading/setBase/emote` |
| | `clip-map` (`resolveClipMap`, `resolveBaseClip`, `resolveAdditiveClip`, `DEFAULT_CLIP_MAPS`, `POSE_TO_BASE`) | mapea nombres de clip de la spec (`ALP_LOC_*`/`ALP_ADD_*`) a los clips reales del GLB placeholder |
| **stage** | `createNodeMesh`, `createLinkCorridor(Between)`, `sampleLinkPath`, `createAnchorMarker`, `loadAnchorModel` | mallas de nodos, corredor de enlace y anclas |
| **engine** (puro, sin three) | `createMapEngine`, `sampleLink`, `linkDistance` | verdad lógica: tick(dt), progreso de enlace 0→1, auto-sit al llegar (vendorizado de gea-sdk) |
| | `createWalkDriver`, `resolveWalk` | capa fina "camina actor de nodo A→B": resuelve enlace+dirección e inyecta el intent |
| | `vaivenDosNodos` | definición runtime de la escena MVP (espejo del YAML de gea-sdk) |
| **adapter** (puro, sin three) | `createMapSceneAdapter` | vincula snapshots del engine a marionetas (posición, heading por tangente, pose) |

`engine/` y `adapter/` van **desacoplados de three** a propósito: la lógica se testea
con stubs. `vaiven-dos-nodos.mjs` y `map-engine.mjs` están **vendorizados** desde
`gea-sdk/packages/game` — editar allí, no aquí.

## Cómo se sirve

Entrada browser: `@zeus/ui-3d-kit` (`src/index.mjs`). Entrada **node-only** para
montar rutas: `@zeus/ui-3d-kit/node` (`src/paths.node.mjs`), que expone `srcDir`,
`assetsDir`, `modelsDir` y `getThreeDir()`.

```js
import express from 'express';
import { srcDir, modelsDir, getThreeDir } from '@zeus/ui-3d-kit/node';
app.use('/kit', express.static(srcDir));
app.use('/models', express.static(modelsDir));
app.use('/vendor/three', express.static(getThreeDir())); // build/ + examples/jsm/
```

Import map en la página:

```html
<script type="importmap">
{ "imports": {
    "three": "/vendor/three/build/three.module.js",
    "three/addons/": "/vendor/three/examples/jsm/",
    "@zeus/ui-3d-kit": "/kit/index.mjs" } }
</script>
```

> `getThreeDir()` deriva la raíz de three del entry principal resuelto: three@0.170
> oculta `./package.json` de su `exports`, así que no se puede probar por ahí. Devuelve
> un dir validado (contiene `build/three.module.js`) o lanza — el server deshabilita
> `/vendor/three` si three no está instalado.

## Assets

Los GLB canónicos (**`SK_Alephillo.glb`** — nombre canónico, mesh Xbot hasta rig `ALP_*` real — más `Xbot.glb`, `RobotExpressive.glb`, `SheenChair.glb`) los posee ahora **`@zeus/game-engine`** (única fuente de verdad, block-11 GA-B). Este kit los sirve reexportando `modelsDir` desde `@zeus/game-engine/node`; ya no hay vendor-sync. No editar los binarios a mano.

## Test

```bash
npm test    # node --test test/*.test.mjs  (22/22)
```
