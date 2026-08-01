# `@zeus/volumes-ops`

Capa de operación files-first sobre `volumes.json` / DISKs (WP-U82, DATOS.md §4):

- **Medición** — archivos y bytes por volumen, corpus o línea (`linePath`).
- **Vaciado con roles** — `operator` = purga dura con asiento en ledger;
  `player`/`dj` = rechazo en purga dura (`rol_no_autorizado`); intent
  `empty_playable` registra asiento sin borrar disco (trama en U83).
- **REST + MCP** desde una definición RouteEntry (patrón WP-U40): GET measure
  → resource; POST empty queda en HTTP.

Nada toca disco sin pasar por `assertIntentRole` + ledger (purga) o sin
asiento (playable).

## Uso

```js
import {
  measureVolume,
  emptyVolume,
  createVolumesOpsServer,
  VOLUMES_OPS_ROUTES
} from '@zeus/volumes-ops';
import {
  projectRoutesToMcp,
  bindProjectedHttpReaders
} from '@zeus/http-contract';

// Medir (read-only)
const m = measureVolume('sandbox');

// Vaciar (operator)
const r = emptyVolume({
  volumeId: 'sandbox',
  corpusId: 'raw',
  role: 'operator',
  actorId: 'ops-1'
});

// HTTP + MCP
const http = await createVolumesOpsServer({ port: 0 });
const projected = projectRoutesToMcp(VOLUMES_OPS_ROUTES);
const { registry, templateRegistry } = bindProjectedHttpReaders(projected, {
  baseUrl: http.url
});
```

## Contadores (U199 · manifiesto sellado)

`volumes.json` es MANIFIESTO: identidad/topología, read-only para el
runtime, sellado por sha256 de sus bytes exactos (`manifest.mjs`). Medir
JAMÁS lo modifica. Tras un vaciado (o `POST …/sync-counters`), la medición
viva se registra en `volumes.state.json` (`state.mjs`): `files`/`bytes`
por volumen y corpus + `measuredAt` + `manifest.sha256` contra el que se
midió. El estado es mutable/regenerable, no versionado y nunca entra en el
hash del manifiesto. Regla D-45: si se puede regenerar midiendo, es
estado, no manifiesto. Volumen sin entrada en el manifiesto (o root sin
manifiesto) → la operación aborta, no se inventa nada.

## Ledger

JSONL append-only: `{volumesRoot}/.ops-ledger.jsonl` (configurable).

## Adaptador de startpack → pack v1 (U206)

`buildPackFromStartpack()` lee un startpack `zeus.startpack/v0` en **solo
lectura**, computa los sha256 y emite el `manifest.json` v1 que `importPack`
sí acepta (el del startpack carece de `name` y `hashes` → `pack_manifest_incompleto`).

```js
const pack = buildPackFromStartpack({
  startpackRoot,          // SOLO LECTURA; nunca se escribe dentro
  outDir,                 // fuera de la fuente, o `destino_dentro_de_origen`
  name: 'mi-pack-v1', version: '1.0.0',
  volumes: { forces: { disk: 'DISK_03', path: 'DISK_03/FORCES', corpora: [...] } }
});
importPack({ packRoot: pack.packRoot, role: 'operator' });
```

Dos reglas que no son cosmética:

- **El árbol de datos son los DISCOS.** Un fichero suelto en el `volumes/` del
  startpack (típicamente su `volumes.json`, que es manifiesto de ROOT) se
  descarta **con reporte** en `pack.skipped`, nunca en silencio.
- **Cero pérdida silenciosa.** Todo fichero debe caer bajo el `path` de algún
  volumen declarado, o `fichero_fuera_de_volumen`. Sin esa guarda el fichero
  se copia al staging, **pasa** la verificación de hash y **desaparece** al
  borrarse el staging —ningún plan de fusión lo cubre— con `importPack`
  devolviendo `ok:true`. Es la juntura, no la pieza.

## Integridad del root (U206 · «la corrupción falla al arrancar»)

`verifyRootIntegrity()` / `assertRootIntegrity()`. El fail-closed que había
era de **ausencia**, no de **corrupción**: `validateVolumesTree` valida contra
*schemas*, así que una escena `.md` corrompida byte a byte pasaba sin una
queja. Legs: `manifiesto` · `sello_vs_ledger` · `sello_vs_estado` · `volumen` ·
`snapshot` (recomputa `source.imported.snapshot` con `hashUnitTree`, el mismo
algoritmo que lo selló) · `familia` (el `validate()` real del driver contra el
árbol **vivo**) · `corpora` (remide contra los `files`/`bytes` sellados).

El leg fuerte es **`sello_vs_ledger`**: el sello anotado en
`volumes.state.json` se re-anota en silencio en cuanto alguien mide
(`counters.mjs` → `state.mjs`), así que una edición a mano de `volumes.json`
deja de verse en el estado; el ledger, que sólo escribe el import, sí la
conserva.

Fronteras declaradas: el snapshot con forma «árbol por unidad» sólo lo sella
FORCES (FIREHOSE sella otra forma, LINEAS ninguna) → familia sin verificador
se reporta `omitido`, **nunca se adivina el algoritmo** (`strictSnapshot:true`
lo convierte en hallazgo). Y el ledger es append-only por convención, no a
prueba de manipulación.

## Cerco del root (U206)

`scanRootCerco()` / `assertRootCerco()` — cuatro predicados escritos: enlace
vivo (`lstat`, junctions de Windows incluidas) · ruta `node_modules` ·
material de identidad (con **la** denylist de `import.mjs`, importada, no
copiada) · **URL viva** = literal `http(s)://` salvo (a) autoridad
`${VAR}` y (b) `volumes.<id>.source.imported.origin` dentro de `volumes.json`,
que el contrato declara metadato inerte. La exención (b) es **por ruta de
clave exacta**: la misma URL en otro campo, o en otro fichero, es URL viva.
Binarios (byte NUL en los primeros 8 kB) no se escanean y se declaran en
`binaries[]`. Un root inexistente devuelve `root_no_encontrado`: barrer la
nada no es estar limpio.

## Tests

```bash
npm test -w @zeus/volumes-ops
```

Usan `mkdtemp` + `ZEUS_VOLUMES_ROOT` — nunca purgan DISK vivos.

Post WP-U62 el monorepo solo trae fixtures en `VOLUMES/DISK_02|03`; datos
de ronda vienen de `@zeus/startpack-*` (games-library) o de un
`ZEUS_VOLUMES_ROOT` externo.

## Regla de los dos juegos

Engine: cero nombres de juego. Roles genéricos `operator` / `player` / `dj`.
