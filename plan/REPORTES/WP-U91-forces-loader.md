# WP-U91 · forces-loader — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm) |
| fecha | 2026-07-18 |
| rama | `wp/u91-forces-loader` |
| commit(s) | `5500dd3`, `6b28d7a`, `d5c9b69`, `6131403`, `66472fe` |
| estado propuesto | listo para revisión |

## Qué se hizo

Nació `@zeus/force-system` (mesh MCP read-only) hermano de `linea-system`:
resources `force://registry`, `force://info`, `force://{id}`,
`force://{id}/scene/{session}/{slug}`; tools de lectura; sin intents
activate/deactivate (U92).

`@zeus/linea-kit` ganó `loadForcesData` / `classifyPairsWith` /
`resolveForce` / `resolveForceScene` (`forces-loader.mjs`): refs `linea:*`
no montadas → `pending_refs` (pendiente, no error). Validación sigue en
schemas U80 vía `validateVolumesTree`.

`@zeus/presets-sdk`: puerto `forces.disk` (4113 / `ZEUS_MCP_FORCES`) y
`resolveForcesBasePath`. `@zeus/http-contract`: payloads `force://…` +
catálogo regenerado. Fixture kit alineado al layout `forces/<id>/`.

## Archivos tocados

- creado `packages/mesh/force-system/**` — MCP loader + smoke/gate
- creado `packages/engine/linea-kit/src/forces-loader.mjs` + test
- creado `packages/engine/presets-sdk/src/paths/forces.mjs`
- creado `packages/engine/http-contract/src/mcp-resources/force.mjs`
- creado `.changeset/wp-u91-forces-loader.md`
- creado `plan/REPORTES/WP-U91-forces-loader.md` — este reporte
- modificado `linea-kit` loader exports, fixtures, README, validate test
- modificado `presets-sdk` env/ports + paths barrel
- modificado `http-contract` RESOURCE_PAYLOADS + spec + test
- modificado root `package.json` / lock / `.env.example`
- modificado `plan/ARQUITECTURA.md` — lista mesh `force-system`

## Evidencia

Volúmenes: `ZEUS_VOLUMES_ROOT=VOLUMES`
(DISK_03 symlink/local del árbol principal; worktree no hereda DISK
gitignored — mismo hallazgo U80).

```
$ ZEUS_VOLUMES_ROOT=…/zeus-sdk/VOLUMES npm test -w @zeus/force-system
# U80 validate OK: … forceChecks=25
# force-system: loader src has no concrete force names — pass
# Loader OK: id=main … session_budget= { max_active_forces: 2, boot_always_on: true }
# Resource OK: force://registry session_budget= …
# Resource OK: force://main/scene/…/01-aspirate-a-esteta is_anchor=true
# SMOKE TEST PASSED
# tests 2 / pass 2 / fail 0

$ npm test -w @zeus/linea-kit
# tests 12 / pass 12 / fail 0
# (live DISK_03 loadForcesData + pending linea refs OK)

$ npm test -w @zeus/http-contract
# tests 18 / pass 18 / fail 0

$ npm run gates
gates: OK (0 offenders)

$ npm run lint
✖ 12 problems (0 errors, 12 warnings)  # warnings preexistentes ajenos al WP
```

Gate concreto (smoke): `CONCRETE_FORCE_RE = /\bforce-[a-g]\b|\bforce-xz\b|\bforce-zx\b/i`
sobre `packages/mesh/force-system/src/**` → 0 offenders.

Arranque MCP: smoke in-process (health + resources). Navegador no abierto
(`ZEUS_OPEN_BROWSER` unset).

## Demolición

n/a (WP no demuele; corpus provenance sigue fuera de zeus).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no — puerto vía
  `resolveZeusMcpPorts().forces.disk` / `ZEUS_MCP_FORCES`; path vía
  `resolveForcesBasePath` / `ZEUS_VOLUMES_ROOT`.
- [x] Cadenas if/switch → tabla: classify por kind de ref; registries MCP
  como arrays.
- [x] Duplicación: carga/validación en linea-kit; mesh solo fachada + MCP.
- [x] console.log / comentado / TODO: solo `console.log` de evidencia en
  smoke (patrón linea-system).
- [x] Nombres de transición: ninguno.
- [x] Demolición: n/a.
- [x] Tests de comportamiento: validate U80 + registry session_budget +
  escena ancla por MCP + pending linea + gate nombres.
- [x] Arranque real: smoke MCP verde.
- [x] README force-system + linea-kit actualizados; spec mcp-resources
  regenerada.
- [x] Diff solo alcance U91 (+ changeset + reporte + ARQUITECTURA una
  línea).

Regla dos juegos: ¿pozo puede consumir force-system tal cual? Sí — el
loader no nombra juegos ni forces concretas; ids solo en VOLUMES/fixtures.

## Hallazgos fuera de alcance

1. **gitignore DISK_03** (heredado U80): corpus local no viaja en git;
   hace falta `ZEUS_VOLUMES_ROOT` o symlink. No arreglado aquí.
2. **presets-sdk openapi sync en Windows**: `assertSpecMatches` compara
   strings crudos; ficheros CRLF vs generate LF hacen fallar
   `horse-preset` / `mcp-http` sync sin drift de contenido (lf-normalized
   match). Tras `spec:generate:http` (escribe LF) pasa; no es cambio de
   contrato por U91 (esos YAML no listan el puerto 4113). Candidato:
   normalizar comparación en `assertSpecMatches` o `.gitattributes` para
   `*.yaml`.
3. Accidente de cwd: un `npm install` corrió brevemente en el árbol
   principal; puede haber dejado `packages/mesh/force-system/` vacío o
   lock tocado en master — el orquestador debería verificar el working
   tree de master (no es parte de esta rama).

## Dudas / bloqueos

Ninguno bloqueante. Push: **no intentado** (política del brief).

---

## Revisión del orquestador

**Aceptado ✅** — 2026-07-18 (orquestador). Sin ✅ BACKLOG ni merge a master
en este paso (pedido explícito del usuario).

### Verificado

1. **Merge master → rama** (`e80ddff`): U81/U82 ya en master; conflicto único
   en `linea-kit/README.md` (loader `loadForcesData` + tools/starterkits U81)
   resuelto sin perder ninguna fila.
2. **CA re-ejecutada** (worktree, `ZEUS_VOLUMES_ROOT=…/zeus-sdk/VOLUMES`):
   - `npm test -w @zeus/force-system` → 2/2; validate U80 `forceChecks=25`;
     `force://registry` con `session_budget`; escena ancla MCP
     `force://main/scene/…/01-aspirate-a-esteta`; gate src sin forces
     concretas.
   - `npm test -w @zeus/linea-kit` → 20/20 (incl. forces-loader + live DISK_03).
   - `npm test -w @zeus/http-contract` → 18/18.
   - `npm run gates` → OK (0 offenders).
3. **Alcance**: diff `master...HEAD` acotado a force-system + forces-loader
   linea-kit + presets path/puerto + http-contract force:// + changeset +
   reporte. Sin U92 (`force:activate`/`deactivate` ausentes). Worker no
   inventó ✅ en BACKLOG.
4. **Basura master**: `packages/mesh/force-system/{src,test}/` existen en el
   árbol de master como **dirs vacíos no trackeados** (accidente npm del
   hallazgo §3 del worker). **Limpiar al merge** (`rm -rf` esos dirs antes o
   al checkout del paquete real).

### Merge sugerido (cuando el usuario autorice)

1. En master: borrar dirs vacíos `packages/mesh/force-system/` si siguen.
2. Merge `wp/u91-forces-loader` → master.
3. Orquestador: BACKLOG 🔶→✅ U91; `git worktree remove` del worktree U91.
4. Siguiente natural: WP-U92 (intents activate; dep U91+U30).
