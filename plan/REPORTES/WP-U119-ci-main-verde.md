# WP-U119 · ci-main-verde — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (wp-u119-ci-main-verde) |
| fecha | 2026-07-18 |
| rama | `wp/u119-ci-main-verde` |
| commit(s) | `11f1f2f` (fix), `1ea35ac` (reporte tip) |
| estado propuesto | listo para revisión |
| push | sí |

## Qué se hizo

Se diagnosticó y corrigió el rojo de CI/Release en main (runs 29656058145 /
29656058148) en los 4 workspaces, sin debilitar asserts:

1. **http-contract** — assert hardcodeaba `0.1.0` tras bump a `0.1.1`; ahora
   lee `package.json`. Además `assertSpecMatches` normaliza EOL (CRLF Windows
   vs LF generado) — deriva local-vs-runner conocida.
2. **linea-system** — `hasLiveLineasRegistry()` solo miraba `registry.yaml`;
   el registry committed lista solo `demo`, pero `startAll()` exige `espana`.
   Detector endurecido: id `espana` en registry + dir en disco; si no → skip ⏳.
3. **firehose-browser** — `route-mcp-e2e` usaba VOLUMES committed con firehose
   deferred (`corpora: []`) → 404 en `/api/corpora/candidate`. Mismo patrón que
   `routes.mjs`: `forceMinimal: true`.
4. **editor-ui** — `resolveLibraryRoot()` lanzaba al cargar el módulo si no hay
   sibling `Z_SDK-games-library` (CI). Ahora retorna null; release tests skip ⏳
   salvo library usable (notario + `node_modules/@zeus/startpack-kit`).

## Archivos tocados

- `.changeset/wp-u119-ci-main-verde.md` — creado: patch http-contract (EOL)
- `packages/engine/http-contract/src/spec-sync.mjs` — modificado: normalize EOL
- `packages/engine/http-contract/test/endpoint-coherence.test.mjs` — modificado:
  versión dinámica
- `packages/mesh/linea-system/test/helpers/live-volumes.mjs` — modificado:
  requiere id espana
- `packages/mesh/firehose-browser/test/route-mcp-e2e.test.mjs` — modificado:
  forceMinimal
- `packages/editor/editor-ui/test/routes.mjs` — modificado: skip hermético
  games-library
- `plan/REPORTES/WP-U119-ci-main-verde.md` — este reporte

## Root cause (por workspace)

| workspace | causa raíz | fix |
| --------- | ---------- | --- |
| `@zeus/http-contract` | Test version pin desfasado tras changeset release (`0.1.0`≠`0.1.1`); EOL CRLF en Windows para specs | assert vs `pkg.version`; normalize EOL en `assertSpecMatches` |
| `@zeus/linea-system` | Skip U102 demasiado débil: `registry.yaml` demo-only habilitaba tests que necesitan corpus live `espana` | exigir `id: espana` + dir; skip ⏳ si no |
| `@zeus/firehose-browser` | smoke-env tomaba VOLUMES committed con firehose deferred vacío; e2e pedía corpus `candidate` | `setupSmokeVolumesEnv(..., { forceMinimal: true })` |
| `@zeus/editor-ui` | Throw module-level sin sibling games-library en CI | resolve nullable + skip ⏳ en release tests |

## Evidencia

### `@zeus/http-contract`

```
# tests 18
# pass 18
# fail 0
```

### `@zeus/linea-system`

```
# Subtest: linea MCP linea://info matches RESOURCE_PAYLOADS
ok 1 - linea MCP linea://info matches RESOURCE_PAYLOADS # SKIP ⏳ VOLUMES/DISK_02/LINEAS live id:espana missing — corpus not in repo (CI/worktree; demo fixture alone is insufficient)
# Subtest: linea-system smoke
ok 2 - linea-system smoke # SKIP ⏳ VOLUMES/DISK_02/LINEAS live id:espana missing — corpus not in repo (CI/worktree; demo fixture alone is insufficient)
# tests 2
# pass 0
# fail 0
# skipped 2
```

### `@zeus/firehose-browser`

```
# tests 5
# pass 5
# fail 0
```

### `@zeus/editor-ui`

```
# tests 17
# pass 15
# fail 0
# skipped 2
```

(release sketch/plaza skipped ⏳ — library sibling sin `node_modules/@zeus/startpack-kit`)

### lint + gates

```
npm run lint → exit 0 (0 errors, 11 warnings preexistentes)
npm run gates → gates: OK (0 offenders)
npm run test:gates → # pass 9 # fail 0
```

- Efecto visible (vistas/demo): ⏳ sin verificar (WP de hermeticidad CI; no demo interactiva).
- CI verde en `main` tras merge: ⏳ sin verificar (worker no merge; orquestador).

## Demolición

- Throw duro `Z_SDK-games-library not found for editor release tests` al importar
  `routes.mjs` → skip ⏳ documentado.
- Skip linea que trataba `registry.yaml` demo como corpus live.
- Pin de versión `0.1.0` en test de http-contract.
- Asunción de firehose corpora en VOLUMES committed sin `forceMinimal`.

```
rg "Z_SDK-games-library not found for editor release tests" packages/editor
# (cero matches — throw demolido)
rg "assert.equal\\(readPackageVersion.*0\\.1\\.0\\)" packages/engine/http-contract
# (cero matches)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no añadidos (paths de candidatos
  sibling library preexistentes).
- [x] Cadenas if/switch → tabla: no aplica.
- [x] Duplicación: detector library es local al test (no hay helper compartido
  exportado); OK para alcance.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres de transición: no.
- [x] Demolición: throws/pins/skips débiles arriba.
- [x] Tests prueban comportamiento: asserts de release/version/corpora intactos;
  skip solo cuando el entorno no puede satisfacer el precondicion.
- [ ] Arranque real: ⏳ sin demo; servers in-process en tests sí.
- [x] README/specs: sin cambio de contrato HTTP; EOL sync no regenera specs.
- [x] Diff solo alcance WP: sí (4 WS + changeset + reporte). Sin BACKLOG.

## Hallazgos fuera de alcance

1. **CRLF residual en cola** — este WP cerró la clase en `assertSpecMatches`;
   otros sync (AsyncAPI/types) pueden seguir en cola residual.
2. **Sibling `Z_SDK-games-library` sin `npm ci`** — release editor local skip;
   ops/dev debe instalar library para ejercitar Notario.
3. **U120–U122 / U55** — no tocados (fuera de alcance).

## Dudas / bloqueos

Ninguno. Tras merge, orquestador debe confirmar run CI verde en main
(⏳ hasta entonces).

---

## Revisión del orquestador

**Aceptado ✅** — orquestador / 2026-07-18 · tip `8e81fa7`.

Verificado:
- Diff acotado a los 4 workspaces + changeset http-contract + reporte (sin BACKLOG).
- Root cause por workspace documentada; fixes = patrón U102 (hermético / skip-⏳), no asserts aflojados.
- Re-smoke orquestador: http-contract / linea-system / firehose-browser / editor-ui → fail 0 (skips ⏳ esperados).
- PRACTICAS §3 honesta; demolición del throw module-level y pin `0.1.0` OK.
- CA «CI verde en main»: código listo; confirmación del run remoto tras merge = seguimiento ops (⏳ al aceptar).

**Merge:** `wp/u119-ci-main-verde` → `main` (único en vuelo). Tras merge: worktree remove; desbloquea U120∥U121.
