# WP-U150 · gate-sitio — reporte

| dato | valor |
| ---- | ----- |
| agente | ejecutor lote Sprint 5 (orquestador+worker) |
| fecha | 2026-07-20 |
| rama | `wp/u150-gate-sitio` (parte de tip U149 `9290073`) |
| commits | _(tip tras commit)_ |
| eje(s) CA | site-web (C8-ampliado) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se cableó `verificar-sitio.mjs` del paquete (no copiado) como
`npm run docs:verify` y paso de `.github/workflows/docs.yml` **tras**
`docs:build`. Se unificó el slug del monorepo: el enlace roto era
`…/zeus-sdk/…` en `docs/guide/layout.md` (404); el remoto real es
`alephscriptorium-eng/Z_SDK` (como ya usaba `estado.md`). Se ampliaron
`paths` del workflow Docs para incluir el propio workflow y `package.json`.

## Archivos tocados

- `.github/workflows/docs.yml` · modificado — paso verify + paths
- `package.json` · modificado — script `docs:verify`
- `docs/guide/layout.md` · modificado — slug `zeus-sdk` → `Z_SDK`
- `plan/REPORTES/WP-U150-gate-sitio.md` · creado — este reporte

## Evidencia

### CA1 · gate falla ante enlace roto (rojo → revert)

```
# sonda temporal en dist/guide/layout.html → /no-existe-u150-probe
$ npm run docs:verify; echo FAIL_EXIT=$?
[verificar-sitio] FALLO: 1 problema(s) que bloquean el deploy.
  ✗ INTERNO guide/layout.html → /no-existe-u150-probe
FAIL_EXIT=1

# tras restaurar html
$ npm run docs:verify; echo OK_EXIT=$?
[verificar-sitio] OK: enlaces internos y anclas resuelven; …
OK_EXIT=0
```

### CA2 · slug unificado y resoluble

```
$ grep -n 'github.com/alephscriptorium-eng/' docs/guide/layout.md docs/guide/estado.md
layout.md:3: …/Z_SDK/blob/main/plan/ARQUITECTURA.md
estado.md:7–8: …/Z_SDK/blob/main/plan/BACKLOG.md · DECISIONES.md

# verificación previa (gh api): repo Z_SDK existe; zeus-sdk → 404
```

### CA3 · docs:build + verify verdes

```
$ npm run docs:build   # BUILD_EXIT=0 (vitepress build complete)
$ npm run docs:verify
[verificar-sitio] dist=docs/.vitepress/dist base=/ html=32
  enlaces internos rotos: 0
  anclas rotas:           0
[verificar-sitio] OK
```

## Auto-revisión (PRACTICAS)

- [x] Diff dentro de ALCANCE_DIFF
- [x] Gate invocado desde node_modules (no copiado)
- [x] Eje site-web evidenciado (fail probe)
- [x] Sin hardcode back-links (U152)
- [x] Commits convencionales

## Hallazgos fuera de alcance

- CI run_id Docs = N/A sin push (exigir en revisión tras push).
- Huérfanos `.worktrees/wp-u12|u23|u89` detectados por vigía (U153) — higiene.

## Dudas / bloqueos

Ninguno. Dep U149 incluida en la base de la rama.

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** (orquestador · 2026-07-20)

### CA
- [x] CA1 — gate falla ante enlace muerto (probe /tmp dist → exit 1; verde tras limpio)
- [x] CA2 — slug unificado `Z_SDK` (remoto real; `zeus-sdk` 404) en layout/estado
- [x] CA3 — `docs:build` + `docs:verify` verdes (html=32)
- [x] ALCANCE_DIFF OK; invoca script desde node_modules (no copia); ceguera OK

### Merge
En main vía stack U152; tip U150 `9ef2eaf`. Push → exigir `gh run` Docs success.
