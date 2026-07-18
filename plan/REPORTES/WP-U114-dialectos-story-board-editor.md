# WP-U114 · dialectos-story-board-editor — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (frente editor / Cursor) |
| fecha | 2026-07-18 |
| rama | `wp/u114-dialectos-story-board-editor` |
| commit(s) | `6ba6b94` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se reemplazó el validador hardcode `story-board-min` / `validateSolveInlineBoard`
por un registro tabla `STORY_BOARD_DIALECTS` (`solve-inline`, `plantilla`,
`aleph-blocks`). `validateDraft` / `normalizeStoryBoard` resuelven dialecto
(`board.dialect` → hint de juego → detección por forma) y rechazan dialecto
desconocido con lista de ids conocidos. Plaza usa dialecto `plantilla`.
Fixtures herméticos SOLVE + ALEPH bajo `test/fixtures/`. README, vista world
y OpenAPI (summary materials + regenerate) al día. **No** se tocó U115
(AJV / kit carpeta).

**¿Un segundo juego narrativo puede registrar otro dialecto sin tocar
validateDraft?** Sí: añadir fila a `STORY_BOARD_DIALECTS`; `validateDraft`
solo llama `validateStoryBoard` vía tabla.

## Archivos tocados

| archivo | acción |
| ------- | ------ |
| `packages/editor/editor-ui/src/world/story-board-dialects.mjs` | creado — registro + validate |
| `packages/editor/editor-ui/src/world/story-board-min.mjs` | borrado — demolición |
| `packages/editor/editor-ui/src/world/materials.mjs` | modificado — registry + plantilla |
| `packages/editor/editor-ui/src/views/world_view.mjs` | modificado — hint dialectos |
| `packages/editor/editor-ui/src/contract.mjs` | modificado — summary materials |
| `packages/editor/editor-ui/spec/openapi.yaml` | regenerado — sync contract |
| `packages/editor/editor-ui/README.md` | modificado — tabla dialectos |
| `packages/editor/editor-ui/test/world-draft.test.mjs` | modificado — CA dialectos |
| `packages/editor/editor-ui/test/fixtures/solve-coagula-story-board.json` | creado — fixture SOLVE |
| `packages/editor/editor-ui/test/fixtures/aleph-et-omega-story-board.json` | creado — fixture ALEPH |
| `plan/REPORTES/WP-U114-dialectos-story-board-editor.md` | creado — este reporte |

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### CA unit (`world-draft` + `spec-sync`)

```
# tests 12
# pass 12
# fail 0
```

Incluye: SOLVE → `solve-inline`; ALEPH → `aleph-blocks`; unknown dialect
rechazo; plaza `plantilla`; materials.dialects; openapi sync.

### lint / gates

```
npm run lint → ✖ 11 problems (0 errors, 11 warnings) · exit 0
npm run gates → gates: OK (0 offenders)
```

### suite completa `npm test -w @zeus/editor-ui`

```
# tests 17
# pass 14
# fail 3
```

Fallos **fuera de alcance U114** (env sibling library):

```
Cannot find package '@zeus/startpack-kit' imported from
.../Z_SDK-games-library/packages/startpack-sketch/index.mjs
(y análogo startpack-plaza) → routes release sketch/plaza 500
```

`materializeStartPack` unit (sin Notario) **verde**. Release e2e Notario:
`⏳ sin verificar` hasta `npm install` workspace en library (dep U110 ya
en main library; link local roto en este checkout).

### Arranque UI

```
⏳ sin verificar visualmente (ZEUS_OPEN_BROWSER no usado).
```

## Demolición

1. Borrado `story-board-min.mjs`.
2. Cero `validateSolveInlineBoard` / mensajes «→ U114» en UI.

```
$ rg -n "story-board-min|validateSolveInlineBoard|Registro completo de dialectos → U114" packages/editor/editor-ui
(sin hits de símbolos demolidos; solo menciones WP-U114 en README/comentarios)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no.
- [x] Cadenas if/switch → tabla: `STORY_BOARD_DIALECTS` + resolve.
- [x] Duplicación: validadores alineados a kit U86 (no import kit —
      scripts no empaquetados); U115 unificará schema. No copy de AJV.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres: sin -old/-v2; dialect ids genéricos.
- [x] Demolición: `story-board-min` borrado; grep limpio.
- [x] Tests comportamiento: fixtures reales + unknown dialect.
- [x] Arranque real: UI ⏳; Notario e2e ⏳ (env startpack-kit).
- [x] README/OpenAPI: veraces; openapi regenerado.
- [x] Diff solo alcance WP: sí (sin BACKLOG; sin kit U115).

### Regla de los dos juegos

Editor (no engine). Dialectos sin nombres de juego en ids. ¿pozo/delta
ignoran el camino narrativo? Sí (kind toy sin story-board).

## Hallazgos fuera de alcance

1. Sibling `Z_SDK-games-library` sin link local `@zeus/startpack-kit` →
   fallan routes release e2e del editor (preexistente / ops local; no U114).
2. U115 sigue pendiente: schema AJV en kit; no solapado aquí.

## Dudas / bloqueos

Ninguno de producto. Listo revisión orquestador (merge tras ✅).

## Nota deps U115

U114 **no depende** de U115. U115 = schema-as-truth en
`kits/carpeta-dramaturgo`; U114 = registro en editor. No cablear AJV
aquí.

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** — 2026-07-18 · orquestador

### CA (todos OK)

1. Registro tabla `STORY_BOARD_DIALECTS` (`solve-inline`, `plantilla`,
   `aleph-blocks`); `validateDraft` / `normalizeStoryBoard` vía
   `validateStoryBoard` — sin if-creciente. Plaza → dialecto `plantilla`.
2. Fixture SOLVE → `solve-inline`; fixture ALEPH → `aleph-blocks`;
   dialecto desconocido (board + hint) → rechazo con lista de conocidos.
3. OpenAPI/README al día (`materials` summary + dialects; README tabla).
4. Re-smoke orquestador (worktree):
   - `node --test test/world-draft.test.mjs` → **11/11**
   - `node --test test/spec-sync.test.mjs` → **1/1**
   - suite `@zeus/editor-ui`: **15 pass / 2 fail** — fallos solo
     routes release sketch/plaza (`Cannot find package '@zeus/startpack-kit'`
     desde sibling library). **No bloqueante** para U114: residual env
     local (hallazgo worker); `materializeStartPack` unit verde; U114 no
     tocó rutas release. Documentado; ops/link library fuera de alcance.
5. `npm run gates` → `gates: OK (0 offenders)`.
6. U115 no tocado (AJV / kit carpeta). Worker no editó `plan/BACKLOG.md`.

### PRACTICAS / Demolición

- §1.2 tabla registry; §1.6 rechazo explicable; §1.9 README+OpenAPI;
  §1.10 tests de comportamiento con fixtures.
- Demolición: `story-board-min.mjs` borrado; grep
  `story-board-min|validateSolveInlineBoard` → cero símbolos vivos.
- Alcance acotado (`main...HEAD`): editor-ui world + tests/fixtures +
  docs + reporte. Tip feat `6ba6b94` + tip docs `6d507e5`.
- Commits convencionales. editor-ui privado → sin changeset (PRACTICAS §6).

### Merge (cuando usuario autorice)

1. zeus `wp/u114-dialectos-story-board-editor` → `main` (incl. esta
   revisión) — **sin** rama library.
2. Orquestador: ✅ BACKLOG en `main` + `git worktree remove`
   `.worktrees/wp-u114-dialectos-story-board-editor`
3. Luego **U115** ⬜ (schema AJV kit; no solapar editor) — abrir 🔶
   cuando el usuario lo pida.

**Push:** no intentado. **✅ BACKLOG:** no aplicado (pendiente autorización
merge del usuario).
