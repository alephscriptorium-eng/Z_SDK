# WP-U98 · contract-form — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U98) |
| fecha | 2026-07-18 |
| rama | `wp/u98-contract-form` |
| commit(s) | `4b09212` feat(protocol); `3958f62` docs(plan); `2697a82` hashes |
| estado propuesto | listo para revisión |
| push | no intentado |

## Qué se hizo

**Vía (a)** elegida: una sola tabla `EVENT_META` en
`packages/engine/protocol/src/event-meta.mjs` alimenta AsyncAPI
(`spec/build.mjs` ya no declara su propia copia) y el validador runtime
`isShaped(kind, data)`. Constantes `PROTOCOL_VERSION` / `EVENT_KINDS` /
`EVENTS` salieron a `kinds.mjs` para evitar ciclo de imports.

`isIntentShaped` / `validateIntent` se mantienen como chequeo mínimo de
transporte + catálogo (dominios); CONTRATO.md documenta la distinción.
Anexo: tests de presupuesto en `arg-domain` pasan por
`checkSnapshotBudget` / `SNAPSHOT_BUDGET_BYTES` (cero `32 * 1024` a mano).

No se tocó la firma de `makeIntent` (U99).

## Archivos tocados

- creado `packages/engine/protocol/src/kinds.mjs` — versión + kinds
- creado `packages/engine/protocol/src/event-meta.mjs` — `EVENT_META` + `isShaped`
- modificado `packages/engine/protocol/src/contract.mjs` — re-exporta; docs JSDoc
- modificado `packages/engine/protocol/src/index.mjs` — exporta `EVENT_META` / `isShaped`
- modificado `packages/engine/protocol/spec/build.mjs` — importa `EVENT_META` (demolición copia local)
- modificado `packages/engine/protocol/spec/CONTRATO.md` / `README.md` — vía (a)
- modificado `packages/engine/protocol/spec/types-build.mjs` + `types/index.d.ts` — tipos
- modificado `packages/engine/protocol/test/contract.test.mjs` — CA `isShaped`
- modificado `packages/games/delta/arg-domain/test/domain-state.test.mjs` — anexo budget
- creado `.changeset/wp-u98-contract-form.md` — minor `@zeus/protocol`
- creado `plan/REPORTES/WP-U98-contract-form.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

**Vía elegida:** (a) — `isShaped` derivado de `EVENT_META`.

- `npm run spec:generate -w @zeus/protocol` → Wrote `.../protocol/spec/asyncapi.yaml`
  (contenido YAML sin cambio semántico; solo fuente del generador).

- `npm run types:generate -w @zeus/protocol` → Wrote `types/index.d.ts`

- `npm test -w @zeus/protocol` → exit 0:

```
# tests 19
# pass 19
# fail 0
```

  Incluye `isShaped accepts valid envelopes and rejects invalid per kind`
  (intent sin `game`, state sin `ts`, track sin `actorId`, ledger sin `seq`,
  kind desconocido → `false`).

- `npm test -w @zeus/arg-domain` → exit 0 (`# tests 72` / `# pass 72`),
  incl. ambos tests de presupuesto G-ARG.5 con `checkSnapshotBudget`.

- `npm test -w @zeus/pozo` → exit 0 (`# tests 9` / `# pass 9`).

- `npm run lint` → exit 0 (0 errors; 12 warnings preexistentes).

- `npm run gates` → `gates: OK (0 offenders)`

- Arranque visual / browser: ⏳ sin verificar (WP de contrato; sin UI).
  `ZEUS_OPEN_BROWSER` no usado.

- Demolición local:

```
$ rg "const EVENT_META" packages/engine/protocol/spec/build.mjs
(sin coincidencias)

$ rg "32 \* 1024" packages/games/delta/arg-domain/test/domain-state.test.mjs
(sin coincidencias)
```

## Demolición

1. `EVENT_META` local en `spec/build.mjs` → eliminado; el generador importa
   desde `src/event-meta.mjs` vía `contract.mjs`.
2. Literales `32 * 1024` + `Buffer.byteLength` en tests de presupuesto
   domain-state → `checkSnapshotBudget`.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no.
- [x] Cadenas if/switch que debieron ser tabla: `isShaped` itera
  `EVENT_META[kind].payload.required` + schema por campo (tabla); tipado
  por `schema.type` en helper pequeño (no switch de kinds).
- [x] Duplicación: la copia de `EVENT_META` en build demolida; budget tests
  reutilizan `checkSnapshotBudget`.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: no `legacy`/`v2`/`-old`.
- [x] Demolición completa (grep arriba): sí.
- [x] Tests de comportamiento: inválido por kind → `isShaped` false; válidos
  true; domain-state budget vía helper.
- [x] Arranque real: ⏳ sin demo visual (contrato puro).
- [x] README/specs: CONTRATO + README actualizados; types regenerados;
  AsyncAPI regenerado (mismo contenido).
- [x] Diff solo alcance U98: sí (no U99 / makeIntent / peer-card / U93).

## ¿pozo puede consumir esto tal cual? (PRACTICAS §1.11)

**Sí.** `EVENT_META` / `isShaped` no nombran juegos. Pozo ya verde con
`validateIntent`; puede adoptar `isShaped` en wire cuando lo necesite.

## Hallazgos fuera de alcance

- **U99:** `makeIntent` sigue con `game` opcional; `isShaped('intent', …)`
  exige `game`. Emisores con envelope completo OK; payloads mínimos de
  dominio siguen por `isIntentShaped` / `validateIntent`.
- `release:changeset-dry` en este entorno **consume** changesets y bumpea
  `package.json` (no es dry real) — no usarlo como verificación inocua;
  el changeset del WP queda en `.changeset/` sin publicar.
- Hallazgo previo (U95): `spec-sync` / CRLF en Windows — regenerar YAML
  puede ensuciar el working tree por EOL sin cambio de contenido.

## Dudas / bloqueos

Ninguno. CA vía (a) verde; anexo `checkSnapshotBudget` hecho.

---

## Revisión del orquestador

**Aceptado ✅** — 2026-07-18 (orquestador). BACKLOG 🔶→✅ **pendiente** (no
marcado en esta pasada; usuario pidió no ✅). Push no intentado. Merge no
hecho.

### Qué se verificó

- Diff `master...wp/u98-contract-form`: 13 archivos; alcance vía (a) + anexo
  budget; sin BACKLOG; sin firma `makeIntent` (U99).
- **CA (a):** `EVENT_META` en `src/event-meta.mjs`; `isShaped` deriva
  required/tipos; `build.mjs` importa (cero `const EVENT_META` local);
  test `isShaped accepts…` rechaza inválidos por kind. Re-run:
  contract tests del CA verdes; `arg-domain` 72/72; `pozo` 9/9.
- **Anexo:** domain-state usa `checkSnapshotBudget` / `SNAPSHOT_BUDGET_BYTES`
  (cero `32 * 1024` a mano).
- PRACTICAS / demolición: OK. Commits convencionales. Auto-revisión honesta.
- **Nota re-run:** `spec-sync` falló aquí por comparación byte-a-byte
  LF/CRLF (hallazgo U95 / reporte §hallazgos); contenido YAML sin drift
  semántico tras `spec:generate`. No bloquea aceptación del CA de forma.

### Hallazgos (no arreglados en revisión)

1. **U99 / asimetría `makeIntent`:** `isShaped('intent')` exige `game`;
   `makeIntent` en esta rama sigue con `game` opcional — correcto para
   partición U98/U99; serializar merge (ver abajo).
2. **`release:changeset-dry`:** no es dry inocuo (consume changesets /
   bumpea) — no usar como verificación; changeset del WP queda en
   `.changeset/`.

### Merge vs U99

**Serializar.** Ambos tocan protocol. Solape de archivos:

- `packages/engine/protocol/spec/CONTRATO.md`
- `packages/engine/protocol/spec/types-build.mjs`
- `packages/engine/protocol/src/contract.mjs`
- `packages/engine/protocol/test/contract.test.mjs`
- `packages/engine/protocol/types/index.d.ts`

Orden sugerido: **U98 primero** (fuente de forma / `EVENT_META` +
`isShaped`), luego **U99** (exige `game` en `makeIntent`) rebase/merge
sobre U98 para resolver CONTRATO + tests sin pelear dos veces la misma
tabla.

### Acción siguiente

1. Usuario/orquestador: marcar ✅ en `plan/BACKLOG.md` (master) cuando
   autorice merge.
2. Merge U98 → master; después U99 (rebase sobre master post-U98).
3. `git worktree remove` del árbol U98 tras merge.
4. No push desde esta revisión.
