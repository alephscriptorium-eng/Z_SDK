# WP-U157 · dts-grafo-cercano — reporte

| dato | valor |
| ---- | ----- |
| agente | Worker-U157 |
| fecha | 2026-07-23 |
| rama | `wp/u157-dts-grafo-cercano` |
| commits | `6262f1d` (feat) · `1e2cafd` (reporte) · docs tip = HEAD |
| eje(s) CA | IV |
| estado propuesto | listo para revisión |

## Lote cerrado

| paquete | ruta | subpaths tipados |
| ------- | ---- | ---------------- |
| `@zeus/view-kit` | `packages/engine/view-kit` | `.`, `./node` |
| `@zeus/game-engine` | `packages/engine/game-engine` | `.`, `./node` |
| `@zeus/authority-kit` | `packages/engine/authority-kit` | `.`, `./create-authority` |
| `@zeus/room-client-browser` | `packages/engine/room-client-browser` | `.`, `./browser`, `./dev-config` |
| `@zeus/http-contract` | `packages/engine/http-contract` | `.`, `./express`, `./mcp-resources` (`./spec` sin types — markdown) |
| `@zeus/ui-kit` | `packages/engine/ui-kit` | `.`, `./theme-contract` |
| `@zeus/app-shell` | `packages/engine/app-shell` | `.`, `./create-app-config`, `./create-theme-handler`, `./create-shell-views`, `./ssr-view-registry` |
| `@zeus/player-mcp-kit` | `packages/engine/player-mcp-kit` | `.` |
| `@zeus/socket-server` | `packages/mesh/socket-server` | `.` |

## Qué se hizo

Se añadieron declaraciones TypeScript (`types/*.d.ts`) y condiciones `"types"`
en `exports` + inclusión en `files` para el lote cerrado de nueve paquetes
del grafo cercano. Changesets patch ×9. Gate Eje IV con dos consumidores TS
independientes (`consumer-a` / `consumer-b`) bajo `tsc --noEmit`. Excepción
two-games para `authority-kit/types/create-authority.d.ts` (léxico
`events.DELTA` / GAME_STATE_DELTA, espejo del `.mjs` ya exceptuado). Fans
protocol y deferidos U156 → cola residual, no silencio.

## Archivos tocados

- `packages/engine/{view-kit,game-engine,authority-kit,room-client-browser,http-contract,ui-kit,app-shell,player-mcp-kit}/package.json` — types + exports
- `packages/mesh/socket-server/package.json` — types + exports
- `packages/engine/*/types/**` y `packages/mesh/socket-server/types/**` — `.d.ts` de superficie exportada
- `packages/engine/http-contract/test/grafo-cercano-*.test.mjs` + fixtures — audit exports + smoke Eje IV
- `.changeset/wp-u157-*-types.md` — patch ×9
- `scripts/gates/exceptions.mjs` — excepción D-8 para tipado DELTA
- `plan/REPORTES/WP-U157-dts-grafo-cercano.md` — este reporte

## Evidencia

> No inventes observaciones. Salida literal o `⏳ sin verificar`.

### Gates

```
$ npm run gates
gates: OK (0 offenders)
```

### Tests del lote

| workspace | resultado |
| --------- | --------- |
| `@zeus/view-kit` | 39/39 pass |
| `@zeus/game-engine` | 10/10 pass |
| `@zeus/authority-kit` | 16/16 pass |
| `@zeus/room-client-browser` | 7/7 pass |
| `@zeus/http-contract` | 20/20 pass (incluye Eje IV smoke + exports audit) |
| `@zeus/ui-kit` | 4/4 pass |
| `@zeus/app-shell` | 9/9 pass |
| `@zeus/player-mcp-kit` | 12/12 pass |
| `@zeus/socket-server` | 2/2 pass |

```
$ node --test packages/engine/http-contract/test/grafo-cercano-types-smoke.test.mjs
# Subtest: Eje IV: tsc resolves grafo-cercano lote types (two consumers)
ok 1 - Eje IV: tsc resolves grafo-cercano lote types (two consumers)
# pass 1
# fail 0
```

### Eje IV (segundo consumidor / sensor)

- Cliente A: `test/fixtures/ts-grafo-cercano-smoke/consumer-a.ts` →
  http-contract (+express/mcp-resources), game-engine (+node), view-kit (+node),
  authority-kit (+create-authority).
- Cliente B: `test/fixtures/ts-grafo-cercano-smoke/consumer-b.ts` →
  ui-kit (+theme-contract), app-shell (+create-theme-handler), player-mcp-kit,
  room-client-browser (+dev-config), socket-server.
- Gate: `grafo-cercano-types-smoke.test.mjs` instala el lote por `file:` en
  temp y corre `tsc --noEmit` (TS ≥5; monorepo trae 4.9.5 → npx 5.9.3).

### Residuales → cola (no silencio)

- Fans protocol no tipados en este WP (sin inflar L): `acta-kit`, `parte-kit`,
  `embajador-kit` y demás kits BARE del grafo protocol no listados arriba.
- Deferidos U156 aún sin `"types"`: `@zeus/presets-sdk` subpaths `./horse`,
  `./presets/contract`, `./mcp/http-contract`.
- `http-contract` `./spec` (markdown) sin condición types — a propósito.

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u157-dts-grafo-cercano` |
| tip | ver `git rev-parse HEAD` en rama |
| run_id | N/A — sin push en este turno de worker |
| conclusion | N/A |

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de ALCANCE_DIFF: 9 packages + changesets + smoke +
      excepción gates + reporte (bins tocados por npm install revertidos)
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia
- [x] Sellos con fuente; rutas citadas existentes
- [x] Sin fluff ni promesa de futuro sin residuales listados
- [x] Eje IV evidenciado: dos consumidores TS + `tsc --noEmit`
- [x] Gates ejecutados de verdad: `gates: OK`
- [x] Commits convencionales: sí
- [x] Diff solo del alcance del WP: sí
- [x] Puertos/URLs/rooms hardcodeados: no (solo tipos)
- [x] API inventada: no — superficie exportada real tipada (formas
      aproximadas con `unknown`/`object` donde JSDoc no fija más)
- [x] Tests verdes en los 9 paquetes tocados
- [x] README/specs: sin mentira previa sobre types de subpaths; no se
      regeneraron specs (sin cambio runtime)

## Hallazgos fuera de alcance

- El worktree arrancó sin `node_modules`; `npm install` local resolvió
  workspaces (no commit de lock).
- TypeScript del monorepo es 4.9.5; el smoke exige ≥5 (npx 5.9.3) —
  candidato a pin en root o U158.

## Dudas / bloqueos

Ninguno. Listo para revisión del orquestador.

---

## Revisión del orquestador

**Aceptado ✅ (orquestador-Z · 2026-07-23).**

- Alcance conforme: lote cerrado de nueve paquetes, sin BACKLOG ni WPs
  ajenos.
- Eje IV cumplido: dos consumidores TypeScript independientes ejercitan el
  lote mediante `tsc --noEmit`.
- Cada paquete declara `types`, condiciones `"types"` en los exports
  tipados y publicación de `types/` mediante `files`.
- Tests declarados del lote y `npm run gates` verdes; sin diagnósticos IDE.
- Residuales enumerados sin inflar el WP (fans protocol, subpaths diferidos
  U156 y actualización TypeScript candidata para U158).
- Re-smoke del orquestador: se ejecutará sobre el tip integrado antes del push.
