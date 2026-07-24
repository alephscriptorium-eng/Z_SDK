# WP-U162 · auditoría publish-ready y allowlist — reporte

| dato | valor |
| ---- | ----- |
| agente | Worker-U162 |
| fecha | 2026-07-24 |
| rama | `wp/u162-auditoria-publish-allowlist` |
| commit(s) | `3342e8b` (feat) · `db7402b` (allowlist) · `584bed1`–`8d60145` (reporte) |
| eje(s) CA | IV (gobierno paquetes) + C8 (canal registry) |
| estado propuesto | listo para revisión |
| DC | DC-15 LOCAL-ONLY |

## Qué se hizo

Auditoría **sin publish** y **sin flips de `private`**:

1. Fuente única de allowlist: [`plan/PUBLISH-ALLOWLIST.md`](../PUBLISH-ALLOWLIST.md)
   — clases A–G explícitas; candidatos P0/P1 nominales; la publicabilidad
   **no** se infiere por ausencia de `private`.
2. Script idempotente `scripts/audit-publish-allowlist.mjs` + npm script
   `audit:publish-allowlist` (opción `--measure` = `npm pack --dry-run`).
3. Inventario 49/49 contra registry `.npmrc`
   (`https://npm.scriptorium.escrivivir.co`): **29** ya publicados, **7**
   candidatos (allowlist §3), **13** mantener privado.
4. Medición por candidato: `publishConfig`, `files`, exports/types, deps
   `@zeus/*` con `*`, changeset, matriz `release.yml`, tarball dry-run.
5. Plan de WPs derivados (IDs sugeridos U163+; **no** se editó
   `plan/BACKLOG.md`).
6. Puntero en [`plan/PRACTICAS.md`](../PRACTICAS.md) §6 → allowlist.

## Archivos tocados

- `plan/PUBLISH-ALLOWLIST.md` — creado (fuente única)
- `plan/PRACTICAS.md` — enlace a allowlist + comando inventario
- `scripts/audit-publish-allowlist.mjs` — creado
- `package.json` — script `audit:publish-allowlist`
- `plan/REPORTES/WP-U162-auditoria-publish-allowlist.md` — este reporte

**No tocados:** `plan/BACKLOG.md`, `packages/*/package.json`,
`.github/workflows/*`, changesets de release. Cero `npm publish`.

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Gates (obligatorio — diff toca scripts)

```
$ npm run gates

> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs

gates: OK (0 offenders)
```

### Frontera dura — cero private flips / cero publish

```
$ git diff 854ed4e --name-only -- 'packages/**/package.json'
(sin salida)

$ git diff 854ed4e --name-only | grep -E 'release\.yml|publish-operator'
(sin salida — no release/publish workflow edits)

$ rg -n "npm publish" scripts/audit-publish-allowlist.mjs
(solo comentario: «nunca npm publish»)
```

Diff de alcance: `plan/` (salvo BACKLOG) + `scripts/audit-publish-allowlist.mjs`
+ una línea de script en root `package.json`.

### Inventario 49/49 (comando reproducible)

```
$ npm run audit:publish-allowlist -- --measure

> zeus-sdk@0.1.0 audit:publish-allowlist
> node scripts/audit-publish-allowlist.mjs --measure

audit:publish-allowlist (WP-U162)
registry: https://npm.scriptorium.escrivivir.co
packages/** package.json files: 49
unique package names: 49
allowlist candidatos: 7 (P0=4 P1=3)

name	class	priority	private	version_local	registry_version	path
@zeus/3d-monitor	mantener privado		true	0.1.0	E404	packages/mesh/3d-monitor/package.json
@zeus/acta-kit	ya publicado		false	0.1.1	0.1.1	packages/engine/acta-kit/package.json
@zeus/app-shell	ya publicado		false	0.2.3	0.2.3	packages/engine/app-shell/package.json
@zeus/authority-kit	ya publicado		false	0.4.2	0.4.2	packages/engine/authority-kit/package.json
@zeus/blob-sync-harness	mantener privado		true	0.0.0	E404	packages/mesh/blob-sync-harness/package.json
@zeus/blobstore-client	candidato	P1	true	0.0.0	E404	packages/mesh/blobstore-client/package.json
@zeus/cache-browser	mantener privado		true	0.1.0	E404	packages/mesh/cache-browser/package.json
@zeus/ciudad-lifecycle	ya publicado		false	0.1.1	0.1.1	packages/mesh/ciudad-lifecycle/package.json
@zeus/console-monitor	candidato	P1	true	0.1.0	E404	packages/mesh/console-monitor/package.json
@zeus/editor-ui	mantener privado		true	0.1.0	E404	packages/editor/editor-ui/package.json
@zeus/embajador-kit	ya publicado		false	0.1.3	0.1.3	packages/engine/embajador-kit/package.json
@zeus/feed-kit	ya publicado		false	0.3.0	0.3.0	packages/engine/feed-kit/package.json
@zeus/firehose-browser	mantener privado		true	0.1.0	E404	packages/mesh/firehose-browser/package.json
@zeus/firehose-core	ya publicado		false	0.1.3	0.1.3	packages/engine/firehose-core/package.json
@zeus/force-system	candidato	P0	true	0.1.0	E404	packages/mesh/force-system/package.json
@zeus/game-engine	ya publicado		false	0.1.4	0.1.4	packages/engine/game-engine/package.json
@zeus/http-contract	ya publicado		false	0.1.3	0.1.3	packages/engine/http-contract/package.json
@zeus/lifecycle-kit	ya publicado		false	0.1.1	0.1.1	packages/engine/lifecycle-kit/package.json
@zeus/linea-editor	candidato	P1	true	0.1.0	E404	packages/mesh/linea-editor/package.json
@zeus/linea-firehose	candidato	P0	true	0.1.0	E404	packages/mesh/linea-firehose/package.json
@zeus/linea-kit	ya publicado		false	0.3.0	0.3.0	packages/engine/linea-kit/package.json
@zeus/linea-system	candidato	P0	true	0.1.0	E404	packages/mesh/linea-system/package.json
@zeus/mcp-launcher	ya publicado		false	0.1.1	0.1.1	packages/mesh/mcp-launcher/package.json
@zeus/oasis-webrtc	mantener privado		true	0.1.0	E404	packages/mesh/oasis-webrtc/package.json
@zeus/operator-bridge	ya publicado		false	0.1.3	0.1.3	packages/mesh/operator-bridge/package.json
@zeus/operator-ui	mantener privado		true	1.0.0	E404	packages/mesh/operator-ui/package.json
@zeus/parte-kit	ya publicado		false	0.1.1	0.1.1	packages/engine/parte-kit/package.json
@zeus/playbook-kit	ya publicado		false	0.1.3	0.1.3	packages/engine/playbook-kit/package.json
@zeus/player-3d-ui	mantener privado		true	0.1.0	E404	packages/mesh/player-3d-ui/package.json
@zeus/player-mcp-kit	ya publicado		false	0.1.4	0.1.4	packages/engine/player-mcp-kit/package.json
@zeus/player-ui	mantener privado		true	0.1.0	E404	packages/mesh/player-ui/package.json
@zeus/presets-sdk	ya publicado		false	0.1.3	0.1.3	packages/engine/presets-sdk/package.json
@zeus/protocol	ya publicado		false	0.4.1	0.4.1	packages/engine/protocol/package.json
@zeus/room-client-browser	ya publicado		false	0.1.4	0.1.4	packages/engine/room-client-browser/package.json
@zeus/rooms	ya publicado		false	0.1.2	0.1.2	packages/engine/rooms/package.json
@zeus/socket-core	ya publicado		false	0.2.0	0.2.0	packages/engine/socket-core/package.json
@zeus/socket-server	ya publicado		false	0.1.2	0.1.2	packages/mesh/socket-server/package.json
@zeus/solar-system	mantener privado		true	0.1.0	E404	packages/mesh/solar-system/package.json
@zeus/ssb-system	candidato	P0	true	0.1.0	E404	packages/mesh/ssb-system/package.json
@zeus/story-board-schema	ya publicado		false	0.2.0	0.2.0	packages/engine/story-board-schema/package.json
@zeus/test-utils	ya publicado		false	0.1.3	0.1.3	packages/engine/test-utils/package.json
@zeus/threejs-ui-lib	mantener privado		true	1.0.0	E404	packages/mesh/operator-ui/projects/threejs-ui-lib/package.json
@zeus/ui-3d-kit	ya publicado		false	0.1.4	0.1.4	packages/engine/ui-3d-kit/package.json
@zeus/ui-kit	ya publicado		false	0.1.3	0.1.3	packages/engine/ui-kit/package.json
@zeus/view-kit	ya publicado		false	0.1.5	0.1.5	packages/engine/view-kit/package.json
@zeus/volumes-ops	ya publicado		false	0.2.4	0.2.4	packages/engine/volumes-ops/package.json
@zeus/webrtc-signaling	ya publicado		false	0.3.3	0.3.3	packages/engine/webrtc-signaling/package.json
@zeus/webrtc-viewer	mantener privado		true	0.1.0	E404	packages/mesh/webrtc-viewer/package.json
zeus-protocol-ts-subpath-smoke	mantener privado		true		E404	packages/engine/protocol/test/fixtures/ts-subpath-smoke/package.json

--- summary ---
total_unique: 49
ya_publicado: 29
candidato: 7
mantener_privado: 13
private_true_local: 20
private_false_or_absent_local: 29
```

Coincide con addenda R5-Z (49 / 29 publicados / 20 no publicados =
7 candidatos + 13 mantener privado). Ningún candidato adicional fuera de
P0/P1 de la addenda.

### `npm view` literal por candidato (registry canónico)

```
$ REGISTRY=https://npm.scriptorium.escrivivir.co

$ npm view @zeus/linea-system version --registry "$REGISTRY"
npm error code E404
npm error 404 Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2flinea-system - no such package available

$ npm view @zeus/linea-firehose version --registry "$REGISTRY"
npm error code E404
npm error 404 Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2flinea-firehose - no such package available

$ npm view @zeus/force-system version --registry "$REGISTRY"
npm error code E404
npm error 404 Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2fforce-system - no such package available

$ npm view @zeus/ssb-system version --registry "$REGISTRY"
npm error code E404
npm error 404 Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2fssb-system - no such package available

$ npm view @zeus/linea-editor version --registry "$REGISTRY"
npm error code E404
npm error 404 Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2flinea-editor - no such package available

$ npm view @zeus/console-monitor version --registry "$REGISTRY"
npm error code E404
npm error 404 Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2fconsole-monitor - no such package available

$ npm view @zeus/blobstore-client version --registry "$REGISTRY"
npm error code E404
npm error 404 Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2fblobstore-client - no such package available
```

### Medición candidatos (`npm pack --dry-run` — sin publish)

Resumen (salida literal del script `--measure`):

| paquete | pri | publishConfig | files | types | exports | `@zeus/*` con `*` (prod+dev) | changeset | release test matrix | pack entries | notas tarball |
| ------- | --- | ------------- | ----- | ----- | ------- | ---------------------------- | --------- | ------------------- | ------------ | ------------- |
| `@zeus/linea-system` | P0 | null | null | null | `.` + `./loader` | http-contract, linea-kit, presets-sdk, test-utils | no | sí | 11 | incluye `test/` |
| `@zeus/linea-firehose` | P0 | null | null | null | `.` + `./server` | firehose-core, presets-sdk, test-utils | no | sí | 7 | incluye `test/` |
| `@zeus/force-system` | P0 | null | null | null | `.` + `./loader` | http-contract, linea-kit, presets-sdk, test-utils | no | no | 9 | incluye `test/` |
| `@zeus/ssb-system` | P0 | null | null | null | `.` + `./export` + `./loader` | linea-kit, presets-sdk, test-utils | no | no | 14 | incluye `test/` + `fixtures/` |
| `@zeus/linea-editor` | P1 | null | null | null | 5 subpaths | http-contract, linea-kit, presets-sdk, story-board-schema, test-utils | no | no | 12 | incluye `test/` |
| `@zeus/console-monitor` | P1 | null | null | null | **null** | app-shell, presets-sdk, test-utils | no | sí | 18 | sin `exports`; incluye `test/` |
| `@zeus/blobstore-client` | P1 | null | null | null | `.` | blob-sync-harness, webrtc-signaling, authority-kit, protocol | no | no | 13 | dep **privada** `@zeus/blob-sync-harness` (E404); version `0.0.0` |

Salida literal (extracto P0 POC + P1 bloqueante):

```
## @zeus/linea-system (P0)
path: packages/mesh/linea-system/package.json
version: 0.1.0
private: true
publishConfig: null
files: null
main: src/index.mjs
types: null
exports: {".":"./src/index.mjs","./loader":"./src/loader.mjs"}
zeusDeps: {"@zeus/http-contract":"*","@zeus/linea-kit":"*","@zeus/presets-sdk":"*","@zeus/test-utils":"*"}
starZeusDeps: ["@zeus/http-contract","@zeus/linea-kit","@zeus/presets-sdk","@zeus/test-utils"]
changesetPending: false
inReleaseTestMatrix: true
pack: ok filename=zeus-linea-system-0.1.0.tgz entries=11
  pack-file: package.json
  pack-file: src/cache-wikitext.mjs
  pack-file: src/index.mjs
  pack-file: src/linea-server.mjs
  pack-file: src/lineas.mjs
  pack-file: src/loader.mjs
  pack-file: src/logic.mjs
  pack-file: src/start.mjs
  pack-file: test/helpers/live-volumes.mjs
  pack-file: test/resource-contract.test.mjs
  pack-file: test/smoke.mjs

## @zeus/blobstore-client (P1)
…
zeusDeps: {"@zeus/blob-sync-harness":"*","@zeus/webrtc-signaling":"*","@zeus/authority-kit":"*","@zeus/protocol":"*"}
pack: ok filename=zeus-blobstore-client-0.0.0.tgz entries=13
  … incluye test/client.test.mjs
```

### C8 — notas

- Registry canónico leído de `.npmrc` (`@zeus:registry=…`).
- Engine ya publicado resuelve versiones alineadas local↔registry en el
  inventario (p. ej. `@zeus/protocol@0.4.1`).
- Candidatos: **no** hay canal C8 de install externo hasta publish-ready +
  GO; hoy solo workspace / tarball dry-run.
- Dependencias `@zeus/*` con `*` en candidatos: consumidor externo no puede
  resolver semver estable desde registry aunque se publicara el paquete hoy.
- `blobstore-client` → `@zeus/blob-sync-harness` (mantener privado / E404):
  bloquea publish del cliente sin refactor de deps.

### Allowlist (fuente única)

Documento: [`plan/PUBLISH-ALLOWLIST.md`](../PUBLISH-ALLOWLIST.md).

- Clase **A** engine library → publicable (pipeline vigente).
- Clase **B** mesh runtime ya en canal → excepciones históricas
  (`operator-bridge`, `socket-server`, `mcp-launcher`, `ciudad-lifecycle`
  aparecen como **ya publicado** en inventario).
- Clase **C** mesh MCP/API → solo §3 P0/P1 = **candidato**.
- Clases **D/E/F/G** → **mantener privado**.

## Plan de WPs derivados (sugerencia — no encolados aquí)

| ID sugerido | título | deps | est. | notas |
| ----------- | ------ | ---- | ---- | ----- |
| **U163** | POC publish-ready `@zeus/linea-system` | U162 ✅ | M | `publishConfig` + `files` excl. tests; pinear deps `@zeus/*`; types/JS-only decisión; changeset; **sin** publish hasta GO |
| **U164** | Replicar P0: linea-firehose, force-system, ssb-system | U163 | M | mismo checklist que POC; ssb: excluir fixtures del tarball |
| **U165** | Gate pre-publicación mesh allowlist | U163 | S–M | script/CI: files, types, semver interno ≠ `*`, registry C8, dry-run pack; opcional extender `release:dry` |
| **U166** | Triage P1 linea-editor + console-monitor | U164 o paralelo tras U163 | M | console-monitor: añadir `exports`; decidir si es producto publicable |
| **U167** | Triage P1 blobstore-client (o deslistar) | U162 | M | desacoplar `blob-sync-harness` **o** enmendar allowlist para bajar de candidato |

**Publish real** y flips de `private`: requieren **GO aparte** tras aceptar
este inventario. U162 no los autoriza.

## CA checklist

| CA | estado | evidencia |
| -- | ------ | --------- |
| Inventario 49/49 comando reproducible | ✅ | § Inventario; `npm run audit:publish-allowlist` |
| `npm view` literal por candidato | ✅ | § npm view; 7× E404 |
| Allowlist explícita (no ausencia de private) | ✅ | `plan/PUBLISH-ALLOWLIST.md` |
| Tarball/contents/types medidos sin publish | ✅ | § Medición; `--measure` / `npm pack --dry-run` |
| Cero cambios `private` / cero publish | ✅ | § Frontera dura |
| Plan WPs derivados con deps + estimación | ✅ | § Plan U163–U167 |
| `npm run gates` OK | ✅ | § Gates |

## Demolición

N/A — WP de gobierno/auditoría. No se demolió código de paquetes.

## Auto-revisión (PRACTICAS.md §3)

- [x] Diff solo ALCANCE_DIFF U162
- [x] No BACKLOG
- [x] No `private` flips / no publish / no release.yml
- [x] C8: registry real en inventario y views
- [x] Changesets: N/A (sin tocar paquetes publicables)
- [x] Gates verdes tras tocar `scripts/`

## Hallazgos fuera de alcance

- Mesh ya publicados sin estar en clase C (clase B): confirmar en gobierno
  si deben documentarse como excepciones permanentes (ya listados en
  allowlist §2).
- Fixture `zeus-protocol-ts-subpath-smoke` cuenta en los 49 (bajo
  `packages/**`); clase E.

## Dudas / bloqueos

Ninguno para cerrar U162. Implementación P0/P1 y publish = GO posterior.

---

## Revisión del orquestador

_(pendiente)_
