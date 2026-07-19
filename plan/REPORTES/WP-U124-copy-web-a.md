# WP-U124 · copy-web-a — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok 4.5) |
| fecha | 2026-07-19 |
| rama | `wp/u124-copy-web-a` |
| worktree | `.worktrees/wp-u124-copy-web-a` |
| commit(s) | `9bdd871` (+ este reporte) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se aplicó **verbatim** CAPA §W-A (`01-PAQUETE-CAPA.md`) al hero de
`docs/index.md`. Ancla ANTES coincidía literal con el repo; sin conflicto.
`name` → `Z_SDK`; `text` → `Juegos de Ventana de Contexto`; `tagline` →
una línea FOSS. `actions` y `features` intocados. Lema
«Crear juegos, no dialectos» reemplazado (D-25 / CAPA; no marketing SUPERADA).
Diff de producto = solo `docs/index.md`.

## Archivos tocados

- modificado `docs/index.md` — hero CAPA W-A (name / text / tagline)
- creado `plan/REPORTES/WP-U124-copy-web-a.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Hero DESPUÉS (literal en repo)

```
hero:
  name: Z_SDK
  text: Juegos de Ventana de Contexto
  tagline: |-
    FOSS Docs: framework ARG para comunidades.
```

### Diff scope

```
$ git diff --stat main...HEAD
 docs/index.md | 9 +++------
 1 file changed, 3 insertions(+), 6 deletions(-)
```

(`plan/REPORTES/…` se añade en commit de reporte; no toca portal.)

### Lema viejo

```
$ rg -n 'Crear juegos, no dialectos' docs/index.md
ABSENT
```

### actions / features

Diff solo muta `name` / `text` / `tagline` del hero; bloques `actions:` y
`features:` sin cambio de contenido (ver `git diff main...HEAD -- docs/index.md`).

### `docs:build`

**Bare (config actual, Windows local):** VitePress falla al renderizar —

```
build error:
Cannot read properties of undefined (reading 'imports')
TypeError: Cannot read properties of undefined (reading 'imports')
    at resolvePageImports (.../vitepress/dist/node/chunk-D3CUZ4fa.js:49514:18)
```

Diagnóstico (parche temporal de log, revertido): `pageChunk` undefined por
mismatch de case en drive letter — `srcPath` = `c:/Users/...` vs
`facadeModuleId` = `C:/Users/...`. **Reproducido también en main** con el
hero ANTES (no es regresión de CAPA).

**Verificación con workaround local no committed**
(`vite: { resolve: { preserveSymlinks: true } }` temporal en
`docs/.vitepress/config.mjs`, restaurado tras el run):

```
$ npm run docs:build
… AsyncAPI HTML generated: docs/public/api/protocol/
  vitepress v1.6.4
✓ building client + server bundles...
✓ rendering pages...
build complete in 40.68s.
DOCS_BUILD_EXIT:0
```

Specs regenerados por `docs:build` se descartaron (`git checkout -- packages/`);
no van en el diff del WP. Config no se commitió (alcance = solo hero /
`docs/index.md`).

CI Linux no afectado por el bug de case Windows (esperado verde allí;
`⏳ sin verificar` en esta máquina).

## Demolición

N/A (brief). Lema viejo no convive en `docs/index.md` (grep ABSENT arriba).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: N/A (solo frontmatter copy)
- [x] Cadenas if/switch que debieron ser tabla: N/A
- [x] Duplicación con otros paquetes: N/A (CAPA verbatim; no marketing SUPERADA)
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: `Z_SDK` viene de CAPA/D-25
- [x] Demolición completa: lema viejo ausente en index
- [x] Tests: N/A (WP docs); CA = copy literal + docs:build
- [x] Arranque real: VitePress build con workaround local → `build complete`;
      bare Windows rojo (preexistente)
- [x] README/specs del paquete: no tocados a propósito
- [x] El diff de producto contiene solo el alcance del WP: sí (`docs/index.md`)

## Hallazgos fuera de alcance

1. **VitePress 1.6.4 + Windows:** `resolvePageImports` rompe por
   `C:` vs `c:` tras `fs.realpathSync`. Workaround:
   `vite: { resolve: { preserveSymlinks: true } }` en
   `docs/.vitepress/config.mjs`. Candidato a micro WP / chore docs — **no
   aplicado** (CA exige diff solo `docs/index.md`).
2. `npm run docs:build` regenera specs OpenAPI/AsyncAPI con churn (EOL /
   noise) — no commitear (mismo hallazgo U120).

## Dudas / bloqueos

Ninguno de contenido CAPA (ancla OK). CA `docs:build` bare en Windows local
rojo por hallazgo #1; verde con workaround no committed. Orquestador: ¿aceptar
con evidencia CI / workaround, o abrir micro para `preserveSymlinks`?

---

## Revisión del orquestador

**Aceptado ✅** — orquestador / 2026-07-19.

Verificado:
- Diff `main...wp/u124-copy-web-a` = solo `docs/index.md` + este reporte
  (alcance cerrado; commits `9bdd871` + `7d1d607`).
- Hero DESPUÉS literal vs `01-PAQUETE-CAPA.md` §W-A:
  `Z_SDK` / `Juegos de Ventana de Contexto` /
  `FOSS Docs: framework ARG para comunidades.`
- Diff de `docs/index.md` muta solo `name` / `text` / `tagline`;
  `actions` y `features` sin cambio de contenido vs main.
- Lema «Crear juegos, no dialectos» ABSENT en `docs/index.md`.
- Reporte + auto-revisión honestos; worker no tocó BACKLOG.
- `docs:build` bare Windows: quirk preexistente `C:` vs `c:`
  (`resolvePageImports` / `pageChunk` undefined) — reproducido en main
  con hero ANTES; **no es regresión CAPA**. Verde con
  `vite.resolve.preserveSymlinks: true` temporal (no committed). CI Linux
  no afectado. Aceptado con esa evidencia.

**Hallazgo → cola residual (sin GO / sin WP nuevo):** candidate micro
`docs/.vitepress/config.mjs` → `vite.resolve.preserveSymlinks: true`
(VitePress 1.6.4 + Windows drive-letter case).

**Merge:** `wp/u124-copy-web-a` → `main` (merge commit tras U125 ya en
main; no FF). Orden: tras A ambos (U124∥U125) ✅. No tocar U126+ / U131.
