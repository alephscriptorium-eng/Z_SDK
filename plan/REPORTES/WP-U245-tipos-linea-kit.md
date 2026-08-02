# WP-U245 · Tipos públicos completos de `@zeus/linea-kit`

Rama `wp/u245-tipos-linea-kit`. Entorno: Windows 11, Node v22.21.1, npm 10.9.4,
TypeScript 5.9.3.

---

## 0 · Qué medí antes de tocar nada

Contraste de lo que traía el BRIEF, medido sobre este worktree:

```
$ cd packages/engine/linea-kit && find . -type f -name "*.d.ts" | wc -l
0
```

```
$ node -e "const p=require('./package.json'); console.log('version', p.version); console.log('types', p.types); console.log('files', JSON.stringify(p.files)); console.log('subpaths', Object.keys(p.exports).length)"
version 0.3.0
types undefined
files ["src","schemas","bin","docs","README.md"]
subpaths 10
```

Los cuatro puntos del BRIEF se confirman: `0.3.0`, cero `.d.ts`, sin `types`
en la raíz, sin carpeta de tipos publicable, y diez subpaths — `.`,
`./curation`, `./resolve`, `./force-activation`, `./validate`, `./loader`,
`./tools`, `./starterkits`, `./viaje` y el comodín `./schemas/*`.

`schemas/` trae **19** documentos JSON Schema, que es exactamente el número de
claves de `SCHEMA_FILES` en `src/validate.mjs`. Ese 19 es lo que el comodín
tiene que cubrir.

---

## 1 · Lo que entrego

**50 declaraciones** bajo `packages/engine/linea-kit/types/`:

- **31 de módulo**, una por módulo alcanzable desde un subpath. Incluye tres
  que no son subpath propio pero a las que los barriles llegan:
  `types/common.d.ts` (formas compartidas), `types/model.d.ts` (el modelo en
  memoria de un corpus LINEAS) y `types/forces-loader.d.ts` (que `./loader`
  reexporta entero, igual que hace `src/loader.mjs`).
- **19 de schema**, una por documento de `schemas/`.

Más, en el manifiesto: `types` en la raíz, la condición `types` en los diez
subpaths, `"types"` dentro de `files`, y `scripts.types:check`.

### El comodín `./schemas/*`, que es el subpath no trivial

El target de runtime es `./schemas/*` y el `*` vale **`volumes.json`**, con
extensión incluida. Por eso la condición `types` es `./types/schemas/*.d.ts` y
las declaraciones se llaman `types/schemas/volumes.json.d.ts`. Lo medí antes de
comprometerme al layout, en un paquete sintético, y TypeScript lo resuelve:

```
======== Module name '@zeus/testpkg/schemas/foo.json' was successfully resolved to
'…/pkg/types/schemas/foo.json.d.ts' with Package ID '@zeus/testpkg/types/schemas/foo.json.d.ts@0.0.0'. ========
```

El target de runtime **no cambia**: sigue siendo `./schemas/*`. No lo estreché a
`./schemas/*.json` precisamente porque eso sí sería un cambio de resolución en
runtime.

---

## 2 · CA1 · Los diez subpaths resuelven su `types` bajo NodeNext

Consumidor real en
`packages/engine/linea-kit/test/types/consumer-nodenext/`, con
`module`/`moduleResolution: NodeNext`, `strict`, `noImplicitAny`,
`skipLibCheck: false`, `types: []`. Importa los diez subpaths y **usa un valor
de cada uno** (no sólo `import type`).

Orden exacta:

```
$ cd packages/engine/linea-kit
$ node test/types/check.mjs --tsc C:/S_LAB/v-sdk/node_modules/typescript/bin/tsc
```

Salida literal:

```
tsc:  C:\S_LAB\v-sdk\node_modules\typescript\bin\tsc
link: C:\S_LAB\wt\z-u245\packages\engine\linea-kit\test\types\node_modules\@zeus\linea-kit -> C:\S_LAB\wt\z-u245\packages\engine\linea-kit
PASS consumer-nodenext — tsc --noEmit, 0 errors
PASS consumer-bundler — tsc --noEmit, 0 errors
link: removed (pass --keep-link to keep it for an editor)
```

Que compile a cero errores demuestra que ningún subpath quedó sin tipos, pero
no dice **por dónde** los tomó. Eso lo demuestra la traza, con la misma orden y
`--trace` (rutas abreviadas a `<PKG>`):

```
======== Module name '@zeus/linea-kit' was successfully resolved to '<PKG>/types/index.d.ts' with Package ID '@zeus/linea-kit/types/index.d.ts@0.3.0'. ========
======== Module name '@zeus/linea-kit/curation' was successfully resolved to '<PKG>/types/curation.d.ts' with Package ID '@zeus/linea-kit/types/curation.d.ts@0.3.0'. ========
======== Module name '@zeus/linea-kit/resolve' was successfully resolved to '<PKG>/types/resolve.d.ts' with Package ID '@zeus/linea-kit/types/resolve.d.ts@0.3.0'. ========
======== Module name '@zeus/linea-kit/force-activation' was successfully resolved to '<PKG>/types/force-activation.d.ts' with Package ID '@zeus/linea-kit/types/force-activation.d.ts@0.3.0'. ========
======== Module name '@zeus/linea-kit/validate' was successfully resolved to '<PKG>/types/validate.d.ts' with Package ID '@zeus/linea-kit/types/validate.d.ts@0.3.0'. ========
======== Module name '@zeus/linea-kit/loader' was successfully resolved to '<PKG>/types/loader.d.ts' with Package ID '@zeus/linea-kit/types/loader.d.ts@0.3.0'. ========
======== Module name '@zeus/linea-kit/tools' was successfully resolved to '<PKG>/types/tools/index.d.ts' with Package ID '@zeus/linea-kit/types/tools/index.d.ts@0.3.0'. ========
======== Module name '@zeus/linea-kit/starterkits' was successfully resolved to '<PKG>/types/starterkits/index.d.ts' with Package ID '@zeus/linea-kit/types/starterkits/index.d.ts@0.3.0'. ========
======== Module name '@zeus/linea-kit/viaje' was successfully resolved to '<PKG>/types/viaje/index.d.ts' with Package ID '@zeus/linea-kit/types/viaje/index.d.ts@0.3.0'. ========
======== Module name '@zeus/linea-kit/schemas/volumes.json' was successfully resolved to '<PKG>/types/schemas/volumes.json.d.ts' with Package ID '@zeus/linea-kit/types/schemas/volumes.json.d.ts@0.3.0'. ========
======== Module name '@zeus/linea-kit/schemas/curation-status.json' was successfully resolved to '<PKG>/types/schemas/curation-status.json.d.ts' with Package ID '@zeus/linea-kit/types/schemas/curation-status.json.d.ts@0.3.0'. ========
======== Module name '@zeus/linea-kit/schemas/viaje-recorrido.json' was successfully resolved to '<PKG>/types/schemas/viaje-recorrido.json.d.ts' with Package ID '@zeus/linea-kit/types/schemas/viaje-recorrido.json.d.ts@0.3.0'. ========
======== Module name '@zeus/linea-kit/schemas/force-registry.json' was successfully resolved to '<PKG>/types/schemas/force-registry.json.d.ts' with Package ID '@zeus/linea-kit/types/schemas/force-registry.json.d.ts@0.3.0'. ========
```

Diez subpaths distintos, diez resoluciones dentro de `types/`. El comodín
aparece cuatro veces porque el consumidor importa cuatro documentos distintos;
las 19 declaraciones de schema las cubre el gate (§4, vector C).

El enlace bajo `test/types/node_modules/@zeus/linea-kit` es deliberado: obliga a
resolver **como dependencia instalada**, atravesando el mapa `exports`, y no por
un alias `paths` de `tsconfig` —que habría dado verde sin probar nada de lo que
mide este WP—. Es un junction bajo un `node_modules` ignorado, nunca entra en el
diff, y `check.mjs` lo borra al terminar salvo que se le pase `--keep-link`.

## 3 · CA2 · Dos consumidores independientes, y por qué el segundo no es «por raíz»

**Lo digo antes que nada: un consumidor sólo-raíz no aporta nada aquí.** El
barril `.` reexporta únicamente el tercio browser-safe del paquete —`curation`,
`resolve` y `force-activation`, tal cual hace `src/index.mjs`—, de modo que un
consumidor que entrara sólo por la raíz dejaría SIETE subpaths sin medir y no
mediría nada nuevo de los tres que sí toca. El BRIEF ya preveía este caso y
autorizaba otra dimensión; la tomé.

`test/types/consumer-bundler/` mide sobre el eje de **resolución y rigor**:

| | consumer-nodenext | consumer-bundler |
|---|---|---|
| `moduleResolution` | `NodeNext` | `bundler` |
| `module` | `NodeNext` | `Preserve` |
| `verbatimModuleSyntax` | — | sí |
| `exactOptionalPropertyTypes` | — | sí |
| `noUncheckedIndexedAccess` | — | sí |
| `noPropertyAccessFromIndexSignature` | — | sí |
| entrada | subpath a subpath | **raíz primero**, subpath sólo para lo que la raíz no lleva |

Cada flag mide algo que el otro consumidor no puede ver:

- **`bundler`**: la condición `types` tiene que ser recogida por el conjunto de
  condiciones de bundler, no sólo por el de NodeNext. La traza confirma que los
  diez subpaths resuelven también aquí dentro de `types/`.
- **`verbatimModuleSyntax`**: cada nombre que el consumidor importa como VALOR
  tiene que ser un export de valor real de las declaraciones. Un nombre
  declarado por error como tipo pasaría bajo NodeNext y falla aquí. El
  consumidor agrupa los 32 valores en un objeto para forzarlo.
- **`exactOptionalPropertyTypes`**: `foo?: T` y `foo?: T | undefined` dejan de
  ser intercambiables. Por eso `SlimRegistro.timestamp` está declarado
  `string | undefined` REQUERIDO y no `timestamp?: string`: el literal que
  construye `slimRegistro` siempre pone la clave.
- **`noUncheckedIndexedAccess` + `noPropertyAccessFromIndexSignature`**: cada
  firma de índice que declaro tiene que ser honesta sobre devolver `undefined`,
  y los campos abiertos de un documento con `additionalProperties: true` se leen
  con corchetes (`registro['some_extension_field']`) y no con punto.

Ambos consumidores compilan a **cero errores** (salida literal en §2).

## 4 · CA3 · El gate falla en LAS DOS direcciones

Gate en `packages/engine/linea-kit/test/gate-exports-types.mjs`, cero
dependencias, ejecutable como CLI y como función. **No viaja en el tarball**
(`files` no incluye `test`), pero sí corre en CI: `test/exports-types.test.mjs`
lo envuelve en `node --test` y el `npm test` del paquete es
`node --test test/*.test.mjs`, que es lo que `.github/workflows/ci.yml` ejecuta
para `@zeus/linea-kit`.

Las dos piernas:

- **A · exports → declaraciones.** Cada subpath debe declarar `types` y el
  fichero apuntado debe existir. El comodín se EXPANDE sobre los targets de
  runtime reales, así que cada `schemas/<x>.json` exige su
  `types/schemas/<x>.json.d.ts`.
- **B · declaraciones → exports.** Cada `.d.ts` bajo `types/` debe ser
  alcanzable desde algún subpath siguiendo los especificadores relativos, y cada
  especificador debe resolver. Coge lo que la pierna A no puede ver: una
  declaración que sólo importan los barriles, y una declaración huérfana.

Más `root:` para el `types` de la raíz y el `"types"` de `files`.

### Vector A — subpath añadido a `exports` SIN su declaración

Sobre una copia física del paquete con `./nuevo` añadido al mapa:

```
$ node packages/engine/linea-kit/test/gate-exports-types.mjs <copia>/vecA
FAIL gate exports↔declarations · …\vectors\vecA — 1 finding(s)
  [leg A] declaration_missing: ./nuevo → ./types/nuevo.d.ts
EXIT=1
```

### Vector B — declaraciones RETIRADAS

Sobre otra copia con `types/viaje/index.d.ts` (entrada del subpath `./viaje`) y
`types/model.d.ts` (que no es entrada de ningún subpath: sólo lo importan
`./resolve` y `./loader`) borradas:

```
$ node packages/engine/linea-kit/test/gate-exports-types.mjs <copia>/vecB
FAIL gate exports↔declarations · …\vectors\vecB — 17 finding(s)
  [leg A] declaration_missing: ./viaje → ./types/viaje/index.d.ts
  [leg B] specifier_dangling: types/tools/segmentar.d.ts → "../model.js"
  [leg B] specifier_dangling: types/tools/crear-linea.d.ts → "../model.js"
  [leg B] specifier_dangling: types/loader.d.ts → "./model.js"
  [leg B] specifier_dangling: types/loader.d.ts → "./model.js"
  [leg B] specifier_dangling: types/resolve.d.ts → "./model.js"
  [leg B] specifier_dangling: types/resolve.d.ts → "./model.js"
  [leg B] declaration_orphan: types/viaje/adapters/gamemap.d.ts
  [leg B] declaration_orphan: types/viaje/adapters/linea.d.ts
  [leg B] declaration_orphan: types/viaje/adapters/wiki.d.ts
  [leg B] declaration_orphan: types/viaje/cache.d.ts
  [leg B] declaration_orphan: types/viaje/etapas.d.ts
  [leg B] declaration_orphan: types/viaje/graph-source.d.ts
  [leg B] declaration_orphan: types/viaje/plan.d.ts
  [leg B] declaration_orphan: types/viaje/reparar.d.ts
  [leg B] declaration_orphan: types/viaje/run.d.ts
  [leg B] declaration_orphan: types/viaje/segmentar-viaje.d.ts
EXIT=1
```

Nótese la asimetría, que es justo lo que justifica las dos piernas: retirar la
entrada de `./viaje` la ve la pierna A; retirar `model.d.ts` **no la ve A en
absoluto** y la coge B por especificador roto.

### Control — el paquete real

```
$ node packages/engine/linea-kit/test/gate-exports-types.mjs
PASS gate exports↔declarations · C:\S_LAB\wt\z-u245\packages\engine\linea-kit — 10 subpaths, 50 declarations
EXIT=0
```

### Los vectores, además, atados en `node --test`

`test/exports-types.test.mjs` copia el manifiesto real y el árbol `types/` real
a un temporal, rompe UNA cosa y vuelve a correr el mismo gate. No hay
filesystem simulado. Nueve casos: el paquete real en verde, la copia sin mutar
en verde (para que el sandbox no sea él mismo el fallo), vector A, vector A bis
(subpath con target string desnudo, sin condición `types`), B1 (entrada
retirada), B2 (declaración transitiva retirada), B3 (declaración huérfana),
vector C (target del comodín sin declaración) y el par `root:`.

```
ok 4 - the real package passes the gate
ok 5 - the unmutated copy passes too (the sandbox itself is not the failure)
ok 6 - vector A · a subpath in exports without its declaration FAILS
ok 7 - vector A bis · a subpath with a bare string target (no types condition) FAILS
ok 8 - vector B1 · retiring the declaration of a declared subpath FAILS
ok 9 - vector B2 · retiring a declaration the barrels import FAILS
ok 10 - vector B3 · a declaration nothing reaches FAILS as an orphan
ok 11 - vector C · a wildcard runtime target without its declaration FAILS
ok 12 - the root types field and the publishable files entry are checked
```

## 5 · CA4 · `npm pack --dry-run`

```
$ cd packages/engine/linea-kit && npm pack --dry-run
```

Salida literal, recortada a lo que este WP añade (los 54 ficheros previos de
`README.md`, `bin/`, `docs/`, `package.json`, `schemas/` y `src/` salen antes,
sin cambio):

```
npm notice 1.6kB types/common.d.ts
npm notice 2.0kB types/curation.d.ts
npm notice 4.4kB types/force-activation.d.ts
npm notice 4.4kB types/forces-loader.d.ts
npm notice 2.0kB types/index.d.ts
npm notice 3.3kB types/loader.d.ts
npm notice 5.9kB types/model.d.ts
npm notice 6.2kB types/resolve.d.ts
npm notice 484B types/schemas/cache-sidecar-meta.json.d.ts
npm notice 458B types/schemas/cota.json.d.ts
npm notice 479B types/schemas/curation-status.json.d.ts
npm notice 477B types/schemas/force-manifest.json.d.ts
npm notice 477B types/schemas/force-registry.json.d.ts
npm notice 460B types/schemas/force.json.d.ts
npm notice 479B types/schemas/lineas-registry.json.d.ts
npm notice 483B types/schemas/manifest-satelite.json.d.ts
npm notice 479B types/schemas/manifest-tronco.json.d.ts
npm notice 467B types/schemas/nodo-meta.json.d.ts
npm notice 475B types/schemas/nodo-sections.json.d.ts
npm notice 477B types/schemas/nodos-document.json.d.ts
npm notice 477B types/schemas/ontology-seeds.json.d.ts
npm notice 466B types/schemas/registro.json.d.ts
npm notice 475B types/schemas/snapshot-meta.json.d.ts
npm notice 473B types/schemas/ssb-manifest.json.d.ts
npm notice 479B types/schemas/triage-manifest.json.d.ts
npm notice 479B types/schemas/viaje-recorrido.json.d.ts
npm notice 472B types/schemas/volumes.json.d.ts
npm notice 1.0kB types/starterkits/force-30min.d.ts
npm notice 534B types/starterkits/index.d.ts
npm notice 1.5kB types/starterkits/linea-30min.d.ts
npm notice 1.8kB types/tools/conectar-satelite.d.ts
npm notice 1.8kB types/tools/crear-cotas.d.ts
npm notice 2.0kB types/tools/crear-linea.d.ts
npm notice 1.1kB types/tools/fetch.d.ts
npm notice 1.9kB types/tools/index.d.ts
npm notice 1.2kB types/tools/milestone-rules.d.ts
npm notice 2.9kB types/tools/segmentar-force.d.ts
npm notice 1.9kB types/tools/segmentar.d.ts
npm notice 2.9kB types/validate.d.ts
npm notice 1.7kB types/viaje/adapters/gamemap.d.ts
npm notice 732B types/viaje/adapters/linea.d.ts
npm notice 1.2kB types/viaje/adapters/wiki.d.ts
npm notice 3.1kB types/viaje/cache.d.ts
npm notice 857B types/viaje/etapas.d.ts
npm notice 899B types/viaje/graph-source.d.ts
npm notice 2.0kB types/viaje/index.d.ts
npm notice 1.3kB types/viaje/plan.d.ts
npm notice 840B types/viaje/reparar.d.ts
npm notice 2.2kB types/viaje/run.d.ts
npm notice 825B types/viaje/segmentar-viaje.d.ts
npm notice Tarball Details
npm notice name: @zeus/linea-kit
npm notice version: 0.3.0
npm notice filename: zeus-linea-kit-0.3.0.tgz
npm notice package size: 63.7 kB
npm notice unpacked size: 253.5 kB
npm notice shasum: 41a7721c8ac9852a78cc0020d0625b264d200e90
npm notice integrity: sha512-+7weQSi0EV31y[...]fFeu91pkAMmpg==
npm notice total files: 104
```

Las 50 declaraciones entran. `test/` NO entra: ni el gate, ni los dos
consumidores, ni `check.mjs`. 104 ficheros = 54 previos + 50 declaraciones.
`--dry-run` no escribió ningún `.tgz` (comprobado: `ls *.tgz` → sin resultados).

## 6 · CA5 · `unknown`, no `any`

```
$ cd packages/engine/linea-kit && grep -rniw 'any' types/
EXIT=1
```

```
$ grep -rnE '@ts-(ignore|expect-error|nocheck)' types/ test/types/
EXIT=1
```

Exit code 1 en ambos = cero coincidencias. El primer grep es
`-w` (palabra completa) e `-i`, o sea que cubre el tipo `any` Y la palabra
inglesa en comentarios: reescribí cuatro comentarios de prosa que la contenían
para que este grep no admita interpretación. No hay `@ts-ignore` ni
`@ts-expect-error` ni `@ts-nocheck` en ninguna parte, ni en las declaraciones
ni en los dos consumidores.

### Dónde quedó `unknown`, y por qué

| Dónde | Qué | Razón |
|---|---|---|
| `forces-loader.d.ts` · `ForceCorpus.card`, `.manifest`, `.entry` | documentos leídos de disco | `loadCorpusEntry` hace `JSON.parse` y **no valida**. Hay schema (`force.json`, `cota.json`, `force-manifest.json`) pero nada obliga a pasarlo. Promover con `@zeus/linea-kit/validate`. |
| `forces-loader.d.ts` · `ForcesData.registry`, `ForcesRegistryView.activation`, `.session_budget`, `.version`, `.description`, `.imported_at`, `.boot` | `registry.json` sin validar | Mismo motivo. `normalizeForceRegistry` sí devuelve el `ForceRegistryView` declarado; `buildForcesRegistryView` sólo copia. |
| `forces-loader.d.ts` · `ResolvedForceScene.scene.*`, `ForceCorpus.scenesByKey` | escenas del manifest | Copiadas de un manifest no validado. |
| `resolve.d.ts` · `ResolvedParte.titulo`, `.año_ini`, `.año_fin`, `.nodos` | los cuatro campos de una parte | **`schemas/manifest-tronco.json` declara `meta.partes` como `{"type":"object","additionalProperties":true}` SIN una sola propiedad declarada.** Sólo el `id` está prometido (es sobre el que `resolveParte` empareja). Lo escribe `buildPartes` en `crear-linea.mjs`, pero un manifest ajeno válido puede no traerlos. |
| `model.d.ts` · `WaveAIndex.anchors` | `scripts/fetch-priority-viaje1.json` | Ese fichero **no tiene schema en este paquete**. La proyección `byNodoId` que el loader construye sí está tipada. |
| `model.d.ts` · `SatelliteIndex.extremes`, `.milestones` | `meta.snapshots` / `meta.milestones` | El schema los declara `object` abierto y `array of string\|object`. |
| `loader.d.ts` · `WikitextCached.meta` | `<oldid>.meta.json` | Se lee con `JSON.parse` dentro de un `try` y es opcional. |
| `tools/crear-linea.d.ts` · `MaterializarTroncoOptions.nodosDoc` | documento `nodos.yaml` en memoria | Se consume antes de validar contra `nodos-document.json`. |
| `tools/crear-cotas.d.ts` · `CrearCotasOptions.scenes`, `CotaManifest.scenes` | escenas del llamador | Pasan íntegras al `manifest.json`; su forma la promete el llamador, no este paquete. |
| `validate.d.ts` · `loadSchemaObjects(): Map<string, unknown>` | schemas parseados | El `Map` es de documentos JSON Schema; `JsonSchemaDocument` está exportado para nombrarlos, pero el `Map` en sí no está tipado más fuerte porque el runtime no lo garantiza clave a clave. |
| `validate.d.ts` · `validate(schemaId, data: unknown)` | dato a validar | Es la entrada de un validador; cualquier otra cosa sería mentira. |
| `viaje/run.d.ts` · `RunViajeRefusal.detail` | payload del fallo de materialización | Es el objeto que devolvió el `materializeNode` del llamador. |
| `viaje/cache.d.ts` · `normalizeTreeJson(tree: unknown)` | formato `tree.json` | Formato de PARTIDA que este paquete nunca escribió y para el que no tiene schema. |
| `force-activation.d.ts` · `normalizeForceRegistry(registry: unknown)`, `ForceRefusal.detail` | entrada polimórfica | Acepta la forma de disco Y una vista ya normalizada, que no comparten forma declarada. `detail` varía por token de error. |
| `tools/milestone-rules.d.ts` · `MilestoneRule.test(reg: unknown, …)`, `applyMilestoneRules(registro: unknown, …)` | fila de reglas | La misma tabla se aplica a filas de historial y a pasos de viaje, que no comparten forma. |
| `viaje/adapters/linea.d.ts` · `nodoIdsFromTrunk(trunkOrLoaded: unknown)` | tres formas aceptadas | La función prueba tres formas a propósito. |
| `viaje/adapters/gamemap.d.ts` · `acceptWalks(walks: unknown)`, `graph-source.d.ts` · `assertGraphSource(source: unknown)` | comprobadores de forma | Su trabajo ES recibir algo no verificado. |

En el lado contrario, hay sitios donde el runtime SÍ promete y por eso el tipo
es estrecho, no `unknown`:

- `CurationStatus`: unión de once literales. Prometida **dos veces** — el
  runtime congela exactamente esos tokens y `schemas/curation-status.json`
  declara el mismo `enum`.
- `ViajeEtapa`: los siete estados, igual (runtime congelado + `enum` en
  `viaje-recorrido.json`).
- `ViajeSourceKind`: los cuatro tokens del `enum` del schema. **No es un
  `string` libre**: `buildRecorrido` valida antes de devolver, así que un
  `GraphSource` cuyo `kind` sea otra cosa produce un rechazo de schema, nunca un
  quinto token. Está anotado en la declaración.
- `isCurationStatus` e `isViajeEtapa` son **type predicates** (`value is …`)
  porque el runtime es exactamente `SET.has(value)`. `isCanonStatus` NO lo es, y
  el comentario dice por qué: `true` normaliza a `'labeled'` y devolvería
  `true` para un valor que no es ese literal.

### Un detalle de contrato que el consumidor de fuera necesita

Las funciones de `./resolve`, `./loader` y las consultas del cargador de forces
devuelven o bien un payload con `error?: undefined`, o bien un sobre
`{ error: string }`. **Se estrechan con `if (result.error !== undefined)`, no
con `if (result.error)`.** Lo medí:

```
n.ts(7,40): error TS2339: Property 'nodo' does not exist on type 'R'.
  Property 'nodo' does not exist on type 'Err'.
```

El motivo es que el `error` del fallo es `string`, que incluye `''`, así que una
prueba de verdad no elimina el constituyente de fallo de la rama falsa. Está
escrito en la cabecera de `types/resolve.d.ts`, `types/loader.d.ts` y
`types/forces-loader.d.ts`, y los dos consumidores lo usan así.

## 7 · CA6 · Changeset

`.changeset/tipos-publicos-linea-kit.md`, **`patch`** — adición compatible: no
hay cambio de comportamiento ni de superficie de runtime, sólo declaraciones y
metadatos de tipos. Único paquete tocado.

---

## 8 · El diff de runtime es CERO, demostrado

No lo afirmo: lo mido de tres maneras.

**(a) `git diff` contra `main` sobre las tres carpetas de runtime:**

```
$ git diff --stat main -- packages/engine/linea-kit/src packages/engine/linea-kit/schemas packages/engine/linea-kit/bin
$ echo $?
0
```

Sin una sola línea de salida.

**(b) OID de blob fichero a fichero.** Es la comparación autoritativa: `git
hash-object` aplica los mismos filtros que `git` usó al guardar el blob, cosa
que un `sha256sum` crudo NO hace (este repositorio tiene `core.autocrlf = true`,
así que un sha256 del árbol de trabajo difiere del blob en los 50 ficheros por
CRLF y NO es evidencia de nada).

```
$ for f in $(git ls-tree -r --name-only main -- .../src .../schemas .../bin); do
    a=$(git rev-parse "main:$f"); b=$(git hash-object "$f")
    [ "$a" != "$b" ] && echo "MISMATCH $f"
  done
  files compared: 50   OID mismatches: 0
```

**(c) Sin altas ni bajas.** `comm -13` entre el listado de `main` y el listado
del árbol de trabajo bajo `src|schemas|bin`: salida vacía.

**(d) Hash de ÁRBOL, que es la prueba de una sola línea.** Un tree hash de git
cubre recursivamente todo su contenido: si un solo byte de un solo fichero
—o un nombre, o un modo— hubiera cambiado, el hash sería otro. Sobre el índice
ya preparado para el commit:

```
$ T=$(git write-tree)
main   src tree: b2e67b41b19d2292191977755413b89df4120ac2
index  src tree: b2e67b41b19d2292191977755413b89df4120ac2
main   schemas:  1278f99089cefae45c427818670f6fe2db1e4536
index  schemas:  1278f99089cefae45c427818670f6fe2db1e4536
main   bin:      fb1f4c490f6757b57535702e5f26caea2751f6b6
index  bin:      fb1f4c490f6757b57535702e5f26caea2751f6b6
```

Tres árboles, tres hashes idénticos. Diff de runtime = cero.

**Lo único que cambia del paquete, en tracked files:**

```
 M packages/engine/linea-kit/package.json
?? packages/engine/linea-kit/types/                (50 .d.ts)
?? packages/engine/linea-kit/test/gate-exports-types.mjs
?? packages/engine/linea-kit/test/exports-types.test.mjs
?? packages/engine/linea-kit/test/types/           (2 consumidores + check.mjs)
```

Más `.changeset/tipos-publicos-linea-kit.md` y este reporte.

### El diff de `package.json`, campo a campo

1. `+ "types": "./types/index.d.ts"` en la raíz.
2. Los diez subpaths pasan de `"<subpath>": "<target>"` a
   `"<subpath>": { "types": "<decl>", "default": "<mismo target de antes>" }`.
   **El target de runtime de cada uno es carácter por carácter el de antes**,
   incluido `"./schemas/*"` del comodín. `types` va primero, como exige la
   resolución por condiciones (y el gate lo comprueba: `A:types_not_first`).
3. `+ "types"` dentro de `files`.
4. `+ "types:check": "node test/types/check.mjs"` dentro de `scripts`.

**Declaro el punto 4 como la única adición fuera de la lista enumerada en la
FRONTERA DURA** («declaraciones, `exports.types`, `types` raíz y `files`
publicables»). Añadí esa clave porque sin ella la comprobación de CA1/CA2 no
tiene forma de invocarse desde el repositorio. Es cero runtime: no la ejecuta
`npm test`, no viaja en el tarball, y no añade dependencias. Si la revisión
prefiere el diff literal de la lista, quitarla cuesta una línea y sólo pierde el
atajo — la orden documentada en §2 sigue funcionando tal cual.

**El paquete no gana dependencias.** No añadí `typescript` a `devDependencies`
porque eso tocaría el lockfile, que está prohibido. `check.mjs` busca el
`typescript` izado del monorepo subiendo directorios, acepta `--tsc` /
`ZEUS_TSC` para el caso de un worktree pelado, y **falla en voz alta** si no lo
encuentra en vez de saltarse la comprobación en silencio.

---

## 9 · La suite del paquete

`npm test -w @zeus/linea-kit` es `node --test test/*.test.mjs`. Medido con el
grafo de dependencias reproducido (este worktree no tiene `node_modules` propio;
lo reconstruí con junctions al árbol instalado del checkout hermano y los
retiré al terminar, sin dejar rastro):

```
$ ZEUS_VOLUMES_ROOT=C:/S_LAB/wt/z-u245/VOLUMES node --test test/*.test.mjs
# tests 52
# pass 51
# fail 1
# skipped 0
```

Los 9 casos nuevos del gate pasan. El único rojo es
`starterkit-e2e.test.mjs · CA: juguete E2E + linea-system`:

```
error: "Cannot find package 'archiver' imported from
  C:\S_LAB\wt\z-u245\packages\engine\presets-sdk\src\presets\export-bundle.mjs"
code: 'ERR_MODULE_NOT_FOUND'
```

**Es ambiental y ajeno a este WP, y así lo demuestro:**

1. `archiver` es dependencia DECLARADA de `@zeus/presets-sdk`
   (`"archiver": "^7.0.1"`) y está en `package-lock.json`
   (`node_modules/archiver`).
2. No está instalado en el único `node_modules` de esta máquina
   (`C:/S_LAB/v-sdk/node_modules/archiver` no existe). No es un problema del
   repositorio: es un `npm ci` incompleto en el disco.
3. La cadena que rompe es
   `linea-kit/test → @zeus/linea-system → @zeus/presets-sdk → archiver`. No
   contiene UN SOLO fichero que yo haya tocado.
4. `src/` de `linea-kit` es idéntico bit a bit a `main` (§8b, 50/50 OID).

En CI, que corre `npm ci` en la raíz, la dependencia está y este test corre como
siempre.

---

## 10 · Lo que NO cubro

- **La suite completa en verde en este worktree.** Ver §9: falta `archiver` en
  el `node_modules` de la máquina. No lo arreglo porque arreglarlo significa
  tocar el lockfile o instalar, ambas cosas fuera de alcance.
- **`skipLibCheck: false` sobre las dependencias del paquete.** Los dos
  consumidores llevan `types: []`, o sea que no cargan `@types/node` ni los
  tipos de `ajv`/`yaml`. Es deliberado: mide MIS declaraciones y no las ajenas,
  y evita depender de `@types/*` que este paquete no declara. La contrapartida
  es que ninguna de mis declaraciones puede referirse a un tipo de Node (no lo
  hacen: `Buffer` y compañía no aparecen).
- **Ninguna declaración `.d.mts` / `.d.cts` ni condición `require`.** El paquete
  es `"type": "module"` sin condición `require`; un consumidor CommonJS no puede
  cargarlo hoy y añadir esa condición sería un cambio de runtime. Fuera de la
  FRONTERA DURA.
- **El gate no está cableado en `scripts/gates/run.mjs`** (fichero de la raíz,
  fuera de `ALCANCE_DIFF`). Corre por `npm test -w @zeus/linea-kit`, que es lo
  que la matriz de `ci.yml` ejecuta, así que sí está en CI — pero no en el
  tablero de gates del repositorio.
- **`types:check` no está en ningún workflow.** Añadirlo exige tocar
  `.github/workflows/ci.yml`. Se invoca a mano con la orden de §2.
- **`src/tools/fs-util.mjs` no tiene declaración.** Es interno: ni
  `src/tools/index.mjs` lo reexporta ni hay subpath que lo alcance. Declararlo
  habría sido una declaración huérfana, que es justo lo que el vector B3 del
  gate rechaza.
- **La corrección semántica de las formas de runtime NO se comprueba contra el
  runtime.** Las declaraciones las escribí leyendo los literales que cada
  función construye y los schemas; nada las contrasta en ejecución. Un
  desajuste futuro entre `src/` y `types/` lo detecta el gate sólo si es
  estructural (fichero ausente, especificador roto), NO si es de campo. Es
  deuda declarada de este WP.
- **`resolveParte` queda a medias, y lo digo por su nombre.** De los cinco
  campos de su resultado sólo `id` está tipado; `titulo`, `año_ini`, `año_fin`
  y `nodos` son `unknown` porque `manifest-tronco.json` no declara ni una
  propiedad de `meta.partes`. Cerrarlo bien exige declararlas en el schema, que
  es tocar `schemas/` — prohibido en este WP. **Ése es el único subpath cuyo
  consumidor externo va a notar el hueco**, y el arreglo es un WP de schema, no
  de tipos.
