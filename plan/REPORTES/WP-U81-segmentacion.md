# WP-U81 · segmentacion — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm) |
| fecha | 2026-07-18 |
| rama | `wp/u81-segmentacion` |
| commit(s) | `c59a9ad`, `c786b0d`, `164ad89` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se extendió `@zeus/linea-kit` con herramientas JS de segmentación del
dramaturgo (concepto de los pythons de referencia, no puerto línea a línea):
`crear-linea`, `segmentar`, `conectar-satelite`, `fetch` (gate `approve`),
`segmentar-force` (trace fuera + cobertura) y `crear-cotas`. Starterkits
«línea en 30 min» y «force en 30 min», CLI `zeus-linea-kit`, tutoriales en
`docs/`, changeset minor. El contrato sigue siendo el validador U80.

## Archivos tocados

- creado `packages/engine/linea-kit/src/tools/**` — tools + reglas de milestone
- creado `packages/engine/linea-kit/src/starterkits/**` — juguete línea/force
- creado `packages/engine/linea-kit/bin/linea-kit.mjs` — CLI
- creado `packages/engine/linea-kit/docs/tutorial-*.md` — tutoriales CA
- creado `packages/engine/linea-kit/test/tools.test.mjs` — unit tools
- creado `packages/engine/linea-kit/test/starterkit-e2e.test.mjs` — CA e2e
- modificado `packages/engine/linea-kit/{package.json,README.md}` — exports/bin
- creado `.changeset/wp-u81-segmentacion.md` — bump minor
- creado `plan/REPORTES/WP-U81-segmentacion.md` — este reporte

## Evidencia

```
$ npm test -w @zeus/linea-kit
# tests 16 / pass 16 / fail 0
# incluye CA: juguete E2E + linea-system (health + loadLineaData 3 nodos / 10 regs)

$ npm run gates
gates: OK (0 offenders)

$ npx eslint packages/engine/linea-kit/src/tools \
    packages/engine/linea-kit/src/starterkits \
    packages/engine/linea-kit/bin \
    packages/engine/linea-kit/test/tools.test.mjs \
    packages/engine/linea-kit/test/starterkit-e2e.test.mjs
# (sin salida; exit 0)

$ npm run lint
✖ 12 problems (0 errors, 12 warnings)  # warnings preexistentes ajenos al WP

$ npm run release:changeset-dry
# pending wp-u81-segmentacion.md → version linea-kit@0.2.0
# pack @zeus/linea-kit@0.2.0 … FAIL
#   - exports target missing from tarball: ./schemas/*
# (tree restored; ver hallazgos — preexistente U80 wildcard)
```

Arranque linea-system: e2e levanta `createServer` sobre la línea juguete y
hace GET `/mcp/health` (puerto de test 14181 vía env). Sin navegador
(`ZEUS_OPEN_BROWSER` unset).

## Demolición

n/a (nacimiento; pythons viven en network-engine, fuera de este repo).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no en `src/`/`bin/`. El e2e usa
  puerto 14181 en `/test/` (exento del gate de puertos), mismo patrón que
  smoke de linea-system.
- [x] Cadenas if/switch → tabla: milestones por `MILESTONE_RULES`; CLI por
  mapa `COMMANDS`.
- [x] Duplicación: reutiliza `validate` / schemas U80; no se copia loader.
- [x] console.log / código comentado / TODO sin backlog: no en tools.
- [x] Nombres de transición (`legacy`/`v2`/…): ninguno.
- [x] Demolición: n/a.
- [x] Tests de comportamiento: milestones, gate fetch, cobertura force,
  schemas, CA e2e con linea-system.
- [x] Arranque real: e2e crea línea + arranca MCP tronco + health OK.
- [x] README/docs del kit actualizados (tools, starterkits, tutoriales).
- [x] Diff solo alcance U81 (+ changeset + reporte).

Regla dos juegos: ¿pozo puede consumir esto tal cual? Sí — tools/starterkits
no nombran juegos ni forces concretas; gate `two-games` OK (flag CLI renombrado
a `--byte-threshold` porque `byte-delta` matcheaba `\bdelta\b`).

## Hallazgos fuera de alcance

1. **`release-dry` vs export `./schemas/*`** — el verificador busca literalmente
   la entrada `schemas/*` en el tarball; falla pack de `@zeus/linea-kit` aunque
   `schemas/` viaja. Preexistente desde U80; candidato fix en
   `scripts/release-dry.mjs` (saltar globs `*`).
2. **`release:changeset-dry` restaura package.json desde git** tras el bump —
   pisa cambios uncommitted del mismo archivo si se corre a mitad de WP.
   Runbook: changeset-dry al final, con package.json ya commiteado, o
   re-aplicar diffs.
3. Hallazgos U80 diferidos (DISK_03 gitignore, ZEUS_VOLUMES_ROOT/worktrees)
   siguen vigentes; no bloquean este CA (fixtures + temp dirs).

## Dudas / bloqueos

Ninguno bloqueante. Push: **no intentado** (política del brief).

---

## Revisión del orquestador

**Aceptado ✅** — 2026-07-18 (orquestador). **No** merge / **no** ✅ BACKLOG
en esta pasada (autorización pendiente de sesión de merge).

### Verificado

- Diff acotado a `@zeus/linea-kit` tools/starterkits/CLI/docs/tests +
  changeset minor + este reporte (21 files; sin BACKLOG; sin U82/U91).
- Rama al día de master (`merge-base` = `3d78e06`); sin merge extra.
- Re-CA: `npm test -w @zeus/linea-kit` → **16/16 pass** (incluye
  `CA: juguete E2E + linea-system`: 3 nodos + 10 registros, validate U80,
  `createServer` + GET `/mcp/health`).
- `npm run gates` → OK (0 offenders). ESLint del alcance WP → exit 0.
- Tutoriales: `docs/tutorial-linea-30min.md`, `docs/tutorial-force-30min.md`.
- Tools presentes: `crear-linea`, `segmentar`, `conectar-satelite`, `fetch`
  (gate `approve`), `segmentar-force`, `crear-cotas` + starterkits.
- PRACTICAS: sin nombres de juego en tools/starterkits; flag CLI
  `--byte-threshold` (evita `\bdelta\b` en two-games); demolición n/a;
  commits convencionales.

### CA

- [x] Starterkit línea juguete E2E (tronco 3 nodos + satélite 10 registros)
- [x] Valida schemas U80
- [x] Se sirve por linea-system apuntado a ella (health OK)
- [x] Tutorial documentado

### Cola hallazgos (no bloquean; añadir a BACKLOG en master al ✅)

1. **`release-dry` vs export `./schemas/*`** — verificador busca entrada
   literal `schemas/*` en tarball; pack `@zeus/linea-kit` falla aunque
   `schemas/` viaja. Preexistente U80. Candidato: `scripts/release-dry.mjs`
   (saltar globs `*`).
2. **Gate two-games vs `byte-delta`** — el flag CLI se renombró a
   `--byte-threshold` porque `byte-delta` matcheaba `\bdelta\b`. Documentar
   o afinar el gate si el dominio necesita el término en flags/API pública.
3. Hallazgos U80 diferidos (DISK_03 gitignore, ZEUS_VOLUMES_ROOT/worktrees)
   y el de changeset-dry que pisa `package.json` uncommitted — siguen en
   cola previa.

### Merge sugerido

Tras autorización usuario: merge `wp/u81-segmentacion` → master; luego ✅
BACKLOG + cola hallazgos arriba; `git worktree remove` del árbol U81.
Paralelo lote-7a: U82/U91 no chocan (partición respetada).
