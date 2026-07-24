# WP-U165 · gate-prepub-mesh-allowlist — reporte

| dato | valor |
| ---- | ----- |
| agente | Worker-U165 |
| fecha | 2026-07-24 |
| rama | `wp/u165-gate-prepub-mesh-allowlist` |
| commits | `0092638` (feat) · reporte en commit docs de esta entrega |
| eje(s) CA | IV + C8 |
| estado propuesto | listo para revisión |
| DC | DC-15 LOCAL-ONLY |

## Qué se hizo

Se añadió el gate opt-in `npm run gate:publish-ready`, sin job ni vía de
publish. Mide el subset **P0×4** ya preparado por U163/U164 y falla si
regresan `publishConfig.registry`, `files` / pack limpio, política de tipos
JS-only o rangos internos `@zeus/*`. P1 (`@zeus/linea-editor`) queda
explícitamente excluido porque U166 lo conservó candidato pero documentó
que su publish-ready completo sigue `<pendiente>`; incluirlo produciría un
rojo permanente conocido.

El gate toma `CANDIDATES.P0/P1` del audit post-U166, por lo que
`audit-publish-allowlist.mjs` ahora solo ejecuta `main()` al invocarse
directamente y sigue funcionando como antes. La comprobación de pack usa
exclusivamente `npm pack --dry-run --json`. No hubo publish, cambios de
`private`, changesets ni cableado release.

## Archivos tocados

- `scripts/gate-publish-ready.mjs` — creado: gate P0, pack dry-run y
  fail-probe en memoria.
- `scripts/audit-publish-allowlist.mjs` — modificado: import seguro de la
  allowlist nominal sin ejecutar el audit como efecto lateral.
- `package.json` — modificado: script opt-in `gate:publish-ready`.
- `plan/REPORTES/WP-U165-gate-prepub-mesh-allowlist.md` — creado: este
  reporte.

## Evidencia

> Salida literal. Todos los comandos se ejecutaron desde el worktree U165.

### Base integrada U164 + U166 y frontera allowlist

```
$ git rev-parse HEAD
0092638b19e7b2d65a4a2c4f8557d7dc79635a1b
$ git rev-parse bab3ad5
bab3ad55a5ceb681a8e0c44da0fd6f687867ed64
$ git merge-base --is-ancestor 6a2a409 HEAD && printf 'U164_reachable=6a2a409\n'
U164_reachable=6a2a409
$ git merge-base --is-ancestor 25cf693 HEAD && printf 'U166_reachable=25cf693\n'
U166_reachable=25cf693
$ git diff --exit-code bab3ad5 -- plan/PUBLISH-ALLOWLIST.md \
    && printf 'allowlist_vs_bab3ad5=byte-identical\n'
allowlist_vs_bab3ad5=byte-identical
```

La rama nació exactamente de `bab3ad5`; el merge U164 `6a2a409` y el merge
U166 `25cf693` son ancestros alcanzables. La allowlist quedó byte-for-byte
intacta respecto de esa base.

### Re-gate integrado obligatorio — P0 resultante de U164 + audit U166

```
$ npm run gate:publish-ready

> zeus-sdk@0.1.0 gate:publish-ready
> node scripts/gate-publish-ready.mjs

gate:publish-ready (WP-U165; P0 allowlist subset)
registry (.npmrc @zeus): https://npm.scriptorium.escrivivir.co
measured: @zeus/linea-system, @zeus/linea-firehose, @zeus/force-system, @zeus/ssb-system
excluded P1 (pending publish-ready WP): @zeus/linea-editor
PASS @zeus/linea-system manifest=packages/mesh/linea-system/package.json files=explicit pack=8 types=JS-only zeusDeps=4
PASS @zeus/linea-firehose manifest=packages/mesh/linea-firehose/package.json files=explicit pack=6 types=JS-only zeusDeps=3
PASS @zeus/force-system manifest=packages/mesh/force-system/package.json files=explicit pack=8 types=JS-only zeusDeps=4
PASS @zeus/ssb-system manifest=packages/mesh/ssb-system/package.json files=explicit pack=11 types=JS-only zeusDeps=3
gate:publish-ready: OK (4 P0 candidates)
```

El registry esperado se lee de `.npmrc` (`@zeus:registry`), no de un
tarball workspace. Cada `publishConfig.registry` debe igualarlo. El gate
rechaza `*`, `workspace:`, `file:`, `link:` y rutas locales en deps
`@zeus/*` de dependencies/dev/peer/optional. Los cuatro P0 aplican la
decisión JS-only documentada por U163/U164: exports ESM runtime, sin
declaraciones inventadas.

Audit nominal post-U166, ejecutado contra el registry canónico:

```
$ npm run audit:publish-allowlist
audit:publish-allowlist (WP-U162)
registry: https://npm.scriptorium.escrivivir.co
packages/** package.json files: 49
unique package names: 49
allowlist candidatos: 5 (P0=4 P1=1)

--- summary ---
total_unique: 49
ya_publicado: 29
candidato: 5
mantener_privado: 15

--- candidatos (allowlist §3, no publicados) ---
@zeus/force-system	P0	private=true	packages/mesh/force-system/package.json
@zeus/linea-editor	P1	private=true	packages/mesh/linea-editor/package.json
@zeus/linea-firehose	P0	private=true	packages/mesh/linea-firehose/package.json
@zeus/linea-system	P0	private=true	packages/mesh/linea-system/package.json
@zeus/ssb-system	P0	private=true	packages/mesh/ssb-system/package.json
(exit 0)
```

### Fallo rojo reproducible y reversible

`--fail-probe` cambia una dependencia solo en el objeto cargado en memoria;
no escribe el manifest. El wrapper confirma que el gate devolvió exit 1:

```
$ set +e; node scripts/gate-publish-ready.mjs \
    --package @zeus/linea-system --fail-probe
fail-probe (memory only): dependencies.@zeus/http-contract=*
gate:publish-ready (WP-U165; P0 allowlist subset)
registry (.npmrc @zeus): https://npm.scriptorium.escrivivir.co
measured: @zeus/linea-system
excluded P1 (pending publish-ready WP): @zeus/linea-editor
FAIL @zeus/linea-system
  - dependencies.@zeus/http-contract=*; expected a registry semver range, not wildcard/workspace/local
gate:publish-ready: FAIL (1 violation)
fail_probe_exit=1
```

### Gates, sintaxis y lint

```
$ npm run gates
> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs
gates: OK (0 offenders)

$ node --check scripts/gate-publish-ready.mjs
(exit 0, sin salida)
$ node --check scripts/audit-publish-allowlist.mjs
(exit 0, sin salida)

$ C:/S_LAB/z-sdk/node_modules/.bin/eslint \
    --config C:/S_LAB/z-sdk/eslint.config.mjs \
    C:/S_LAB/.worktrees/z/wp-u165-gate-prepub-mesh-allowlist/scripts/gate-publish-ready.mjs \
    C:/S_LAB/.worktrees/z/wp-u165-gate-prepub-mesh-allowlist/scripts/audit-publish-allowlist.mjs
(exit 0, sin salida)
```

### Cableado npm / CI

El cableado es deliberadamente opt-in en `package.json`:
`"gate:publish-ready": "node scripts/gate-publish-ready.mjs"`. No se tocó
ningún workflow. Por tanto no existe job de publish ni efecto sobre release;
un CI posterior puede invocar el mismo comando como check acotado.

**Evidencia CI:** N/A local-only; la rama no se empujó y no se afirma un run
de Actions inexistente.

## Demolición

N/A: el WP añade un gate y no sustituye otro camino. El audit existente se
conserva ejecutable y aporta la fuente nominal importada por el gate.

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: `scripts/**`, `package.json` y
      este reporte.
- [x] Cero árboles/ficheros copiados de otros mundos.
- [x] Sellos con fuente: `.npmrc`, allowlist §3/§5 y reportes U163/U164/U166.
- [x] Sin fluff ni promesa futura sin `<pendiente>`; P1 queda explícitamente
      fuera por su estado integrado.
- [x] Eje IV: un único gate mide cuatro clientes P0 del contrato.
- [x] C8: registry leído de `.npmrc`; se rechazan deps workspace/locales.
- [x] Gates ejecutados de verdad; fail-probe rojo y reversible evidenciado.
- [x] Commit convencional `feat(release): gate P0 publish readiness`.
- [x] Diff solo del alcance: cero BACKLOG, allowlist, manifests candidatos,
      `private`, `.changeset/**`, workflows release o publish.
- [x] Sin puertos/rooms, cadenas de dispatch, código comentado ni TODO.
- [x] Tests de comportamiento: verde real P0 + probe rojo sobre el mismo
      evaluador; el WP no cambia runtime de paquetes.

## Hallazgos fuera de alcance

- `@zeus/linea-editor` P1 sigue fallando publish-ready por diseño integrado
  U166 (`files`, registry y pines `<pendiente>`). No se corrigió aquí.

## Dudas / bloqueos

Ninguno. No se ejecutó `npm publish`, no se hizo push y no se mergeó a main.

---

## Revisión del orquestador

**Aceptado ✅ · 2026-07-24.**

- ALCANCE_DIFF: `scripts/gate-publish-ready.mjs` + import seguro del
  audit + script npm + este reporte; allowlist byte-identical vs
  `bab3ad5` (solo lectura).
- Re-gate integrado obligatorio sobre base U164+U166: ancestros
  `6a2a409` (U164) y `25cf693` (U166) alcanzables; `npm run
  gate:publish-ready` → OK P0×4; `npm run gates` → OK.
- Fail-probe independiente: `--package @zeus/linea-system --fail-probe`
  → exit 1 (dep `*` en memoria; sin escritura de manifests).
- Eje IV + C8: registry canónico desde `.npmrc`; P1 excluido con causa
  documentada (U166 / publish-ready pendiente).
- Fronteras: cero edit allowlist · cero flip `private` · cero
  changesets · cero workflows publish · cero `npm publish`.
- Merge post-✅ a `main` (último de Ola B).

---

## Corrección · reapertura tras R11-Z FAIL · 2026-07-24

| dato | valor |
| ---- | ----- |
| agente | Worker-U165 (carril orquestador · corrección) |
| fecha | 2026-07-24 |
| rama | `wp/u165-gate-semver-registry-probes` |
| base | tip main `98eea90` (gob. reopen) |
| gate FAIL | `plan/REPORTES/entregas/GATE-R11-Z-FAIL.md` |
| estado propuesto | listo para revisión (re-✅) |
| DC | DC-15 LOCAL-ONLY |

### Motivo (literal del FAIL)

`isRegistryRange()` solo rechazaba `*`, `workspace:`/`file:`/`link:` y
rutas `./` `/`. Aceptaba `latest`, Git/URL, rutas Windows y semver exacto
inexistente en registry. Un único fail-probe cubría `*`.

### Qué se corrigió

- Predicado `classifyZeusVersion`: exige **pin semver exacto**
  (`semver.valid`); rechaza wildcards, dist-tags, Git/URL, protocolos
  locales y rutas POSIX/Windows.
- Resolución C8: `npm view <name>@<pin> version --registry` (cache) por
  cada dep `@zeus/*` medida.
- `--fail-probe <kind>`: `star` · `latest` · `git` · `url` ·
  `windows-path` · `missing-version` (inyección solo en memoria).
- Allowlist **no tocada**; `private: true` en P0×4 intacto; cero
  changesets / publish / workflows.

### Archivos tocados (esta corrección)

- `scripts/gate-publish-ready.mjs` — sensor + probes + registry view.
- este reporte — addenda de corrección.

### Tabla probes (esperado vs obtenido)

| probe | esperado | obtenido |
| ----- | -------- | -------- |
| verde P0×4 (`npm run gate:publish-ready`) | PASS exit 0 | PASS exit 0 |
| `--fail-probe star` (`*`) | FAIL exit 1 | FAIL exit 1 |
| `--fail-probe latest` | FAIL exit 1 | FAIL exit 1 |
| `--fail-probe git` | FAIL exit 1 | FAIL exit 1 |
| `--fail-probe url` | FAIL exit 1 | FAIL exit 1 |
| `--fail-probe windows-path` | FAIL exit 1 | FAIL exit 1 |
| `--fail-probe missing-version` (`9.9.9`) | FAIL exit 1 (E404 registry) | FAIL exit 1 |

### Evidencia literal

### Re-gate P0×4 (corrección R11-Z FAIL)

```
$ git rev-parse HEAD
98eea90c83746353065bdfc261e3563d3b8903b7
$ npm run gate:publish-ready

> zeus-sdk@0.1.0 gate:publish-ready
> node scripts/gate-publish-ready.mjs

gate:publish-ready (WP-U165; P0 allowlist subset)
registry (.npmrc @zeus): https://npm.scriptorium.escrivivir.co
measured: @zeus/linea-system, @zeus/linea-firehose, @zeus/force-system, @zeus/ssb-system
excluded P1 (pending publish-ready WP): @zeus/linea-editor
PASS @zeus/linea-system manifest=packages/mesh/linea-system/package.json files=explicit pack=8 types=JS-only zeusDeps=4
PASS @zeus/linea-firehose manifest=packages/mesh/linea-firehose/package.json files=explicit pack=6 types=JS-only zeusDeps=3
PASS @zeus/force-system manifest=packages/mesh/force-system/package.json files=explicit pack=8 types=JS-only zeusDeps=4
PASS @zeus/ssb-system manifest=packages/mesh/ssb-system/package.json files=explicit pack=11 types=JS-only zeusDeps=3
gate:publish-ready: OK (4 P0 candidates)
```

#### Probe rojo `star`

```
$ node scripts/gate-publish-ready.mjs --package @zeus/linea-system --fail-probe star
fail-probe (memory only): kind=star dependencies.@zeus/http-contract=*
gate:publish-ready (WP-U165; P0 allowlist subset)
registry (.npmrc @zeus): https://npm.scriptorium.escrivivir.co
measured: @zeus/linea-system
excluded P1 (pending publish-ready WP): @zeus/linea-editor
FAIL @zeus/linea-system
  - dependencies.@zeus/http-contract=*; expected exact registry semver pin (wildcard *)
gate:publish-ready: FAIL (1 violation)
fail_probe_exit=1
```

#### Probe rojo `latest`

```
$ node scripts/gate-publish-ready.mjs --package @zeus/linea-system --fail-probe latest
fail-probe (memory only): kind=latest dependencies.@zeus/http-contract=latest
gate:publish-ready (WP-U165; P0 allowlist subset)
registry (.npmrc @zeus): https://npm.scriptorium.escrivivir.co
measured: @zeus/linea-system
excluded P1 (pending publish-ready WP): @zeus/linea-editor
FAIL @zeus/linea-system
  - dependencies.@zeus/http-contract=latest; expected exact registry semver pin (not an exact registry semver pin (tags/ranges rejected))
gate:publish-ready: FAIL (1 violation)
fail_probe_exit=1
```

#### Probe rojo `git`

```
$ node scripts/gate-publish-ready.mjs --package @zeus/linea-system --fail-probe git
fail-probe (memory only): kind=git dependencies.@zeus/http-contract=git+https://example.com/zeus/http-contract.git
gate:publish-ready (WP-U165; P0 allowlist subset)
registry (.npmrc @zeus): https://npm.scriptorium.escrivivir.co
measured: @zeus/linea-system
excluded P1 (pending publish-ready WP): @zeus/linea-editor
FAIL @zeus/linea-system
  - dependencies.@zeus/http-contract=git+https://example.com/zeus/http-contract.git; expected exact registry semver pin (git/github locator)
gate:publish-ready: FAIL (1 violation)
fail_probe_exit=1
```

#### Probe rojo `url`

```
$ node scripts/gate-publish-ready.mjs --package @zeus/linea-system --fail-probe url
fail-probe (memory only): kind=url dependencies.@zeus/http-contract=https://example.com/zeus-http-contract.tgz
gate:publish-ready (WP-U165; P0 allowlist subset)
registry (.npmrc @zeus): https://npm.scriptorium.escrivivir.co
measured: @zeus/linea-system
excluded P1 (pending publish-ready WP): @zeus/linea-editor
FAIL @zeus/linea-system
  - dependencies.@zeus/http-contract=https://example.com/zeus-http-contract.tgz; expected exact registry semver pin (http(s) URL)
gate:publish-ready: FAIL (1 violation)
fail_probe_exit=1
```

#### Probe rojo `windows-path`

```
$ node scripts/gate-publish-ready.mjs --package @zeus/linea-system --fail-probe windows-path
fail-probe (memory only): kind=windows-path dependencies.@zeus/http-contract=C:\tmp\zeus-http-contract
gate:publish-ready (WP-U165; P0 allowlist subset)
registry (.npmrc @zeus): https://npm.scriptorium.escrivivir.co
measured: @zeus/linea-system
excluded P1 (pending publish-ready WP): @zeus/linea-editor
FAIL @zeus/linea-system
  - dependencies.@zeus/http-contract=C:\tmp\zeus-http-contract; expected exact registry semver pin (Windows/absolute path)
gate:publish-ready: FAIL (1 violation)
fail_probe_exit=1
```

#### Probe rojo `missing-version`

```
$ node scripts/gate-publish-ready.mjs --package @zeus/linea-system --fail-probe missing-version
fail-probe (memory only): kind=missing-version dependencies.@zeus/http-contract=9.9.9
gate:publish-ready (WP-U165; P0 allowlist subset)
registry (.npmrc @zeus): https://npm.scriptorium.escrivivir.co
measured: @zeus/linea-system
excluded P1 (pending publish-ready WP): @zeus/linea-editor
FAIL @zeus/linea-system
  - dependencies.@zeus/http-contract@9.9.9 not resolvable on registry https://npm.scriptorium.escrivivir.co (E404: npm error code E404 | npm error 404 No match found for version 9.9.9 | npm error 404 | npm error 404  '@zeus/http-contract@9.9.9' is not in this registry.)
gate:publish-ready: FAIL (1 violation)
fail_probe_exit=1
```



### Gates / lint

```
$ npm run gates
gates: OK (0 offenders)
$ node --check scripts/gate-publish-ready.mjs
(exit 0)
$ eslint scripts/gate-publish-ready.mjs
(exit 0)
$ git diff --exit-code HEAD -- plan/PUBLISH-ALLOWLIST.md
allowlist intact
```

### Auto-revisión

- [x] Diff solo `scripts/gate-publish-ready.mjs` + este reporte.
- [x] Allowlist solo lectura.
- [x] CA R11-Z FAIL: pines + registry + probes rojos ×5 + verde.
- [x] Frontera: cero private flip · cero publish · cero changesets.
- [x] Re-gate P0×4 OK.

### Dudas / bloqueos

Ninguno. Push/merge = orquestador post-✅. No declarar R11-Z PASS.

## Revisión del orquestador · re-✅ corrección R11-Z FAIL

**Aceptado ✅ · 2026-07-24 (re-validado).**

- CA del FAIL cubiertos: pines semver exactos; rechazo
  latest/Git/URL/Windows; resolución registry C8 (`npm view`); probes
  rojos ×5 + verde P0×4.
- ALCANCE_DIFF: solo `scripts/gate-publish-ready.mjs` + reporte;
  allowlist intacta; U164/U166 no reabiertos.
- Fronteras: cero private · cero publish · cero changesets.
- Merge `b550510` · tip obra `5a3c4d9`.
- Siguiente: aviso **reintento R11-Z** (no declarar PASS).

---

## Addenda · corrección FAIL-REINTENTO (semver raíz) · 2026-07-24

| dato | valor |
| ---- | ----- |
| agente | Worker-U165 (re-despacho) |
| fecha | 2026-07-24 |
| rama | `wp/u165-semver-root-devdep` |
| base tip | `ae0a4a2` (main con gobierno reopen) |
| eje(s) CA | IV + C8 |
| estado propuesto | listo para revisión |
| DC | DC-15 LOCAL-ONLY |

### Motivo FAIL-REINTENTO

`scripts/gate-publish-ready.mjs` hace `require('semver')`, pero el
`package.json` raíz no declaraba `semver` en `devDependencies`.
`npm ls semver --depth=0` devolvía `(empty)` / exit 1; el gate solo
funcionaba por hoisting transitivo (no contrato). Fuente:
`plan/REPORTES/entregas/GATE-R11-Z-FAIL-REINTENTO.md`.

### Qué se hizo

1. `npm install --save-dev semver` en la raíz del worktree.
2. `semver` quedó en `devDependencies` del `package.json` raíz
   (`^7.8.5`) y `package-lock.json` actualizado.
3. Re-ejecutados P0×4, probes ×6 y `npm run gates`.
4. Sin tocar scripts, allowlist, private, changesets ni publish.

### Archivos tocados

- `package.json` — `devDependencies.semver: "^7.8.5"`.
- `package-lock.json` — lock coherente con la declaración directa.
- `plan/REPORTES/WP-U165-gate-prepub-mesh-allowlist.md` — esta addenda.

### Evidencia · `npm ls semver --depth=0`

```
$ npm ls semver --depth=0
zeus-sdk@0.1.0 C:\S_LAB\.worktrees\z\wp-u165-semver-root-devdep
└── semver@7.8.5

npm_ls_exit=0
```

### Tabla gate / probes

| chequeo | comando | exit |
| ------- | ------- | ---- |
| P0×4 verde | `npm run gate:publish-ready` | 0 |
| probe star | `--fail-probe star` | 1 |
| probe latest | `--fail-probe latest` | 1 |
| probe git | `--fail-probe git` | 1 |
| probe url | `--fail-probe url` | 1 |
| probe windows-path | `--fail-probe windows-path` | 1 |
| probe missing-version | `--fail-probe missing-version` | 1 |
| gates | `npm run gates` | 0 |

Salida literal P0×4:

```
$ npm run gate:publish-ready

> zeus-sdk@0.1.0 gate:publish-ready
> node scripts/gate-publish-ready.mjs

gate:publish-ready (WP-U165; P0 allowlist subset)
registry (.npmrc @zeus): https://npm.scriptorium.escrivivir.co
measured: @zeus/linea-system, @zeus/linea-firehose, @zeus/force-system, @zeus/ssb-system
excluded P1 (pending publish-ready WP): @zeus/linea-editor
PASS @zeus/linea-system manifest=packages/mesh/linea-system/package.json files=explicit pack=8 types=JS-only zeusDeps=4
PASS @zeus/linea-firehose manifest=packages/mesh/linea-firehose/package.json files=explicit pack=6 types=JS-only zeusDeps=3
PASS @zeus/force-system manifest=packages/mesh/force-system/package.json files=explicit pack=8 types=JS-only zeusDeps=4
PASS @zeus/ssb-system manifest=packages/mesh/ssb-system/package.json files=explicit pack=11 types=JS-only zeusDeps=3
gate:publish-ready: OK (4 P0 candidates)
gate_exit=0
```

Probes (cada uno exit 1; manifests no escritos — fail-probe in-memory):

```
probe_star_exit=1
probe_latest_exit=1
probe_git_exit=1
probe_url_exit=1
probe_windows-path_exit=1
probe_missing-version_exit=1
```

```
$ npm run gates
gates: OK (0 offenders)
gates_exit=0
```

### Fronteras / allowlist

```
$ git diff --exit-code HEAD -- plan/PUBLISH-ALLOWLIST.md
allowlist_intact=yes
```

- Allowlist solo lectura (byte-identical vs HEAD).
- Cero private flip · cero npm publish · cero changesets de release ·
  cero workflows publish.
- U164 / U166 no reabiertos.
- Scripts no tocados.

### Auto-revisión CA

- [x] Root declara `semver` en `devDependencies` (directo).
- [x] `package-lock.json` actualizado con esa declaración.
- [x] `npm ls semver --depth=0` exit 0 y lista `semver@7.8.5` bajo root.
- [x] Re-gate P0×4 PASS (exit 0).
- [x] Probes ×6 FAIL exit 1 cada uno.
- [x] `npm run gates` OK.
- [x] Diff solo `package.json` + `package-lock.json` + este reporte.
- [x] Allowlist intacta; fronteras de publicación intactas.
- [x] No se declara R11-Z PASS (siguiente: orquestador / reintento custodio).

### Dudas / bloqueos

Ninguno. Push/merge = orquestador post-✅. No declarar R11-Z PASS.

## Revisión del orquestador · re-✅ FAIL-REINTENTO (semver raíz)

**Aceptado ✅ · 2026-07-24 (semver root devDependency).**

- CA FAIL-REINTENTO: `semver@^7.8.5` en `devDependencies` raíz;
  lock coherente; `npm ls semver --depth=0` → `semver@7.8.5` exit 0.
- Re-gate P0×4 PASS; probes ×6 FAIL exit 1; `npm run gates` OK.
- ALCANCE_DIFF: solo `package.json` + `package-lock.json` + reporte;
  allowlist intacta; scripts no tocados; U164/U166 no reabiertos.
- Fronteras: cero private · cero publish · cero changesets.
- Merge `289b7fe` · tip obra `1bfd9b8`.
- Siguiente: aviso **nuevo reintento R11-Z** (no declarar PASS).
