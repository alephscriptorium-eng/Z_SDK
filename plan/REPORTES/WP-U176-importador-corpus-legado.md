# Reporte — WP-U176 · Importador one-off de corpus legado

Rama: `wp/u176-importador-corpus-legado` · base `origin/main` (`e64b461`).
Rol: WORKER (skill swarm-orquestacion). Ola D · Eje II + ceguera transversal.

## Qué se hizo

Tooling **one-off** bajo `scripts/import-legado/` que lee el corpus legado en
**solo lectura** (rutas inyectadas por env del operador; ninguna horneada) y
emite los formatos **existentes** del engine con IDs zeus deterministas
(precedente D-19). No reconstruye ningún editor: traduce a contratos ya vivos.

Ficheros creados (todos bajo `scripts/import-legado/`, más este reporte):

- `ids.mjs` — IDs zeus deterministas (`<prefijo>-<slug>-<hash8>`; sin reloj ni
  aleatoriedad; el hash se deriva de claves estables de origen, no del texto
  humano).
- `fuente.mjs` — lectura SOLO LECTURA + normalización a modelo neutro `obras`.
  La colección de obras se localiza **sin nombrarla en código** (cualquier
  clave de `resources` que no sea uno de los tres pozos `characters`/`scenes`/
  `chapters`; override por `IMPORT_SRC_WORKS_KEY`).
- `importar.mjs` — transformación pura obra → triple de formatos destino.
- `validar.mjs` — corre los validadores existentes (AJV story-board +
  validador reparto + schemas de línea).
- `escribir.mjs` — escritura de la salida bajo `<IMPORT_OUT>/LINEAS/`.
- `index.mjs` — CLI (`--check` valida sin escribir; sin flags escribe).
- `README.md` — doc de uso (comando + nombres de env, sin valores).
- `test/importar.test.mjs` + `test/fixtures/` — tests con fixtures
  **sintéticas** neutras (corpus JSON `corpus.json` + obra markdown `obra-md/`;
  contenido inventado, mismo shape que el corpus real).

## Mapeo de formatos (origen → destino)

| Origen (neutro)           | Destino                                                                 | Validador                         |
| ------------------------- | ----------------------------------------------------------------------- | --------------------------------- |
| obra                      | una línea + un story-board + un reparto                                  | —                                 |
| `chapters` → tramos       | `nodos-document` + `manifest-tronco` + `nodo-meta[]` + `lineas-registry` | schemas `@zeus/linea-kit`         |
| `scenes` → actos          | `acts[]` del story-board (dialecto solve-inline)                         | AJV `@zeus/story-board-schema`    |
| `characters` → personajes | `reparto.personajes[]` + `story-board.personajes.refs[]` (refs-only U174) | validador `@zeus/reparto-kit`     |

`asignaciones: []` (los actores/peer-card llegan después); `politica` mínima
por rol. Personajes al story-board **solo por referencia** (nunca embebidos).

## Comando de uso (nombres de env; sin valores — el operador los inyecta)

```sh
# Validar sin escribir
IMPORT_SRC_JSON=… IMPORT_SRC_OBRA=… node scripts/import-legado/index.mjs --check

# Importar y escribir bajo $IMPORT_OUT/LINEAS
IMPORT_SRC_JSON=… IMPORT_SRC_OBRA=… IMPORT_OUT=… node scripts/import-legado/index.mjs
```

Env: `IMPORT_SRC_JSON`, `IMPORT_SRC_OBRA`, `IMPORT_SRC_WORKS_KEY`, `IMPORT_OUT`,
`IMPORT_NOW`, `CEGUERA_PATTERN` (todas opcionales; al menos una fuente). El
directorio de salida es del operador y **no** entra en git.

## Tests (`node --test`, salida literal)

```
1..11
# tests 11
# suites 0
# pass 11
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

Cubren: lectura de ambas fuentes; story-board verde contra AJV; reparto
shape+ceguera; formatos de línea verdes; determinismo (mismo input → misma
salida, ids con forma zeus); refs-only U174; e2e escribe a temporal y
`validateStoryBoardFile` verde; ceguera 0 en el bundle serializado; guard de
ceguera marca un patrón presente; override `worksKey`; `IMPORT_NOW` determinista.

## CA por CA (evidencia literal)

- **CA1 · Import reproducible documentado (comando + nombres de env, sin
  valores).** CUMPLE. README `scripts/import-legado/README.md` + §comando
  arriba; CLI `--check` verde contra fixtures sintéticas:
  ```
  import-legado: 2 obra(s) → líneas + story-board + reparto
    linea-el-atlas-de-las-brumas-5c3a3c66: OK
    linea-obra-md-e582fc48: OK
    lineas-registry: OK
  import-legado: --check verde (sin escritura).
  ```
  (Evidencia regenerada desde el HEAD final — ver §Corrección tras
  contrarrevisión.)
- **CA2 · Salida valida contra schemas existentes (AJV story-board verde +
  validador reparto).** CUMPLE. Tests 2–4 verdes: story-board contra
  `@zeus/story-board-schema` (AJV), reparto contra `@zeus/reparto-kit`
  (`isRepartoShaped` + `validarReparto`), y además líneas contra
  `@zeus/linea-kit` (nodos-document / manifest-tronco / nodo-meta /
  lineas-registry). E2e: `validateStoryBoardFile` verde desde el fichero escrito.
- **CA3 · Grep de ceguera (patrón enmascarado) = 0 literal en todo lo
  commiteado.** CUMPLE. Patrón enmascarado `«n·velist|n·vela|N·velistEditor»`
  (case-insensitive) sobre `scripts/import-legado/` (incl. README, fixtures,
  tests) y este reporte:
  ```
  conteo literal = 0
  ```
  El corpus fuente NO entra en git. El patrón de ceguera de los tests se
  ensambla en runtime desde códigos de carácter: el token literal jamás se
  persiste.
- **CA4 · Cero rutas absolutas locales en el árbol.** CUMPLE. Grep de
  `[A-Za-z]:\`, `/c/`, `S_LAB`, `.worktrees`, `C:/Users`, `AppData` sobre
  `scripts/import-legado/` = `0`. Todas las rutas se inyectan por env.
- **CA5 · Cero publish / flip private / changesets.** CUMPLE. El diff toca
  solo `scripts/import-legado/**` + este reporte; sin `.changeset/`, sin
  `package.json` de paquete, sin flip `private`, sin `npm publish`.

## Alcance del diff

`scripts/import-legado/**` (código + README + fixtures sintéticas + tests) +
`plan/REPORTES/WP-U176-importador-corpus-legado.md`. No se tocó linea-editor
(dueño U175), ni schemas/kits de engine (solo lectura), ni `.changeset/`, ni
`plan/BACKLOG.md`.

## Junctions (constancia)

Se creó junction `node_modules` → `C:\S_LAB\z-sdk\node_modules` para resolver
los paquetes workspace (`@zeus/reparto-kit`, `@zeus/story-board-schema`,
`@zeus/linea-kit`, `@zeus/protocol`, `ajv`, `yaml`). **Eliminado antes de
cerrar** (constancia en el retorno). No se commitea (node_modules gitignorado).

## Pendientes honestos

- La **ejecución real** contra el corpus legado la hará el operador después,
  inyectando las envs con sus rutas: la entrega es el tooling probado con
  fixtures sintéticas. Cuando el `resources` real traiga la colección de obras
  bajo su clave de origen, el importador la auto-detecta (o el operador fija
  `IMPORT_SRC_WORKS_KEY`) — sin que ese nombre entre nunca en el árbol.
- Reparto con `asignaciones: []` por diseño: el casting de actores (identidad
  peer-card) es un paso posterior, fuera de este WP.
- `año_ini` de los nodos usa el orden posicional del tramo (0,1,2…) como
  ordinal determinista: el corpus no trae años; satisface `nodo-meta` y ordena
  la línea.

## Corrección tras contrarrevisión (OBS-1)

La contrarrevisión independiente detectó que la evidencia de CA1 citaba IDs
**rancios** (`…-8eb402d9` / `…-e3cfb387`): se capturaron ANTES del fix ASCII de
`ids.mjs` y no se regeneraron. Corregido: la salida de `--check` del bloque CA1
se reejecutó desde el HEAD final y ahora muestra los IDs reales
(`linea-el-atlas-de-las-brumas-5c3a3c66` / `linea-obra-md-e582fc48`). Único
bloque afectado (grep del reporte: no había más IDs hasheados citados).

Matiz honesto sobre el drift: el fix ASCII (commit `18e565d`, rango combinante
literal → escape `\u0300-\u036f`) **sí cambió la salida determinista**, al
contrario de lo que decía el mensaje de aquel commit («sin cambio de
comportamiento»). El blob previo (`4524bb1`) coló un NUL y marcas combinantes
literales que perturbaban la entrada de `hash8` — verificado empíricamente: el
blob viejo daba `hash8('linea','w-1')=8eb402d9`, el HEAD limpio da `5c3a3c66`
para la misma llamada. El HEAD es la salida canónica correcta y sigue siendo
**determinista** (dos corridas de `--check` + cálculo directo de `hash8`
coinciden). El código nunca fue incorrecto; la corrupción de bytes del fichero
sí desplazaba el hash, y el fix ASCII lo sanea.
