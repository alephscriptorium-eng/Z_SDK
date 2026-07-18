# WP-U62 · release-pipeline — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (lote-ola6-c / Cursor) |
| fecha | 2026-07-18 |
| rama | `wp/u62-release-pipeline` (zeus) · `wp/u62-release-pipeline` (library) |
| commit(s) | _(hashes al cerrar)_ |
| estado propuesto | listo para revisión |

## Qué se hizo

Se implementó el pipeline de releases de datos (Notario) en
`Z_SDK-games-library`: paquetes `@zeus/startpack-delta` y
`@zeus/startpack-pozo`, script `scripts/notario-release.mjs` (tabla por
juego), workflow GitHub, docs de consumo, e2e de ronda desde tarball, y
cableado de autoridad delta/pozo + arg-console a start pack. En el monorepo
Z_SDK se demolió la política de VOLUMES vivos: solo fixtures sintéticos
`DISK_02`/`DISK_03` en git; `ZEUS_VOLUMES_ROOT` / README alineados a
startpack o árbol externo. GitHub Releases espejo creados con tarball +
acta. Publish npm registry: ⏳ sin `NPM_TOKEN` (equivalente documentado vía
tarball/`npm install` file).

## Archivos tocados

### Library `Z_SDK-games-library`

| archivo | acción |
| ------- | ------ |
| `packages/startpack-delta/**` | creado — start pack delta |
| `packages/startpack-pozo/**` | creado — start pack pozo (simetría) |
| `scripts/notario-release.mjs` | creado — pipeline Notario |
| `scripts/lib/startpack-games.mjs` | creado — catálogo juegos (tabla) |
| `scripts/resolve-startpack.mjs` | creado — resolución pack instalado |
| `e2e/startpack-round.mjs` | creado — CA ronda desde tarball |
| `.github/workflows/release-startpack.yml` | creado — Release CI |
| `docs/startpacks.md` | creado — docs consumo |
| `packages/delta/arg-demos/.../authority` + `lib/startpack.mjs` | modificado/creado — consume pack |
| `packages/pozo/src/authority.mjs` + `startpack.mjs` | modificado/creado — consume pack |
| `packages/delta/arg-console/src/server.mjs` | modificado — presets desde pack |
| `package.json` / lock / README / `.gitignore` | modificado — workspaces + scripts |

### Monorepo Z_SDK (`wp/u62-release-pipeline`)

| archivo | acción |
| ------- | ------ |
| `VOLUMES/DISK_02/**`, `VOLUMES/DISK_03/**` | creado — fixtures sintéticos (desde linea-kit) |
| `VOLUMES/README.md`, `VOLUMES/volumes.json` | modificado — política post-U62 |
| `.gitignore` | modificado — track fixtures; ignorar DISK_01/04 vivos |
| `.env.example`, `README.md` | modificado — ZEUS_VOLUMES_ROOT / startpack |
| `packages/engine/volumes-ops/README.md` | modificado — puntero fixtures/startpack |
| `plan/REPORTES/WP-U62-release-pipeline.md` | creado — este reporte |

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Library — unit startpack

```
# tests 2 (delta) + 1 (pozo)
# pass 3
# fail 0
```

### Library — e2e:startpack

```
✅ Notario tarball: .../zeus-startpack-delta-0.1.0.tgz
✅ Acta: .../ACTA-delta-v0.1.0.md
✅ npm install @zeus/startpack-delta (via file tarball) OK
✅ loadStartPack gamemap=gamemap-demo volumes=...
✅ authority arrancó ronda desde start pack
🟢 e2e:startpack OK
```

### GitHub Release (library)

```
https://github.com/alephscriptorium-eng/Z_SDK-games-library/releases/tag/startpack-delta-v0.1.0
assets: zeus-startpack-delta-0.1.0.tgz + ACTA-delta-v0.1.0.md

https://github.com/alephscriptorium-eng/Z_SDK-games-library/releases/tag/startpack-pozo-v0.1.0
assets: zeus-startpack-pozo-0.1.0.tgz + ACTA-pozo-v0.1.0.md
```

### Registry npm `@zeus/startpack-delta`

```
⏳ sin verificar — NPM_TOKEN ausente (ops gated, mismo espíritu U61 file:)
Equivalente CA: npm install ./zeus-startpack-delta-0.1.0.tgz → OK en e2e
```

### Monorepo

```
gates: OK (0 offenders)
npm run lint → 0 errors (11 warnings preexistentes)
npm test -w @zeus/volumes-ops → # pass 6 # fail 0
npm test -w @zeus/force-system → # pass 2 # fail 0 (fixture DISK_03)
node --test packages/engine/presets-sdk/test/env-volumes.mjs → # pass 2
npm test -w @zeus/presets-sdk → fail 2 preexistente (spec-sync openapi drift; no tocado en U62)
```

### Push

- Library: _(al cerrar)_ `git push -u origin wp/u62-release-pipeline`
- Zeus rama: **no intentado** (política worker)

### ¿pozo puede consumir el pipeline tal cual?

Sí: mismo Notario `--game pozo`, mismo shape de paquete, Release espejo
`startpack-pozo-v0.1.0`, autoridad pozo aplica `pack.env`. Evidencia Release
+ unit test; e2e authority round profundo solo ejecutado para delta (CA
prioriza delta; pozo simétrico en kit).

## Demolición

- Política VOLUMES vivos retirada del monorepo (README + volumes.json +
  gitignore). Fixtures sintéticos `DISK_02`/`DISK_03` sustituyen corpus vivo.
- Slots `DISK_01`/`DISK_04` marcados `deferred`; no se trackean.
- Grep operativo: docs ya no prometen DISK_01 firehose 38 MB en el repo.

```
# tracked under VOLUMES (post-U62):
git ls-files VOLUMES/ | head
# VOLUMES/README.md
# VOLUMES/volumes.json
# VOLUMES/DISK_02/...
# VOLUMES/DISK_03/...
test ! -d VOLUMES/DISK_01 && echo DISK_01_ABSENT_OK
```

Nota: copies locales de DISK vivos en el checkout principal (fuera del
worktree) no se borraron del disco del operador — están gitignoradas; ops
debe moverlas a `ZEUS_VOLUMES_ROOT` externo si aún las usa.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no; `ZEUS_*` / resolve startpack;
  registry URL solo en `publishConfig` / docs (como U60/U61).
- [x] Cadenas if/switch → tabla: catálogo `STARTPACK_GAMES` (tabla).
- [x] Duplicación: fixtures copiados a startpack/VOLUMES desde linea-kit
  (datos, no lógica); loader no copia engine.
- [x] console.log / código comentado / TODO sin backlog: logs de autoridad
  al cargar pack (operativos).
- [x] Nombres de transición: no `legacy`/`v2`/`old`.
- [x] Demolición VOLUMES vivos: docs + git policy; fixtures conservados.
- [x] Tests de comportamiento: loadStartPack + e2e install tarball + authority.
- [x] Arranque real: authority delta anunció start pack (e2e).
- [x] README/specs: library README + docs/startpacks.md + VOLUMES README.
- [x] Diff solo alcance U62: sí (zeus bins CRLF restaurados).

## Hallazgos fuera de alcance

- `scripts/ensure-zeus-sdk.mjs`: en Windows, junction rota a worktree borrado
  → `rmSync` no limpia y `symlink` falla `EEXIST`. Workaround: `rmdir` manual.
  Candidato a micro-fix post-U61.
- `@zeus/presets-sdk` `spec-sync` openapi drift en worktree (2 fails) —
  preexistente; no tocado.
- Publish real `@zeus/*` / `engine/*` sigue gated → U55.
- Notario aún no compacta ledger de ronda real (ARG WP-20/23 completo);
  U62 entrega el canal de release + pack instalable; compactación DISK viva
  queda para cuando haya rondas con escritura Notario completa.

## Dudas / bloqueos

Ninguno bloqueante. CA registry `npm install @zeus/startpack-delta` queda
⏳ honesto hasta ops `NPM_TOKEN` startpacks; evidencia equivalente (tarball +
Release + e2e) lista.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
