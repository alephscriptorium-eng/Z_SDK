# WP-U95 · paths-node — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U95) |
| fecha | 2026-07-18 |
| rama | `wp/u95-paths-node` |
| commit(s) | `4af5d11` (reporte), `5031cec` (impl) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se extrajo `nodeSrcDir(metaUrl)` a una sola implementación en
`@zeus/protocol` (`src/node-src-dir.mjs`, export `./node-src-dir`). Los cinco
entry points `./node` (protocol, game-engine, view-kit, ui-3d-kit, arg-domain)
consumen ese helper; se unificó el fichero a `src/node.mjs` (antes
`paths.node.mjs` en tres paquetes). Se borraron las tres copias
`paths.node.mjs`. Se añadieron tests de `nodeSrcDir`, changeset patch en los
cuatro paquetes publicables y nota Node en el README de protocol.

¿pozo puede consumir esto tal cual? Sí: el helper es genérico (solo
`import.meta.url` → dirname); cero conceptos de juego.

## Archivos tocados

- creado `packages/engine/protocol/src/node-src-dir.mjs` — impl única
- creado `packages/engine/protocol/test/node-src-dir.test.mjs` — tests
- modificado `packages/engine/protocol/src/node.mjs` — usa `nodeSrcDir`
- modificado `packages/engine/protocol/package.json` — export `./node-src-dir`
- modificado `packages/engine/protocol/README.md` — sección Node
- creado `packages/engine/game-engine/src/node.mjs` — renombrado + helper
- borrado `packages/engine/game-engine/src/paths.node.mjs`
- modificado `packages/engine/game-engine/package.json` — `./node` + dep protocol
- modificado `packages/engine/game-engine/src/index.mjs` — comentario ruta
- creado `packages/engine/view-kit/src/node.mjs`
- borrado `packages/engine/view-kit/src/paths.node.mjs`
- modificado `packages/engine/view-kit/package.json`
- creado `packages/engine/ui-3d-kit/src/node.mjs`
- borrado `packages/engine/ui-3d-kit/src/paths.node.mjs`
- modificado `packages/engine/ui-3d-kit/package.json` + README + index comentario
- modificado `packages/games/delta/arg-domain/src/node.mjs` — usa helper
- creado `.changeset/wp-u95-paths-node.md`

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### CA: una sola implementación en `packages/` (fuera de node_modules)

```
$ rg -n 'export function nodeSrcDir|fileURLToPath' \
  packages/engine/protocol/src/node-src-dir.mjs \
  packages/engine/*/src/node.mjs \
  packages/games/delta/arg-domain/src/node.mjs
packages/engine/protocol/src/node-src-dir.mjs:8:import { fileURLToPath } from 'node:url';
packages/engine/protocol/src/node-src-dir.mjs:14:export function nodeSrcDir(metaUrl) {
packages/engine/protocol/src/node-src-dir.mjs:15:  return path.dirname(fileURLToPath(metaUrl));
```

(Los cinco `node.mjs` importan `nodeSrcDir`; no repiten `fileURLToPath`.)

### CA: los 5 `exports["./node"]` homogéneos

```
$ rg -n '"\./node"' packages --glob 'package.json'
packages/engine/protocol/package.json:18:    "./node": "./src/node.mjs",
packages/engine/view-kit/package.json:9:    "./node": "./src/node.mjs"
packages/engine/game-engine/package.json:9:    "./node": "./src/node.mjs"
packages/engine/ui-3d-kit/package.json:13:    "./node": "./src/node.mjs"
packages/games/delta/arg-domain/package.json:12:    "./node": "./src/node.mjs"
```

### CA: servidores Express que lo consumen

Smoke de los mismos imports que usan arg-console / pozo / player-3d / 3d-monitor:

```
OK mount /ui-3d-kit -> src
OK mount /view-kit -> src
OK mount /game-engine -> src
OK mount /arg-domain -> src
OK mount /protocol -> src
OK mount /models -> models
OK three true
EXPRESS_CONSUMER_SMOKE_OK
```

Arranque real pozo-view (timeout; headless):

```
$ timeout 8 node packages/games/pozo/src/view/server.mjs
[pozo-view] http://localhost:3025/views/pozo · room=POZO_DEMO
```

### Tests

```
$ node --test packages/engine/protocol/test/node-src-dir.test.mjs
# tests 2 / # pass 2 / # fail 0

$ npm test -w @zeus/game-engine   → # tests 4  / pass 4
$ npm test -w @zeus/view-kit      → # tests 30 / pass 30
$ npm test -w @zeus/ui-3d-kit     → # tests 24 / pass 24
$ npm test -w @zeus/arg-domain    → # tests 68 / pass 68
```

`npm test -w @zeus/protocol` completo: 15 pass / 2 fail preexistentes
(`spec-sync` / `types-sync`, drift CRLF `\r\n` vs `\n` en
`types/index.d.ts` / asyncapi — sin cambios de este WP en esos artefactos).
Los 2 tests nuevos de `node-src-dir` pasan.

### Lint

```
$ npm run lint
✖ 12 problems (0 errors, 12 warnings)
```

(warnings preexistentes; 0 errors.)

## Demolición

Borrados:

- `packages/engine/game-engine/src/paths.node.mjs`
- `packages/engine/view-kit/src/paths.node.mjs`
- `packages/engine/ui-3d-kit/src/paths.node.mjs`

(Las «4 copias» del one-liner: las tres `paths.node` + el one-liner inline
de protocol/arg-domain sustituidos por la impl única; quedan 5 facades
`node.mjs` homogéneas.)

```
$ rg -n 'paths\.node' packages --glob '!**/node_modules/**'
ZERO
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no tocados (solo path helpers).
- [x] Cadenas if/switch que debieron ser tabla: no aplica.
- [x] Duplicación con otros paquetes (busqué antes de responder): el
      one-liner de `./node` queda en un solo sitio; otros `fileURLToPath` en
      http-contract/app-shell/ui-kit/etc. son otros usos (hallazgo).
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: `nodeSrcDir` / `node.mjs`
      (sin legacy/v2/old).
- [x] Demolición completa (grep arriba): `paths.node` cero en packages/.
- [x] Tests prueban comportamiento: dirname de URL + srcDir de protocol.
- [x] Arranque real verificado: pozo-view imprimió URL; smoke de mounts.
- [x] README/specs del paquete siguen siendo verdad: protocol + ui-3d-kit
      actualizados; AsyncAPI/types no tocados (fallo CRLF preexistente).
- [x] El diff contiene solo el alcance del WP: sí (sin U93/U97/peer-card).

## Hallazgos fuera de alcance

- `npm test -w @zeus/protocol` falla `spec-sync` / `types-sync` por CRLF en
  Windows (contenido idéntico salvo `\r\n`). Candidato a gate/normalización
  de EOL, no a regenerar specs en este WP.
- Otros `fileURLToPath(import.meta.url)` viven fuera de los 5 `./node`
  (http-contract, app-shell, ui-kit, test-utils, playbook-kit, …). No son
  el contrato `exports["./node"]`; eventual higiene aparte.
- Worktree sin `node_modules` propio resuelve `@zeus/*` al checkout master
  vía el monorepo padre: hace falta `npm install` en el worktree (o merge)
  para que el export nuevo `./node-src-dir` resuelva en local.

## Dudas / bloqueos

Ninguno. Push: no intentado (política).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
