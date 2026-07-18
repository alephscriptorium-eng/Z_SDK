# WP-U110 · startpack-kit — reporte

| dato | valor |
| ---- | ----- |
| agente | swarm worker (WP-U110) |
| fecha | 2026-07-18 |
| rama | `wp/u110-startpack-kit` (zeus + library) |
| commit(s) | library `22c7d0d`; zeus (este reporte) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se extrajo `@zeus/startpack-kit` en `Z_SDK-games-library` con la única
implementación de `loadStartPack` (+ helpers `readJson*` /
`createStartPackLoader`). Los cuatro `@zeus/startpack-{delta,pozo,sketch,solve-coagula}`
pasaron a thin wrappers (packageName/game + enrich específico). Docs
(`docs/startpacks.md`, README layout, README delta) apuntan al kit.
API pública de cada pack (`loadStartPack` / `resolveStartPackRoot`) se
mantiene para Notario y `resolve-startpack`. Library sin toolchain
changesets: kit publicable con `publishConfig` alineado a los startpacks;
changeset documentado como N/A en library.

## Archivos tocados

| archivo | cambio |
| ------- | ------ |
| `packages/startpack-kit/*` (library) | creado — kit + tests + README |
| `packages/startpack-*/index.mjs` ×4 | refactor → `createStartPackLoader` |
| `packages/startpack-*/package.json` ×4 | dep `@zeus/startpack-kit@0.1.0` |
| `packages/startpack-delta/README.md` | nota kit |
| `package.json` / `package-lock.json` | `test:startpack` incluye kit |
| `docs/startpacks.md` / `README.md` | puntero kit |
| `plan/REPORTES/WP-U110-startpack-kit.md` (zeus) | este reporte |

## Evidencia

```
> npm run test:startpack
# @zeus/startpack-kit: 5 pass
# @zeus/startpack-delta: 2 pass
# @zeus/startpack-pozo: 1 pass
# @zeus/startpack-sketch: 1 pass
# @zeus/startpack-solve-coagula: 1 pass
EXIT:0

> npm run release:startpack -- --game sketch --dry-run
📜 Notario · game=sketch · pkg=@zeus/startpack-sketch
✅ Notario done · loadStartPack ✅ · volumes.json ✅ · acta ✅ · gamemap ✅
EXIT:0

> npm run release:startpack -- --game solve-coagula --dry-run
📜 Notario · game=solve-coagula · pkg=@zeus/startpack-solve-coagula
✅ Notario done · loadStartPack ✅ · volumes.json ✅ · acta ✅ · gamemap ✅
EXIT:0
```

Arranque demo interactivo: ⏳ sin verificar (CA pide tests packs + Notario
dry; no se levantó demo UI).

## Demolición

Cuerpos `export function loadStartPack` / `function loadStartPack(`:
cero en los cuatro packs; una sola en el kit.

```
$ rg -n "export function loadStartPack|function loadStartPack\(" \
    packages/startpack-delta packages/startpack-pozo \
    packages/startpack-sketch packages/startpack-solve-coagula
# (sin matches)

$ rg -n "export function loadStartPack" packages/startpack-kit
packages/startpack-kit/index.mjs:62:export function loadStartPack(opts) {

$ rg -n "missing manifest" packages/startpack-*/index.mjs packages/startpack-kit/index.mjs
packages/startpack-kit/index.mjs:73:    throw new Error(`${label}: missing manifest at ${manifestPath}`);
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no; paths vía `root` / join.
- [x] Cadenas if/switch que debieron ser tabla: no; enrich por pack, no
  switch de juegos en el kit.
- [x] Duplicación: demolida la ×4; busqué antes — no hay otro kit en engine.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres de transición (v2/old/new/legacy): no.
- [x] Demolición completa (grep arriba): sí.
- [x] Tests comportamiento (manifest/gamemap/enrich/reject): sí.
- [x] Arranque real: Notario dry sketch + solve; demos UI ⏳.
- [x] README/specs: kit README + docs/startpacks + layout README.
- [x] Diff solo alcance U110: sí (sin U111–U114).

## Regla de los dos juegos

¿pozo/delta/sketch/solve pueden consumir el kit tal cual? **Sí** — API
genérica (`root`, `packageName`, `game`, `enrich`); conceptos exclusivos
(mazePack ARG, feedSeed pozo, storyBoard solve, scene sketch) viven solo
en el enrich de cada pack.

## Hallazgos fuera de alcance

- Notario dry reescribe `acta/ACTA.md` con rutas absolutas del worktree
  local; no se commitearon esos ruidos (restore). Candidato higiene:
  acta con paths relativos o sin path absoluto en tabla.
- Library no tiene `.changeset/`; publish real de startpacks sigue gated
  por ops/`NPM_TOKEN` (mismo estado pre-U110).

## Dudas / bloqueos

Ninguno. Listo para revisión orquestador (merge library + zeus reporte).

---

## Revisión del orquestador

_(pendiente)_
