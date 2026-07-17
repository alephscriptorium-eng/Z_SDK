# WP-U03 · z-sdk-ci — reporte

| dato | valor |
| ---- | ----- |
| agente | worker wp/u03-z-sdk-ci |
| fecha | 2026-07-17 |
| rama | `wp/u03-z-sdk-ci` |
| commit(s) | `d1ffa30` chore(ci); `dfce777` docs(reportes) |
| estado propuesto | listo para revisión (CA remoto ⏳; push fuera del swarm) |

## Qué se hizo

Se añadió el workflow GitHub Actions `.github/workflows/ci.yml` en el worktree
de `wp/u03-z-sdk-ci`: en `pull_request` y pushes a `main` / `wp/**` corre
`npm ci` + `npm run lint` + `npm run gates` (cableado U00) + `npm run test:gates`,
más un job matriz `npm test -w` sobre 31 workspaces. Sin publish (U53).

Se documentó el CI en `README.md` §Verificación.

**Desvío / CA remoto:** por **orden explícita del orquestador/usuario** no se
hizo push, no se creó PR remoto y no se reconfiguró auth para publicar.
`push: no intentado (orden orquestador)`. El CA «PR de prueba / checks en
GitHub» queda **⏳ sin verificar**. Antes de esa orden hubo un intento fallido
de push (403 con credencial `escrivivir-co` vía HTTPS); no se reintentó.

## Archivos tocados

- `.github/workflows/ci.yml` — creado: job quality (lint+gates+test:gates) + matriz de tests
- `README.md` — modificado: documenta CI en Z_SDK y `npm run gates`
- `plan/REPORTES/WP-U03-z-sdk-ci.md` — creado: este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Local — quality (equivalente al job `lint + gates`)

```
$ npm ci
… exit 0 (worktree)

$ npm run lint
✖ 16 problems (0 errors, 16 warnings)
exit 0

$ npm run gates
> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs
gates: OK (0 offenders)

$ npm run test:gates
… # tests 7 # pass 7 # fail 0
exit 0
```

### Local — cómo correría el workflow (sin Actions remotas)

Tras `npm ci` en un checkout limpio, el job `quality` ejecuta en serie:
`npm run lint` → `npm run gates` → `npm run test:gates`.
El job `test` ejecuta, por cada entrada de `matrix.workspace`:
`npm test -w "<workspace>"` (fail-fast: false).

Inventario local de la matriz (Windows, worktree, 2026-07-17):
**22 OK / 9 FAIL** (fallos preexistentes; no corregidos en este WP — ver hallazgos):

```
FAIL @zeus/presets-sdk
OK   @zeus/firehose-core
OK   @zeus/room-client-browser
OK   @zeus/session-domain
FAIL @zeus/session-protocol
OK   @zeus/tablero-core
FAIL @zeus/http-contract
OK   @zeus/rooms
OK   @zeus/openapi-mcp-projector
OK   @zeus/game-engine
OK   @zeus/operator-bridge
OK   @zeus/ui-3d-kit
OK   @zeus/ui-kit
OK   @zeus/app-shell
OK   @zeus/test-utils
OK   @zeus/solar-system
FAIL @zeus/linea-system
FAIL @zeus/linea-firehose
OK   @zeus/console-monitor
OK   @zeus/socket-server
FAIL @zeus/cache-browser
FAIL @zeus/firehose-browser
FAIL @zeus/editor-ui
FAIL @zeus/player-ui
OK   @zeus/player-3d-ui
OK   @zeus/3d-monitor
OK   @zeus/ping-pong-bots
OK   @zeus/arg-domain
OK   @zeus/arg-feeds
OK   @zeus/arg-console
OK   @zeus/arg-player-mcp
SUMMARY pass=22 fail=9
```

### Local — CA «rojo sintético» (gates; sin PR remota)

Violación temporal (`port: 3013` en src de producción) → gates exit 1; al
borrar el archivo, gates vuelve a OK:

```
$ printf "export const listen = { host: '127.0.0.1', port: 3013 };\n" \
    > packages/lib/test-utils/src/_u03_synthetic_tmp.mjs
$ npm run gates
gates: FAIL (1 offender(s))
  [ports] packages/lib/test-utils/src/_u03_synthetic_tmp.mjs:1 — export const listen = { host: '127.0.0.1', port: 3013 };
exit=1

$ rm -f packages/lib/test-utils/src/_u03_synthetic_tmp.mjs
$ npm run gates
gates: OK (0 offenders)
```

Además, `npm run test:gates` ya cubre CA rojo sintético por regla (a–d) en
tests unitarios (U00; 7/7 pass arriba).

### Remoto — PR / checks GitHub

```
⏳ sin verificar — push: no intentado (orden orquestador).
No hay PR de prueba ni runs de Actions observados en este WP.
Validación remota pendiente fuera del swarm (sembrar main + push rama + PR).
```

Evidencia previa al freno (no reintentada): push HTTPS a
`alephscriptorium-eng/Z_SDK` devolvió
`remote: Permission to alephscriptorium-eng/Z_SDK.git denied to escrivivir-co`
(403) aunque `gh` listaba cuenta `alephscriptorium-eng` activa — mismatch
credencial git vs `gh`.

- Efecto visible (vistas/demo): n/a (infra CI).

## Demolición

n/a (WP sin demolición).

```
(n/a)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no en código de app; workflow usa
      actions/setup-node y scripts npm del repo (sin puertos de malla).
- [x] Cadenas if/switch que debieron ser tabla: n/a (YAML + lista matriz).
- [x] Duplicación con otros paquetes: no hay otro workflow CI en el monorepo;
      no se reinventó `gates` — se cableó `npm run gates`.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: no (`ci.yml`, sin legacy/v2).
- [x] Demolición completa: n/a.
- [x] Tests prueban comportamiento: este WP no añade tests nuevos; reutiliza
      `test:gates` (rojo sintético U00) + matriz de tests existentes.
- [ ] Arranque real verificado: CI remoto ⏳; local sí (lint/gates/matriz
      inventariada). No se levantó demo UI (fuera de alcance).
- [x] README/specs: README §Verificación actualizado; sin cambio de contrato
      de paquetes.
- [x] Diff solo alcance WP: workflow + README + reporte (sin BACKLOG).

## Hallazgos fuera de alcance

1. **9 workspaces fallan `npm test -w` en local** (presets-sdk openapi sync,
   session-protocol, http-contract, linea-system, linea-firehose,
   cache-browser, firehose-browser, editor-ui, player-ui). Cuando exista
   remoto, la matriz CI saldrá parcialmente roja hasta WPs de reparación.
2. **Mismatch credencial git HTTPS** (`escrivivir-co`) vs `gh` activo
   (`alephscriptorium-eng`) — relevante para quien haga el push fuera del
   swarm.
3. Remoto `origin` → `Z_SDK.git` quedó apuntado en el worktree tras el
   intento previo; no se tocó tras la orden de no publicar.

## Dudas / bloqueos

- CA remoto (PR + checks verdes/rojos en GitHub): bloqueado a propósito —
  `push: no intentado (orden orquestador)`. Orquestador/usuario sembrará
  `main` y abrirá PR fuera del swarm.
- ¿Tras el primer push externo conviene un WP solo para poner verde la
  matriz (los 9 FAIL), o se acepta CI parcialmente rojo como señal?

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
