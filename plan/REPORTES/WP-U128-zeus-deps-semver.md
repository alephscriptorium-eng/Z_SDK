# WP-U128 · zeus-deps-semver — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok) |
| fecha | 2026-07-19 |
| rama zeus | `wp/u128-zeus-deps-semver` |
| rama library | `wp/u128-zeus-deps-semver` |
| commit(s) library | `43b6f9b` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se inventariaron deps/devDeps `@zeus/*: "*"` bajo `packages/` de la library (7
`package.json`, 50 ocurrencias). Se fijaron a caret semver:

- Publicados (pista `package-lock.json` + spot-check `npm view @zeus/protocol`
  → `0.2.0` en registry scriptorium): p. ej. `^0.2.0`, `^0.1.2`, …
- Workspace locales (`@zeus/arg-domain`, `arg-console`, `arg-feeds`): caret de
  su `version` en package.json (`^0.1.0`).

Se actualizó `package-lock.json` en el mismo commit. `npm install` + tests
básicos de paquetes tocados en verde.

## Archivos tocados

- `packages/delta/arg-console/package.json` — `*` → caret
- `packages/delta/arg-demos/package.json` — `*` → caret
- `packages/delta/arg-domain/package.json` — `*` → caret
- `packages/delta/arg-feeds/package.json` — `*` → caret
- `packages/delta/arg-player-mcp/package.json` — `*` → caret
- `packages/pozo/package.json` — `*` → caret
- `packages/solve-coagula/package.json` — `*` → caret
- `package-lock.json` — rangos alineados

## Evidencia

CA cero estrellas:

```
$ rg '"@zeus/[^"]+"\s*:\s*"\*"' packages --glob 'package.json'
ZERO stars OK
```

Install:

```
added 434 packages, and audited 448 packages in 2m
```

Tests:

```
npm test -w @zeus/arg-domain
# tests 72 / # pass 72 / # fail 0

npm test -w @zeus/arg-feeds
# tests 4 / # pass 4 / # fail 0
```

Push library: `origin/wp/u128-zeus-deps-semver` @ `43b6f9b`.

## Demolición

Rangos `"*"` en esas deps: demolidos (grep CA = cero).

## Auto-revisión (PRACTICAS.md §3)

- [x] Puertos/URLs hardcodeados: N/A
- [x] No se inventaron versiones no publicadas (lock + npm view + version local)
- [x] Diff solo package.json + lock de packages/ afectados
- [x] No se tocaron workflows (U126) ni docs CAPA (U125)
- [x] Tests de comportamiento existentes verdes

## Hallazgos fuera de alcance

Ninguno crítico.

## Dudas / bloqueos

Ninguno.

---

## Revisión del orquestador

**Aceptado ✅** — orquestador / 2026-07-19.

Verificado:
- Diff library `main...wp/u128-zeus-deps-semver` = 7 `package.json` bajo
  `packages/` + `package-lock.json` (commit `43b6f9b`). Zeus = solo este
  reporte (`03031ff`). No tocó workflows (U126) ni docs CAPA (U125).
- CA: `rg '"@zeus/[^"]+"\s*:\s*"\*"' packages --glob 'package.json'` → cero
  (reproducido). Carets alineados con lock/registry (`^0.2.0` protocol,
  `^0.1.2` presets-sdk, etc.; workspace locales `^0.1.0`).
- Nota: `*` residuales en lock bajo `node_modules/@zeus/feed-kit` vienen del
  tarball publicado (deps del paquete registry), fuera de alcance del CA.
- Evidencia install + tests arg-domain/arg-feeds en reporte; PRACTICAS OK.

**Merge:** library `wp/u128-zeus-deps-semver` + reporte zeus → `main` (último
de la serie B aceptada; U127 sigue bloqueado aparte).
