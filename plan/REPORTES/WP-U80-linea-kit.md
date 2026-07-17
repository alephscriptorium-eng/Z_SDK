# WP-U80 · linea-kit — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm) |
| fecha | 2026-07-17 |
| rama | `wp/u80-linea-kit` |
| commit(s) | `9560c30`, `55213d1`, `609c65a`, `ca5f9f0` |
| estado propuesto | listo para revisión |

## Qué se hizo

Nació `@zeus/linea-kit` (`packages/engine/linea-kit`): JSON Schemas de
DATOS.md §2 + familia force/cota §8, cadena de curación unificada
(`CURATION_STATUSES` / `normalizeCurationStatus`), resolve browser-safe,
validador Ajv + `validateVolumesTree` (node), loader fs generalizado (node).

`@zeus/linea-system` quedó en fachada fina (defaults presets + coverage) que
importa `@zeus/linea-kit/loader`. `@zeus/arg-feeds` consume
`@zeus/linea-kit/curation` y anota `curation_status` en droplets firehose.
Changeset minor para el paquete publicable. VOLUMES no se mutaron.

## Archivos tocados

- creado `packages/engine/linea-kit/**` — schemas, src, fixtures, tests, README
- creado `.changeset/wp-u80-linea-kit.md`
- modificado `packages/mesh/linea-system/src/loader.mjs` — demolición → fachada
- modificado `packages/mesh/linea-system/package.json` — dep `@zeus/linea-kit`
- modificado `packages/games/delta/arg-feeds/{package.json,src/index.mjs,src/real.mjs}`
- modificado `package-lock.json` — ajv transitivo del kit
- creado `plan/REPORTES/WP-U80-linea-kit.md` — este reporte

## Evidencia

```
$ npm test -w @zeus/linea-kit
# tests 8 / pass 8 / fail 0

$ ZEUS_VOLUMES_ROOT=…/zeus-sdk/VOLUMES npm test -w @zeus/linea-kit
# live VOLUMES ok at …/zeus-sdk/VOLUMES;
# disks={"DISK_01":true,"DISK_02":true,"DISK_03":true};
# checked=111; skipped=[]
# (mtimes de volumes.json / triage / registry.yaml / registry.json sin cambio)

$ npm test -w @zeus/linea-system
# SMOKE TEST PASSED
# tests 2 / pass 2 / fail 0

$ npm test -w @zeus/arg-feeds
# tests 4 / pass 4 / fail 0

$ npm run gates
gates: OK (0 offenders)

$ npm run lint
✖ 12 problems (0 errors, 12 warnings)  # warnings preexistentes ajenos al WP
```

Worktree sin DISK_* en git: validación viva apuntó a
`C:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/VOLUMES` (symlinks locales
`VOLUMES/DISK_*` solo en el worktree, gitignored). Fixtures del paquete
cubren el caso sin VOLUMES.

Arranque MCP linea-system: ejercitado vía smoke/resource-contract (no UI).

## Demolición

Loader duplicado en linea-system (~600 LOC de impl) sustituido por fachada
(~70 LOC) que reexporta el kit.

```
$ wc -l packages/mesh/linea-system/src/loader.mjs
72 packages/mesh/linea-system/src/loader.mjs

$ rg -n "async function loadWpHistoriaIndex|function slimRegistro" packages/mesh/linea-system/src/
(sin matches — impl demolida)

$ rg -n "@zeus/linea-kit/loader" packages/mesh/linea-system/src/loader.mjs
23:} from '@zeus/linea-kit/loader';
```

API pública de `@zeus/linea-system/loader` conservada
(`loadLineaData`, `resolveNodo`, `readWikitext`, `readRegistro`, …).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no nuevos. El hint
  `action.server: 'linea-wp-historia'` se preservó del loader original
  (comportamiento negativo).
- [x] Cadenas if/switch que debieron ser tabla: no; curación y schemas por
  mapas/`SCHEMA_FILES`.
- [x] Duplicación: loader centralizado en kit; linea-system solo fachada.
- [x] console.log / código comentado / TODO sin backlog: solo
  `console.warn` heredados en paths opcionales ausentes.
- [x] Nombres de transición: ninguno (`legacy`/`v2`/…).
- [x] Demolición completa (grep arriba): sí.
- [x] Tests de comportamiento: curación, resolve, validate fixtures + live
  VOLUMES read-only, smoke linea-system.
- [x] Arranque real: smoke MCP linea-system verde; no se abrió navegador
  (`ZEUS_OPEN_BROWSER` unset).
- [x] README del kit describe exports browser-safe vs node-only.
- [x] Diff solo alcance U80 (+ changeset + reporte).

Regla dos juegos: ¿pozo puede consumir el kit tal cual? Sí — formatos y
loader no nombran juegos ni forces concretas; gate `two-games` OK.

## Hallazgos fuera de alcance

1. **DISK_03 no viaja en git** pese a README/D-19: `.gitignore` tiene
   `VOLUMES/*` con excepciones solo para `README.md` y `volumes.json`; no hay
   `!VOLUMES/DISK_03/**`. El corpus existe en disco local del operador pero
   no en el índice. Candidato WP: exceptuar DISK_03 en gitignore + add.
2. Worktrees no heredan DISK gitignored del árbol principal; hace falta
   `ZEUS_VOLUMES_ROOT` o symlinks locales (no commiteados).
3. Algunos manifests force vivos omiten capas `prompt`/`output` (anomalías
   ya documentadas); el schema las tolera con `files.minProperties: 1`.

## Dudas / bloqueos

Ninguno bloqueante. Push: **no intentado** (política del brief).

---

## Revisión del orquestador

**Aceptado ✅** — orquestador / 2026-07-17 (revisión; sin merge ni ✅ BACKLOG
en este paso — pedido explícito del usuario).

### Verificado

- **Merge master:** rama estaba en `e70b4e2` (pre-U56); merge ort limpio →
  `8dd16dc` (`merge(master): integra U56`). Tras merge: 0 behind master.
- **Alcance** `master...HEAD` (~44 files): `packages/engine/linea-kit/**`,
  fachada `linea-system` loader, consumo `arg-feeds` curation, changeset,
  reporte. **Sin** `plan/BACKLOG.md` tocado por el worker. Commits
  convencionales OK.
- **Re-CA** (worktree post-merge):
  - `npm test -w @zeus/linea-kit` → 8/8 pass; live VOLUMES
    `DISK_01/02/03` ok (`checked=111; skipped=[]`) vía árbol master
    `…/zeus-sdk/VOLUMES` (symlinks locales en worktree)
  - `npm test -w @zeus/linea-system` → 2/2 + **SMOKE TEST PASSED**
  - `npm test -w @zeus/arg-feeds` → 4/4 pass
  - `npm run gates` → `gates: OK (0 offenders)`
- **Demolición:** `linea-system/src/loader.mjs` = 72 LOC fachada sobre
  `@zeus/linea-kit/loader`; `loadWpHistoriaIndex` / `slimRegistro` ausentes
  en linea-system.
- **Regla dos juegos:** cero `delta`/`pozo` y cero forces concretas en
  `packages/engine/linea-kit/{src,schemas}`; README documenta browser-safe
  vs node-only.

### PRACTICAS

Auto-revisión honesta; demolición completa (no dual path); sin nombres de
transición; curación unificada por mapas; alcance acotado a U80 (no U81).

### Hallazgos → cola (no bloquean; al merge en master)

1. **DISK_03 no viaja en git** pese a comentario D-19 en `.gitignore`
   (`VOLUMES/*` sin `!VOLUMES/DISK_03/**`). Corpus local del operador;
   fixtures del kit cubren CI. Candidato WP: exceptuar DISK_03 + add.
2. Worktrees no heredan DISK gitignored → hace falta `ZEUS_VOLUMES_ROOT`
   o symlinks (documentado en reporte worker; no WP si es runbook).

### Merge

**Listo** para merge a master + ✅ BACKLOG por el orquestador en master
(paso separado). Orden: U80 solo (U56 ya en master). Tras merge:
`git worktree remove` de `.worktrees/wp-u80-linea-kit`. **No** push.
