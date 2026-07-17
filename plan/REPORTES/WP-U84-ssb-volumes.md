# WP-U84 · ssb-volumes — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm) |
| fecha | 2026-07-18 |
| rama | `wp/u84-ssb-volumes` |
| commit(s) | `8c95d7b`, `d4d618e`, `ec57d86` (+ docs hash fixes) |
| estado propuesto | listo para revisión |

## Qué se hizo

Nació `@zeus/ssb-system` (`packages/mesh/ssb-system`): exportador files-first
del log tipado SSB (tribe*/parliament*/votes* según modelos OASIS) a JSON en
**`DISK_04/SSB`**, entrada `ssb` en `volumes.json` (readonly + provenance), y
servidor MCP loader read-only (`ssb://…`) hermano de linea-firehose /
force-system. El sync es CLI (`npm run volumes:sync:ssb` / `--fixture`), no
demonio mesh.

`@zeus/linea-kit` ganó schema `ssb-manifest` y `validateVolumesTree` cubre
DISK_04 cuando existe. `@zeus/presets-sdk` expone `resolveSsbBasePath` y
puerto `ZEUS_MCP_SSB` (4114). Changeset para los publicables. Slot DISK_03
(FORCES) no se tocó.

## Archivos tocados

- creado `packages/mesh/ssb-system/**` — export, loader, MCP, fixture, e2e, README
- creado `packages/engine/linea-kit/schemas/ssb-manifest.json`
- modificado `packages/engine/linea-kit/src/validate.mjs` — DISK_04
- modificado `packages/engine/linea-kit/src/tools/conectar-satelite.mjs` — nota SSB
- modificado `packages/engine/linea-kit/test/validate-loader.test.mjs`
- creado `packages/engine/presets-sdk/src/paths/ssb.mjs` + exports/env MCP
- modificado `VOLUMES/volumes.json`, `VOLUMES/README.md`, `.env.example`, `.gitignore`
- modificado `package.json` / `package-lock.json` — scripts + workspace
- modificado `plan/ARQUITECTURA.md` — lista mesh
- creado `.changeset/wp-u84-ssb-volumes.md`
- creado `plan/REPORTES/WP-U84-ssb-volumes.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

```
$ npm test -w @zeus/ssb-system
# U80 validate OK: volumesRoot=…\Temp\zeus-ssb-e2e-…; checked=2; skipped=["DISK_01/FIREHOSE","DISK_02/LINEAS","DISK_03/FORCES"]
# Health OK: {"status":"ok","server":"ssb-system",…}
# Resource OK: ssb://stats files= 9
# Resource OK: ssb://manifest syncedAt= …
# Tool OK: ssb_get_message type= parliamentCandidature
# SMOKE/E2E PASSED
# Export OK: …\DISK_04\SSB; counts={"tribes":2,"parliament":5,"votes":2}
# tests 4 / pass 4 / fail 0

$ npm test -w @zeus/linea-kit
# tests 26 / pass 26 / fail 0

$ npm test -w @zeus/presets-sdk
# tests 38 / pass 38 / fail 0

$ npm run gates
gates: OK (0 offenders)

$ npm run lint
✖ 12 problems (0 errors, 12 warnings)  # warnings preexistentes ajenos al WP
```

CA primario (fixture sin red): **sí** — export → volumen válido U80
(`ssb-manifest` + `volumes`) → resources MCP navegables (`ssb://stats`,
`ssb://manifest`, `ssb://corpus/tribes`, tools browse/get).

Runbook pub real (`ZEUS_SSB_LOG_PATH`, `ZEUS_SSB_PUB_URL`): documentado en
`packages/mesh/ssb-system/README.md`, `VOLUMES/README.md`, `.env.example`.
Ejecución contra pub VPS: **⏳ sin verificar** (`ZEUS_SSB_LOG_PATH` /
`ZEUS_SSB_PUB_URL` unset en este entorno; sin acceso al dump del pub).

Worktree: tests usan `mkdtemp` + `ZEUS_VOLUMES_ROOT` temporal (DISK_* del
repo principal no heredados). Camino documentado en README del paquete.

Arranque MCP: ejercitado vía e2e/smoke (health + resources). Navegador no
abierto (`ZEUS_OPEN_BROWSER` unset).

## Demolición

n/a (WP de adición; sin paquete previo que sustituir).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no; puerto vía
  `resolveZeusMcpPorts().ssb.disk` / `ZEUS_MCP_SSB`. Paths vía
  `ZEUS_VOLUMES_ROOT` + volumes.json.
- [x] Cadenas if/switch → tabla: `CORPUS_BY_TYPE` + prefijos en
  `corpusForContent`.
- [x] Duplicación: reutiliza `createStandardMcpServer` / `validateVolumesTree`
  / `resolveVolume`; no se reimplementó U80.
- [x] console.log de depuración / TODO sin backlog: solo logs de CLI sync y
  consola de tests (patrón force-system).
- [x] Nombres de transición (`legacy`/`v2`/…): ninguno.
- [x] Demolición: n/a.
- [x] Tests de comportamiento: fixture→counts/skip post; validate schema;
  MCP resources/tools.
- [x] Arranque real: MCP health + readResource en e2e.
- [x] README/specs: README ssb-system + VOLUMES README alineados; schema
  ssb-manifest en kit.
- [x] Diff solo alcance U84: sí (no U85; DISK_03 intacto).

Regla de los dos juegos: paquete mesh genérico — cero delta/pozo en src
(`rg` limpio). ¿pozo puede consumir el volumen tal cual? Sí (JSON + MCP
read-only genérico).

## Hallazgos fuera de alcance

- `conectar-satelite` seguía diciendo «WP-U84 stub»; se actualizó la nota en
  este WP (mínimo). Un tutorial/docs más rico del remotes.ssb puede ir en U85.
- VOLUMES/README citaba scripts `volumes:sync:firehose` fantasma (hallazgo
  previo U82); aquí solo se añadió `volumes:sync:ssb` real.
- Mensajes tribe cifrados (box / tribeCrypto) no se desencriptan en el
  exportador: se exportan solo contents tipados legibles en el dump JSON.
  Candidato a WP si el dump del pub trae envelopes opacos.
- `spec:generate:http` regenera muchos OpenAPI ajenos por CRLF en Windows;
  no se metieron en el diff (ruido).

## Dudas / bloqueos

Ninguno bloqueante. Pub real pendiente de dump (`ZEUS_SSB_LOG_PATH`) cuando
haya acceso operador.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
