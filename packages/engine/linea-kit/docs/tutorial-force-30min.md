# Tutorial: crea tu force en 30 minutos

Starterkit force/cota (D-19 / DATOS.md §8). Las forces concretas son **datos**;
el engine solo conoce el formato.

## Qué obtienes

- un corpus `force-juguete` (kind `boot`) con 2 escenas `prompt/think/output`
- capa **trace descartada** (anotada en provenance / anomalies)
- cotas stub `sima` (lower/colapso) y `cima` (upper/victoria)
- `registry.json` con `session_budget` y paths

## Pasos

```bash
mkdir -p /tmp/zeus-forces-demo

npx zeus-linea-kit starterkit-force \
  --forces-root /tmp/zeus-forces-demo \
  --force-id force-juguete \
  --overwrite
```

Herramientas sueltas:

```bash
# segmentar-force necesita un JSON de escenas (rangos 1-based)
npx zeus-linea-kit segmentar-force \
  --out /tmp/zeus-forces-demo/forces/force-x \
  --force-id force-x \
  --raw ./context.md \
  --scenes ./scenes.json \
  --overwrite

npx zeus-linea-kit crear-cotas \
  --out /tmp/zeus-forces-demo/cotas/sima \
  --id sima \
  --bound lower \
  --overwrite
```

## Validar

```js
import { validateFile } from '@zeus/linea-kit/validate';

validateFile('force', '/tmp/zeus-forces-demo/forces/force-juguete/force.json');
validateFile(
  'force-manifest',
  '/tmp/zeus-forces-demo/forces/force-juguete/manifest.json'
);
validateFile('cota', '/tmp/zeus-forces-demo/cotas/sima/cota.json');
validateFile('force-registry', '/tmp/zeus-forces-demo/registry.json');
```

Cobertura: `force.json` → `provenance.coverage.ok` (gate informal de
IMPORT_NOTES; el contrato duro sigue siendo el schema U80).

## Nota de naming

En zeus se llaman **forces**, nunca «engines» (colisión con `engine/*`).
