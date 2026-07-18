# WP-U117 · story-board-schema — reporte

| dato | valor |
| ---- | ----- |
| agente | swarm worker (Cursor) |
| fecha | 2026-07-18 |
| rama | `wp/u117-story-board-schema` (zeus + library) |
| commit(s) | zeus `9003ba1` · library `233c564` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se creó el paquete publicable `@zeus/story-board-schema` en
`packages/engine/story-board-schema` con el JSON Schema de U115 (más
`not.required: blocks` en `dialectSolve` para alinear con el editor) y
helper AJV + post-check semántico `blocks[].act → act id`.

`@zeus/editor-ui` depende del paquete: `STORY_BOARD_DIALECTS` conserva
ids/labels/resolve/detect; la validación de forma ya no usa regex a mano.
En `Z_SDK-games-library`, el kit carpeta-dramaturgo importa el paquete,
demuele `schema/story-board.schema.json` y deja un README de puntero.

## Archivos tocados

**zeus**
- creado `packages/engine/story-board-schema/**` — schema + validate + tests + README
- creado `.changeset/wp-u117-story-board-schema.md` — minor
- modificado `packages/editor/editor-ui/src/world/story-board-dialects.mjs` — AJV vía paquete
- modificado `packages/editor/editor-ui/package.json` — dep `@zeus/story-board-schema`
- modificado `packages/editor/editor-ui/README.md` — contrato único
- modificado `package-lock.json` — workspace

**library**
- modificado `kits/carpeta-dramaturgo/scripts/validate-story-board.mjs` — reexport CLI
- borrado `kits/carpeta-dramaturgo/schema/story-board.schema.json`
- creado `kits/carpeta-dramaturgo/schema/README.md` — puntero al paquete
- modificado `kits/carpeta-dramaturgo/{README,test/run}.mjs` — CA U117
- modificado `package.json` / `package-lock.json` — dep file: + quita `ajv` raíz (entra por el paquete / transitivas)

## Evidencia

```
$ npm test -w @zeus/story-board-schema
# tests 6
# pass 6
# fail 0

$ node --test packages/editor/editor-ui/test/world-draft.test.mjs
# tests 11
# pass 11
# fail 0

$ rg ACT_ID packages/editor/editor-ui
(sin matches)  → ACT_ID=0

$ npm run test:carpeta-dramaturgo   # library worktree, ZEUS_SDK_ROOT→zeus WT
--- @zeus/story-board-schema (paquete zeus, no copia kit) ---
✅ package → …/packages/engine/story-board-schema/package.json
✅ no kits/carpeta-dramaturgo/schema/story-board.schema.json
✅ synthetic invalid board rejected
✅ fixtures SOLVE + ALEPH
✅ plantilla / toy / from-solve-mini
🟢 test:carpeta-dramaturgo OK
```

Arranque UI editor: ⏳ sin verificar (CA cubierto por world-draft + schema unit;
no se levantó `npm start -w @zeus/editor-ui`).

Nota: `npm test -w @zeus/editor-ui` completo falla 3 tests de entorno
preexistentes (`@zeus/startpack-kit` no resuelto desde library main sibling;
openapi sync) — fuera de alcance; world-draft del CA está verde.

## Demolición

- Library: `kits/carpeta-dramaturgo/schema/story-board.schema.json` borrado
  (dir `schema/` solo con README puntero).
- Editor: `ACT_ID`, `WIDGET_ID`, `validateSolveShape`, `validateAlephBlocks`
  eliminados.

```
$ rg ACT_ID packages/editor/editor-ui   → 0
$ rg WIDGET_ID|validateSolveShape|validateAlephBlocks packages/editor/editor-ui → 0
$ test ! -f kits/.../schema/story-board.schema.json → local_schema_gone=1
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no
- [x] Cadenas if/switch que debieron ser tabla: dialectos siguen en tabla
  `STORY_BOARD_DIALECTS`; familia schema vía `schemaFamilyForDialect`
- [x] Duplicación: schema movido, no copiado; editor/library importan
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no (`legacy`/`v2`/…)
- [x] Demolición completa (grep arriba): sí
- [x] Tests prueban comportamiento: fixtures + inválido + act ref + dialect mismatch
- [ ] Arranque real verificado: ⏳ sin verificar (solo unit/CA kit)
- [x] README/specs del paquete siguen siendo verdad: README paquete + kit + editor
- [x] El diff contiene solo el alcance del WP: sí (bins ajenos revertidos)

## Hallazgos fuera de alcance

- Tres tests e2e/release de `editor-ui` fallan por
  `Cannot find package '@zeus/startpack-kit'` al resolver desde library
  sibling (residual ya anotado en U114) — no tocado.
- Schema: se añadió `not.required: ["blocks"]` a `dialectSolve` (alineación
  editor); no estaba en U115 literal — documentado aquí.

## Dudas / bloqueos

Ninguno. Pregunta PRACTICAS §1.11: ¿pozo (u otro juego narrativo) puede
consumir `@zeus/story-board-schema` tal cual? **Sí** — el contrato habla
solo `acts` / `widgets` / `blocks` / `uichain`, sin nombres de juego.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
