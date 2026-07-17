# WP-U50 · scope-publish — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm chat WP-U50) |
| fecha | 2026-07-17 |
| rama | `wp/u50-scope-publish` |
| commit(s) | `ed042bc` `5e7034f` `fb225f8` `be368e0` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se abrió Ola 5 (D-7) sobre el layout actual (`packages/lib/*` = engine; U51 no
movió carpetas). Se añadió `@zeus:registry=https://npm.scriptorium.escrivivir.co`
al `.npmrc` junto a `@alephscript`. Los 15 paquetes engine publicables recibieron
`publishConfig.registry`, `files`, exports ya existentes revisados, README (6
nuevos), versión lockstep `0.1.0` y deps `@zeus/*` de `*` → `0.1.0`.
`@zeus/operator-bridge` permanece `private: true` (mesh, ARQUITECTURA §2).
Paquetes no publicables (app/platform/mcp/arg/games/operator-ui/threejs-ui-lib)
llevaron `private: true` explícito. Script raíz `release:dry` = `npm pack --json`
+ verificación de tarballs en `.release-dry/`. **No** se hizo `npm publish` ni
push. CA install-from-registry: **⏳** (404 en registry; sin publish). Dry-run
equivalente: install desde tarballs en directorio limpio fuera del monorepo →
verde.

## Archivos tocados

- `.npmrc` — añadida línea `@zeus:registry=…`
- `.gitignore` — ignora `.release-dry/`
- `package.json` (raíz) — `private: true`, script `release:dry`
- `scripts/release-dry.mjs` — creado (pack + verify, sin publish)
- `packages/lib/{protocol,authority-kit,player-mcp-kit,view-kit,playbook-kit,game-engine,rooms,presets-sdk,http-contract,ui-kit,ui-3d-kit,app-shell,firehose-core,room-client-browser,test-utils}/package.json` — publish metadata + lockstep deps
- `packages/lib/{app-shell,firehose-core,game-engine,room-client-browser,test-utils,ui-kit}/README.md` — creados
- `packages/lib/operator-bridge/package.json` — `private: true` (ya lo era; reafirmado)
- `packages/{app,platform,mcp,arg,games}/*/package.json`, `packages/operator-ui/**/package.json` — `private: true`
- `plan/REPORTES/WP-U50-scope-publish.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### `.npmrc`

```
@alephscript:registry=https://npm.scriptorium.escrivivir.co
@zeus:registry=https://npm.scriptorium.escrivivir.co
```

### `npm run release:dry` (verde)

```
release:dry — 15 publicable package(s), lockstep 0.1.0
registry: https://npm.scriptorium.escrivivir.co
outdir:   …/.release-dry

pack @zeus/app-shell@0.1.0 … ok (6 entries, zeus-app-shell-0.1.0.tgz)
pack @zeus/authority-kit@0.1.0 … ok (4 entries, zeus-authority-kit-0.1.0.tgz)
pack @zeus/firehose-core@0.1.0 … ok (6 entries, zeus-firehose-core-0.1.0.tgz)
pack @zeus/game-engine@0.1.0 … ok (11 entries, zeus-game-engine-0.1.0.tgz)
pack @zeus/http-contract@0.1.0 … ok (22 entries, zeus-http-contract-0.1.0.tgz)
pack @zeus/playbook-kit@0.1.0 … ok (11 entries, zeus-playbook-kit-0.1.0.tgz)
pack @zeus/player-mcp-kit@0.1.0 … ok (8 entries, zeus-player-mcp-kit-0.1.0.tgz)
pack @zeus/presets-sdk@0.1.0 … ok (53 entries, zeus-presets-sdk-0.1.0.tgz)
pack @zeus/protocol@0.1.0 … ok (12 entries, zeus-protocol-0.1.0.tgz)
pack @zeus/room-client-browser@0.1.0 … ok (5 entries, zeus-room-client-browser-0.1.0.tgz)
pack @zeus/rooms@0.1.0 … ok (4 entries, zeus-rooms-0.1.0.tgz)
pack @zeus/test-utils@0.1.0 … ok (5 entries, zeus-test-utils-0.1.0.tgz)
pack @zeus/ui-3d-kit@0.1.0 … ok (15 entries, zeus-ui-3d-kit-0.1.0.tgz)
pack @zeus/ui-kit@0.1.0 … ok (37 entries, zeus-ui-kit-0.1.0.tgz)
pack @zeus/view-kit@0.1.0 … ok (17 entries, zeus-view-kit-0.1.0.tgz)

release:dry — all 15 green
```

### CA install desde registry propio (directorio limpio)

⏳ **sin publish real** — política swarm + brief. Probe:

```
npm view @zeus/protocol version
npm error 404 Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2fprotocol - no such package available
```

### Dry-run equivalente: install desde tarballs fuera del monorepo

Directorio limpio `/tmp/zeus-u50-clean-*` (fuera del workspace; evita resolución
por `node_modules` padre), `.npmrc` con ambos scopes, `npm install` de tarballs
locales (`protocol`, `http-contract`, `presets-sdk`, `ui-kit`, `rooms`,
`authority-kit`, `app-shell`):

```
added 281 packages, and audited 282 packages in 20s
… found 0 vulnerabilities
resolved …/zeus-u50-clean-78683/node_modules/@zeus/protocol/src/index.mjs
EVENTS STATE,INTENT,TRACK,LEDGER
makeIntent function
startAuthority function
TARBALL_INSTALL_OK
```

### Gates

```
npm run gates
gates: OK (0 offenders)
```

### Publicables vs privados (decisión)

| paquete | estado | nota |
| ------- | ------ | ---- |
| 15× engine en `packages/lib/*` (lista release:dry) | publicable | ARQUITECTURA §2/§5 |
| `@zeus/test-utils` | publicable | listado en engine/; smokes externos (U54) |
| `@zeus/operator-bridge` | **private** | mesh (ARQUITECTURA §2); no mezclar con engine |
| app/platform/mcp/arg/games/operator-ui/threejs-ui-lib | **private** | demos, mesh, juegos (ola 6) |

### ZEUS_OPEN_BROWSER

No tocado en este WP; `presets-sdk` ya es opt-in (`=== '1'`). Default no abre.

### Push / publish

- `git push`: **no intentado**
- `npm publish`: **no intentado**
- `gh`: **no intentado**

## Demolición

Deps `file:` en operator-ui / threejs-ui-lib **no demolidas** a versiones de
registry: sin `npm publish` el registry no tiene `@zeus/*` (404 arriba). Convertir
ahora a `0.1.0` dejaría operator-ui half-migrated (install externo roto).
`operator-bridge` además es private/mesh → no hay artefacto de registry que
sustituya ese `file:`.

Residual documentado (grep vivo):

```
packages/operator-ui/package.json
  "@zeus/operator-bridge": "file:../lib/operator-bridge",
  "@zeus/room-client-browser": "file:../lib/room-client-browser",
  "@zeus/ui-3d-kit": "file:../../lib/ui-3d-kit",
packages/operator-ui/projects/threejs-ui-lib/package.json
  "@zeus/ui-3d-kit": "file:../../../lib/ui-3d-kit",
```

⏳ residual hasta primer publish real (U53/CI) o WP que demuela tras registry
poblado. D-11 anticipa conversión post-publish.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: solo URL del registry en `.npmrc` /
      `publishConfig` (contrato D-7; no es room/puerto de runtime).
- [x] Cadenas if/switch que debieron ser tabla: n/a (metadatos + script de
      verificación).
- [x] Duplicación con otros paquetes: no; un solo `release-dry.mjs`.
- [x] console.log / código comentado / TODO sin backlog: no en el script de
      release (solo progreso a stdout).
- [x] Nombres fuera de glosario o de transición: no (`release:dry`, no legacy/v2).
- [x] Demolición completa: **no** — residual `file:` documentado ⏳ (arriba).
- [x] Tests prueban comportamiento: `release:dry` verifica files/exports/bin en
      tarballs; dry-run install importa `makeIntent` / `startAuthority`.
- [x] Arranque real verificado: n/a viewers; verificación = pack + install
      tarball. Registry install ⏳.
- [x] README/specs: READMEs nuevos alineados; specs no tocados.
- [x] Diff solo alcance WP: sí (publish metadata, private flags, script, reporte).
      No se editó BACKLOG.

## Hallazgos fuera de alcance

1. `packages/lib/game-engine/package.json` description aún menciona «ARG» /
   `paths.node.mjs` comenta «source of truth for the ARG» — candidato a limpieza
   D-8 en WP menor (no tocado aquí más allá de metadata publish).
2. `npm pack` en Windows: Git Bash `tar` interpreta `C:` como host remoto; el
   script usa `npm pack --json` para listar entradas (hallazgo de plataforma).
3. Tras primer publish real, demolir `file:` de operator-ui → deps `0.1.0` (o
   semver) del registry (encaja U53 / seguimiento D-11).

## Dudas / bloqueos

Ninguno bloqueante. CA registry queda ⏳ de forma explícita por política (no
publish en swarm). Orquestador: ¿aceptar dry-run tarball como evidencia
suficiente del CA «install resuelve el engine» hasta U53?

---

## Revisión del orquestador

**Aceptado ✅** — 2026-07-17 (orquestador)

### Qué se verificó

- Rama `wp/u50-scope-publish` ya incluye master (`merge-base` = `d5e74c4`); no hizo falta merge.
- Diff acotado a alcance U50 (`.npmrc`, publish metadata engine, `private: true`,
  `scripts/release-dry.mjs`, READMEs nuevos, reporte). Sin BACKLOG. Sin producto runtime.
- **CA `release:dry`:** re-ejecutado en worktree → **all 15 green** (lockstep 0.1.0,
  registry `https://npm.scriptorium.escrivivir.co`).
- **CA install registry:** **⏳** aceptado por política swarm (brief + usuario):
  sin publish/credenciales; dry-run tarball fuera del monorepo documentado en reporte
  (`TARBALL_INSTALL_OK`). Probe `npm view` 404 coherente.
- **`.npmrc`:** `@zeus:registry=…` junto a `@alephscript`.
- **15 publicables** en `packages/lib/*`: `publishConfig.registry`, `files`, `version`
  0.1.0, README presentes. `@zeus/operator-bridge` **private** (mesh).
- **No publicables:** `private: true` en app/platform/mcp/arg/games/operator-ui/
  threejs-ui-lib (los que ya lo eran en master no aparecen en diff; coherente).
- **`gates`:** re-ejecutado → `gates: OK (0 offenders)`.
- **Demolición `file:`:** residual operator-ui / threejs-ui-lib documentado ⏳;
  no half-migrated (correcto sin registry poblado; D-11 / U53).
- Commits convencionales; auto-revisión honesta (demolición ⏳ explícita).

### CA registry (política)

⏳ **OK** — no bloquea aceptación. Cierre real del CA queda a U53 (publish CI) o
smoke U54 cuando el registry tenga `@zeus/*`.

### Merge

Autorizado. Orden sugerido: **U50 primero** (ola 5); luego U51 / U54 / U53 según deps.
Tras merge: `git worktree remove` del worktree U50.

### Acción orquestador (esta sesión)

Solo §revisión + commit en rama. **No** merge, **no** push, **no** ✅ BACKLOG,
**no** npm publish (pedido explícito del usuario).
