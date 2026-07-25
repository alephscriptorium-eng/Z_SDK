# WP-U175 · Autoría gateada por reparto sobre `@zeus/linea-editor`

Rama: `wp/u175-autoria-gateada-linea-editor` · Worktree:
`C:\S_LAB\.worktrees\z\wp-u175-autoria-gateada-linea-editor` · Base: `origin/main`
(`e64b461`).

## Qué se hizo

Se **extendió la autoría gateada EXISTENTE** de `@zeus/linea-editor`
(`crear_linea` / `export_story_board`, gate visible con `approvalToken`) con dos
caras nuevas sobre el **mismo** mecanismo, sin gate paralelo:

- **U173 · permisos por reparto**: el gate único (`requireMutationApproval`)
  ahora, cuando la llamada aporta un `reparto` (`@zeus/reparto-kit` `reparto/1`) +
  `card` (peer-card de `@zeus/protocol`, con `ssbId`) + `personajeId`, exige que la
  peer-card **pueda `reparto:interpretar`** ese personaje. Se evalúa con
  `evaluarPermiso(...,{ exigirSeat:true })`: card sin asiento → `seat_ausente`;
  `ssbId` manipulado post-firma → `seat_invalido`.
- **U174 · personajes en el story-board**: `export_story_board` con `reparto`
  emite el campo opcional `personajes` (**refs-only** `{ personajeId }`) y valida
  el board contra `@zeus/story-board-schema` (AJV).

## Flujo del gate: actual → extendido (3-4 líneas)

`crear_linea`/`export_story_board` → **un solo** `requireMutationApproval` →
**Cara V (siempre)**: `approve` + `approvalToken` exacto (sin cambios). **Cara
U173 (aditiva)**: si hay `reparto`, tras el token evalúa `evaluarPermiso` con
`exigirSeat:true`; deniega con `rule: linea-editor.reparto_<motivo>`. El **mismo**
objeto `gate` lleva ambas caras (`gate.gate_line` + `gate.reparto`) y es visible en
`editor://info`, la server card y los payloads de error. Sin `reparto` el gate se
comporta **idéntico** al token-only previo (retro-compatible). El export, cuando
hay reparto, añade `personajes` refs al board y valida U174.

## Integración (ficheros)

- `src/gate.mjs`: `requireMutationApproval` extendido con la cara reparto;
  nuevos `evaluateRepartoAuthorship`, `AUTHORSHIP_PERMISO` (`reparto:interpretar`),
  `REPARTO_GATE_LINE`. Importa `evaluarPermiso`/`isRepartoShaped` de
  `@zeus/reparto-kit` (cero cripto/identidad propia; delegada al kit/protocol).
- `src/export-story-board.mjs`: nuevo `buildPersonajesRefs` (refs-only);
  `lineToStoryBoard(lineMeta, { reparto, repartoUri })` y
  `exportStoryBoardFromLine` emiten `personajes` y `refs.personajes` (ids) cuando el
  reparto los aporta.
- `src/tools.mjs`: ambas tools propagan `reparto`/`card`/`personajeId`/`now` al
  gate; el export además pasa `reparto`/`repartoUri` al emisor.
- `src/editor-server.mjs`: `editor://info` y la card exponen la cara reparto
  (`gate.reparto`, motivos de deny, `personajes`); `inputSchema` de ambas tools
  admite `reparto`/`card`/`personajeId` (y `repartoUri` en export) opcionales.
- `src/index.mjs`: re-exporta lo nuevo.
- `package.json`: `+@zeus/reparto-kit` (dep runtime), `+@zeus/protocol`
  (devDep para construir peer-cards en test). **No** se tocó ningún campo de
  publish (`publishConfig`/`files`/`private`/`version`).
- `README.md`: documentada la cara reparto y los personajes U174.
- `test/reparto-autoria.test.mjs`: nuevo (11 tests).

## CA por CA (evidencia literal)

### CA · Autoría permitida/denegada por reparto (verde/rojo)

```
ok 5 - CA1 verde: actor con personaje asignado + asiento válido PUEDE autorar (crear_linea)
ok 6 - CA1 rojo: actor SIN personaje en el reparto NO puede autorar → personaje_no_en_reparto
ok 7 - CA1 rojo: card SIN asiento con exigirSeat forzado → seat_ausente
ok 8 - CA1 rojo: asiento inválido (ssbId manipulado post-firma) → seat_invalido
ok 9 - CA1 rojo: personaje asignado pero el rol NO concede autorar → rol_sin_permiso
```
Verde: actor con `pj-prota` asignado + peer-card firmada → `ok:true`,
`gate.reparto.motivo='concedido'`, volumen escrito. Rojo: actor sin personaje,
sin asiento (`seat_ausente`), asiento inválido (`seat_invalido`,
`gate.reparto.seat_error='seatSignature mismatch'`) o rol sin permiso → `ok:false`
y **sin** volumen. `exigirSeat` y los motivos `seat_invalido`/`seat_ausente`
ejercitados explícitamente.

### CA · Export valida contra story-board-schema U174 (AJV verde)

```
ok 13 - CA2 verde: export con reparto emite personajes refs y VALIDA contra U174 (AJV)
ok 14 - CA2 retro-compat: export SIN reparto no lleva personajes y sigue validando U174
ok 15 - U174 refs-only: buildPersonajesRefs descarta corpus; el schema rechaza refs con nombre/rol
```
El board emitido lleva `personajes.reparto = reparto://…/reparto.json` y
`personajes.refs = [{personajeId}]` (solo ids). `validateStoryBoard` y
`validateStoryBoardFile` (sobre el fichero escrito) → `ok:true`. Refs-only
probado: cada ref es exactamente `{ personajeId }`; el payload horse no filtra
`nombre`/`rol` ni nombres de corpus; un board con `nombre`/`rol` embebidos en la
ref es **rechazado** por el schema estricto U174.

### CA · Gate único extendido, cero paralelo

```
ok 10 - gate único: la cara token se aplica ANTES que la de reparto (token_mismatch corta)
ok 11 - gate único: sin reparto se comporta como el gate token-only previo (retro-compat)
ok 12 - evaluateRepartoAuthorship: un reparto mal formado deniega sin lanzar → reparto_no_shaped
```
Un solo `requireMutationApproval`; el objeto `gate` transporta ambas caras. La
cara reparto es aditiva (solo evalúa tras superar el token) y no existe segundo
mecanismo. Los tests base (eje V, e2e horse, eje IV) siguen verdes sin cambios.

### CA · Cero publish/flip/changesets

No se tocó `publishConfig`/`files`/`private`/`version` de `linea-editor` ni
`.changeset/` ni `plan/BACKLOG.md`. `git status` = solo
`packages/mesh/linea-editor/**` + este reporte.

## Suites (literal)

**ANTES (base de partida, solo tests preexistentes):**
```
# tests 6
# pass 6
# fail 0
```
**DESPUÉS (con los nuevos):**
```
ok 1 - eje V: gate visible and auditable
ok 2 - eje II/III: crearLinea defined once in linea-kit/tools
ok 3 - horse offer: preset refs only (no corpus keys)
ok 4 - ceguera ampliada: pack tree (src+test) free of método tokens
ok 5 - CA1 verde: actor con personaje asignado + asiento válido PUEDE autorar (crear_linea)
ok 6 - CA1 rojo: actor SIN personaje en el reparto NO puede autorar → personaje_no_en_reparto
ok 7 - CA1 rojo: card SIN asiento con exigirSeat forzado → seat_ausente
ok 8 - CA1 rojo: asiento inválido (ssbId manipulado post-firma) → seat_invalido
ok 9 - CA1 rojo: personaje asignado pero el rol NO concede autorar → rol_sin_permiso
ok 10 - gate único: la cara token se aplica ANTES que la de reparto (token_mismatch corta)
ok 11 - gate único: sin reparto se comporta como el gate token-only previo (retro-compat)
ok 12 - evaluateRepartoAuthorship: un reparto mal formado deniega sin lanzar → reparto_no_shaped
ok 13 - CA2 verde: export con reparto emite personajes refs y VALIDA contra U174 (AJV)
ok 14 - CA2 retro-compat: export SIN reparto no lleva personajes y sigue validando U174
ok 15 - U174 refs-only: buildPersonajesRefs descarta corpus; el schema rechaza refs con nombre/rol
ok 16 - slice e2e: horse tools/call crear_linea gated → volume + kit schemas
ok 17 - eje IV: CLI crearLinea same contract as gated tool (second client)
1..17
# tests 17
# pass 17
# fail 0
# skipped 0
# todo 0
```
Runner: `node --test test/*.mjs` (convención del package: `"test": "node --test
test/*.mjs"`).

## Junctions (constancia)

- CREADO: `mklink /J <worktree>\node_modules C:\S_LAB\z-sdk\node_modules`
  (junction top-level; resuelve `@zeus/reparto-kit`/`story-board-schema`/`protocol`/
  `presets-sdk`/`linea-kit` desde main — todos ya en main, ninguno tocado).
- ELIMINADO antes de terminar: `rmdir <worktree>\node_modules` (ver retorno).
- No se creó ningún junction adicional (no se tocó `packages/engine/**`).

## Supuestos / pendientes honestos

- **Reparto aditivo (supuesto de diseño):** la cara reparto se activa solo cuando
  la llamada aporta un `reparto`. Es lo que preserva la retro-compatibilidad (las
  llamadas y tests token-only siguen igual) sin inventar un gate paralelo. Si el
  orquestador quisiera reparto **obligatorio** para toda autoría, sería un flip de
  política de una línea (rechazar `reparto == null`), fuera del alcance de este WP.
- **Permiso de autoría = `reparto:interpretar`** (verbo del catálogo congelado de
  `@zeus/reparto-kit`, glosado allí como «actuar/autorar el personaje asignado»).
- **`personajes.refs` = elenco completo del reparto** (todos los `personajes`),
  coherente con la fixture U174 `story-board-con-personajes.solve.json`. El puntero
  `personajes.reparto` por defecto es `reparto://<lineaId>/reparto.json`
  (override con `repartoUri`).
- Integridad referencial `personajeId ↔ reparto` es competencia de
  `@zeus/reparto-kit` (el board no embebe el reparto); el schema U174 solo valida la
  **forma** refs-only, y así se emite.
- Deps añadidas (`@zeus/reparto-kit` runtime, `@zeus/protocol` dev) son campos
  no-publish; U178 (publish-ready) es dueño de los manifests de publish, intactos.
