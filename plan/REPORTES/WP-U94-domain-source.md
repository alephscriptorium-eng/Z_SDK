# WP-U94 · domain-source — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok 4.5) |
| fecha | 2026-07-18 |
| rama | `wp/u94-domain-source` |
| commit(s) | `014d804` refactor · `29f0a6f` test · docs reporte (HEAD) |
| estado propuesto | listo para revisión |
| push | **no intentado** (política swarm) |

## Qué se hizo

Se unificó la validación de **curate** y **vaciar** en funciones puras
exportadas (`validateCurate`, `validateEmptySea`) que consumen gate
(`reducer`) y mutador (`line-board.curate` / `flow.emptySoft`). Se demolió
la copia `CODE_STATUS` y el array `order` local del reducer. `emptySoft`
pasa a devolver `mar_colapsado` (mismo code que el gate) vía el validador
compartido. En `domain-state.applyOps` todas las invocaciones de mutadores
que devuelven `{ok,error}` (y `setAperture` booleano) comprueban el
resultado antes de continuar. Tests nuevos en `domain-source.test.mjs`
verifican que un caso inválido produce el mismo error en gate y mutador
desde la misma función.

## Archivos tocados

- modificado `packages/games/delta/arg-domain/src/line-board.mjs` — `validateCurate`; demolición `CODE_STATUS`
- modificado `packages/games/delta/arg-domain/src/flow-engine.mjs` — `validateEmptySea`; `emptySoft` la consume
- modificado `packages/games/delta/arg-domain/src/reducer.mjs` — gates curate/empty delegan en validadores
- modificado `packages/games/delta/arg-domain/src/domain-state.mjs` — comprobar `{ok,error}` / boolean en ops
- modificado `packages/games/delta/arg-domain/src/index.mjs` — re-export validadores
- modificado `packages/games/delta/arg-domain/README.md` — documenta fuente única
- creado `packages/games/delta/arg-domain/test/domain-source.test.mjs` — CA fuente única
- creado `plan/REPORTES/WP-U94-domain-source.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Unit arg-domain

```
$ npm test -w @zeus/arg-domain
# tests 72
# pass 72
# fail 0
```

(incluye 4 tests nuevos en `domain-source.test.mjs`: status_salto,
no_cacheado, nada_que_vaciar, mar_colapsado — gate ≡ mutador ≡ validador)

### Lint / gates

```
$ npm run lint
✖ 12 problems (0 errors, 12 warnings)  # preexistentes; cero errores nuevos

$ npm run gates
gates: OK (0 offenders)
```

`ZEUS_OPEN_BROWSER` unset (= no abre). Arranque demo/e2e:
`⏳ sin verificar` (WP de dominio puro; CA pide unit arg-domain).

### Pregunta obligatoria (CA)

| pregunta | respuesta |
| -------- | --------- |
| ¿cada regla/code en un solo sitio? | Sí — `validateCurate` / `validateEmptySea`; `DELTA_STATUSES` única |
| ¿test por mecánica (mismo error gate+mutador desde misma fn)? | Sí — `domain-source.test.mjs` |
| ¿cero mutadores sin comprobar resultado? | Sí — applyOps comprueba todos los `{ok,error}` (+ setAperture) |
| ¿tests arg-domain verdes? | Sí — 72/72 |
| ¿Demolición de copias de orden/codes? | Sí — ver §Demolición |

## Demolición

- Array local `order = ['pending','draft','curated']` en `reducer.curate` →
  borrado; usa `validateCurate` → `DELTA_STATUSES`.
- `CODE_STATUS` duplicado de `DELTA_STATUSES` → borrado;
  `decodeLineStatus` lee `DELTA_STATUSES`; `STATUS_CODE` se deriva del
  mismo array.
- Codes vaciar duplicados (`colapsado` en emptySoft vs `mar_colapsado` en
  gate) → unificados en `validateEmptySea` → `mar_colapsado`.

```
$ rg -n "\['pending', 'draft', 'curated'\]|CODE_STATUS|order = \['pending'" packages/games/delta/arg-domain/
packages/games/delta/arg-domain/src/line-board.mjs:11:export const DELTA_STATUSES = Object.freeze(['pending', 'draft', 'curated']);
```

(única literal viva = `DELTA_STATUSES`)

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no tocados
- [x] Cadenas if/switch que debieron ser tabla: no nuevas; applyOps sigue switch de ops (preexistente)
- [x] Duplicación con otros paquetes (busqué antes de responder): no; validadores viven en el paquete dueño de la mecánica
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no (validateCurate / validateEmptySea)
- [x] Demolición completa (grep arriba): sí — una sola literal de orden
- [x] Tests prueban comportamiento, no solo «no explota»: sí — mismo error gate/mutador/fn
- [ ] Arranque real verificado (qué levanté y miré): `⏳ sin verificar` — CA unit; sin demo
- [x] README/specs del paquete siguen siendo verdad: README actualizado; CONTRATO no cambió forma de intents
- [x] El diff contiene solo el alcance del WP: sí (arg-domain + reporte; no U96/U93)

## Hallazgos fuera de alcance

- **salvage** sigue con codes duales: gate `mar_colapsado` vs mutador
  `colapsado` (mismo patrón pre-U94 que vaciar). Candidato a extender
  `validateEmptySea`-style o `validateSalvage` en WP futuro.
- **cache / milestone** duplican reglas gate↔mutador (`ya_cacheado`,
  `no_curado`, …) sin validador compartido; fuera del CA U94 (solo curate
  + vaciar).
- `applyOps` ante `!res.ok` hace `break` silencioso (patrón excavate): no
  propaga el error al caller de `applyIntent` (el gate ya filtró). Si se
  desea ledger de inconsistencia gate/mutador, haría falta WP aparte.

## Dudas / bloqueos

Ninguno. Listo para revisión del orquestador.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
