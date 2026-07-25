# Reporte — WP-U174 · Referencias de personajes en story-board

- Rama: `wp/u174-personajes-story-board` (base `origin/main` = `b7a7f8b`)
- Worktree: `C:\S_LAB\.worktrees\z\wp-u174-personajes-story-board`
- Runner: Opus 4.8 (cascada Fable→GPT-5.6 Sol→mejor disponible; corrió el mejor
  disponible en esta estación).

## Qué se hizo

Se extendió el contrato **único** `@zeus/story-board-schema` (WP-U117) con un
campo **opcional** `personajes` de **referencias** al reparto de
`@zeus/reparto-kit` (contrato `reparto/1` de U173). Diseño **refs-only, nunca
corpus embebido**: cada referencia es `{ personajeId }` — la FK a
`reparto.personajes[].id`, exactamente como `Asignacion.personajeId` de U173. El
`nombre`/`rol` (corpus) vive SOLO en el reparto; el board no lo embebe.

- **Un solo schema, mismo contrato.** Cero schema paralelo, cero «v2», cero
  naming de transición (D-3). El campo se añade a `$defs` y como propiedad
  opcional en **ambos** dialectos (`dialectSolve` y `dialectAleph`) del `oneOf`
  existente. Como ambos dialectos son `additionalProperties: true` y `personajes`
  es opcional, **cualquier board previo valida sin cambios** (retro-compatible).
- **Refs-only forzado por schema.** `personajeRef` es `additionalProperties:
  false` con `required: [personajeId]`: intentar embeber corpus
  (`nombre`/`rol`/otro) → **ref inválida** (caso rojo). La *integridad
  referencial* (que el id exista en un reparto concreto) NO es competencia del
  board (que no embebe el reparto) sino de `@zeus/reparto-kit`.
- **Sin tocar `validate.mjs` ni el runtime:** AJV ya compila el schema completo
  (incluidos los nuevos `$defs`) y las sub-compilaciones por dialecto incluyen
  `$defs`, por lo que los `$ref` resuelven sin cambios de código. Validación
  verde y roja salen «gratis» del schema.

## Fragmento literal del schema añadido

Nuevos `$defs` (en `schemas/story-board.schema.json`):

```json
"personajeId": { "type": "string", "minLength": 1 },
"personajeRef": {
  "type": "object",
  "additionalProperties": false,
  "required": ["personajeId"],
  "properties": { "personajeId": { "$ref": "#/$defs/personajeId" } }
},
"personajes": {
  "type": "object",
  "additionalProperties": false,
  "required": ["refs"],
  "properties": {
    "reparto": { "$ref": "#/$defs/nonEmptyString" },
    "refs": { "type": "array", "items": { "$ref": "#/$defs/personajeRef" } }
  }
}
```

Propiedad añadida a `dialectSolve.properties` **y** a `dialectAleph.properties`
(una línea, idéntica en ambos):

```json
"personajes": { "$ref": "#/$defs/personajes" }
```

## Ficheros tocados (todos bajo `packages/engine/story-board-schema/**`)

Modificados:
- `schemas/story-board.schema.json` — `$defs` `personajeId`/`personajeRef`/`personajes` + propiedad opcional `personajes` en ambos dialectos + nota en `description`.
- `test/validate.test.mjs` — 8 tests nuevos (helper `readBoard` + `LOCAL_FIXTURES`).
- `README.md` — sección «Referencias de personajes (opcional · WP-U174)».

Nuevos (fixtures locales del schema):
- `test/fixtures/story-board-con-personajes.solve.json` (verde · solve con refs)
- `test/fixtures/story-board-con-personajes.aleph.json` (verde · aleph con refs)
- `test/fixtures/story-board-sin-personajes.solve.json` (verde · sin campo)
- `test/fixtures/story-board-personaje-ref-invalida.solve.json` (rojo · corpus embebido)

**Fixtures de consumidores tocadas: NINGUNA** (no fue necesario; el campo es
opcional y aditivo). Las fixtures previas de editor-ui (`solve-coagula`,
`aleph-et-omega`) validan **sin cambios** (test 10 las carga contra el schema
modificado — verde).

## CA por CA (evidencia literal)

### CA1 · Refs de personajes validadas por AJV (verde + rojo)

Suite `node --test test/*.test.mjs` (DESPUÉS):

```text
ok 1 - loads canonical schema from package path
ok 2 - SOLVE fixture validates as solve-inline
ok 3 - ALEPH fixture validates as aleph-blocks
ok 4 - synthetic invalid board is rejected with explicable errors
ok 5 - unknown act ref on aleph board is rejected
ok 6 - solve dialect hint rejects aleph-shaped board
ok 7 - solve board WITH personajes refs validates (green)
ok 8 - aleph board WITH personajes refs validates (green, mismo contrato)
ok 9 - solve board WITHOUT personajes still validates (retro-compat)
ok 10 - previous editor fixtures still validate unchanged (no personajes field)
ok 11 - invalid personaje ref is rejected — embedded corpus (refs-only) (red)
ok 12 - personaje ref with empty personajeId is rejected (red)
ok 13 - personaje ref missing personajeId is rejected (red)
ok 14 - personajes without refs array is rejected (red)
# tests 14
# pass 14
# fail 0
# skipped 0
```

Salida literal del validador (verde y rojo):

```text
=== GREEN solve con personajes ===
{"ok":true,"dialect":"solve-inline","actsToWidgets":{"act-0":["panel-elenco"]}}
=== GREEN aleph con personajes ===
{"ok":true,"dialect":"aleph-blocks","actsToWidgets":{"act-0":["tablero-aleph"]}}
=== RED ref invalida (corpus embebido) ===
{"ok":false,"errors":["/personajes/refs/0: must NOT have additional properties"]}
=== RED empty personajeId ===
{"ok":false,"errors":["/personajes/refs/0/personajeId: must NOT have fewer than 1 characters"]}
```

Verde de partida (ANTES, mismo suite): `# tests 6 / # pass 6 / # fail 0`.

### CA2 · Fixtures previas intactas y validando · consumidores verdes

- Fixtures previas: **intactas** (0 cambios en `editor-ui/test/fixtures/**`) y
  validando bajo el schema modificado (test 10, arriba).
- Consumidores ejecutados **contra mi schema del worktree** (vía junction
  anidado `@zeus/story-board-schema` → paquete del worktree; ver §junction):

`editor-ui` (`node --test test/*.mjs`):
```text
# tests 17
# pass 15
# fail 0
# skipped 2
```
Los 2 `skipped` son pre-existentes (release de `Z_SDK-games-library` sin
`ZEUS_GAMES_LIBRARY_ROOT`/`startpack-kit` en esta estación), idénticos al
baseline; ajenos a este WP. Tests de story-board relevantes: `ok 9 - SOLVE
fixture validates as solve-inline dialect`, `ok 10 - aleph fixture validates as
aleph-blocks dialect`, `ok 8 - plaza draft validates with story-board plantilla
dialect` — verdes.

`linea-editor` (`node --test test/*.mjs`):
```text
# tests 6
# pass 6
# fail 0
# skipped 0
```

Baseline (ANTES, contra el schema de base) era idéntico: editor-ui 15 pass/2
skip/0 fail; linea-editor 6 pass/0 fail. Mi cambio aditivo no altera ningún
resultado.

### CA3 · Cero schema paralelo · cero naming de transición (D-3)

- Un único fichero de schema (`story-board.schema.json`), `oneOf` existente sin
  añadir dialectos. Nombres nuevos: `personajes`, `personajeRef`, `personajeId`
  — únicos, sin `legacy`/`v2`/`old`/`nuevo`. `$id`/`title`/versión del paquete
  **sin cambios**.
- Vocabulario vetado (`NovelistEditor`/`novela`/`novelist`) en el diff: **0**.
  `grep -rEic "novela|novelist|noveleditor"` sobre `packages/engine/story-board-schema` = **0**.

### CA · Cero publish / flip private / changesets

No se creó `.changeset/`, no se ejecutó publish, no se tocó `private`, ni
`plan/BACKLOG.md`/`plan/DECISIONES.md`. `git status --short` final:
```text
 M packages/engine/story-board-schema/README.md
 M packages/engine/story-board-schema/schemas/story-board.schema.json
 M packages/engine/story-board-schema/test/validate.test.mjs
?? packages/engine/story-board-schema/test/fixtures/
```
(+ este reporte bajo `plan/REPORTES/`). `node_modules` en todos los niveles está
gitignored (`git check-ignore` confirma) → los junctions no se versionan.

## Constancia del junction (regla de infraestructura)

- **Creado (top-level):** `mklink /J
  C:\S_LAB\.worktrees\z\wp-u174-personajes-story-board\node_modules
  C:\S_LAB\z-sdk\node_modules` — «Unión creada» confirmada; `ajv` alcanzable.
- **Creados (anidados, para forzar que los consumidores resuelvan MI schema y no
  el de base):** `.../packages/editor/editor-ui/node_modules/@zeus/story-board-schema`
  y `.../packages/mesh/linea-editor/node_modules/@zeus/story-board-schema`, ambos
  `→ .../packages/engine/story-board-schema` (verificado por `realpathSync` +
  `grep -c personajes = 6`). Sin ellos, el junction top-level resuelve
  `@zeus/story-board-schema` al **checkout base** (symlink de workspace), y los
  consumidores no ejercitarían el cambio.
- **Eliminados** los 3 junctions con `rmdir` (borra SOLO el enlace) antes de
  cerrar. Constancia de eliminación en §retorno.

## Supuestos / pendientes honestos

- **Forma de la referencia**: `{ personajeId }` estricto + puntero opcional
  `reparto` (URI que aporta el caller; el contrato `reparto/1` no expone un id
  propio del reparto). Se asume que «referencia al reparto» = FK por
  `personajeId` (paralelo a `Asignacion.personajeId`) + URI opcional de origen.
  Validable en contrarrevisión si se prefiere otra granularidad (p.ej. exigir
  `reparto` o patrón de URI).
- **Sin helper de extracción**: no se añadió API en `validate.mjs` para leer los
  refs (el consumidor lee `board.personajes.refs`); se evitó gold-plating fuera
  de CA. Candidato futuro si un consumidor lo pide.
- **Integridad referencial cross-reparto**: fuera de alcance del schema por
  diseño refs-only (el board no embebe el reparto); es competencia de
  `@zeus/reparto-kit` (`crearReparto`). No comprobada aquí — `<pendiente>` para
  U175 si consume ambos.
- **Contrarrevisión independiente PASS**: `<pendiente>` (la ejecuta el
  orquestador; no se pide ✅ sin ella).
