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
