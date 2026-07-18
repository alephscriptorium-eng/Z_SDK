# WP-U116 · cast-table-alias — reporte

| dato | valor |
| ---- | ----- |
| agente | swarm worker (Cursor) |
| fecha | 2026-07-18 |
| rama | `wp/u116-cast-table-alias` |
| commit(s) | _(ver push; este reporte en el mismo commit feat)_ |
| estado propuesto | listo para revisión |

## Qué se hizo

Se aplicó **GO diseño A**: la fábrica por defecto de `@zeus/view-kit`
registra el id canónico `cast-table` y el sinónimo `panel-elenco` hacia
el mismo `renderCastTableWidget` (tabla `CAST_TABLE_WIDGET_IDS`). El
fallback de id en el render pasó de `panel-elenco` a `cast-table`.
README documenta canónico vs alias. SOLVE no se tocó (sigue pudiendo
declarar `panel-elenco`). Changeset patch.

**¿pozo puede consumir esto tal cual?** Sí: puede montar `cast-table`
sin conocer vocabulario de otro juego, o ignorar el registry.

## Archivos tocados

| archivo | acción |
| ------- | ------ |
| `packages/engine/view-kit/src/widgets.mjs` | modificado — tabla ids + fallback neutro |
| `packages/engine/view-kit/src/index.mjs` | modificado — export `CAST_TABLE_WIDGET_IDS` |
| `packages/engine/view-kit/test/widgets.test.mjs` | modificado — CA cast-table + alias |
| `packages/engine/view-kit/README.md` | modificado — canónico vs alias |
| `.changeset/wp-u116-cast-table-alias.md` | creado — patch view-kit |
| `plan/REPORTES/WP-U116-cast-table-alias.md` | creado — este reporte |

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### `npm test -w @zeus/view-kit`

```
# tests 39
# pass 39
# fail 0
```

### `npm run lint`

```
✖ 11 problems (0 errors, 11 warnings)
```

(warnings preexistentes; 0 errors)

### `npm run gates`

```
gates: OK (0 offenders)
```

### Gate two-games

```
rg solve-coagula|SOLVE|REIC|SolveCoagula packages/engine/view-kit/ → (vacío)
```

### Arranque visual

⏳ sin verificar — WP de registry/unit; no se levantó vista SOLVE (boards
no migran; alias mantiene contrato).

## Demolición

- Fábrica que *solo* registraba `'panel-elenco': renderCastTableWidget`
  → tabla `CAST_TABLE_WIDGET_IDS` (`cast-table` + `panel-elenco`).
- Fallback `ctx.id || 'panel-elenco'` → `ctx.id || 'cast-table'`.

```
rg "ctx\.id \|\| 'panel-elenco'" packages/engine/view-kit/ → (vacío)
rg "'panel-elenco': renderCastTableWidget" packages/engine/view-kit/src/ → (vacío)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no
- [x] Cadenas if/switch que debieron ser tabla: no — `CAST_TABLE_WIDGET_IDS`
- [x] Duplicación con otros paquetes (busqué antes de responder): no
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: gate OK (evité `legacy`
  en comentario tras primer rojo del gate)
- [x] Demolición completa (grep arriba): sí
- [x] Tests prueban comportamiento, no solo «no explota»: montaje por
  `cast-table`, alias mismo renderer, fallback id
- [x] Arranque real verificado: ⏳ unit only (alcance registry)
- [x] README/specs del paquete siguen siendo verdad: README actualizado
- [x] El diff contiene solo el alcance del WP: sí (view-kit + changeset +
  reporte)

## Hallazgos fuera de alcance

- Labels ES hardwired («elenco vacío», columnas participante/rol/eje)
  siguen en el render — residual opcional del WP; cola, no bloquea CA.
- U117 (schema único) no tocado; puede correr en paralelo.

## Dudas / bloqueos

Ninguno.

---

## Revisión del orquestador

**Aceptado ✅** (orquestador / 2026-07-18) — **sin merge / sin ✅ BACKLOG /
sin push** hasta GO usuario (esta revisión solo deja rastro en la rama).

### Verificado
- Diff `main...HEAD`: 1 commit producto `0eec9eb` (`feat(view-kit): …`);
  alcance solo view-kit + changeset + reporte (worker no tocó BACKLOG ni
  U117).
- CA GO **A**: factory `CAST_TABLE_WIDGET_IDS` (`cast-table` canónico +
  alias `panel-elenco` → mismo `renderCastTableWidget`); tests montan por
  id neutro y alias; fallback `ctx.id || 'cast-table'`; README veraz;
  SOLVE boards no tocados.
- Demolición: greps `ctx.id || 'panel-elenco'` y
  `'panel-elenco': renderCastTableWidget` → vacío.
- PRACTICAS §1/§3/§6: tabla de ids (no if/switch), sin nombres de
  transición, changeset patch `@zeus/view-kit`, commit convencional.
- Re-smoke orquestador (worktree): `npm test -w @zeus/view-kit` →
  39/39; `npm run gates` → OK; lint 0 errors / 11 warnings preexistentes;
  `rg solve-coagula|SOLVE|REIC|SolveCoagula packages/engine/view-kit/` →
  vacío (case-sensitive).

### Hallazgos (cola; no bloquean)
- Labels ES hardwired en render (residual ya anotado en BACKLOG U116).
- Rama 1 commit detrás de `main` (`d886a38` asigna U117) — al mergear,
  integrar/rebase sobre tip de `main`; no pisa paths U117.

### Merge (cuando usuario autorice)
1. Rebase/merge `main` → `wp/u116-cast-table-alias` si hace falta.
2. Merge a `main`; orquestador marca ✅ BACKLOG en `main`.
3. `git worktree remove .worktrees/wp-u116-cast-table-alias`.
