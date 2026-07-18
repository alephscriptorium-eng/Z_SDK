# WP-U99 · makeintent-game — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U99) |
| fecha | 2026-07-18 |
| rama | `wp/u99-makeintent-game` |
| worktree | `.worktrees/wp-u99-makeintent-game` |
| commit(s) | `5c382a4` feat(protocol)! · `6c78a43` refactor(volumes-ops) · `c5f3449` chore(changeset) · (este) docs(plan) |
| estado propuesto | listo para revisión |
| push | no intentado |
| browsers | no launch (`ZEUS_OPEN_BROWSER` unset / no opt-in) |

## Qué se hizo

**Vía (a):** `makeIntent` exige `game` (string no vacío), simétrico con
`makeEnvelope`. Sin `game` lanza `TypeError`. Se demoleció el condicional
`if (game != null) payload.game = game`; el campo va siempre en el payload.

Wrappers **delta** (`arg-domain`) y **pozo** ya inyectaban `GAME_ID` — sin
cambio de callers de juego. Types (`MakeIntentOpts.game: string`),
`CONTRATO.md` §3 y JSDoc de `makeOperatorIntent` actualizados.

**Colateral necesario:** `volumes-ops/emptyVolume` usaba `makeIntent` solo
para gate de rol local (sin room wire) y no pasaba `game`. Pasó a
`assertIntentRole({ actorId, intent, role }, …)` — sin inventar un id de
juego en engine.

## Archivos tocados

- modificado `packages/engine/protocol/src/contract.mjs` — `game` obligatorio
- modificado `packages/engine/protocol/test/contract.test.mjs` — rechazo sin
  game + stamps
- modificado `packages/engine/protocol/test/roles.test.mjs` — opts con `game`
- modificado `packages/engine/protocol/spec/CONTRATO.md` — API §3
- modificado `packages/engine/protocol/spec/types-build.mjs` +
  `types/index.d.ts` — `MakeIntentOpts.game` required
- modificado `packages/engine/volumes-ops/src/empty.mjs` — role gate sin
  `makeIntent`
- modificado `packages/mesh/operator-bridge/src/index.mjs` — JSDoc `game`
  obligatorio
- creado `.changeset/wp-u99-makeintent-game.md` — protocol minor +
  volumes-ops patch
- creado `plan/REPORTES/WP-U99-makeintent-game.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- Vía elegida: **(a)** — CA: `makeIntent` sin `game` lanza; wrappers
  delta/pozo verdes; condicional demolido.

- `npm test -w @zeus/protocol` → exit 0:

```
# tests 17
# suites 0
# pass 17
# fail 0
```

- `npm test -w @zeus/arg-domain` → exit 0 (`# tests 72` `# pass 72`)
- `npm test -w @zeus/pozo` → exit 0 (`# tests 9` `# pass 9`)
- `npm test -w @zeus/volumes-ops` → exit 0 (`# tests 6` `# pass 6`)
- `npm test -w @zeus/operator-bridge` → exit 0 (`# tests 9` `# pass 9`)

- `npm run lint` → exit 0 (0 errors; 12 warnings preexistentes).

- `npm run gates` → `gates: OK (0 offenders)`.

- `npm run release:changeset-dry` → **protocol@0.2.0 pack ok**;
  **volumes-ops pack ok**; dry falló por **ajeno**:
  `@zeus/linea-kit` `exports target missing from tarball: ./schemas/*`
  (tree restored). Ver hallazgos.

- Arranque visual / e2e / navegador: **no** (política brief: opt-in;
  higiene de contrato unitario; sin urgencia).

## Demolición

Símbolo demolido: condicional `if (game != null)` en `makeIntent`.

```
rg -n "if \(game != null\)" packages/engine/protocol
→ ZERO matches if (game != null)
```

`game` se escribe siempre en el payload tras el assert tipado.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no
- [x] Cadenas if/switch que debieron ser tabla: no (un solo assert tipado,
  como `makeEnvelope`)
- [x] Duplicación con otros paquetes: no; reutiliza el mismo criterio de
  `makeEnvelope`
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa (grep arriba): sí
- [x] Tests prueban comportamiento: sí (throws sin game; stamps con game;
  roles con game)
- [ ] Arranque real verificado: ⏳ sin e2e (CA vía a = unit + wrappers;
  política browsers opt-in)
- [x] README/specs del paquete: CONTRATO.md + types; README ya mostraba
  `{ game: 'my-game' }`
- [x] El diff contiene solo el alcance del WP: sí (+ colateral volumes-ops
  necesario para no inventar game en engine)

¿pozo puede consumir esto tal cual? **Sí** — su wrapper ya inyecta
`game: GAME_ID`.

## Hallazgos fuera de alcance

- `release:changeset-dry` falla en `@zeus/linea-kit` (`./schemas/*` ausente
  del tarball) — preexistente; no tocado aquí.
- En Windows, `spec:generate` de asyncapi puede dejar el working tree con
  ruido de EOL (`LF will be replaced by CRLF`) sin diff de contenido; el
  blob coincide con HEAD. No se commitó asyncapi.
- Callers directos de `@zeus/protocol` `makeIntent` sin `game` (p. ej.
  tests internos ya corregidos; `makeOperatorIntent` exige `opts.game` vía
  throw de protocol) — cualquier caller externo que omitiera `game` rompe
  (BREAKING 0.x, documentado).

## Dudas / bloqueos

Ninguno. CA vía (a) verde.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
